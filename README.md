# happy-web

1주년 기념용 정적 웹사이트입니다. Home, Gift, Letter, Camera, Love 페이지로 구성되어 있고, 편지 ZIP 다운로드와 방명록/선물 입력 저장은 외부 서비스와 연결됩니다.

이 README는 공개 저장소에서 볼 수 있는 기능 설명과, 운영자가 자주 수정하는 코드 위치를 중심으로 정리합니다. 실제 서비스 URL, Google Form 주소, entry ID 같은 상세 연결값은 README에 적지 않습니다.

---

## 1. 페이지 구성

### Home

- 기념일 기준 D-day 또는 함께한 날 D+를 보여줍니다.
- Gift, Letter, Camera, Love 페이지로 이동할 수 있습니다.
- Gift/Letter 페이지는 타임캡슐 공개 시간 전에는 잠금 안내를 보여줍니다.

### Gift

- 화면에는 선물상자 3개가 표시됩니다.
- 상자 안에 `Gift 1`, `Gift 2` 같은 번호 텍스트는 표시하지 않습니다.
- 왼쪽부터 파란색, 빨간색, 초록색 상자 이미지를 고정으로 보여줍니다.
- 어떤 선물이 연결되는지는 기존 랜덤 로직으로 결정됩니다.
- 선물 모달, 영상, 사진 게임을 닫거나 확인하면 Gift 페이지의 3개 선물 목록을 다시 뽑습니다.

### Letter

- 편지 설명 페이지와 여러 장의 편지를 순서대로 보여줍니다.
- 각 편지는 공개 시간이 지나야 열립니다.
- `LetterPageSixBody`는 Gift9을 뽑으면 즉시 공개될 수 있습니다.
- `편지 저장하기`는 브라우저에서 ZIP을 직접 만들지 않고, 서버에 준비된 `letters.zip` 다운로드로 연결됩니다.

### Camera

- 기념 사진 프레임을 만들고 저장할 수 있습니다.
- 모바일 브라우저에서는 저장/공유 동작이 기기별 브라우저 정책을 따릅니다.

### Love

- 함께한 날, 달력, 방명록을 보여줍니다.
- 달력의 14일 칸은 연분홍 배경, 진분홍 하트, 흰색 숫자 형태로 표시됩니다.
- 방명록은 Google Form으로 제출하고 Google Sheet CSV를 읽어 목록을 표시합니다.

---

## 2. Gift 동작

### 기본 노출 규칙

- 전체 선물은 `Gift 1`부터 `Gift 9`까지 정의되어 있습니다.
- 기본 화면에는 공개 조건을 만족한 선물 후보 중 랜덤으로 3개만 표시됩니다.
- `Gift 2`, `Gift 3`, `Gift 4`, `Gift 7`, `Gift 9`은 지정된 공개 시각 이후에만 후보에 포함됩니다.
- `Gift 8`은 일반 랜덤 후보에 포함되지 않는 특수 선물입니다.
- `Gift 9`는 공개 시각 이후 후보 목록에 추가될 뿐, 3칸 모두에 강제 표시되지 않습니다.
- `Gift 9`는 한 번 뽑으면 같은 브라우저/프로필에서는 다시 나오지 않습니다.

### Gift별 연결

| Gift | 연결 |
| --- | --- |
| Gift1 | 떨어지는 사진을 잡는 사진 게임 |
| Gift2 | `assets/gift-videos/video (1).mp4` |
| Gift3 | `assets/gift-videos/video (2).mp4` |
| Gift4 | `assets/gift-videos/video (3).mp4` |
| Gift5 | 기본 꽝 모달 |
| Gift6 | 기본 꽝 모달 |
| Gift7 | `assets/gift-tongue.png` 메롱 꽝 모달 |
| Gift8 | `assets/gift-winner.png` 특수 선물 모달 + 선물 입력 저장 |
| Gift9 | `assets/gift-letter-bonus.png` 깜짝 편지 모달 + `LetterPageSixBody` 즉시 공개 |

### Gift1 사진 게임

- 사진 목록은 `scripts/app.js`의 `GIFT_PHOTO_CONFIG.files`에서 관리합니다.
- 게임 시작 전 중앙 원형 로딩 UI가 표시됩니다.
- 로딩 UI는 최대 3초 동안 현재 로드된 사진 수와 퍼센트를 보여줍니다.
- 카운트다운 중에도 이미지는 계속 백그라운드에서 로드됩니다.
- 게임 시작 시점까지 로드된 사진만 이번 라운드에 사용합니다.
- 로드된 사진이 0장이면 게임을 시작하지 않고 재시도 안내를 보여줍니다.

### Gift7과 Gift8

`Gift 7`을 실제로 클릭해서 뽑을 때마다 브라우저 저장소에 횟수를 기록합니다.

```js
localStorage.getItem("our-day-gift-seven-cycle-count")
localStorage.getItem("our-day-gift-seven-total-count")
localStorage.getItem("our-day-gift-eight-pending")
```

동작 순서:

```text
일반 선물 후보 중 랜덤 3개 표시
→ 사용자가 Gift7을 뽑음
→ 현재 주기에서 Gift7을 2번 뽑으면 gift-eight-pending = 1
→ 다음 선물 목록 3칸이 모두 Gift8로 표시됨
→ 사용자가 Gift8을 실제로 뽑으면 cycle count와 pending 상태 초기화
→ 다시 일반 선물 후보 중 랜덤 3개 단계로 반복
```

이 카운트는 `localStorage` 기반입니다. 같은 브라우저/같은 프로필에서는 창을 껐다 켜도 유지되지만, Chrome, Edge, Safari, 카카오톡 인앱 브라우저는 저장 공간이 서로 분리됩니다.

### Gift8 선물 입력

- Gift8 모달에는 원하는 선물을 입력하는 폼이 있습니다.
- 입력값은 Google Form으로 전송됩니다.
- 제출 후 사용자에게 `선물 리스트 접수 완료!` 알림을 보여줍니다.
- 알림 확인 후 Gift8 모달과 입력란이 닫히고 Gift 페이지 목록을 다시 뽑습니다.

### Gift9 편지 추가 공개

- Gift9은 공개 시각 이후 랜덤 후보에 추가됩니다.
- 후보 중 랜덤으로 선택되어 화면에 보여야 실제로 뽑을 수 있습니다.
- 한 번 뽑으면 아래 키가 저장되어 다시 노출되지 않습니다.

```js
localStorage.getItem("our-day-gift-nine-claimed")
```

- Gift9을 뽑으면 `LetterPageSixBody`도 즉시 공개됩니다.
- 이 연결은 `scripts/letter-config.js`의 `unlockByGiftNine: true`와 `scripts/app.js`의 공개 조건에서 처리합니다.

### 선물상자 이미지

선물상자 이미지는 위치 기준으로 고정됩니다. 실제 Gift 번호와 화면의 상자 색상은 직접 연결되지 않습니다.

| 위치 | 기본 이미지 | luxury 이미지 |
| --- | --- | --- |
| 왼쪽 | `assets/gift-box-blue.png` | `assets/gift-box-blue-luxury.png` |
| 가운데 | `assets/gift-box-red.png` | `assets/gift-box-red-luxury.png` |
| 오른쪽 | `assets/gift-box-green.png` | `assets/gift-box-green-luxury.png` |

`GIFT_BOX_LUXURY_OPEN_DATE` 이전에는 기본 이미지 세트를 사용하고, 이후에는 luxury 이미지 세트를 사용합니다.

---

## 3. Letter 다운로드

편지 저장 기능은 `letters.zip`을 내려받는 구조입니다.

```text
resources/Strings.resx 또는 scripts/letter-config.js 수정
→ GitHub Actions가 편지 이미지를 렌더링
→ assets/downloads/letters.zip 생성
→ GitHub Pages 배포
→ 사용자가 편지 저장하기 클릭
→ Worker URL로 이동해 ZIP 다운로드
```

브라우저에서는 ZIP을 만들지 않습니다. `fetch()`로 ZIP을 받아 Blob으로 다시 저장하는 방식도 사용하지 않습니다.

ZIP에는 항상 다음 파일이 들어갑니다.

- `letter-description.jpg`
- `letter-page-*.jpg`

현재 편지 설정은 설명 1장과 편지 9장입니다.

---

## 4. 자주 수정하는 위치

| 대상 | 관리 위치 |
| --- | --- |
| 화면 문구와 편지 본문 | `resources/Strings.resx` |
| 편지 페이지 목록과 공개시간 | `scripts/letter-config.js` |
| Gift2/Gift3/Gift4/Gift7/Gift9 공개시간 | `scripts/app.js`의 `GIFT_OPEN_TIMES` |
| 선물상자 luxury 이미지 변경시간 | `scripts/app.js`의 `GIFT_BOX_LUXURY_OPEN_DATE` |
| Gift1 사진 목록과 속도 | `scripts/app.js`의 `GIFT_PHOTO_CONFIG` |
| Gift/Letter 페이지 입장 가능 시간 | `scripts/app.js`의 `TIMECAPSULE_OPEN_DATE` |
| 메인 D-day 기준일 | `scripts/app.js`의 `ANNIVERSARY_DATE` |
| 함께한 날 D+ 기준일 | `scripts/app.js`의 `START_DATE` |
| 편지 ZIP 다운로드 URL | `scripts/config.js`의 `LETTER_ZIP_WORKER_URL` |
| 서버 시간 URL | `scripts/config.js`의 `SERVER_TIME_URL` |
| 방명록/선물 입력 저장 연동 | `scripts/app.js`의 관련 form config |

시간 문자열은 ISO 8601 + UTC 오프셋 형태를 유지합니다.

```text
YYYY-MM-DDTHH:mm:ss+09:00
```

---

## 5. 로컬 확인

루트에서 실행합니다.

```bash
npm install
npm run serve
```

기본 로컬 주소:

```text
http://localhost:4173
```

자주 보는 페이지:

```text
http://localhost:4173/#gift
http://localhost:4173/#letter
http://localhost:4173/#camera
http://localhost:4173/#love
```

편지 ZIP 생성과 검증:

```bash
npm run build:letter
npm run verify:letter
```

Playwright 브라우저가 없으면 먼저 설치합니다.

```bash
npx playwright install chromium
```

---

## 6. 테스트 메모

Gift8 흐름을 빠르게 확인하려면 브라우저 DevTools Console에서 아래 값을 설정한 뒤 Gift 페이지를 새로고침합니다.

```js
localStorage.setItem("our-day-gift-seven-cycle-count", "2");
localStorage.setItem("our-day-gift-eight-pending", "1");
```

Gift9를 다시 테스트하려면 이미 뽑은 기록을 지운 뒤 공개 시각 이후에 Gift 페이지를 새로고침합니다. Gift9은 공개 이후에도 랜덤 후보 중 하나라서 새로고침 한 번에 바로 보이지 않을 수 있습니다.

```js
localStorage.removeItem("our-day-gift-nine-claimed");
```

Gift 관련 저장값을 처음 상태로 되돌리려면:

```js
localStorage.removeItem("our-day-gift-seven-cycle-count");
localStorage.removeItem("our-day-gift-seven-total-count");
localStorage.removeItem("our-day-gift-eight-pending");
localStorage.removeItem("our-day-gift-nine-claimed");
```

---

## 7. 주의사항

- 실제 외부 서비스 URL과 Google Form entry ID는 공개 README에 적지 않습니다.
- 편지 ZIP 다운로드는 Worker URL 설정이 있어야 동작합니다.
- 카카오톡 인앱 브라우저에서 파일 저장을 안정적으로 처리하려면 ZIP 응답에 다운로드용 헤더가 필요합니다.
- GitHub Actions에서 만든 편지 이미지의 폰트는 로컬 Windows/macOS 렌더링과 미세하게 다를 수 있습니다.
- 공개 시간 판단은 가능한 경우 서버 시간을 우선 사용하고, 동기화 전에는 브라우저 시간을 fallback으로 사용합니다.
