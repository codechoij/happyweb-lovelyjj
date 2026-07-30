const ANNIVERSARY_DATE = new Date("2026-08-14T00:00:00+09:00");
const START_DATE = new Date("2025-08-14T00:00:00+09:00");

const gifts = [
  {
    title: "Gift 1",
    type: "photoGame",
    result: "떨어지는 사진을 잡아 선물을 열어보세요.",
  },
  {
    title: "Gift 2",
    type: "video",
    result: "1주년 축하 영상을 준비했어요.",
    video: {
      title: "1주년 축하 영상",
      src: "./assets/gift-videos/video%20(1).mp4",
      downloadName: "video (1).mp4",
    },
  },
  {
    title: "Gift 3",
    type: "video",
    result: "또 다른 축하 영상을 준비했어요.",
    video: {
      title: "또 다른 축하 영상",
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
  nameColumn: "닉네임",
  messageColumn: "메세지",
  timestampColumn: "타임스탬프",
};

const GUESTBOOK_FAIL_MESSAGE =
  "잠깐! 소중한 당신의 진심이 날라가지 않게 메세지를 먼저 클립보드에 복사해놔주세요...";

const ADMIN_API_URL =
  "https://script.google.com/macros/s/AKfycbzApYhpcMCTY20XOao4v66kjoQuPS6MYtuTEwonVX-V04C5VinQlsghtkpsou7ANcWnFA/exec";

const ADMIN_SESSION_TOKEN_KEY = "our-day-admin-session-token";

const ADMIN_SHORTCUT_CLICK_COUNT = 15;
const ADMIN_SHORTCUT_WINDOW_MS = 4500;
const PROTECTED_PAGE_IDS = ["gift", "letter"];

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

let lastPublicHash = "#home";
let adminSessionToken = "";
let activePageId = "home";
let unlockedProtectedPages = new Set();

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
    const message = data.message || "관리자 요청을 처리하지 못했습니다.";
    const error = new Error(message);
    error.code = data.code;
    throw error;
  }

  return data;
}

const adminAuth = {
  async verifyPassword(password) {
    const data = await sharedPasswordAuth.verifyPassword(password);
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

function getAdminErrorMessage(error) {
  if (error.code === "BAD_PASSWORD") return "비밀번호가 틀렸습니다. 다시 입력해주세요.";
  if (error.code === "LOCKED") return "비밀번호 시도가 많아 잠시 잠겼습니다. 나중에 다시 시도해주세요.";
  if (error.code === "UNAUTHORIZED") return "관리자 인증이 만료됐습니다. 다시 들어와주세요.";
  if (error.code === "WEAK_PASSWORD") return "비밀번호는 4자 이상으로 입력해주세요.";
  return "비밀번호 서버와 통신하지 못했습니다. 잠시 후 다시 시도해주세요.";
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
  };
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
  if (status) status.textContent = "관리자 페이지에서 설정한 비밀번호를 입력해주세요.";
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

  if (gate) gate.hidden = isUnlocked;
  if (content) content.hidden = !isUnlocked;
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
  status.textContent = "관리자 비밀번호를 입력해주세요.";
  requestAnimationFrame(() => input.focus());
}

function closeAdminAuthModal() {
  const modal = $("[data-admin-auth-modal]");
  const form = $("[data-admin-auth-form]");
  const status = $("[data-admin-auth-status]");

  if (!modal || !form || !status) return;

  modal.hidden = true;
  form.reset();
  status.textContent = "관리자 비밀번호를 입력해주세요.";
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

    status.textContent = "비밀번호를 확인하는 중입니다.";

    try {
      await adminAuth.verifyPassword(password);
      form.reset();
      status.textContent = "확인됐습니다.";
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
      status.textContent = "비밀번호는 4자 이상으로 입력해주세요.";
      newPassword.focus();
      return;
    }

    if (password !== confirmation) {
      status.textContent = "비밀번호 확인이 일치하지 않습니다.";
      confirmPassword.focus();
      return;
    }

    status.textContent = "비밀번호를 저장하는 중입니다.";

    try {
      await adminAuth.changePassword(password);
      form.reset();
      status.textContent = "비밀번호가 변경됐습니다.";
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

      form.hidden = false;
      status.textContent = "관리자 페이지에서 설정한 비밀번호를 입력해주세요.";
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

      status.textContent = "비밀번호를 확인하는 중입니다.";

      try {
        await sharedPasswordAuth.verifyPassword(password);
        status.textContent = "확인됐습니다.";
        unlockProtectedPage(pageId);
      } catch (error) {
        input.value = "";
        status.textContent = getAdminErrorMessage(error);
        input.focus();
      }
    });
  });

  PROTECTED_PAGE_IDS.forEach(resetProtectedPage);
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
    label.textContent = "기념일까지";
    main.textContent = `D-${days}`;
    detail.textContent = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    return;
  }

  const together = now.getTime() - START_DATE.getTime();
  const daysTogether = Math.floor(together / 86400000);
  label.textContent = "우리가 함께한 지";
  main.textContent = `D+${daysTogether}`;
  detail.textContent = "365 days with you";
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
    if (speedMultiplier < 1) return `축하합니다! ${speedText} 속도에 당첨되었습니다! `;
    if (speedMultiplier > 1) return `힘내세요! ${speedText} 속도군요... `;
    return "";
  }

  function setReadyMessage() {
    const prefix = getReadyPrefix();
    const prefixMarkup = prefix ? `<p class="gift-speed-message">${prefix}</p>` : "";
    readyMessage.innerHTML = `
      ${prefixMarkup}
      <p>화면 위에서 떨어지는 사진을 클릭해 잡는 게임입니다. 사진을 잡으면 크게 열리고 저장할 수 있어요. 한 번 지나간 사진은 다시 등장하지 않습니다.</p>
      <strong>준비되셨나요?</strong>
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
          title: "Gift photo",
        });
        gameStatus.textContent = "공유 창에서 사진을 저장할 수 있어요.";
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
      gameStatus.textContent = "사진 다운로드를 시작했습니다.";
    } catch (error) {
      window.open(capturedPhotoUrl, "_blank", "noopener");
      gameStatus.textContent = "새로 열린 사진을 길게 누르거나 저장 메뉴를 사용해주세요.";
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
    gameStatus.textContent = "잡은 사진을 저장할 수 있어요.";
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
      gameStatus.textContent = "사진 잡기가 끝났습니다.";
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
    image.alt = "떨어지는 선물 사진";
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
    gameStatus.textContent = "사진마다 내려오는 속도가 조금씩 달라요.";
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

    gameStatus.textContent = "남은 사진을 이어서 잡아보세요.";
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
    gameStatus.textContent = "준비되면 네 버튼을 눌러주세요.";
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
      result.textContent = "마음에 드는 상자를 하나 골라주세요.";
      return;
    }
    result.textContent = "첫 번째 선물은 아직 준비 중입니다.";
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
      <div class="gift-body">${gift.title}</div>
    `;
      button.addEventListener("click", () => {
        if (gift.type === "photoGame") {
          result.textContent = gift.result;
          if (!photoGameReady || !startPhotoGame) {
            result.textContent = "첫 번째 선물은 아직 준비 중입니다.";
            return;
          }
          startPhotoGame();
          return;
        }

        if (gift.type === "video") {
          result.textContent = gift.result;
          startGiftVideo(gift.video);
          return;
        }

        result.textContent = gift.result;
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
    heading.textContent = config.title || "축하 영상";
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
      status.textContent =
        "카메라가 켜졌습니다. 찰칵 버튼을 눌러주세요.\n페이지를 벗어나 카메라가 멈춘 경우, '카메라 켜기' 버튼을 다시 눌러주세요.";
    } catch (error) {
      status.textContent = "카메라 권한을 허용해야 사용할 수 있습니다.";
    }
  });

  captureButton.addEventListener("click", async () => {
    if (!stream) {
      status.textContent = "먼저 카메라를 켜주세요.";
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
    captureButton.textContent = "다시 찍기";
    status.textContent = "사진을 폴라로이드로 준비하는 중입니다.";

    await ensurePolaroidFontsLoaded();
    const framedDataUrl = createPolaroidDataUrl(canvas, polaroidCaption);
    if (currentCapture !== captureVersion) return;
    download.href = framedDataUrl;
    status.textContent = "사진이 준비됐습니다. 아래에서 저장할 수 있어요.";
  });

  download.addEventListener("click", (event) => {
    if (download.getAttribute("href") === "#") {
      event.preventDefault();
      status.textContent = "저장 파일을 준비하는 중입니다. 잠시만 기다려주세요.";
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
    copy: "소중한 오늘의 기록",
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
      button.textContent = "음악 파일 준비중";
      return;
    }

    if (audio.paused) {
      await audio.play();
      button.textContent = "배경음악 일시정지";
    } else {
      audio.pause();
      button.textContent = "배경음악 재생";
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
  const nameIndex = headers.indexOf(GUESTBOOK_CONFIG.nameColumn);
  const messageIndex = headers.indexOf(GUESTBOOK_CONFIG.messageColumn);
  const timestampIndex = headers.indexOf(GUESTBOOK_CONFIG.timestampColumn);

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
    list.innerHTML = '<p class="empty-list">아직 남겨진 메세지가 없습니다.</p>';
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
    status.textContent = "Google Form/Sheet 연결 후 저장과 목록 조회가 활성화됩니다.";
    renderGuestbook([]);
    return;
  }

  if (isLocalFile()) {
    status.textContent = "준과 지윤에게 한 마디씩 남겨주세요!";
    renderGuestbook([]);
    return;
  }

  status.textContent = "준과 지윤에게 한 마디씩 남겨주세요!";
  loadGuestbookEntries()
    .then(renderGuestbook)
    .catch(() => {
      status.textContent = "방명록을 불러오지 못했습니다.";
    });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = nameInput.value.trim();
    const message = messageInput.value.trim();

    if (!name || !message) return;

    sendButton.disabled = true;
    status.textContent = "소중한 메세지를 저장하는 중입니다.";
    submitGoogleForm(name, message);

    try {
      const entries = await waitForSavedEntry(name, message);
      if (!entries) throw new Error("Saved entry was not found.");
      renderGuestbook(entries);
      form.reset();
      status.textContent = "저장됐어요. 최신 메세지가 위에 표시됩니다.";
    } catch (error) {
      await copyMessageToClipboard(message);
      alert(GUESTBOOK_FAIL_MESSAGE);
      status.textContent = "저장 여부를 확인하지 못했습니다.";
    } finally {
      sendButton.disabled = false;
    }
  });
}

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
setInterval(updateCountdown, 1000);
