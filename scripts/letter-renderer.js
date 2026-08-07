/**
 * Shared letter image renderer.
 *
 * Used by BOTH:
 *   1. The website (scripts/app.js) — kept here so the browser page and the
 *      build pipeline render the letters from one implementation.
 *   2. GitHub Actions build — a headless Chromium page loads this file along
 *      with letter-config.js and zip.js and produces the JPGs + letters.zip.
 *
 * Font note: the original code used "Apple SD Gothic Neo" / "Malgun Gothic".
 * Those are not available on headless CI Linux, so the renderer falls back to
 * the same system font stack the website itself uses in CSS. Each local text
 * measurement therefore matches the actual browser output; only the glyph
 * source font differs on CI (a CJK fallback such as Noto Sans CJK is
 * installed in the workflow when available).
 */
(function (global) {
  "use strict";

  const LETTER_CANVAS_WIDTH = 1200;
  const LETTER_CANVAS_HEIGHT = 1720;
  const BASE_FONT = '"Apple SD Gothic Neo", "Malgun Gothic", Arial, sans-serif';

  function drawRoundRect(context, x, y, width, height, radius, fill, stroke) {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(x + width - radius, y);
    context.quadraticCurveTo(x + width, y, x + width, y + radius);
    context.lineTo(x + width, y + height - radius);
    context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    context.lineTo(x + radius, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - radius);
    context.lineTo(x, y + radius);
    context.quadraticCurveTo(x, y, x + radius, y);
    context.closePath();
    context.fillStyle = fill;
    context.fill();
    context.strokeStyle = stroke;
    context.lineWidth = 3;
    context.stroke();
  }

  function drawCircle(context, x, y, radius, fill, stroke) {
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fillStyle = fill;
    context.fill();
    context.strokeStyle = stroke;
    context.lineWidth = 3;
    context.stroke();
  }

  function wrapCanvasText(context, text, x, y, maxWidth, lineHeight) {
    const lines = normalizeCanvasText(text).split("\n");
    let cursorY = y;

    lines.forEach((paragraph) => {
      if (!paragraph) {
        cursorY += lineHeight;
        return;
      }

      let line = "";
      [...paragraph].forEach((char) => {
        const testLine = line + char;
        if (context.measureText(testLine).width > maxWidth && line) {
          context.fillText(line, x, cursorY);
          line = char;
          cursorY += lineHeight;
          return;
        }
        line = testLine;
      });

      if (line) {
        context.fillText(line, x, cursorY);
        cursorY += lineHeight;
      }
    });

    return cursorY;
  }

  function normalizeCanvasText(text) {
    return String(text)
      .replace(/\r\n?/g, "\n")
      .split("\n")
      .map((line) => line.trim().replace(/\s+/g, " "))
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  /**
   * Create one letter JPG as a data URL.
   *
   * @param {object} item {
   *   shape: "bubble" | "paper",
   *   eyebrow?: string,
   *   title?: string,
   *   body: string,
   *   pageIndex?: number,
   *   letterTo?: string,
   *   letterFrom?: string,
   *   maxPageIndex?: number,
   * }
   * @returns {string} data:image/jpeg;base64,...
   */
  function createLetterDataUrl(item) {
    const canvas = document.createElement("canvas");
    canvas.width = LETTER_CANVAS_WIDTH;
    canvas.height = LETTER_CANVAS_HEIGHT;
    const context = canvas.getContext("2d");

    context.fillStyle = "#fffaf7";
    context.fillRect(0, 0, canvas.width, canvas.height);

    if (item.shape === "bubble") {
      drawRoundRect(context, 120, 120, 960, 1250, 72, "#ffffff", "#ead9d5");
      drawCircle(context, 875, 1378, 44, "#ffffff", "#ead9d5");
      drawCircle(context, 942, 1440, 22, "#ffffff", "#ead9d5");
    } else {
      drawRoundRect(context, 120, 140, 960, 1400, 8, "#fffefc", "#ead9d5");
    }

    context.textAlign = "left";
    context.textBaseline = "top";

    context.fillStyle = "#312c35";
    context.font = `700 42px ${BASE_FONT}`;

    let cursorY = item.shape === "paper" ? 274 : 230;
    if (item.eyebrow) {
      context.fillStyle = "#e95d73";
      context.font = `700 28px ${BASE_FONT}`;
      context.fillText(item.eyebrow, 190, cursorY);
      cursorY += 78;
    }

    context.fillStyle = "#312c35";
    if (item.pageIndex === 0) {
      context.font = `900 48px ${BASE_FONT}`;
      context.fillText(item.letterTo || "", 190, cursorY);
      cursorY += 118;
    }

    if (item.title) {
      context.font = `700 42px ${BASE_FONT}`;
      context.fillText(item.title, 190, cursorY);
      cursorY += item.body ? 78 : 0;
    }

    context.fillStyle = "#756d78";
    const bodyFontSize = item.shape === "bubble" ? 35 : 40;
    const bodyLineHeight = item.shape === "bubble" ? 59 : 68;
    let bodyEndY = cursorY;
    context.font = `400 ${bodyFontSize}px ${BASE_FONT}`;
    if (item.body) {
      bodyEndY = wrapCanvasText(context, item.body, 190, cursorY, 820, bodyLineHeight);
    }

    if (item.pageIndex === item.maxPageIndex) {
      context.fillStyle = "#312c35";
      context.font = `900 48px ${BASE_FONT}`;
      context.textAlign = "right";
      const fromY = Math.min(bodyEndY + bodyLineHeight * 1.35, 1288);
      context.fillText(item.letterFrom || "", 1010, fromY);
    }

    if (typeof item.pageIndex === "number") {
      context.fillStyle = "#756d78";
      context.font = `400 32px ${BASE_FONT}`;
      context.textAlign = "center";
      context.fillText(String(item.pageIndex + 1), 600, 1438);
    }

    return canvas.toDataURL("image/jpeg", 0.92);
  }

  /**
   * Render all letter images (description + configured pages).
   *
   * @param {object} deps {
   *   letterTo: string,
   *   letterFrom: string,
   *   description: { eyebrow, title, body },
   *   pages: Array<{ bodyKey: string }>,
   *   getText: (key: string) => string,
   *   renderDataUrl?: (item) => string  (defaults to createLetterDataUrl),
   * }
   * @returns {Array<{filename: string, dataUrl: string}>}
   */
  function renderAllLetterImages(deps) {
    const pageCount = deps.pages.length;
    const maxPageIndex = pageCount - 1;
    const result = [
      {
        filename: "letter-description.jpg",
        dataUrl: deps.renderDataUrl
          ? deps.renderDataUrl({
              shape: "bubble",
              eyebrow: deps.description.eyebrow,
              title: deps.description.title,
              body: deps.description.body,
            })
          : createLetterDataUrl({
              shape: "bubble",
              eyebrow: deps.description.eyebrow,
              title: deps.description.title,
              body: deps.description.body,
            }),
      },
    ];

    deps.pages.forEach((page, index) => {
      const body = deps.getText(page.bodyKey).trim();
      result.push({
        filename: `letter-page-${index + 1}.jpg`,
        dataUrl: deps.renderDataUrl
          ? deps.renderDataUrl({
              shape: "paper",
              body,
              pageIndex: index,
              maxPageIndex,
              letterTo: deps.letterTo,
              letterFrom: deps.letterFrom,
            })
          : createLetterDataUrl({
              shape: "paper",
              body,
              pageIndex: index,
              maxPageIndex,
              letterTo: deps.letterTo,
              letterFrom: deps.letterFrom,
            }),
      });
    });

    return result;
  }

  /** Resolve the font family that actually renders on the current device. */
  function resolveCanvasFontFamily(context) {
    const candidates = ["Apple SD Gothic Neo", "Malgun Gothic", "sans-serif"];
    const probe = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ가나다";

    for (const family of candidates) {
      if (family === "sans-serif") return family;
      context.font = `40px "${family}"`;
      if (context.measureText(probe).width > 0) return family;
    }

    return "sans-serif";
  }

  global.LetterRenderer = {
    createLetterDataUrl,
    renderAllLetterImages,
    wrapCanvasText,
    normalizeCanvasText,
    resolveCanvasFontFamily,
    BASE_FONT,
    CANVAS_WIDTH: LETTER_CANVAS_WIDTH,
    CANVAS_HEIGHT: LETTER_CANVAS_HEIGHT,
  };
})(window);
