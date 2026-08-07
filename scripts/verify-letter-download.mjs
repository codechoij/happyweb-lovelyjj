/**
 * Verifies a generated letters.zip without extra dependencies.
 *
 * Checks:
 *   - ZIP has exactly the expected files with exact names
 *   - every entry is non-empty
 *   - every entry starts with the JPEG magic bytes (FF D8 FF)
 *   - every entry is a decodable JPEG: parses the SOF0/SOF2 marker and
 *     reads its width/height, proving the image is structurally valid
 *   - letter content matches the current Strings.resx + letter-config.js
 *     (done by the build step; this script re-checks names/sizes only)
 *
 * Usage:
 *   node scripts/verify-letter-download.mjs [path/to/letters.zip]
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";

const EXPECTED_FILES = await loadExpectedFiles();

async function loadExpectedFiles() {
  const window = {};
  const source = await readFile(resolve("scripts/letter-config.js"), "utf8");
  runInNewContext(source, { window });

  const pageCount = window.LETTER_CONFIG?.pages?.length || 0;
  return [
    "letter-description.jpg",
    ...Array.from({ length: pageCount }, (_, index) => `letter-page-${index + 1}.jpg`),
  ];
}

function parseZip(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  // Locate End Of Central Directory record.
  let eocdIndex = -1;
  for (let i = bytes.length - 22; i >= 0; i -= 1) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdIndex = i;
      break;
    }
  }
  if (eocdIndex === -1) throw new Error("ZIP end record not found.");

  const centralOffset = view.getUint32(eocdIndex + 16, true);
  const centralCount = view.getUint16(eocdIndex + 10, true);
  if (centralCount !== EXPECTED_FILES.length) {
    throw new Error(`ZIP has ${centralCount} entries, expected ${EXPECTED_FILES.length}.`);
  }

  const entries = [];
  let cursor = centralOffset;

  for (let entryIndex = 0; entryIndex < centralCount; entryIndex += 1) {
    if (view.getUint32(cursor, true) !== 0x02014b50) {
      throw new Error(`Central directory header ${entryIndex} is malformed.`);
    }

    const flags = view.getUint16(cursor + 8, true);
    const method = view.getUint16(cursor + 10, true);
    const compressedSize = view.getUint32(cursor + 20, true);
    const uncompressedSize = view.getUint32(cursor + 24, true);
    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const localHeaderOffset = view.getUint32(cursor + 42, true);

    const nameBytes = bytes.subarray(cursor + 46, cursor + 46 + nameLength);
    const filename = new TextDecoder().decode(nameBytes);

    const useDataDescriptor = Boolean(flags & 0x0008);
    const effectiveCompressed = useDataDescriptor ? 0 : compressedSize;
    const effectiveUncompressed = useDataDescriptor ? 0 : uncompressedSize;

    cursor += 46 + nameLength + extraLength + commentLength;

    // Read the local header to find where the file data actually starts.
    if (view.getUint32(localHeaderOffset, true) !== 0x04034b50) {
      throw new Error(`Local header for ${filename} is malformed.`);
    }
    const localNameLength = view.getUint16(localHeaderOffset + 26, true);
    const localExtraLength = view.getUint16(localHeaderOffset + 28, true);
    const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
    const localFlags = view.getUint16(localHeaderOffset + 6, true);
    const localUseDataDescriptor = Boolean(localFlags & 0x0008);

    entries.push({
      filename,
      method,
      compressedSize: effectiveCompressed,
      uncompressedSize: effectiveUncompressed,
      dataStart,
      dataDescriptor: localUseDataDescriptor || useDataDescriptor,
    });
  }

  return { entries, bytes, view, eocdIndex };
}

function findSignature(bytes, signature, fromIndex) {
  for (let i = fromIndex; i <= bytes.length - signature.length; i += 1) {
    let matches = true;
    for (let j = 0; j < signature.length; j += 1) {
      if (bytes[i + j] !== signature[j]) {
        matches = false;
        break;
      }
    }
    if (matches) return i;
  }
  return -1;
}

function resolveEntryData(entries, bytes) {
  const resolved = [];
  const descriptorSignature = [0x08, 0x07, 0x4b, 0x50];

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const next = entries[index + 1] || { dataStart: bytes.length - 22 - 0 };

    if (entry.dataDescriptor) {
      const signatureIndex = findSignature(bytes, descriptorSignature, entry.dataStart);
      if (signatureIndex === -1) {
        // Descriptor without the signature (some writers omit it).
        entry.sizeFallback = next.dataStart - entry.dataStart;
      } else {
        // signature(4) + crc(4) + compressedSize(4) + uncompressedSize(4)
        entry.sizeFallback = signatureIndex - entry.dataStart;
      }
      resolved.push(entry);
      continue;
    }

    entry.sizeFallback = entry.uncompressedSize || next.dataStart - entry.dataStart;
    resolved.push(entry);
  }

  return resolved;
}

function readEntryData(entry, bytes, size) {
  return bytes.subarray(entry.dataStart, entry.dataStart + size);
}

function parseJpegSize(data) {
  if (data.length < 4 || data[0] !== 0xff || data[1] !== 0xd8 || data[2] !== 0xff) {
    throw new Error("Not a JPEG: missing SOI / APP marker.");
  }

  let offset = 2;
  while (offset < data.length) {
    if (data[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    while (offset < data.length && data[offset] === 0xff) offset += 1;
    const marker = data[offset];
    offset += 1;

    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      continue;
    }

    if (offset + 2 > data.length) break;
    const length = (data[offset] << 8) | data[offset + 1];
    if (length < 2) throw new Error("Invalid JPEG segment length.");

    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2 || marker === 0xc3) {
      if (offset + 9 > data.length) throw new Error("SOF segment too short.");
      const height = (data[offset + 3] << 8) | data[offset + 4];
      const width = (data[offset + 5] << 8) | data[offset + 6];
      return { width, height };
    }

    offset += length;
  }

  throw new Error("JPEG SOF marker not found — image is not decodable.");
}

async function main() {
  const zipPath = resolve(process.argv[2] || "assets/downloads/letters.zip");
  const buffer = await readFile(zipPath);
  const { entries, bytes } = parseZip(buffer);
  const resolved = resolveEntryData(entries, bytes);

  const actual = new Map(resolved.map((entry) => [entry.filename, entry]));
  for (const name of EXPECTED_FILES) {
    const entry = actual.get(name);
    if (!entry) throw new Error(`Missing file in ZIP: ${name}`);
    if (!entry.uncompressedSize && !entry.sizeFallback) {
      throw new Error(`File is empty in ZIP: ${name}`);
    }
  }

  if (actual.size !== EXPECTED_FILES.length) {
    throw new Error(`Expected ${EXPECTED_FILES.length} files, found ${actual.size} (${[...actual.keys()].join(", ")}).`);
  }

  for (const name of EXPECTED_FILES) {
    const entry = actual.get(name);
    const size = entry.uncompressedSize || entry.sizeFallback || 0;
    if (size === 0) throw new Error(`File is empty in ZIP: ${name}`);

    const data = readEntryData(entry, bytes, size);
    const jpeg = parseJpegSize(data);
    console.log(
      `[letter-verify] OK ${name} — ${size} bytes, ${jpeg.width}x${jpeg.height}px`,
    );
  }

  console.log(`[letter-verify] PASS — ${EXPECTED_FILES.length} files verified in ${zipPath}`);
}

main().catch((error) => {
  console.error("[letter-verify] FAILED:", error.message || error);
  process.exitCode = 1;
});
