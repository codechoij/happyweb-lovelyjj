const ANNIVERSARY_DATE = new Date("2026-08-14T00:00:00+09:00");
const START_DATE = new Date("2025-08-14T00:00:00+09:00");
const TIMECAPSULE_OPEN_DATE = new Date("2026-08-14T18:00:00+09:00");
const TIMECAPSULE_OPEN_NOTICE_END_DATE = new Date("2026-08-14T19:00:00+09:00");
const RESOURCE_URL = "./resources/Strings.resx";

const gifts = [
  {
    titleKey: "GiftOneTitle",
    type: "photoGame",
    resultKey: "GiftPhotoGameResult",
  },
  {
    titleKey: "GiftTwoTitle",
    type: "video",
    resultKey: "GiftVideoOneResult",
    video: {
      titleKey: "GiftVideoOneTitle",
      src: "./assets/gift-videos/video%20(1).mp4",
      downloadName: "video (1).mp4",
    },
  },
  {
    titleKey: "GiftThreeTitle",
    type: "video",
    resultKey: "GiftVideoTwoResult",
    video: {
      titleKey: "GiftVideoTwoTitle",
      src: "./assets/gift-videos/video%20(2).mp4",
      downloadName: "video (2).mp4",
    },
  },
];

const VISIBLE_GIFT_COUNT = 3;

const GIFT_PHOTO_CONFIG = {
  folder: "./assets/gift-photos/",
  maxPhotos: 30,
  extensions: ["jpg", "jpeg", "png", "webp"],
  startFallMs: 2000,
  minFallMs: 700,
  speedUpPerSecond: 100,
  minSpawnDelayMs: 250,
  maxSpawnDelayMs: 770,
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

const GUESTBOOK_FAIL_MESSAGE =
  "GuestbookFailMessage";

const ADMIN_API_URL =
  "https://script.google.com/macros/s/AKfycbzApYhpcMCTY20XOao4v66kjoQuPS6MYtuTEwonVX-V04C5VinQlsghtkpsou7ANcWnFA/exec";

const ADMIN_SESSION_TOKEN_KEY = "our-day-admin-session-token";

const ADMIN_SHORTCUT_CLICK_COUNT = 15;
const ADMIN_SHORTCUT_WINDOW_MS = 4500;
const TRUSTED_TIME_SYNC_INTERVAL_MS = 60 * 1000;
const TRUSTED_TIME_RETRY_INTERVAL_MS = 10 * 1000;
const PROTECTED_PAGE_IDS = ["gift", "letter"];

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

async function requestAdminApi(action, payload = {}) {
  const response = await fetch(ADMIN_API_URL, {
    method: "POST",
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await response.json();

  if (!response.ok || !data.ok) {
    const message = data.message || t("AdminRequestFailed");
    const error = new Error(message);
    error.code = data.code;
    throw error;
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
  trustedTimeLastAttemptAt = Date.now();
  const data = await requestAdminApi("getServerTime");
  const epochMs = Number(data.epochMs);

  if (!Number.isFinite(epochMs)) throw new Error("Invalid server time.");

  trustedTimeOffsetMs = epochMs - Date.now();
  trustedTimeSyncedAt = Date.now();
  return getTrustedNow();
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

function formatTimecapsuleOpenAt() {
  return t("TimecapsuleOpenAt");
}

function updateTimecapsuleGate(pageId, now = getTrustedNow()) {
  const { title, confirm, form, input, status, timecapsuleStatus } = getProtectedPageElements(pageId);
  const hasTrustedTime = Boolean(now);
  const opened = isTimecapsuleOpen(now);

  if (title) {
    title.textContent = opened
      ? t("ProtectedTitle")
      : hasTrustedTime
        ? t("TimecapsuleTitle")
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
      ? `${formatTimecapsuleOpenAt()}\n${t("TimecapsuleCountdown", parts)}`
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
    const giftVideo = $("[data-gift-video]");

    if (giftModal) giftModal.hidden = true;
    if (giftVideoModal) giftVideoModal.hidden = true;
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
  return [...items].sort(() => Math.random() - 0.5);
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function discoverGiftPhotos() {
  const candidates = [];

  for (let index = 1; index <= GIFT_PHOTO_CONFIG.maxPhotos; index += 1) {
    GIFT_PHOTO_CONFIG.extensions.forEach((extension) => {
      candidates.push(`${GIFT_PHOTO_CONFIG.folder}photo (${index}).${extension}`);
    });
  }

  return Promise.all(
    candidates.map(
      (url) =>
        new Promise((resolve) => {
          const image = new Image();
          image.onload = () => resolve(url);
          image.onerror = () => resolve(null);
          image.src = `${url}?v=${Date.now()}`;
        }),
    ),
  ).then((urls) => urls.filter(Boolean));
}

function initGiftPhotoGame(photoUrls) {
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
  let gameStartedAt = 0;
  let photoQueue = [];
  let speedMultiplier = 1;
  let capturedPhotoUrl = "";

  function stopSpawning() {
    clearTimeout(spawnTimer);
    spawnTimer = null;
  }

  function resetStage() {
    stopSpawning();
    stage.innerHTML = "";
  }

  function clearActivePhotos() {
    stage.innerHTML = "";
  }

  function exitGame() {
    resetStage();
    modal.hidden = true;
    readyView.hidden = false;
    captureView.hidden = true;
    finishView.hidden = true;
    stage.hidden = false;
    document.body.classList.remove("modal-open");
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

  function beginRound() {
    resetStage();
    readyView.hidden = true;
    captureView.hidden = true;
    finishView.hidden = true;
    stage.hidden = false;
    gameStartedAt = Date.now();
    photoQueue = shuffleItems(photoUrls);
    gameStatus.textContent = t("GiftStatusPlaying");
    spawnPhoto();
    scheduleNextSpawn();
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
    resetStage();
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
  const startGiftVideo = initGiftVideo();
  let startPhotoGame = null;
  let photoGameReady = false;

  discoverGiftPhotos().then((photoUrls) => {
    startPhotoGame = initGiftPhotoGame(photoUrls);
    photoGameReady = photoUrls.length > 0;
    if (photoGameReady) {
      result.textContent = t("GiftResultDefault");
      return;
    }
    result.textContent = t("GiftNotReady");
  });

  shuffleItems(gifts)
    .slice(0, VISIBLE_GIFT_COUNT)
    .forEach((gift) => {
      const button = document.createElement("button");
      button.className = "gift-box";
      button.type = "button";
      button.innerHTML = `
      <div class="gift-ribbon"></div>
      <div class="gift-lid"></div>
      <div class="gift-body">${t(gift.titleKey)}</div>
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

        result.textContent = t(gift.resultKey);
      });
      grid.appendChild(button);
    });
}

function initGiftVideo() {
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

function initLetter() {
  const toggle = $("[data-letter-toggle]");
  const letter = $("[data-letter]");
  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!isOpen));
    letter.hidden = isOpen;
  });
}

function initCamera() {
  const video = $("[data-video]");
  const status = $("[data-camera-status]");
  const photo = $("[data-photo]");
  const polaroid = $("[data-polaroid]");
  const download = $("[data-download]");
  const captionDate = $("[data-polaroid-date]");
  const captionCopy = $("[data-polaroid-copy]");
  const captureButton = $("[data-camera-capture]");
  let stream;
  let captureVersion = 0;

  $("[data-camera-start]").addEventListener("click", async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
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
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 960;
    const context = canvas.getContext("2d");
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    const polaroidCaption = getPolaroidCaptionParts();
    const currentCapture = captureVersion + 1;
    captureVersion = currentCapture;

    photo.src = dataUrl;
    captionDate.textContent = polaroidCaption.date;
    captionCopy.textContent = polaroidCaption.copy;
    download.href = "#";
    polaroid.hidden = false;
    captureButton.textContent = t("CameraRetakeButton");
    status.textContent = t("CameraPreparingStatus");

    await ensurePolaroidFontsLoaded();
    const framedDataUrl = createPolaroidDataUrl(canvas, polaroidCaption);
    if (currentCapture !== captureVersion) return;
    download.href = framedDataUrl;
    status.textContent = t("CameraReadyStatus");
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

function createPolaroidDataUrl(sourceCanvas, caption) {
  const frame = document.createElement("canvas");
  const photoPadding = Math.round(sourceCanvas.width * 0.055);
  const topPadding = photoPadding;
  const sidePadding = photoPadding;
  const bottomPadding = Math.round(sourceCanvas.width * 0.18);
  let captionSize = Math.max(28, Math.round(sourceCanvas.width * 0.038));
  const imageWidth = sourceCanvas.width;
  const imageHeight = sourceCanvas.height;

  frame.width = imageWidth + sidePadding * 2;
  frame.height = imageHeight + topPadding + bottomPadding;

  const context = frame.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, frame.width, frame.height);
  context.drawImage(sourceCanvas, sidePadding, topPadding, imageWidth, imageHeight);

  const captionY = topPadding + imageHeight + bottomPadding / 2;
  const gap = Math.round(captionSize * 0.28);

  while (captionSize > 24) {
    context.font = `${captionSize}px "Gamja Flower", cursive`;
    const dateWidth = context.measureText(caption.date).width;
    context.font = `${captionSize}px "Single Day", cursive`;
    const copyWidth = context.measureText(caption.copy).width;
    if (dateWidth + gap + copyWidth <= frame.width - sidePadding * 2) break;
    captionSize -= 2;
  }

  context.fillStyle = "#756d78";
  context.textBaseline = "middle";

  context.font = `${captionSize}px "Gamja Flower", cursive`;
  const dateWidth = context.measureText(caption.date).width;
  context.font = `${captionSize}px "Single Day", cursive`;
  const copyWidth = context.measureText(caption.copy).width;
  const totalWidth = dateWidth + gap + copyWidth;
  let cursorX = (frame.width - totalWidth) / 2;

  context.font = `${captionSize}px "Gamja Flower", cursive`;
  context.textAlign = "left";
  context.fillText(caption.date, cursorX, captionY);
  cursorX += dateWidth + gap;

  context.font = `${captionSize}px "Single Day", cursive`;
  context.fillText(caption.copy, cursorX, captionY);

  return frame.toDataURL("image/jpeg", 0.92);
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
    cell.textContent = day;
    days.appendChild(cell);
  }
}

function initMusic() {
  const button = $("[data-music-toggle]");
  const audio = $("[data-audio]");

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
  } catch (error) {
    console.error(error);
  }

  applyResourceStrings();
  window.addEventListener("hashchange", setActivePage);
  initGate();
  initAdminAuth();
  initAdminPage();
  initProtectedPages();
  await refreshTrustedTimeIfNeeded();
  setActivePage();
  initGifts();
  initLetter();
  initCamera();
  initCalendar();
  initMusic();
  initGuestbook();
  updateCountdown();
  updateTimecapsuleGates();
  setInterval(() => {
    updateCountdown();
    refreshTrustedTimeIfNeeded();
    updateTimecapsuleGates();
  }, 1000);
}

boot();
