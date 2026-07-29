const ANNIVERSARY_DATE = new Date("2026-08-14T00:00:00+09:00");
const START_DATE = new Date("2025-08-14T00:00:00+09:00");

const gifts = [
  {
    title: "Gift A",
    result: "첫 번째 선물 공개 영역입니다. 나중에 실제 선물명으로 바꾸면 됩니다.",
  },
  {
    title: "Gift B",
    result: "두 번째 선물 공개 영역입니다. 이미지나 쿠폰 UI를 붙일 수 있습니다.",
  },
  {
    title: "Gift C",
    result: "세 번째 선물 공개 영역입니다. 이벤트성 꽝/진짜 선물도 가능합니다.",
  },
];

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

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

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

function setActivePage() {
  const target = window.location.hash?.replace("#", "") || "home";
  $$(".page").forEach((page) => page.classList.toggle("active", page.id === target));
  $$(".nav a").forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${target}`));
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

function initGifts() {
  const grid = $("[data-gift-grid]");
  const result = $("[data-gift-result]");
  gifts.forEach((gift, index) => {
    const button = document.createElement("button");
    button.className = "gift-box";
    button.type = "button";
    button.innerHTML = `
      <div class="gift-ribbon"></div>
      <div class="gift-lid"></div>
      <div class="gift-body">${gift.title}</div>
    `;
    button.addEventListener("click", () => {
      result.textContent = `${index + 1}번 상자: ${gift.result}`;
    });
    grid.appendChild(button);
  });
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
  let stream;

  $("[data-camera-start]").addEventListener("click", async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      video.srcObject = stream;
      status.textContent = "카메라가 켜졌습니다. 찰칵 버튼을 눌러주세요.";
    } catch (error) {
      status.textContent = "카메라 권한을 허용해야 사용할 수 있습니다.";
    }
  });

  $("[data-camera-capture]").addEventListener("click", () => {
    if (!stream) {
      status.textContent = "먼저 카메라를 켜주세요.";
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 960;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    photo.src = dataUrl;
    download.href = dataUrl;
    polaroid.hidden = false;
    status.textContent = "사진이 준비됐습니다. 아래에서 저장할 수 있어요.";
  });
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
setActivePage();
initGate();
initGifts();
initLetter();
initCamera();
initCalendar();
initMusic();
initGuestbook();
updateCountdown();
setInterval(updateCountdown, 1000);
