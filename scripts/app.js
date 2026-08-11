const ANNIVERSARY_DATE = new Date("2026-08-14T00:00:00+09:00");
const START_DATE = new Date("2025-08-14T00:00:00+09:00");
const TIMECAPSULE_OPEN_DATE = new Date("2026-08-14T12:00:00+09:00");
const TIMECAPSULE_OPEN_NOTICE_END_DATE = new Date("2026-08-15T00:00:00+09:00");
const RESOURCE_URL = "./resources/Strings.resx";
const LOVE_PAGE_MUSIC_SRC = "./assets/love-page-music.mp3";

const GIFT_OPEN_TIMES = {
  // Gift 2 (멘트 작성 영상) 선물 공개시간 지정. (14일 오후 6시)
  gift2: "2026-08-14T18:00:00+09:00",
  // Gift 3 (니가 좋아 영상) 선물 공개시간 지정. (15일 오후 2시)
  gift3: "2026-08-15T14:00:00+09:00",
  // Gift 4 (사진 모음 영상) 선물 공개시간 지정. (16일 오전 10시)
  gift4: "2026-08-16T10:00:00+09:00",
  // Gift 7 (메롱) 선물 공개시간 지정. (18일 오전 6시)
  gift7: "2026-08-18T06:00:00+09:00",
  // Gift 9 (편지 추가 공개) 선물 공개시간 지정. (17일 오후 2시)
  gift9: "2026-08-17T14:00:00+09:00",
};

const GIFT_BOX_LUXURY_OPEN_DATE = new Date("2026-08-18T06:00:00+09:00");
const GIFT_BOX_IMAGES = {
  basic: [
    "./assets/gift-box-blue.png",
    "./assets/gift-box-red.png",
    "./assets/gift-box-green.png",
  ],
  luxury: [
    "./assets/gift-box-blue-luxury.png",
    "./assets/gift-box-red-luxury.png",
    "./assets/gift-box-green-luxury.png",
  ],
};

const gifts = [
  {
    id: "gift1",
    titleKey: "GiftOneTitle",
    type: "photoGame",
    resultKey: "GiftPhotoGameResult",
  },
  {
    id: "gift2",
    titleKey: "GiftTwoTitle",
    type: "video",
    resultKey: "GiftVideoOneResult",
    availableAt: GIFT_OPEN_TIMES.gift2,
    video: {
      titleKey: "GiftVideoOneTitle",
      src: "./assets/gift-videos/video%20(1).mp4",
      downloadName: "video (1).mp4",
    },
  },
  {
    id: "gift3",
    titleKey: "GiftThreeTitle",
    type: "video",
    resultKey: "GiftVideoTwoResult",
    availableAt: GIFT_OPEN_TIMES.gift3,
    video: {
      titleKey: "GiftVideoTwoTitle",
      src: "./assets/gift-videos/video%20(2).mp4",
      downloadName: "video (2).mp4",
    },
  },
  {
    id: "gift4",
    titleKey: "GiftFourTitle",
    type: "video",
    resultKey: "GiftVideoThreeResult",
    availableAt: GIFT_OPEN_TIMES.gift4,
    video: {
      titleKey: "GiftVideoThreeTitle",
      src: "./assets/gift-videos/video%20(3).mp4",
      downloadName: "video (3).mp4",
    },
  },
  {
    id: "gift5",
    titleKey: "GiftFiveTitle",
    type: "dud",
    resultKey: "GiftDudResult",
  },
  {
    id: "gift6",
    titleKey: "GiftSixTitle",
    type: "dud",
    resultKey: "GiftDudResult",
  },
  {
    id: "gift7",
    titleKey: "GiftSevenTitle",
    type: "dud",
    resultKey: "GiftDudResult",
    availableAt: GIFT_OPEN_TIMES.gift7,
    dud: {
      variant: "tongueDud",
      imageSrc: "./assets/gift-tongue.png",
      altKey: "GiftTongueAlt",
      titleKey: "GiftTongueTitle",
      messageKey: "GiftDudMessage",
    },
  },
];

const GIFT_EIGHT = {
  id: "gift8",
  titleKey: "GiftEightTitle",
  type: "prize",
  resultKey: "GiftPrizeResult",
  prize: {
    variant: "prize",
    imageSrc: "./assets/gift-winner.png",
    altKey: "GiftPrizeAlt",
    titleKey: "GiftPrizePop",
    messageKey: "GiftPrizeMessage",
  },
};

const GIFT_NINE = {
  id: "gift9",
  titleKey: "GiftNineTitle",
  type: "letterBonus",
  resultKey: "GiftLetterBonusResult",
  availableAt: GIFT_OPEN_TIMES.gift9,
  notice: {
    variant: "letterBonus",
    imageSrc: "./assets/gift-letter-bonus.png",
    altKey: "GiftLetterBonusAlt",
    titleKey: "GiftPrizePop",
    messageKey: "GiftLetterBonusMessage",
  },
};

const VISIBLE_GIFT_COUNT = 3;
// Browser storage is isolated by browser/profile; true cross-browser device counting needs a server.
const GIFT_SEVEN_CYCLE_COUNT_KEY = "our-day-gift-seven-cycle-count";
const GIFT_SEVEN_TOTAL_COUNT_KEY = "our-day-gift-seven-total-count";
const GIFT_EIGHT_PENDING_KEY = "our-day-gift-eight-pending";
const GIFT_NINE_CLAIMED_KEY = "our-day-gift-nine-claimed";

const GIFT_PHOTO_CONFIG = {
  folder: "./assets/gift-photos/",
  files: [
    "photo (1).jpg",
    "photo (2).jpg",
    "photo (3).jpg",
    "photo (4).jpg",
    "photo (5).jpg",
    "photo (6).jpg",
    "photo (7).jpg",
    "photo (8).jpg",
    "photo (9).jpg",
    "photo (10).jpg",
    "photo (11).jpg",
    "photo (12).jpg",
    "photo (13).jpg",
    "photo (14).jpg",
  ],
  startFallMs: 2000,
  minFallMs: 700,
  speedUpPerSecond: 100,
  minSpawnDelayMs: 250,
  maxSpawnDelayMs: 770,
  maxInitialLoadMs: 3000,
  countdownStepMs: 1000,
};

const GUESTBOOK_CONFIG = {
  formAction: "https://docs.google.com/forms/d/e/1FAIpQLScoA-gNf-jdBA9tcF0L5-QKDswANgDzUqh4-zgg2b_XrOIklg/formResponse",
  nameEntry: "entry.177558218",
  messageEntry: "entry.14006226",
  sheetCsvUrl: "https://docs.google.com/spreadsheets/d/1-uyBD_odTyvnTdQAwG-sU8uEcm5kYOnKybg27EhhOzU/gviz/tq?tqx=out:csv&gid=0",
  nameColumnKey: "GuestbookNameLabel",
  messageColumnKey: "GuestbookMessageLabel",
  timestampColumnKey: "GuestbookTimestampColumn",
};

const GIFT_PRIZE_FORM_CONFIG = {
  formAction: "https://docs.google.com/forms/d/e/1FAIpQLScLC30YN8SccWKBoAZf9SKa5HXPj25g8YLxm-ia0tJYAPemhg/formResponse",
  wishEntry: "entry.483348725",
};

const GUESTBOOK_FAIL_MESSAGE =
  "GuestbookFailMessage";

const ADMIN_API_URL =
  "https://script.google.com/macros/s/AKfycbzApYhpcMCTY20XOao4v66kjoQuPS6MYtuTEwonVX-V04C5VinQlsghtkpsou7ANcWnFA/exec";

const ADMIN_SESSION_TOKEN_KEY = "our-day-admin-session-token";

const ADMIN_SHORTCUT_CLICK_COUNT = 15;
const ADMIN_SHORTCUT_WINDOW_MS = 4500;
const TRUSTED_TIME_SYNC_INTERVAL_MS = 60 * 1000;
const TRUSTED_TIME_RETRY_INTERVAL_MS = 10 * 1000;
const TRUSTED_TIME_REQUEST_TIMEOUT_MS = 60 * 1000;
const TRUSTED_TIME_FAST_TIMEOUT_MS = 2000;
const PROTECTED_PAGE_IDS = ["gift", "letter"];

const POLAROID_FRAME_STYLES = {
  classic: {
    background: "#ffffff",
    captionColor: "#756d78",
    accent: "#ead9d5",
  },
  rose: {
    background: "#fff0f2",
    captionColor: "#9d3950",
    accent: "#e95d73",
  },
  mint: {
    background: "#edf9f5",
    captionColor: "#357667",
    accent: "#79c7b4",
  },
  butter: {
    background: "#fff7df",
    captionColor: "#8c6930",
    accent: "#ffd983",
  },
};

const POLAROID_FONT_STYLES = {
  default: {
    dateFamily: '"Gamja Flower", cursive',
    copyFamily: '"Single Day", cursive',
  },
  gamja: {
    dateFamily: '"Gamja Flower", cursive',
    copyFamily: '"Gamja Flower", cursive',
  },
  single: {
    dateFamily: '"Single Day", cursive',
    copyFamily: '"Single Day", cursive',
  },
};

const POLAROID_CAPTION_SIZE_STYLES = {
  small: {
    previewSize: 18,
    downloadScale: 1,
  },
  medium: {
    previewSize: 20,
    downloadScale: 1.3,
  },
  large: {
    previewSize: 24,
    downloadScale: 1.65,
  },
};

const PHOTO_OUTPUT_WIDTH = 960;
const PHOTO_OUTPUT_HEIGHT = 1280;
const PHOTO_ASPECT_RATIO = PHOTO_OUTPUT_WIDTH / PHOTO_OUTPUT_HEIGHT;
const POLAROID_HEART_FONT_RATIO = 0.042;
const POLAROID_HEART_GAP_RATIO = 0.083;

// Fallback only. 실제 편지 공개시간은 scripts/letter-config.js에서 수정합니다.
const BUILTIN_LETTER_CONFIG = {
  descriptionReleaseAt: "2026-08-14T12:00:00+09:00",
  pages: [
    { bodyKey: "LetterPageOneBody", releaseAt: "2026-08-14T18:00:00+09:00" },
    { bodyKey: "LetterPageTwoBody", releaseAt: "2026-08-15T09:00:00+09:00" },
    { bodyKey: "LetterPageThreeBody", releaseAt: "2026-08-16T09:00:00+09:00" },
    { bodyKey: "LetterPageFourBody", releaseAt: "2026-08-16T09:00:00+09:00" },
    { bodyKey: "LetterPageFiveBody", releaseAt: "2026-08-17T09:00:00+09:00" },
    { bodyKey: "LetterPageSixBody", releaseAt: "2026-08-18T09:00:00+09:00", unlockByGiftNine: true },
    { bodyKey: "LetterPageSevenBody", releaseAt: "2026-08-18T09:00:00+09:00" },
    { bodyKey: "LetterPageEightBody", releaseAt: "2026-08-19T09:00:00+09:00" },
    { bodyKey: "LetterPageNineBody", releaseAt: "2026-08-20T09:00:00+09:00" },
  ],
};

const LETTER_CONFIG = window.LETTER_CONFIG || BUILTIN_LETTER_CONFIG;
const LETTER_DESCRIPTION_RELEASE_DATE = new Date(LETTER_CONFIG.descriptionReleaseAt);
const LETTER_PAGES = LETTER_CONFIG.pages.map((item) => ({
  bodyKey: item.bodyKey,
  releaseAt: new Date(item.releaseAt),
  unlockByGiftNine: Boolean(item.unlockByGiftNine),
}));

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

let resourceStrings = {};
let lastPublicHash = "#home";
let adminSessionToken = "";
let activePageId = "home";
let unlockedProtectedPages = new Set();
let trustedTimeOffsetMs = null;
let trustedTimeSyncedAt = 0;
let trustedTimeLastAttemptAt = 0;
let trustedTimeSyncPromise = null;
let updateLetterReleaseView = () => {};
let refreshGiftGridView = () => {};
let siteConfigLoadPromise = null;

async function loadResourceStrings() {
  const response = await fetch(RESOURCE_URL);
  if (!response.ok) throw new Error("Failed to load resource strings.");

  const xml = await response.text();
  const documentXml = new DOMParser().parseFromString(xml, "application/xml");
  const parseError = documentXml.querySelector("parsererror");
  if (parseError) throw new Error("Failed to parse resource strings.");

  resourceStrings = [...documentXml.querySelectorAll("data[name]")].reduce((items, node) => {
    const key = node.getAttribute("name");
    const value = node.querySelector("value")?.textContent ?? "";
    if (key) items[key] = value;
    return items;
  }, {});
}

function t(key, values = {}) {
  const template = resourceStrings[key] ?? key;
  return Object.entries(values).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    template,
  );
}

function applyResourceStrings() {
  $$("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });

  $$("[data-i18n-placeholder]").forEach((element) => {
    element.setAttribute("placeholder", t(element.dataset.i18nPlaceholder));
  });

  $$("[data-i18n-alt]").forEach((element) => {
    element.setAttribute("alt", t(element.dataset.i18nAlt));
  });

  $$("[data-i18n-aria-label]").forEach((element) => {
    element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel));
  });

  $$("[data-i18n-title]").forEach((element) => {
    element.setAttribute("title", t(element.dataset.i18nTitle));
  });

  document.title = t("MetaTitle");
  document.querySelector('meta[name="description"]')?.setAttribute("content", t("MetaDescription"));
  document.querySelector('meta[property="og:title"]')?.setAttribute("content", t("MetaTitle"));
  document.querySelector('meta[property="og:description"]')?.setAttribute("content", t("MetaDescription"));
  document.querySelector('meta[name="twitter:title"]')?.setAttribute("content", t("MetaTitle"));
  document.querySelector('meta[name="twitter:description"]')?.setAttribute("content", t("MetaDescription"));
}

function isLocalFile() {
  return window.location.protocol === "file:";
}

function isGuestbookConfigured() {
  return Boolean(
    GUESTBOOK_CONFIG.formAction &&
      GUESTBOOK_CONFIG.nameEntry &&
      GUESTBOOK_CONFIG.messageEntry &&
      GUESTBOOK_CONFIG.sheetCsvUrl,
  );
}

function readStoredValue(storage, key) {
  try {
    return storage.getItem(key);
  } catch (error) {
    return null;
  }
}

function writeStoredValue(storage, key, value) {
  try {
    storage.setItem(key, value);
    return true;
  } catch (error) {
    // Storage can be unavailable in strict privacy modes.
    return false;
  }
}

function isAdminAuthenticated() {
  return Boolean(getAdminSessionToken());
}

function getAdminSessionToken() {
  if (adminSessionToken) return adminSessionToken;
  adminSessionToken = readStoredValue(sessionStorage, ADMIN_SESSION_TOKEN_KEY) || "";
  return adminSessionToken;
}

function setAdminSessionToken(token) {
  adminSessionToken = token;
  writeStoredValue(sessionStorage, ADMIN_SESSION_TOKEN_KEY, token);
}

function clearAdminSessionToken() {
  adminSessionToken = "";
  try {
    sessionStorage.removeItem(ADMIN_SESSION_TOKEN_KEY);
  } catch (error) {
    // Storage can be unavailable in strict privacy modes.
  }
}

async function requestAdminApi(action, payload = {}, options = {}) {
  const controller = options.timeoutMs ? new AbortController() : null;
  const timeoutId = controller
    ? setTimeout(() => controller.abort(), options.timeoutMs)
    : null;

  let response;
  try {
    response = await fetch(ADMIN_API_URL, {
      method: "POST",
      body: JSON.stringify({ action, ...payload }),
      signal: controller?.signal,
    });
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }

  const data = await response.json();

  if (!response.ok || !data.ok) {
    const message = data.message || t("AdminRequestFailed");
    const error = new Error(message);
    error.code = data.code;
    throw error;
  }

  return data;
}

async function requestJson(url, options = {}) {
  const controller = options.timeoutMs ? new AbortController() : null;
  const timeoutId = controller
    ? setTimeout(() => controller.abort(), options.timeoutMs)
    : null;

  let response;
  try {
    response = await fetch(url, {
      method: options.method || "GET",
      cache: "no-store",
      signal: controller?.signal,
    });
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }

  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(data.message || "Request failed.");
  }
  return data;
}

const adminAuth = {
  async verifyPassword(password) {
    const data = await requestAdminApi("verifyAdminPassword", { password });
    setAdminSessionToken(data.token);
    return data;
  },

  async changePassword(newPassword) {
    return requestAdminApi("changePassword", {
      token: getAdminSessionToken(),
      newPassword,
    });
  },
};

const sharedPasswordAuth = {
  verifyPassword(password) {
    return requestAdminApi("verifyPassword", { password });
  },
};

async function syncTrustedTime() {
  if (trustedTimeSyncPromise) return trustedTimeSyncPromise;

  trustedTimeLastAttemptAt = Date.now();
  trustedTimeSyncPromise = requestTrustedTime()
    .then((data) => {
      const epochMs = Number(data.epochMs);

      if (!Number.isFinite(epochMs)) throw new Error("Invalid server time.");

      trustedTimeOffsetMs = epochMs - Date.now();
      trustedTimeSyncedAt = Date.now();
      return getTrustedNow();
    })
    .finally(() => {
      trustedTimeSyncPromise = null;
    });

  return trustedTimeSyncPromise;
}

async function requestTrustedTime() {
  const serverTimeUrl = await getServerTimeUrl();

  if (serverTimeUrl) {
    try {
      return await requestJson(serverTimeUrl, { timeoutMs: TRUSTED_TIME_FAST_TIMEOUT_MS });
    } catch (error) {
      console.warn("Fast server time endpoint failed; falling back to Apps Script.", error);
    }
  }

  return requestAdminApi("getServerTime", {}, { timeoutMs: TRUSTED_TIME_REQUEST_TIMEOUT_MS });
}

async function getServerTimeUrl() {
  try {
    await loadSiteConfig();
  } catch (error) {
    return "";
  }

  const configuredUrl = window.SITE_CONFIG?.SERVER_TIME_URL?.trim() || "";
  if (configuredUrl) return configuredUrl;

  const zipUrl = window.SITE_CONFIG?.LETTER_ZIP_WORKER_URL?.trim() || "";
  if (!zipUrl || zipUrl.includes("WORKER_NAME.YOUR_SUBDOMAIN")) return "";

  try {
    const url = new URL(zipUrl);
    url.pathname = "/time";
    url.search = "";
    return url.toString();
  } catch (error) {
    return "";
  }
}

function getTrustedNow() {
  if (trustedTimeOffsetMs === null) return null;
  return new Date(Date.now() + trustedTimeOffsetMs);
}

function needsTrustedTimeSync() {
  const now = Date.now();
  if (trustedTimeOffsetMs === null) return now - trustedTimeLastAttemptAt > TRUSTED_TIME_RETRY_INTERVAL_MS;
  return now - trustedTimeSyncedAt > TRUSTED_TIME_SYNC_INTERVAL_MS;
}

async function refreshTrustedTimeIfNeeded() {
  if (!needsTrustedTimeSync()) return;

  try {
    await syncTrustedTime();
  } catch (error) {
    console.error(error);
  }
}

function getAdminErrorMessage(error) {
  if (error.code === "BAD_PASSWORD" || error.code === "BAD_ADMIN_PASSWORD") return t("PasswordBad");
  if (error.code === "LOCKED") return t("PasswordLocked");
  if (error.code === "UNAUTHORIZED") return t("AdminUnauthorized");
  if (error.code === "WEAK_PASSWORD") return t("PasswordWeak");
  return t("PasswordServerFailed");
}

function isProtectedPage(pageId) {
  return PROTECTED_PAGE_IDS.includes(pageId);
}

function getProtectedPageElements(pageId) {
  return {
    gate: $(`[data-protected-gate="${pageId}"]`),
    content: $(`[data-protected-content="${pageId}"]`),
    form: $(`[data-protected-form="${pageId}"]`),
    input: $(`[data-protected-password="${pageId}"]`),
    status: $(`[data-protected-status="${pageId}"]`),
    title: $(`[data-protected-title="${pageId}"]`),
    confirm: $(`[data-protected-confirm="${pageId}"]`),
    timecapsuleStatus: $(`[data-timecapsule-status="${pageId}"]`),
  };
}

function isTimecapsuleOpen(now = getTrustedNow()) {
  if (!now) return false;
  return now.getTime() >= TIMECAPSULE_OPEN_DATE.getTime();
}

function shouldShowTimecapsuleOpenNotice(now = getTrustedNow()) {
  if (!now) return false;
  const time = now.getTime();
  return time >= TIMECAPSULE_OPEN_DATE.getTime() && time < TIMECAPSULE_OPEN_NOTICE_END_DATE.getTime();
}

function getTimecapsuleRemainingParts(now = getTrustedNow()) {
  if (!now) return null;
  const remaining = Math.max(0, TIMECAPSULE_OPEN_DATE.getTime() - now.getTime());
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return { days, hours, minutes, seconds };
}

function formatKstDateTime(date) {
  return `${new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)} KST`;
}

function formatTimecapsuleOpenAt() {
  return formatKstDateTime(TIMECAPSULE_OPEN_DATE);
}

function updateTimecapsuleGate(pageId, now = getTrustedNow()) {
  const { title, confirm, form, input, status, timecapsuleStatus } = getProtectedPageElements(pageId);
  const hasTrustedTime = Boolean(now);
  const opened = isTimecapsuleOpen(now);

  if (title) {
    title.textContent = opened
      ? t("ProtectedTitle")
      : hasTrustedTime
        ? t("TimecapsuleTitle", { openAt: formatTimecapsuleOpenAt() })
        : t("TimecapsuleCheckingTitle");
  }

  if (confirm) {
    confirm.disabled = !opened;
    confirm.textContent = opened ? t("ProtectedConfirmButton") : t("TimecapsuleLockedButton");
  }

  if (!opened && form) {
    form.hidden = true;
    form.reset();
  }

  if (!opened && input) input.value = "";
  if (!opened && status) status.textContent = t("TimecapsulePasswordLocked");

  if (timecapsuleStatus) {
    timecapsuleStatus.hidden = false;

    if (opened) {
      if (shouldShowTimecapsuleOpenNotice(now)) {
        timecapsuleStatus.textContent = t("TimecapsuleOpenStatus");
      } else {
        timecapsuleStatus.textContent = "";
        timecapsuleStatus.hidden = true;
      }
      return;
    }

    const parts = getTimecapsuleRemainingParts(now);
    timecapsuleStatus.textContent = parts
      ? `${t("TimecapsuleOpenAt", { openAt: formatTimecapsuleOpenAt() })}\n${t("TimecapsuleCountdown", parts)}`
      : t("TimecapsuleTimeUnavailable");
  }
}

function updateTimecapsuleGates() {
  PROTECTED_PAGE_IDS.forEach((pageId) => updateTimecapsuleGate(pageId));
}

function resetProtectedPage(pageId) {
  const { gate, content, form, input, status } = getProtectedPageElements(pageId);

  if (pageId === "gift") {
    const giftModal = $("[data-gift-modal]");
    const giftVideoModal = $("[data-gift-video-modal]");
    const giftDudModal = $("[data-gift-dud-modal]");
    const giftVideo = $("[data-gift-video]");

    if (giftModal) giftModal.hidden = true;
    if (giftVideoModal) giftVideoModal.hidden = true;
    if (giftDudModal) giftDudModal.hidden = true;
    if (giftVideo) giftVideo.pause();
    document.body.classList.remove("modal-open");
  }

  unlockedProtectedPages.delete(pageId);
  if (gate) gate.hidden = false;
  if (content) content.hidden = true;
  if (form) {
    form.hidden = true;
    form.reset();
  }
  if (input) input.value = "";
  if (status) status.textContent = t("ProtectedPasswordPrompt");
  updateTimecapsuleGate(pageId);
}

function unlockProtectedPage(pageId) {
  const { gate, content, form } = getProtectedPageElements(pageId);

  unlockedProtectedPages.add(pageId);
  if (gate) gate.hidden = true;
  if (content) content.hidden = false;
  if (form) form.reset();
}

function syncProtectedPage(pageId) {
  const { gate, content } = getProtectedPageElements(pageId);
  const isUnlocked = unlockedProtectedPages.has(pageId);

  if (!isTimecapsuleOpen()) {
    updateTimecapsuleGate(pageId);
    if (gate) gate.hidden = false;
    if (content) content.hidden = true;
    unlockedProtectedPages.delete(pageId);
    return;
  }

  if (gate) gate.hidden = isUnlocked;
  if (content) content.hidden = !isUnlocked;
  updateTimecapsuleGate(pageId);
}

function setActivePage() {
  const hashTarget = window.location.hash?.replace("#", "") || "home";
  const pageTarget = hashTarget === "guestbook" ? "love" : hashTarget;
  const hasPage = Boolean(document.getElementById(pageTarget)?.classList.contains("page"));
  const activePage = hasPage ? pageTarget : "home";

  if (activePage === "admin" && !isAdminAuthenticated()) {
    const fallbackTarget = lastPublicHash.replace("#", "") || "home";
    const fallbackPage = fallbackTarget === "guestbook" ? "love" : fallbackTarget;

    $$(".page").forEach((page) => page.classList.toggle("active", page.id === fallbackPage));
    $$(".nav a").forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${fallbackPage}`));
    openAdminAuthModal();
    return;
  }

  if (activePageId !== activePage) {
    PROTECTED_PAGE_IDS.forEach((pageId) => {
      if (pageId !== activePage) resetProtectedPage(pageId);
    });
  }

  $$(".page").forEach((page) => page.classList.toggle("active", page.id === activePage));
  $$(".nav a").forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${activePage}`));

  if (isProtectedPage(activePage)) {
    syncProtectedPage(activePage);
  }

  if (hashTarget !== activePage && document.getElementById(hashTarget)) {
    requestAnimationFrame(() => document.getElementById(hashTarget)?.scrollIntoView({ block: "start" }));
  }

  if (activePage !== "admin") {
    lastPublicHash = window.location.hash || "#home";
  }

  activePageId = activePage;
}

function initGate() {
  const gate = $("[data-gate]");
  const kick = $("[data-kick]");
  const content = $("[data-home-content]");

  $("[data-gate-yes]").addEventListener("click", () => {
    gate.hidden = true;
    kick.hidden = true;
    content.hidden = false;
  });

  $("[data-gate-no]").addEventListener("click", () => {
    gate.hidden = true;
    content.hidden = true;
    kick.hidden = false;
  });

  $("[data-gate-reset]").addEventListener("click", () => {
    kick.hidden = true;
    content.hidden = true;
    gate.hidden = false;
  });
}

function openAdminAuthModal() {
  const modal = $("[data-admin-auth-modal]");
  const input = $("[data-admin-auth-password]");
  const status = $("[data-admin-auth-status]");

  if (!modal || !input || !status) return;

  modal.hidden = false;
  document.body.classList.add("modal-open");
  input.value = "";
  status.textContent = t("AdminPasswordPrompt");
  requestAnimationFrame(() => input.focus());
}

function closeAdminAuthModal() {
  const modal = $("[data-admin-auth-modal]");
  const form = $("[data-admin-auth-form]");
  const status = $("[data-admin-auth-status]");

  if (!modal || !form || !status) return;

  modal.hidden = true;
  form.reset();
  status.textContent = t("AdminPasswordPrompt");
  document.body.classList.remove("modal-open");

  if (window.location.hash === "#admin") {
    history.replaceState(null, "", lastPublicHash);
    setActivePage();
  }
}

function initAdminAuth() {
  const form = $("[data-admin-auth-form]");
  const input = $("[data-admin-auth-password]");
  const status = $("[data-admin-auth-status]");
  const exit = $("[data-admin-auth-exit]");
  const shortcut = $("[data-admin-shortcut]");
  let shortcutClicks = [];

  if (!form || !input || !status || !exit || !shortcut) return;

  shortcut.addEventListener("click", (event) => {
    const now = Date.now();
    shortcutClicks = shortcutClicks.filter((clickedAt) => now - clickedAt <= ADMIN_SHORTCUT_WINDOW_MS);
    shortcutClicks.push(now);

    if (shortcutClicks.length < ADMIN_SHORTCUT_CLICK_COUNT) return;

    event.preventDefault();
    shortcutClicks = [];

    if (isAdminAuthenticated()) {
      window.location.hash = "#admin";
      return;
    }

    openAdminAuthModal();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = input.value;

    if (!password) return;

    status.textContent = t("PasswordChecking");

    try {
      await adminAuth.verifyPassword(password);
      form.reset();
      status.textContent = t("PasswordConfirmed");
      $("[data-admin-auth-modal]").hidden = true;
      document.body.classList.remove("modal-open");
      window.location.hash = "#admin";
      setActivePage();
    } catch (error) {
      input.value = "";
      status.textContent = getAdminErrorMessage(error);
      input.focus();
    }
  });

  exit.addEventListener("click", closeAdminAuthModal);
}

function initAdminPage() {
  const tabs = $$("[data-admin-panel-tab]");
  const panels = $$("[data-admin-panel]");
  const form = $("[data-admin-password-form]");
  const newPassword = $("[data-admin-new-password]");
  const confirmPassword = $("[data-admin-confirm-password]");
  const status = $("[data-admin-password-status]");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.adminPanelTab;
      tabs.forEach((item) => item.classList.toggle("active", item === tab));
      panels.forEach((panel) => panel.classList.toggle("active", panel.dataset.adminPanel === target));
    });
  });

  if (!form || !newPassword || !confirmPassword || !status) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = newPassword.value.trim();
    const confirmation = confirmPassword.value.trim();

    if (password.length < 4) {
      status.textContent = t("PasswordWeak");
      newPassword.focus();
      return;
    }

    if (password !== confirmation) {
      status.textContent = t("PasswordMismatch");
      confirmPassword.focus();
      return;
    }

    status.textContent = t("PasswordSaving");

    try {
      await adminAuth.changePassword(password);
      form.reset();
      status.textContent = t("PasswordChanged");
    } catch (error) {
      if (error.code === "UNAUTHORIZED") clearAdminSessionToken();
      status.textContent = getAdminErrorMessage(error);
    }
  });
}

function initProtectedPages() {
  $$("[data-protected-confirm]").forEach((button) => {
    button.addEventListener("click", () => {
      const pageId = button.dataset.protectedConfirm;
      const { form, input, status } = getProtectedPageElements(pageId);

      if (!form || !input || !status) return;
      if (!isTimecapsuleOpen()) {
        updateTimecapsuleGate(pageId);
        refreshTrustedTimeIfNeeded();
        return;
      }

      form.hidden = false;
      status.textContent = t("ProtectedPasswordPrompt");
      requestAnimationFrame(() => input.focus());
    });
  });

  $$("[data-protected-form]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const pageId = form.dataset.protectedForm;
      const { input, status } = getProtectedPageElements(pageId);
      const password = input?.value || "";

      if (!pageId || !input || !status || !password) return;
      if (!isTimecapsuleOpen()) {
        updateTimecapsuleGate(pageId);
        refreshTrustedTimeIfNeeded();
        return;
      }

      status.textContent = t("PasswordChecking");

      try {
        await sharedPasswordAuth.verifyPassword(password);
        status.textContent = t("PasswordConfirmed");
        unlockProtectedPage(pageId);
      } catch (error) {
        input.value = "";
        status.textContent = getAdminErrorMessage(error);
        input.focus();
      }
    });
  });

  PROTECTED_PAGE_IDS.forEach(resetProtectedPage);
  updateTimecapsuleGates();
}

function updateCountdown() {
  const now = new Date();
  const main = $("[data-count-main]");
  const detail = $("[data-count-detail]");
  const label = $("[data-count-label]");

  if (!main || !detail || !label) return;

  const remaining = ANNIVERSARY_DATE.getTime() - now.getTime();
  if (remaining > 0) {
    const days = Math.floor(remaining / 86400000);
    const hours = Math.floor((remaining % 86400000) / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    label.textContent = t("CountdownUntil");
    main.textContent = `D-${days}`;
    detail.textContent = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    return;
  }

  const together = now.getTime() - START_DATE.getTime();
  const daysTogether = Math.floor(together / 86400000);
  label.textContent = t("CountdownTogether");
  main.textContent = `D+${daysTogether}`;
  detail.textContent = t("CountdownDetailAfter");
}

function shuffleItems(items) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function selectVisibleGifts(items) {
  if (isGiftEightPending()) {
    return Array.from({ length: VISIBLE_GIFT_COUNT }, () => GIFT_EIGHT);
  }

  const availableGifts = getAvailableGifts(items);
  return shuffleItems(availableGifts).slice(0, Math.min(VISIBLE_GIFT_COUNT, availableGifts.length));
}

function getGiftNow() {
  return getTrustedNow() || new Date();
}

function isGiftBoxLuxuryOpen(now = getGiftNow()) {
  return now.getTime() >= GIFT_BOX_LUXURY_OPEN_DATE.getTime();
}

function getGiftBoxImages() {
  return isGiftBoxLuxuryOpen() ? GIFT_BOX_IMAGES.luxury : GIFT_BOX_IMAGES.basic;
}

function isGiftAvailable(gift, now = getGiftNow()) {
  if (!gift.availableAt) return true;
  return now.getTime() >= new Date(gift.availableAt).getTime();
}

function isGiftNineEligible() {
  return !isGiftNineClaimed() && isGiftAvailable(GIFT_NINE);
}

function isGiftNineClaimed() {
  return readStoredValue(localStorage, GIFT_NINE_CLAIMED_KEY) === "1";
}

function getAvailableGifts(items) {
  const candidates = [...items];
  if (!isGiftNineClaimed()) candidates.push(GIFT_NINE);
  return candidates.filter((gift) => isGiftAvailable(gift));
}

function readStoredNumber(key) {
  const value = Number.parseInt(readStoredValue(localStorage, key) || "0", 10);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function isGiftEightPending() {
  return readStoredValue(localStorage, GIFT_EIGHT_PENDING_KEY) === "1";
}

function recordGiftSevenPick() {
  const cycleCount = readStoredNumber(GIFT_SEVEN_CYCLE_COUNT_KEY) + 1;
  const totalCount = readStoredNumber(GIFT_SEVEN_TOTAL_COUNT_KEY) + 1;

  writeStoredValue(localStorage, GIFT_SEVEN_CYCLE_COUNT_KEY, String(cycleCount));
  writeStoredValue(localStorage, GIFT_SEVEN_TOTAL_COUNT_KEY, String(totalCount));

  if (cycleCount >= 2) {
    writeStoredValue(localStorage, GIFT_EIGHT_PENDING_KEY, "1");
  }
}

function resetGiftSevenCycle() {
  writeStoredValue(localStorage, GIFT_SEVEN_CYCLE_COUNT_KEY, "0");
  writeStoredValue(localStorage, GIFT_EIGHT_PENDING_KEY, "0");
}

function markGiftNineClaimed() {
  writeStoredValue(localStorage, GIFT_NINE_CLAIMED_KEY, "1");
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function discoverGiftPhotos() {
  return Promise.resolve(GIFT_PHOTO_CONFIG.files.map((file) => `${GIFT_PHOTO_CONFIG.folder}${file}`));
}

function initGiftPhotoGame(photoUrls, onClose = () => {}) {
  const modal = $("[data-gift-modal]");
  const stage = $("[data-gift-stage]");
  const gameStatus = $("[data-gift-game-status]");
  const readyView = $("[data-gift-ready-view]");
  const readyMessage = $("[data-gift-ready-message]");
  const readyStart = $("[data-gift-ready-start]");
  const captureView = $("[data-gift-capture-view]");
  const capturedImage = $("[data-gift-captured-image]");
  const download = $("[data-gift-download]");
  const replay = $("[data-gift-replay]");
  const close = $("[data-gift-close]");
  const capturedClose = $("[data-gift-captured-close]");
  const finishView = $("[data-gift-finish-view]");
  const finishConfirm = $("[data-gift-finish-confirm]");
  let spawnTimer;
  let countdownTimer;
  let countdownResolve;
  let gameStartedAt = 0;
  let photoQueue = [];
  let speedMultiplier = 1;
  let capturedPhotoUrl = "";
  let gameFlowToken = 0;
  const preloadedPhotos = new Map();
  const loadedPhotoUrls = new Set();

  function stopSpawning() {
    clearTimeout(spawnTimer);
    spawnTimer = null;
  }

  function stopCountdown() {
    clearTimeout(countdownTimer);
    countdownTimer = null;
    if (countdownResolve) {
      countdownResolve();
      countdownResolve = null;
    }
  }

  function resetStage() {
    stopSpawning();
    stopCountdown();
    stage.innerHTML = "";
  }

  function clearActivePhotos() {
    stage.innerHTML = "";
  }

  function sleep(ms) {
    return new Promise((resolve) => {
      countdownResolve = resolve;
      countdownTimer = setTimeout(() => {
        countdownTimer = null;
        countdownResolve = null;
        resolve();
      }, ms);
    });
  }

  async function preloadPhoto(url) {
    if (preloadedPhotos.has(url)) {
      const didLoad = await preloadedPhotos.get(url);
      if (!didLoad) preloadedPhotos.delete(url);
      return didLoad;
    }

    const promise = new Promise((resolve) => {
      const loadImage = () => {
        const image = new Image();
        image.decoding = "async";
        image.onload = () => {
          loadedPhotoUrls.add(url);
          resolve(true);
        };
        image.onerror = () => setTimeout(loadImage, 1000);
        image.src = url;
      };

      loadImage();
    });

    preloadedPhotos.set(url, promise);
    const didLoad = await promise;
    if (!didLoad) preloadedPhotos.delete(url);
    return didLoad;
  }

  async function preloadAllPhotos(onProgress = () => {}) {
    const reportProgress = () => onProgress(getLoadedPhotoUrls().length, photoUrls.length);
    reportProgress();

    await Promise.all(
      photoUrls.map(async (url) => {
        const wasLoaded = loadedPhotoUrls.has(url);
        const didLoad = await preloadPhoto(url);
        if (didLoad && !wasLoaded) reportProgress();
      }),
    );
  }

  function getLoadedPhotoUrls() {
    return photoUrls.filter((url) => loadedPhotoUrls.has(url));
  }

  function waitForInitialPreload(onProgress = () => {}) {
    return new Promise((resolve) => {
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        resolve();
      };
      const timer = setTimeout(finish, GIFT_PHOTO_CONFIG.maxInitialLoadMs);

      preloadAllPhotos((loaded, total) => {
        if (finished) return;
        onProgress(loaded, total);
        if (loaded >= total) finish();
      }).then(finish);
    });
  }

  function showStageLoadingProgress(loaded, total) {
    const percent = total ? Math.round((loaded / total) * 100) : 100;
    stage.innerHTML = `
      <div class="gift-loading-progress" style="--gift-load-progress: ${percent}%;" aria-live="polite">
        <div class="gift-loading-ring">
          <span>${percent}%</span>
        </div>
        <p>${t("GiftStatusLoadingPhotos")}</p>
        <strong>${loaded}/${total}</strong>
      </div>
    `;
  }

  function showStageCountdown(value) {
    stage.innerHTML = `<div class="gift-countdown">${value}</div>`;
  }

  function showLoadFailedView() {
    readyView.hidden = false;
    captureView.hidden = true;
    finishView.hidden = true;
    stage.hidden = true;
    readyMessage.innerHTML = `
      <p>${t("GiftStatusLoadFailed")}</p>
      <strong>${t("GiftReadyQuestion")}</strong>
    `;
    gameStatus.textContent = t("GiftStatusLoadFailed");
  }

  function exitGame() {
    gameFlowToken += 1;
    resetStage();
    modal.hidden = true;
    readyView.hidden = false;
    captureView.hidden = true;
    finishView.hidden = true;
    stage.hidden = false;
    document.body.classList.remove("modal-open");
    onClose();
  }

  function getRandomSpeedMultiplier() {
    return Math.round(randomBetween(3, 17)) / 10;
  }

  function getReadyPrefix() {
    const speedText = speedMultiplier.toFixed(1);
    if (speedMultiplier < 1) return t("GiftSpeedLucky", { speed: speedText });
    if (speedMultiplier > 1) return t("GiftSpeedHard", { speed: speedText });
    return "";
  }

  function setReadyMessage() {
    const prefix = getReadyPrefix();
    const prefixMarkup = prefix ? `<p class="gift-speed-message">${prefix}</p>` : "";
    readyMessage.innerHTML = `
      ${prefixMarkup}
      <p>${t("GiftReadyDescription")}</p>
      <strong>${t("GiftReadyQuestion")}</strong>
    `;
  }

  function getFallDuration() {
    const elapsedSeconds = (Date.now() - gameStartedAt) / 1000;
    // Difficulty lowered: do not multiply the time-based acceleration by speedMultiplier.
    // const speedUp = GIFT_PHOTO_CONFIG.speedUpPerSecond * speedMultiplier;
    const speedUp = GIFT_PHOTO_CONFIG.speedUpPerSecond;
    const accelerated = GIFT_PHOTO_CONFIG.startFallMs - elapsedSeconds * speedUp;
    const base = Math.max(GIFT_PHOTO_CONFIG.minFallMs, accelerated);
    return randomBetween(base * 0.78, base * 1.18) / speedMultiplier;
  }

  function getPhotoFilename(url) {
    return decodeURIComponent(url.split("/").pop() || "gift-photo.jpg");
  }

  function isMobileBrowser() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  async function getPhotoFile(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to load captured photo.");
    const blob = await response.blob();
    const filename = getPhotoFilename(url);
    return new File([blob], filename, { type: blob.type || "image/jpeg" });
  }

  async function saveCapturedPhoto(event) {
    event.preventDefault();
    if (!capturedPhotoUrl) return;

    try {
      const file = await getPhotoFile(capturedPhotoUrl);

      if (isMobileBrowser() && navigator.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share({
          files: [file],
          title: t("GiftCapturedAlt"),
        });
        gameStatus.textContent = t("GiftStatusShareSave");
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = file.name;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      gameStatus.textContent = t("GiftStatusDownloadStarted");
    } catch (error) {
      window.open(capturedPhotoUrl, "_blank", "noopener");
      gameStatus.textContent = t("GiftStatusOpenPhotoToSave");
    }
  }

  function capturePhoto(url) {
    stopSpawning();
    clearActivePhotos();
    stage.hidden = true;
    captureView.hidden = false;
    capturedPhotoUrl = url;
    capturedImage.src = url;
    download.href = url;
    download.download = url.split("/").pop() || "gift-photo.jpg";
    gameStatus.textContent = t("GiftStatusCaptured");
  }

  function hasFinishedRound() {
    return !photoQueue.length && !stage.querySelector(".falling-photo");
  }

  function setFinishedStatus() {
    if (hasFinishedRound()) {
      stopSpawning();
      readyView.hidden = true;
      captureView.hidden = true;
      stage.hidden = true;
      finishView.hidden = false;
      gameStatus.textContent = t("GiftStatusFinished");
    }
  }

  function scheduleNextSpawn() {
    stopSpawning();

    if (!photoQueue.length) {
      setFinishedStatus();
      return;
    }

    const delay =
      randomBetween(GIFT_PHOTO_CONFIG.minSpawnDelayMs, GIFT_PHOTO_CONFIG.maxSpawnDelayMs) / speedMultiplier;
    spawnTimer = setTimeout(() => {
      spawnPhoto();
      scheduleNextSpawn();
    }, delay);
  }

  function spawnPhoto() {
    const url = photoQueue.shift();
    if (!url) {
      stopSpawning();
      setFinishedStatus();
      return;
    }

    const button = document.createElement("button");
    const image = document.createElement("img");
    const size = randomBetween(84, 180);
    const duration = getFallDuration();

    button.className = "falling-photo";
    button.type = "button";
    button.style.left = `${randomBetween(2, 86)}%`;
    button.style.setProperty("--photo-size", `${size}px`);
    button.style.setProperty("--fall-duration", `${duration}ms`);
    button.style.setProperty("--rotate-start", `${randomBetween(-28, 28)}deg`);
    button.style.setProperty("--rotate-end", `${randomBetween(-34, 34)}deg`);
    button.style.setProperty("--drift", `${randomBetween(-70, 70)}px`);
    image.src = url;
    image.alt = t("GiftFallingPhotoAlt");
    image.draggable = false;

    button.appendChild(image);
    button.addEventListener("click", () => capturePhoto(url));
    button.addEventListener("animationend", () => {
      button.remove();
      setFinishedStatus();
    });
    stage.appendChild(button);
  }

  function startRound(roundPhotoUrls) {
    if (!roundPhotoUrls.length) {
      showLoadFailedView();
      return;
    }

    resetStage();
    readyView.hidden = true;
    captureView.hidden = true;
    finishView.hidden = true;
    stage.hidden = false;
    gameStartedAt = Date.now();
    photoQueue = shuffleItems(roundPhotoUrls);
    gameStatus.textContent = t("GiftStatusPlaying");
    spawnPhoto();
    scheduleNextSpawn();
  }

  async function beginRound() {
    const flowToken = gameFlowToken + 1;
    gameFlowToken = flowToken;
    readyStart.disabled = true;
    readyView.hidden = true;
    captureView.hidden = true;
    finishView.hidden = true;
    stage.hidden = false;
    stage.innerHTML = "";
    gameStatus.textContent = t("GiftStatusLoadingPhotos");
    showStageLoadingProgress(0, photoUrls.length);

    try {
      await waitForInitialPreload((loaded, total) => {
        if (flowToken !== gameFlowToken) return;
        showStageLoadingProgress(loaded, total);
      });
      if (flowToken !== gameFlowToken) return;

      for (const value of ["3", "2", "1"]) {
        if (flowToken !== gameFlowToken) return;
        showStageCountdown(value);
        await sleep(GIFT_PHOTO_CONFIG.countdownStepMs);
      }

      if (flowToken !== gameFlowToken) return;
      startRound(getLoadedPhotoUrls());
    } finally {
      readyStart.disabled = false;
    }
  }

  function resumeRound() {
    captureView.hidden = true;
    stage.hidden = false;

    if (!photoQueue.length) {
      setFinishedStatus();
      return;
    }

    gameStatus.textContent = t("GiftStatusResume");
    spawnPhoto();
    scheduleNextSpawn();
  }

  function openReadyView() {
    if (!photoUrls.length) return;
    gameFlowToken += 1;
    resetStage();
    readyStart.disabled = false;
    speedMultiplier = getRandomSpeedMultiplier();
    modal.hidden = false;
    readyView.hidden = false;
    captureView.hidden = true;
    finishView.hidden = true;
    stage.hidden = true;
    document.body.classList.add("modal-open");
    gameStatus.textContent = t("GiftReadyPromptStatus");
    setReadyMessage();
  }

  close.addEventListener("click", exitGame);
  capturedClose.addEventListener("click", exitGame);
  finishConfirm.addEventListener("click", exitGame);
  replay.addEventListener("click", resumeRound);
  readyStart.addEventListener("click", beginRound);
  download.addEventListener("click", saveCapturedPhoto);

  return openReadyView;
}

function initGifts() {
  const grid = $("[data-gift-grid]");
  const result = $("[data-gift-result]");
  let renderGiftGrid = () => {};
  const startGiftVideo = initGiftVideo(() => renderGiftGrid());
  const showGiftResult = initGiftDud(() => renderGiftGrid());
  let startPhotoGame = null;
  let photoGameReady = false;
  let giftNineWasEligible = isGiftNineEligible();

  discoverGiftPhotos().then((photoUrls) => {
    startPhotoGame = initGiftPhotoGame(photoUrls, () => renderGiftGrid());
    photoGameReady = photoUrls.length > 0;
    if (photoGameReady) {
      result.textContent = t("GiftResultDefault");
      return;
    }
    result.textContent = t("GiftNotReady");
  });

  renderGiftGrid = function renderGiftGrid() {
    grid.innerHTML = "";
    const giftBoxImages = getGiftBoxImages();

    selectVisibleGifts(gifts).forEach((gift, index) => {
      const button = document.createElement("button");
      button.className = "gift-box";
      button.type = "button";
      button.setAttribute("aria-label", "선물 상자");
      button.innerHTML = `
      <img class="gift-box-image" src="${giftBoxImages[index % giftBoxImages.length]}" alt="" aria-hidden="true" />
    `;
      button.addEventListener("click", () => {
        if (gift.type === "photoGame") {
          result.textContent = t(gift.resultKey);
          if (!photoGameReady || !startPhotoGame) {
            result.textContent = t("GiftNotReady");
            return;
          }
          startPhotoGame();
          return;
        }

        if (gift.type === "video") {
          result.textContent = t(gift.resultKey);
          startGiftVideo(gift.video);
          return;
        }

        if (gift.type === "dud") {
          result.textContent = t(gift.resultKey);
          if (gift.id === "gift7") {
            recordGiftSevenPick();
          }
          showGiftResult(gift.dud);
          return;
        }

        if (gift.type === "prize") {
          result.textContent = t(gift.resultKey);
          showGiftResult(gift.prize);
          resetGiftSevenCycle();
          return;
        }

        if (gift.type === "letterBonus") {
          result.textContent = t(gift.resultKey);
          markGiftNineClaimed();
          updateLetterReleaseView();
          showGiftResult(gift.notice);
          return;
        }

        result.textContent = t(gift.resultKey);
      });
      grid.appendChild(button);
    });
  };

  refreshGiftGridView = () => {
    const giftNineIsEligible = isGiftNineEligible();
    if (giftNineIsEligible === giftNineWasEligible) return;
    giftNineWasEligible = giftNineIsEligible;
    renderGiftGrid();
  };
  renderGiftGrid();
}

function initGiftVideo(onClose = () => {}) {
  const modal = $("[data-gift-video-modal]");
  const heading = $("[data-gift-video-title]");
  const video = $("[data-gift-video]");
  const actions = $("[data-gift-video-actions]");
  const download = $("[data-gift-video-download]");
  const close = $("[data-gift-video-close]");
  const replay = $("[data-gift-video-replay]");

  function closeVideo() {
    video.pause();
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    onClose();
  }

  function openVideo(config) {
    if (!config?.src) return;
    modal.hidden = false;
    actions.hidden = true;
    document.body.classList.add("modal-open");
    heading.textContent = config.titleKey ? t(config.titleKey) : t("GiftVideoFallbackTitle");
    video.src = config.src;
    download.href = config.src;
    download.download = config.downloadName || config.src.split("/").pop() || "gift-video.mp4";
    video.currentTime = 0;
    video.play().catch(() => {});
  }

  close.addEventListener("click", closeVideo);
  video.addEventListener("ended", () => {
    actions.hidden = false;
  });
  replay.addEventListener("click", () => {
    actions.hidden = true;
    video.currentTime = 0;
    video.play().catch(() => {});
  });

  return openVideo;
}

function initGiftDud(onClose = () => {}) {
  const modal = $("[data-gift-dud-modal]");
  const image = $("[data-gift-dud-image]");
  const title = $("[data-gift-dud-title-text]");
  const message = $("[data-gift-dud-message]");
  const prizeForm = $("[data-gift-prize-form]");
  const prizeInput = $("[data-gift-prize-input]");
  const prizeSubmit = $("[data-gift-prize-submit]");
  const prizeStatus = $("[data-gift-prize-status]");
  const close = $("[data-gift-dud-close]");
  const confirm = $("[data-gift-dud-confirm]");
  const defaultConfirmText = confirm.textContent;
  const defaultConfig = {
    variant: "dud",
    imageSrc: "./assets/gift-bomb.png",
    altKey: "GiftDudAlt",
    titleKey: "GiftDudTitle",
    messageKey: "GiftDudMessage",
  };

  function closeDud() {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    onClose();
  }

  function resetPrizeForm() {
    if (!prizeForm || !prizeInput || !prizeStatus) return;
    prizeForm.hidden = true;
    prizeInput.value = "";
    prizeInput.disabled = false;
    if (prizeSubmit) prizeSubmit.disabled = false;
    prizeStatus.textContent = "";
  }

  function openDud(config = {}) {
    const resultConfig = { ...defaultConfig, ...config };

    modal.dataset.giftResultVariant = resultConfig.variant;
    image.src = resultConfig.imageSrc;
    image.alt = t(resultConfig.altKey);
    title.hidden = !resultConfig.titleKey;
    title.textContent = resultConfig.titleKey ? t(resultConfig.titleKey) : "";
    message.textContent = t(resultConfig.messageKey);
    confirm.textContent = resultConfig.variant === "prize" ? t("GiftPrizeLaterButton") : defaultConfirmText;
    resetPrizeForm();
    if (resultConfig.variant === "prize" && prizeForm) {
      prizeForm.hidden = false;
    }
    modal.hidden = false;
    document.body.classList.add("modal-open");
  }

  prizeForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const wish = prizeInput.value.trim();
    if (!wish) {
      prizeStatus.textContent = t("GiftPrizeWishRequired");
      prizeInput.focus();
      return;
    }

    submitGiftPrizeForm(wish);
    const savedMessage = t("GiftPrizeWishSaved");
    prizeInput.disabled = true;
    if (prizeSubmit) prizeSubmit.disabled = true;
    prizeStatus.textContent = savedMessage;
    window.alert(savedMessage);
    closeDud();
  });

  close.addEventListener("click", closeDud);
  confirm.addEventListener("click", closeDud);

  return openDud;
}

function initLetter() {
  const toggle = $("[data-letter-toggle]");
  const book = $("[data-letter]");
  const descriptionPage = $("[data-letter-description-page]");
  const start = $("[data-letter-start]");
  const page = $("[data-letter-page]");
  const pageTo = $("[data-letter-to]");
  const pageBody = $("[data-letter-page-body]");
  const pageFrom = $("[data-letter-from]");
  const pageNumber = $("[data-letter-page-number]");
  const lockedPage = $("[data-letter-locked-page]");
  const lockedTo = $("[data-letter-locked-to]");
  const lockedBody = $("[data-letter-locked-body]");
  const lockedFrom = $("[data-letter-locked-from]");
  const lockedRelease = $("[data-letter-locked-release]");
  const actions = $("[data-letter-actions]");
  const previous = $("[data-letter-prev]");
  const next = $("[data-letter-next]");
  const home = $("[data-letter-home]");
  const save = $("[data-letter-save]");
  const status = $("[data-letter-status]");
  let currentPageIndex = -1;

  function getNow() {
    return getTrustedNow();
  }

  function isDescriptionReleased(now = getNow()) {
    return Boolean(now && now.getTime() >= LETTER_DESCRIPTION_RELEASE_DATE.getTime());
  }

  function isPageReleased(index, now = getNow()) {
    const item = LETTER_PAGES[index];
    if (!item) return false;
    if (item.unlockByGiftNine && isGiftNineClaimed()) return true;
    return Boolean(now && now.getTime() >= item.releaseAt.getTime());
  }

  function getReleasedPageCount(now = getNow()) {
    return LETTER_PAGES.filter((item, index) => isPageReleased(index, now)).length;
  }

  function formatLetterRelease(date) {
    return new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }

  function hideAllPages() {
    descriptionPage.hidden = true;
    page.hidden = true;
    lockedPage.hidden = true;
    actions.hidden = true;
    status.textContent = "";
  }

  function showDescription() {
    currentPageIndex = -1;
    hideAllPages();
    descriptionPage.hidden = false;

    const now = getNow();
    if (!isDescriptionReleased(now)) {
      status.textContent = now
        ? t("LetterLockedReleaseMessage", { release: formatLetterRelease(LETTER_DESCRIPTION_RELEASE_DATE) })
        : t("LetterTimeCheckingStatus");
      start.disabled = true;
      return;
    }

    start.disabled = false;
  }

  function renderReleasedPage(index) {
    const item = LETTER_PAGES[index];
    const body = t(item.bodyKey).trim();
    hideAllPages();
    currentPageIndex = index;
    pageTo.hidden = index !== 0;
    pageBody.textContent = body;
    pageBody.hidden = !body;
    pageFrom.hidden = index !== LETTER_PAGES.length - 1;
    pageNumber.textContent = String(index + 1);
    page.hidden = false;
    actions.hidden = false;
    previous.hidden = index === 0;
    next.hidden = index === LETTER_PAGES.length - 1;
    home.hidden = true;
    save.hidden = index !== LETTER_PAGES.length - 1;
  }

  function renderLockedPage(index) {
    const item = LETTER_PAGES[index];
    const body = t(item.bodyKey).trim();
    hideAllPages();
    currentPageIndex = index;
    lockedTo.hidden = index !== 0;
    lockedBody.textContent = body;
    lockedBody.hidden = !body;
    lockedFrom.hidden = index !== LETTER_PAGES.length - 1;
    lockedRelease.textContent = t("LetterLockedReleaseMessage", { release: formatLetterRelease(item.releaseAt) });
    lockedPage.hidden = false;
    actions.hidden = false;
    previous.hidden = index <= 0 || getReleasedPageCount() < 1;
    next.hidden = true;
    home.hidden = false;
    save.hidden = true;
  }

  function showLetterPage(index) {
    if (!getNow()) {
      hideAllPages();
      status.textContent = t("LetterTimeCheckingStatus");
      refreshTrustedTimeIfNeeded();
      return;
    }

    if (!LETTER_PAGES[index]) {
      showDescription();
      return;
    }

    if (isPageReleased(index)) {
      renderReleasedPage(index);
      return;
    }

    renderLockedPage(index);
  }

  updateLetterReleaseView = () => {
    if (book.hidden) return;
    if (currentPageIndex === -1) {
      showDescription();
      return;
    }
    showLetterPage(currentPageIndex);
  };

  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!isOpen));
    book.hidden = isOpen;
    if (!isOpen) showDescription();
  });

  start.addEventListener("click", () => showLetterPage(0));
  previous.addEventListener("click", () => {
    if (currentPageIndex > 0) showLetterPage(currentPageIndex - 1);
  });
  next.addEventListener("click", () => showLetterPage(currentPageIndex + 1));
  save.addEventListener("click", async (event) => {
    event.preventDefault();
    const downloadUrl = await getLetterZipUrl();

    if (!downloadUrl) {
      status.textContent = t("LetterSaveUnavailableStatus");
      return;
    }

    // Plain HTTPS navigation to the Cloudflare Worker URL. No fetch(), no
    // Blob, no createObjectURL() — this is what lets KakaoTalk's in-app
    // browser save the file.
    status.textContent = t("LetterSavedStatus");
    window.location.href = downloadUrl;
  });
}

async function loadSiteConfig() {
  if (window.SITE_CONFIG) return;
  if (siteConfigLoadPromise) return siteConfigLoadPromise;

  siteConfigLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "./scripts/config.js";
    script.onload = resolve;
    script.onerror = () => {
      siteConfigLoadPromise = null;
      reject(new Error("Failed to load site config."));
    };
    document.head.appendChild(script);
  });
}

async function getLetterZipUrl() {
  try {
    await loadSiteConfig();
  } catch (error) {
    return "";
  }

  const configuredUrl = window.SITE_CONFIG?.LETTER_ZIP_WORKER_URL?.trim() || "";
  if (!configuredUrl || configuredUrl.includes("WORKER_NAME.YOUR_SUBDOMAIN")) {
    return "";
  }
  return `${configuredUrl}?v=${Date.now()}`;
}

function initCamera() {
  const video = $("[data-video]");
  const status = $("[data-camera-status]");
  const photo = $("[data-photo]");
  const polaroidResult = $("[data-polaroid-result]");
  const polaroid = $("[data-polaroid]");
  const download = $("[data-download]");
  const captionDate = $("[data-polaroid-date]");
  const captionCopy = $("[data-polaroid-copy]");
  const captureButton = $("[data-camera-capture]");
  const styleInputs = $$("[data-polaroid-style], [data-polaroid-pattern], [data-polaroid-font], [data-polaroid-font-size]");
  let stream;
  let captureVersion = 0;
  let renderVersion = 0;
  let capturedCanvas = null;
  let capturedCaption = null;

  function refreshPolaroidPreview() {
    const options = getSelectedPolaroidOptions();
    applyPolaroidPreviewStyle(polaroid, options);
  }

  async function refreshPolaroidDownload() {
    if (!capturedCanvas || !capturedCaption || polaroidResult.hidden) return;

    const currentRender = ++renderVersion;
    download.href = "#";
    status.textContent = t("CameraPreparingStatus");

    await ensurePolaroidFontsLoaded();
    const framedDataUrl = createPolaroidDataUrl(capturedCanvas, capturedCaption, getSelectedPolaroidOptions());
    if (currentRender !== renderVersion) return;
    download.href = framedDataUrl;
    status.textContent = t("CameraReadyStatus");
  }

  async function showCapturedCanvas(canvas) {
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    const polaroidCaption = getPolaroidCaptionParts();
    const currentCapture = captureVersion + 1;
    captureVersion = currentCapture;
    const currentRender = ++renderVersion;
    capturedCanvas = canvas;
    capturedCaption = polaroidCaption;

    photo.src = dataUrl;
    polaroid.style.setProperty("--polaroid-photo-ratio", `${canvas.width} / ${canvas.height}`);
    captionDate.textContent = polaroidCaption.date;
    captionCopy.textContent = polaroidCaption.copy;
    download.href = "#";
    polaroidResult.hidden = false;
    refreshPolaroidPreview();
    captureButton.textContent = t("CameraRetakeButton");
    status.textContent = t("CameraPreparingStatus");

    await ensurePolaroidFontsLoaded();
    const framedDataUrl = createPolaroidDataUrl(canvas, polaroidCaption, getSelectedPolaroidOptions());
    if (currentCapture !== captureVersion || currentRender !== renderVersion) return;
    download.href = framedDataUrl;
    status.textContent = t("CameraReadyStatus");
  }

  styleInputs.forEach((input) => {
    input.addEventListener("change", () => {
      refreshPolaroidPreview();
      refreshPolaroidDownload();
    });
  });

  refreshPolaroidPreview();

  $("[data-camera-start]").addEventListener("click", async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: PHOTO_OUTPUT_WIDTH },
          height: { ideal: PHOTO_OUTPUT_HEIGHT },
          aspectRatio: { ideal: PHOTO_ASPECT_RATIO },
        },
        audio: false,
      });
      video.srcObject = stream;
      status.textContent = t("CameraStartedStatus");
    } catch (error) {
      status.textContent = t("CameraPermissionStatus");
    }
  });

  captureButton.addEventListener("click", async () => {
    if (!stream) {
      status.textContent = t("CameraNeedsStartStatus");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = PHOTO_OUTPUT_WIDTH;
    canvas.height = PHOTO_OUTPUT_HEIGHT;
    const context = canvas.getContext("2d");
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    drawVideoCover(context, video, canvas.width, canvas.height);
    await showCapturedCanvas(canvas);
  });

  download.addEventListener("click", (event) => {
    if (download.getAttribute("href") === "#") {
      event.preventDefault();
      status.textContent = t("CameraDownloadPreparingStatus");
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (stream && document.visibilityState === "visible") {
      video.play().catch(() => {});
    }
  });
}

function drawVideoCover(context, video, outputWidth, outputHeight) {
  const sourceWidth = video.videoWidth || outputWidth;
  const sourceHeight = video.videoHeight || outputHeight;
  const sourceRatio = sourceWidth / sourceHeight;
  let cropWidth = sourceWidth;
  let cropHeight = sourceHeight;
  let cropX = 0;
  let cropY = 0;

  if (sourceRatio > PHOTO_ASPECT_RATIO) {
    cropWidth = Math.round(sourceHeight * PHOTO_ASPECT_RATIO);
    cropX = Math.round((sourceWidth - cropWidth) / 2);
  } else if (sourceRatio < PHOTO_ASPECT_RATIO) {
    cropHeight = Math.round(sourceWidth / PHOTO_ASPECT_RATIO);
    cropY = Math.round((sourceHeight - cropHeight) / 2);
  }

  context.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, outputWidth, outputHeight);
}

function getCheckedValue(selector, fallback) {
  return document.querySelector(`${selector}:checked`)?.value || fallback;
}

function getSelectedPolaroidOptions() {
  const frame = getCheckedValue("[data-polaroid-style]", "classic");
  const pattern = getCheckedValue("[data-polaroid-pattern]", "none");
  const font = getCheckedValue("[data-polaroid-font]", "default");
  const size = getCheckedValue("[data-polaroid-font-size]", "medium");

  return {
    frame: POLAROID_FRAME_STYLES[frame] ? frame : "classic",
    pattern: ["none", "dots", "hearts"].includes(pattern) ? pattern : "none",
    font: POLAROID_FONT_STYLES[font] ? font : "default",
    size: POLAROID_CAPTION_SIZE_STYLES[size] ? size : "medium",
  };
}

function applyPolaroidPreviewStyle(polaroid, options) {
  const frameStyle = POLAROID_FRAME_STYLES[options.frame] || POLAROID_FRAME_STYLES.classic;
  const fontStyle = POLAROID_FONT_STYLES[options.font] || POLAROID_FONT_STYLES.default;
  const sizeStyle = POLAROID_CAPTION_SIZE_STYLES[options.size] || POLAROID_CAPTION_SIZE_STYLES.medium;

  polaroid.dataset.frame = options.frame;
  polaroid.dataset.pattern = options.pattern;
  polaroid.dataset.font = options.font;
  polaroid.dataset.size = options.size;
  polaroid.style.setProperty("--polaroid-bg", frameStyle.background);
  polaroid.style.setProperty("--polaroid-caption", frameStyle.captionColor);
  polaroid.style.setProperty("--polaroid-accent", frameStyle.accent);
  polaroid.style.setProperty("--polaroid-pattern-color", frameStyle.accent);
  polaroid.style.setProperty("--polaroid-date-font", fontStyle.dateFamily);
  polaroid.style.setProperty("--polaroid-copy-font", fontStyle.copyFamily);
  polaroid.style.setProperty("--polaroid-caption-size", `${sizeStyle.previewSize}px`);
}

function getKstDateParts() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .split("-");
}

function getPolaroidCaptionParts() {
  const [year, month, day] = getKstDateParts();
  return {
    date: `${year}.${month}.${day}`,
    copy: t("PolaroidCaptionCopy"),
  };
}

async function ensurePolaroidFontsLoaded() {
  if (!document.fonts?.load) return;
  await Promise.all([
    document.fonts.load('38px "Gamja Flower"'),
    document.fonts.load('38px "Single Day"'),
  ]);
}

function createPolaroidDataUrl(sourceCanvas, caption, options = getSelectedPolaroidOptions()) {
  const frame = document.createElement("canvas");
  frame.width = sourceCanvas.width;
  frame.height = Math.round(frame.width / PHOTO_ASPECT_RATIO);

  const photoPadding = Math.round(frame.width * 0.055);
  const topPadding = photoPadding;
  const bottomPadding = Math.round(frame.width * 0.18);
  const imageHeight = frame.height - topPadding - bottomPadding;
  const imageWidth = Math.round(imageHeight * PHOTO_ASPECT_RATIO);
  const sidePadding = Math.round((frame.width - imageWidth) / 2);
  const frameStyle = POLAROID_FRAME_STYLES[options.frame] || POLAROID_FRAME_STYLES.classic;
  const fontStyle = POLAROID_FONT_STYLES[options.font] || POLAROID_FONT_STYLES.default;
  const sizeStyle = POLAROID_CAPTION_SIZE_STYLES[options.size] || POLAROID_CAPTION_SIZE_STYLES.medium;
  const baseCaptionSize = Math.max(28, Math.round(frame.width * 0.038));
  let captionSize = Math.round(baseCaptionSize * sizeStyle.downloadScale);

  const context = frame.getContext("2d");
  context.fillStyle = frameStyle.background;
  context.fillRect(0, 0, frame.width, frame.height);
  context.drawImage(sourceCanvas, sidePadding, topPadding, imageWidth, imageHeight);
  drawPolaroidPattern(context, frame, options.pattern, frameStyle.accent, [
    { x: 0, y: 0, width: frame.width, height: topPadding },
    { x: 0, y: topPadding, width: sidePadding, height: imageHeight },
    { x: sidePadding + imageWidth, y: topPadding, width: sidePadding, height: imageHeight },
    { x: 0, y: topPadding + imageHeight, width: frame.width, height: bottomPadding },
  ]);

  const captionY = topPadding + imageHeight + bottomPadding / 2;
  const gap = Math.round(captionSize * 0.28);

  while (captionSize > 24) {
    context.font = `${captionSize}px ${fontStyle.dateFamily}`;
    const dateWidth = context.measureText(caption.date).width;
    context.font = `${captionSize}px ${fontStyle.copyFamily}`;
    const copyWidth = context.measureText(caption.copy).width;
    if (dateWidth + gap + copyWidth <= frame.width - sidePadding * 2) break;
    captionSize -= 2;
  }

  context.fillStyle = frameStyle.captionColor;
  context.textBaseline = "middle";

  context.font = `${captionSize}px ${fontStyle.dateFamily}`;
  const dateWidth = context.measureText(caption.date).width;
  context.font = `${captionSize}px ${fontStyle.copyFamily}`;
  const copyWidth = context.measureText(caption.copy).width;
  const totalWidth = dateWidth + gap + copyWidth;
  let cursorX = (frame.width - totalWidth) / 2;

  context.font = `${captionSize}px ${fontStyle.dateFamily}`;
  context.textAlign = "left";
  context.fillText(caption.date, cursorX, captionY);
  cursorX += dateWidth + gap;

  context.font = `${captionSize}px ${fontStyle.copyFamily}`;
  context.fillText(caption.copy, cursorX, captionY);

  return frame.toDataURL("image/jpeg", 0.92);
}

function drawPolaroidPattern(context, frame, pattern, accentColor, regions = null) {
  const applyFrameRegions = () => {
    if (!regions) return;
    context.beginPath();
    regions.forEach((region) => {
      context.rect(region.x, region.y, region.width, region.height);
    });
    context.clip();
  };

  if (pattern === "dots") {
    context.save();
    applyFrameRegions();
    context.globalAlpha = 0.24;
    context.fillStyle = accentColor;

    const gap = Math.max(42, Math.round(frame.width * 0.055));
    const radius = Math.max(3, Math.round(frame.width * 0.004));

    for (let y = gap / 2; y < frame.height; y += gap) {
      for (let x = gap / 2; x < frame.width; x += gap) {
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
      }
    }

    context.restore();
    return;
  }

  if (pattern === "hearts") {
    context.save();
    applyFrameRegions();
    context.globalAlpha = 0.2;
    context.fillStyle = accentColor;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = `${Math.max(36, Math.round(frame.width * POLAROID_HEART_FONT_RATIO))}px Arial, sans-serif`;

    const gap = Math.max(76, Math.round(frame.width * POLAROID_HEART_GAP_RATIO));
    for (let y = gap / 2; y < frame.height; y += gap) {
      for (let x = gap / 2; x < frame.width; x += gap) {
        context.fillText("♥", x, y);
      }
    }

    context.restore();
  }
}

function initCalendar() {
  const days = $("[data-calendar-days]");
  const firstDay = new Date("2026-08-01T00:00:00+09:00").getDay();
  const totalDays = 31;

  for (let i = 0; i < firstDay; i += 1) {
    const blank = document.createElement("span");
    days.appendChild(blank);
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const cell = document.createElement("span");
    cell.className = day === 14 ? "day special" : "day";
    if (day === 14) {
      cell.setAttribute("aria-label", "August 14");
      cell.innerHTML = `<span class="day-heart" aria-hidden="true"></span><span class="day-number">${day}</span>`;
    } else {
      cell.textContent = day;
    }
    days.appendChild(cell);
  }
}

function initMusic() {
  const button = $("[data-music-toggle]");
  const audio = $("[data-audio]");

  audio.src = LOVE_PAGE_MUSIC_SRC;
  audio.preload = "metadata";

  button.addEventListener("click", async () => {
    if (!audio.getAttribute("src")) {
      button.textContent = t("MusicPreparingButton");
      return;
    }

    if (audio.paused) {
      await audio.play();
      button.textContent = t("MusicPauseButton");
    } else {
      audio.pause();
      button.textContent = t("MusicPlayButton");
    }
  });
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === "," && !quoted) {
      row.push(value);
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }

  return rows.filter((items) => items.some((item) => item.trim()));
}

function mapGuestbookRows(csvText) {
  const rows = parseCsv(csvText);
  if (rows.length < 2) return [];

  const headers = rows[0].map((header) => header.trim());
  const nameIndex = headers.indexOf(t(GUESTBOOK_CONFIG.nameColumnKey));
  const messageIndex = headers.indexOf(t(GUESTBOOK_CONFIG.messageColumnKey));
  const timestampIndex = headers.indexOf(t(GUESTBOOK_CONFIG.timestampColumnKey));

  if (nameIndex === -1 || messageIndex === -1) return [];

  return rows
    .slice(1)
    .map((row, index) => ({
      name: row[nameIndex] || "",
      message: row[messageIndex] || "",
      timestamp: timestampIndex === -1 ? "" : row[timestampIndex] || "",
      order: index,
    }))
    .filter((entry) => entry.name.trim() && entry.message.trim())
    .sort((a, b) => {
      const aTime = Date.parse(a.timestamp);
      const bTime = Date.parse(b.timestamp);
      if (Number.isNaN(aTime) || Number.isNaN(bTime)) return b.order - a.order;
      return bTime - aTime;
    });
}

async function loadGuestbookEntries() {
  const separator = GUESTBOOK_CONFIG.sheetCsvUrl.includes("?") ? "&" : "?";
  const response = await fetch(`${GUESTBOOK_CONFIG.sheetCsvUrl}${separator}cacheBust=${Date.now()}`);
  if (!response.ok) throw new Error("Failed to load guestbook sheet.");
  return mapGuestbookRows(await response.text());
}

function renderGuestbook(entries) {
  const list = $("[data-guestbook-list]");
  list.innerHTML = "";

  if (!entries.length) {
    const empty = document.createElement("p");
    empty.className = "empty-list";
    empty.textContent = t("GuestbookEmpty");
    list.appendChild(empty);
    return;
  }

  entries.forEach((entry) => {
    const article = document.createElement("article");
    article.className = "guestbook-item";

    const name = document.createElement("strong");
    name.textContent = entry.name;

    const message = document.createElement("p");
    message.textContent = entry.message;

    const time = document.createElement("small");
    time.textContent = entry.timestamp;

    article.append(name, message, time);
    list.appendChild(article);
  });
}

async function waitForSavedEntry(name, message) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1600));
    const entries = await loadGuestbookEntries();
    const saved = entries.some((entry) => entry.name === name && entry.message === message);
    if (saved) return entries;
  }

  return null;
}

function submitGoogleForm(name, message) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = GUESTBOOK_CONFIG.formAction;
  form.target = "guestbook-submit-frame";
  form.hidden = true;

  const nameInput = document.createElement("input");
  nameInput.name = GUESTBOOK_CONFIG.nameEntry;
  nameInput.value = name;

  const messageInput = document.createElement("input");
  messageInput.name = GUESTBOOK_CONFIG.messageEntry;
  messageInput.value = message;

  form.append(nameInput, messageInput);
  document.body.appendChild(form);
  form.submit();
  form.remove();
}

function submitGiftPrizeForm(wish) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = GIFT_PRIZE_FORM_CONFIG.formAction;
  form.target = "gift-prize-submit-frame";
  form.hidden = true;

  const wishInput = document.createElement("input");
  wishInput.name = GIFT_PRIZE_FORM_CONFIG.wishEntry;
  wishInput.value = wish;

  form.append(wishInput);
  document.body.appendChild(form);
  form.submit();
  form.remove();
}

async function copyMessageToClipboard(message) {
  try {
    await navigator.clipboard.writeText(message);
  } catch (error) {
    // The alert still tells the user what to do if clipboard permission is unavailable.
  }
}

function initGuestbook() {
  const form = $("[data-guestbook-form]");
  const nameInput = $("[data-guestbook-name]");
  const messageInput = $("[data-guestbook-message]");
  const sendButton = $("[data-guestbook-send]");
  const status = $("[data-guestbook-status]");

  if (!isGuestbookConfigured()) {
    sendButton.disabled = true;
    status.textContent = t("GuestbookNotConfigured");
    renderGuestbook([]);
    return;
  }

  if (isLocalFile()) {
    status.textContent = t("GuestbookPrompt");
    renderGuestbook([]);
    return;
  }

  status.textContent = t("GuestbookPrompt");
  loadGuestbookEntries()
    .then(renderGuestbook)
    .catch(() => {
      status.textContent = t("GuestbookLoadFailed");
    });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = nameInput.value.trim();
    const message = messageInput.value.trim();

    if (!name || !message) return;

    sendButton.disabled = true;
    status.textContent = t("GuestbookSavingStatus");
    submitGoogleForm(name, message);

    try {
      const entries = await waitForSavedEntry(name, message);
      if (!entries) throw new Error("Saved entry was not found.");
      renderGuestbook(entries);
      form.reset();
      status.textContent = t("GuestbookSavedStatus");
    } catch (error) {
      await copyMessageToClipboard(message);
      alert(t(GUESTBOOK_FAIL_MESSAGE));
      status.textContent = t("GuestbookSaveUnknownStatus");
    } finally {
      sendButton.disabled = false;
    }
  });
}

async function boot() {
  try {
    await loadResourceStrings();
    // Exposes readiness for the GitHub Actions build (Playwright).
    window.resourceStringsLoaded = true;
  } catch (error) {
    console.error(error);
    window.resourceStringsLoaded = false;
  }

  applyResourceStrings();
  window.addEventListener("hashchange", setActivePage);
  initGate();
  initAdminAuth();
  initAdminPage();
  initProtectedPages();
  setActivePage();
  initGifts();
  initLetter();
  initCamera();
  initCalendar();
  initMusic();
  initGuestbook();
  updateCountdown();
  updateTimecapsuleGates();
  refreshTrustedTimeIfNeeded().then(() => {
    updateTimecapsuleGates();
    updateLetterReleaseView();
    setActivePage();
  });
  setInterval(() => {
    updateCountdown();
    refreshTrustedTimeIfNeeded().then(() => {
      updateTimecapsuleGates();
      updateLetterReleaseView();
      refreshGiftGridView();
    });
    updateTimecapsuleGates();
    updateLetterReleaseView();
  }, 1000);
}

boot();
