/**
 * Cloudflare Worker — Letter ZIP download proxy + trusted time endpoint.
 *
 * Role is intentionally minimal:
 *   1. Fetch the latest letters.zip from GitHub Pages.
 *   2. Verify the response is really a ZIP (never hand an HTML error page or
 *      an empty ZIP to the user).
 *   3. Stream it back with correct download headers.
 *
 * It does NOT generate the ZIP — GitHub Actions does that on every push.
 *
 * Configuration (no secrets are hardcoded):
 *   - ORIGIN_ZIP_URL : the GitHub Pages URL of the generated ZIP. Defaults to
 *     this project's Pages URL; set via wrangler var or `--var`.
 *   - Routes         : https://<worker>.<subdomain>.workers.dev/letters.zip
 *                      https://<worker>.<subdomain>.workers.dev/time
 */
const DEFAULT_ORIGIN_ZIP_URL = "https://codechoij.github.io/happyweb-lovelyjj/assets/downloads/letters.zip";

const ZIP_MAGIC_BYTES = [0x50, 0x4b, 0x03, 0x04]; // PK\x03\x04
const MAX_BODY_BYTES = 50 * 1024 * 1024; // 50 MB safety cap

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (url.pathname === "/time") {
      return handleTimeRequest(request);
    }

    if (url.pathname !== "/letters.zip") {
      return new Response("Not Found", { status: 404, headers: corsHeaders() });
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: { ...corsHeaders(), "Allow": "GET, HEAD" },
      });
    }

    const originUrl = (env && env.ORIGIN_ZIP_URL) || DEFAULT_ORIGIN_ZIP_URL;

    let originResponse;
    try {
      originResponse = await fetch(originUrl, {
        redirect: "follow",
        cf: { cacheTtl: 60, cacheEverything: false },
      });
    } catch (error) {
      return jsonError(502, "업스트림 서버에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.");
    }

    if (!originResponse.ok) {
      const status = originResponse.status === 404 ? 404 : 502;
      const message =
        originResponse.status === 404
          ? "다운로드 파일이 아직 준비되지 않았습니다."
          : "업스트림 서버가 오류를 반환했습니다.";
      return jsonError(status, message);
    }

    const contentType = originResponse.headers.get("content-type") || "";
    const isProbablyHtml = contentType.includes("text/html");
    const isProbablyZip =
      contentType.includes("application/zip") ||
      contentType.includes("application/x-zip-compressed") ||
      contentType.includes("application/octet-stream");

    if (isProbablyHtml) {
      return jsonError(502, "업스트림이 파일 대신 HTML 문서를 반환했습니다.");
    }

    // Stream the body but cap it so a malicious/broken origin cannot
    // make the Worker buffer unbounded memory.
    const { readable, writable } = new TransformStream();
    const reader = originResponse.body ? originResponse.body.getReader() : null;
    if (reader) {
      let received = 0;
      const writer = writable.getWriter();

      (async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            received += value.byteLength;
            if (received > MAX_BODY_BYTES) {
              await writer.abort(new Error("Body too large."));
              return;
            }
            await writer.write(value);
          }
          await writer.close();
        } catch (error) {
          await writer.abort(error);
        }
      })();
    } else {
      const body = await originResponse.arrayBuffer();
      if (body.byteLength === 0) {
        return jsonError(502, "다운로드 파일이 비어 있습니다.");
      }
      const firstBytes = new Uint8Array(body, 0, 4);
      if (!isZipMagic(firstBytes) && !isProbablyZip) {
        return jsonError(502, "업스트림이 ZIP이 아닌 응답을 반환했습니다.");
      }
      const stream = new Response(body, { status: 200 });
      return withDownloadHeaders(stream, "letters.zip");
    }

    // HEAD requests need a content length; the origin response provides it.
    const contentLength = originResponse.headers.get("content-length");
    const headers = {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="letters.zip"',
      "Cache-Control": "no-store",
      ...corsHeaders(),
    };
    if (contentLength && request.method === "HEAD") {
      headers["Content-Length"] = contentLength;
    }

    return new Response(readable, {
      status: 200,
      headers,
    });
  },
};

function handleTimeRequest(request) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { ...corsHeaders(), "Allow": "GET, HEAD" },
    });
  }

  const now = new Date();
  const body = request.method === "HEAD"
    ? null
    : JSON.stringify({
        ok: true,
        epochMs: now.getTime(),
        iso: now.toISOString(),
        timeZone: "Asia/Seoul",
      });

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...corsHeaders(),
    },
  });
}

function isZipMagic(bytes) {
  if (!bytes || bytes.length < 4) return false;
  return (
    bytes[0] === ZIP_MAGIC_BYTES[0] &&
    bytes[1] === ZIP_MAGIC_BYTES[1] &&
    bytes[2] === ZIP_MAGIC_BYTES[2] &&
    bytes[3] === ZIP_MAGIC_BYTES[3]
  );
}

function withDownloadHeaders(response, filename) {
  const headers = new Headers(response.headers);
  headers.set("Content-Type", "application/zip");
  headers.set("Content-Disposition", `attachment; filename="${filename}"`);
  headers.set("Cache-Control", "no-store");
  Object.entries(corsHeaders()).forEach(([name, value]) => headers.set(name, value));
  return new Response(response.body, {
    status: response.status,
    headers,
  });
}

function jsonError(status, message) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...corsHeaders(),
    },
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
