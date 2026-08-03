import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".zip": "application/zip",
};

/**
 * Tiny static file server used by the letter build and local verification.
 * Serves every request from `root` and logs each hit to the Node process.
 */
export function createSiteServer({ root, port = 4173, host = "127.0.0.1" } = {}) {
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url || "/", `http://${host}:${port}`);
      const rawPath = decodeURIComponent(url.pathname);
      const pathname = rawPath === "/" ? "/index.html" : rawPath;
      const filePath = normalize(join(root, pathname));
      const resolvedRoot = normalize(root);

      if (filePath !== resolvedRoot && !filePath.startsWith(resolvedRoot + "/")) {
        response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Forbidden");
        return;
      }

      const info = await stat(filePath);
      if (info.isDirectory()) {
        response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Not found");
        return;
      }

      const body = await readFile(filePath);
      const mime = MIME_TYPES[extname(filePath).toLowerCase()] || "application/octet-stream";
      response.writeHead(200, {
        "Content-Type": mime,
        "Cache-Control": "no-store",
      });
      response.end(body);
    } catch (error) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
    }
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      resolve({
        host,
        port,
        url: `http://${host}:${port}`,
        close: () => new Promise((done) => server.close(done)),
      });
    });
  });
}

// Allow `npm run serve` to start the server directly.
const isDirectRun = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (isDirectRun) {
  const root = resolve(process.cwd());
  const server = await createSiteServer({ root, port: Number(process.env.PORT || 4173) });
  console.log(`Serving ${root} at ${server.url}`);
}
