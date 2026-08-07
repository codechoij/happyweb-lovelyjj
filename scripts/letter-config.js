/**
 * Single source of truth for the letter pages.
 *
 * Loaded by BOTH:
 *   1. index.html (before app.js) — app.js builds its LETTER_PAGES from this.
 *   2. GitHub Actions build (headless Chromium page) — the download ZIP is
 *      generated from the exact same page data, so editing letter content
 *      (resources/Strings.resx) or the page list here automatically updates
 *      both the website and the letters.zip download.
 *
 * Date strings are ISO 8601 with a UTC offset so they are timezone-safe
 * regardless of where the code runs.
 */
window.LETTER_CONFIG = {
  descriptionReleaseAt: "2026-07-31T14:37:00+09:00",
  pages: [
    {
      bodyKey: "LetterPageOneBody",
      releaseAt: "2026-07-31T14:37:10+09:00",
    },
    {
      bodyKey: "LetterPageTwoBody",
      releaseAt: "2026-07-31T14:37:30+09:00",
    },
    {
      bodyKey: "LetterPageThreeBody",
      releaseAt: "2026-07-31T14:37:40+09:00",
    },
    {
      bodyKey: "LetterPageFourBody",
      releaseAt: "2026-07-31T14:37:50+09:00",
    },
    {
      bodyKey: "LetterPageFiveBody",
      releaseAt: "2026-07-31T14:38:00+09:00",
    },
    {
      bodyKey: "LetterPageSixBody",
      releaseAt: "2026-07-31T14:39:00+09:00",
    },
    {
      bodyKey: "LetterPageSevenBody",
      releaseAt: "2026-07-31T14:40:00+09:00",
    },
    {
      bodyKey: "LetterPageEightBody",
      releaseAt: "2026-07-31T14:41:00+09:00",
    },
    {
      bodyKey: "LetterPageNineBody",
      releaseAt: "2026-07-31T14:42:00+09:00",
    },
  ],
};
