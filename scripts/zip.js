/**
 * Shared ZIP utilities.
 *
 * Used by:
 *   - The browser bundle (loaded via <script> before app.js)
 *   - The GitHub Actions build script, which runs the same code inside a
 *     headless Chromium page via Playwright
 *
 * The user-facing site no longer downloads ZIPs from the browser: the save
 * button is a plain <a> pointing at the Cloudflare Worker HTTPS URL. These
 * helpers are kept here so the build pipeline and the rendering code share a
 * single implementation.
 */
(function (global) {
  "use strict";

  function dataUrlToBytes(dataUrl) {
    const base64 = dataUrl.split(",")[1] || "";
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
  }

  function getCrc32(bytes) {
    let crc = 0xffffffff;

    for (let i = 0; i < bytes.length; i += 1) {
      crc ^= bytes[i];
      for (let bit = 0; bit < 8; bit += 1) {
        crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
      }
    }

    return (crc ^ 0xffffffff) >>> 0;
  }

  /**
   * Builds a ZIP archive (stored, no compression — JPEG is already dense, and
   * this keeps the original behaviour identical).
   * @param {Array<{filename: string, bytes: Uint8Array}>} files
   * @returns {Uint8Array}
   */
  function createZipBytes(files) {
    const encoder = new TextEncoder();
    const localParts = [];
    const centralParts = [];
    let offset = 0;

    files.forEach((file) => {
      const nameBytes = encoder.encode(file.filename);
      const crc = getCrc32(file.bytes);
      const localHeader = new Uint8Array(30 + nameBytes.length);
      const localView = new DataView(localHeader.buffer);

      localView.setUint32(0, 0x04034b50, true);
      localView.setUint16(4, 20, true);
      localView.setUint16(6, 0x0800, true);
      localView.setUint16(8, 0, true);
      localView.setUint32(14, crc, true);
      localView.setUint32(18, file.bytes.length, true);
      localView.setUint32(22, file.bytes.length, true);
      localView.setUint16(26, nameBytes.length, true);
      localHeader.set(nameBytes, 30);

      localParts.push(localHeader, file.bytes);

      const centralHeader = new Uint8Array(46 + nameBytes.length);
      const centralView = new DataView(centralHeader.buffer);
      centralView.setUint32(0, 0x02014b50, true);
      centralView.setUint16(4, 20, true);
      centralView.setUint16(6, 20, true);
      centralView.setUint16(8, 0x0800, true);
      centralView.setUint16(10, 0, true);
      centralView.setUint32(16, crc, true);
      centralView.setUint32(20, file.bytes.length, true);
      centralView.setUint32(24, file.bytes.length, true);
      centralView.setUint16(28, nameBytes.length, true);
      centralView.setUint32(42, offset, true);
      centralHeader.set(nameBytes, 46);
      centralParts.push(centralHeader);

      offset += localHeader.length + file.bytes.length;
    });

    const centralSize = centralParts.reduce((size, part) => size + part.length, 0);
    const endHeader = new Uint8Array(22);
    const endView = new DataView(endHeader.buffer);
    endView.setUint32(0, 0x06054b50, true);
    endView.setUint16(8, files.length, true);
    endView.setUint16(10, files.length, true);
    endView.setUint32(12, centralSize, true);
    endView.setUint32(16, offset, true);

    return concatBytes([...localParts, ...centralParts, endHeader]);
  }

  function createZipBlob(files) {
    return new Blob([createZipBytes(files)], { type: "application/zip" });
  }

  function bytesToBase64(bytes) {
    let binary = "";
    const chunkSize = 0x8000;

    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }

    return btoa(binary);
  }

  function concatBytes(parts) {
    const total = parts.reduce((size, part) => size + part.length, 0);
    const joined = new Uint8Array(total);
    let offset = 0;

    parts.forEach((part) => {
      joined.set(part, offset);
      offset += part.length;
    });

    return joined;
  }

  global.dataUrlToBytes = dataUrlToBytes;
  global.getCrc32 = getCrc32;
  global.createZipBytes = createZipBytes;
  global.createZipBlob = createZipBlob;
  global.bytesToBase64 = bytesToBase64;
})(window);
