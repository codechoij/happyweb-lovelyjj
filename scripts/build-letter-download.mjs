/**
 * Builds assets/downloads/letters.zip from the live site using headless
 * Chromium (Playwright). It loads the real index.html, waits for the letter
 * renderer + resources to be ready, then runs the SAME rendering functions
 * the website uses (LetterRenderer + zip.js) and writes the ZIP.
 *
 * Usage:
 *   node scripts/build-letter-download.mjs            # needs Playwright installed
 *   LETTER_SITE_URL=http://localhost:4173 node scripts/build-letter-download.mjs
 *
 * The ZIP is used by GitHub Pages as:
 *   https://<owner>.github.io/<repo>/assets/downloads/letters.zip
 */
import { createSiteServer } from "./serve.mjs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");
const DEFAULT_OUTPUT_DIR = join(PROJECT_ROOT, "assets", "downloads");

const FONT_SOURCES = {
  sites: [],
  googleFonts: [],
};

function log(step, message) {
  console.log(`[letter-build] ${step}: ${message}`);
}

async function getPlaywright() {
  try {
    return await import("playwright");
  } catch (error) {
    throw new Error(
      "Playwright is not installed. Run `npm install` at the project root (installs playwright as a devDependency), then retry.",
    );
  }
}

async function waitForLetterReady(page) {
  await page.waitForFunction(() => {
    return Boolean(
      window.LetterRenderer?.renderAllLetterImages &&
        window.LETTER_CONFIG?.pages?.length &&
        window.resourceStringsLoaded === true,
    );
  });
  log("wait", "Letter renderer and resources are ready.");
}

async function loadBuildScripts(page) {
  await page.addScriptTag({ path: join(PROJECT_ROOT, "scripts", "letter-renderer.js") });
  await page.addScriptTag({ path: join(PROJECT_ROOT, "scripts", "zip.js") });
}

async function getExpectedLetterFiles(page) {
  return page.evaluate(() => [
    "letter-description.jpg",
    ...window.LETTER_CONFIG.pages.map((_, index) => `letter-page-${index + 1}.jpg`),
  ]);
}

async function generateZip(page, outputDir) {
  const result = await page.evaluate(async (fonts) => {
    async function loadFonts() {
      const loads = [];
      if (document.fonts?.load) {
        loads.push(...fonts.sites.map((font) => document.fonts.load(font)));
        loads.push(...fonts.googleFonts.map((font) => document.fonts.load(font)));
      }
      await Promise.all(loads);
    }

    await loadFonts();

    // Re-fetch the resource strings directly so the ZIP content always uses
    // the current Strings.resx, same file the website renders.
    const response = await fetch("./resources/Strings.resx", { cache: "no-store" });
    if (!response.ok) throw new Error("Failed to load Strings.resx for ZIP build.");
    const xml = await response.text();
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    const strings = {};
    [...doc.querySelectorAll("data[name]")].forEach((node) => {
      const key = node.getAttribute("name");
      const value = node.querySelector("value")?.textContent ?? "";
      if (key) strings[key] = value;
    });

    const getText = (key) => strings[key] ?? key;

    const images = window.LetterRenderer.renderAllLetterImages({
      letterTo: getText("LetterTo"),
      letterFrom: getText("LetterFrom"),
      description: {
        eyebrow: getText("LetterDescriptionEyebrow"),
        title: getText("LetterDescriptionTitle"),
        body: getText("LetterDescriptionBody"),
      },
      pages: window.LETTER_CONFIG.pages,
      getText,
    });

    const files = images.map((image) => ({
      filename: image.filename,
      bytes: window.dataUrlToBytes(image.dataUrl),
    }));

    const zipBytes = window.createZipBytes(files);
    return {
      files: files.map((file) => ({
        filename: file.filename,
        byteLength: file.bytes.length,
      })),
      base64: window.bytesToBase64(zipBytes),
    };
  }, FONT_SOURCES);

  const outputPath = join(outputDir, "letters.zip");
  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, Buffer.from(result.base64, "base64"));

  log("zip", `Wrote ${outputPath} with ${result.files.length} files.`);
  result.files.forEach((file) => log("zip", `  - ${file.filename} (${file.byteLength} bytes)`));

  return { outputPath, files: result.files };
}

async function main() {
  const siteUrl = process.env.LETTER_SITE_URL || "";
  const outputDir = resolve(process.env.LETTER_OUTPUT_DIR || DEFAULT_OUTPUT_DIR);
  const server = siteUrl ? null : await createSiteServer({ root: PROJECT_ROOT, port: 4173 });
  const baseUrl = siteUrl || (server ? server.url : "");

  if (!baseUrl) {
    throw new Error("No site URL available.");
  }

  let browser;
  try {
    log("start", `Loading site at ${baseUrl}`);
    const { chromium } = await getPlaywright();
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const pageErrors = [];
    page.on("pageerror", (error) => {
      pageErrors.push(String(error));
    });
    page.on("console", (message) => {
      if (message.type() === "error") pageErrors.push(message.text());
    });

    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await loadBuildScripts(page);
    await waitForLetterReady(page);
    const expectedNames = await getExpectedLetterFiles(page);

    const { outputPath, files } = await generateZip(page, outputDir);

    if (files.length !== expectedNames.length) {
      throw new Error(`Expected ${expectedNames.length} files in ZIP, got ${files.length}.`);
    }
    if (pageErrors.length) {
      log("warn", `Page reported non-blocking errors:\n${pageErrors.join("\n")}`);
    }

    const actualNames = files.map((file) => file.filename);
    for (const name of expectedNames) {
      if (!actualNames.includes(name)) throw new Error(`Missing expected file in ZIP: ${name}`);
    }

    log("done", `letters.zip written to ${outputPath}`);
  } finally {
    if (browser) await browser.close();
    if (server) await server.close();
  }
}

main().catch((error) => {
  console.error("[letter-build] FAILED:", error.message || error);
  process.exitCode = 1;
});
