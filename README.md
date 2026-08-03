# happy-web (Our Day — 1주년 기념 사이트)

1주년 기념용 정적 웹사이트입니다. GitHub Pages로 배포되며, 편지 다운로드(`letters.zip`)는 GitHub Actions가 자동 생성 → GitHub Pages → Cloudflare Worker 프록시 구조로 제공됩니다.

---

## 1. 편지 ZIP 다운로드 구조

이전에는 브라우저에서 Canvas로 JPG 7장을 만들고 `URL.createObjectURL()` + 임시 `<a>` 클릭으로 ZIP을 내려받았습니다. 카카오톡 인앱 브라우저는 `blob:` URL 다운로드를 지원하지 않아 `저장 중` 상태에서 멈추는 문제가 있었습니다.

현재 구조:

```text
편지 내용 수정 (resources/Strings.resx, scripts/letter-config.js)
→ git push
→ GitHub Actions: Playwright(헤드리스 Chromium)로 사이트 로드
   → 웹과 동일한 LetterRenderer.renderAllLetterImages() 실행
   → JPG 7장 생성 → letters.zip 생성
→ assets/downloads/letters.zip 포함 GitHub Pages 배포
→ 사용자가 "편지 저장하기" 클릭
   → 앱이 Cloudflare Worker HTTPS URL로 이동 (window.location.href)
   → Worker가 GitHub Pages의 최신 ZIP을 프록시
   → Content-Disposition: attachment 헤더로 다운로드
```

**중요**: 브라우저에서는 ZIP을 만들지 않습니다. `fetch()`로 ZIP을 받아 다시 Blob으로 바꾸는 방식도 사용하지 않습니다. 버튼은 Worker HTTPS 주소로의 일반 내비게이션입니다.

### 핵심 파일

| 파일 | 역할 |
| --- | --- |
| `resources/Strings.resx` | 편지 본문/제목/서명 등 모든 문자열 원본 (웹 + 다운로드 공통) |
| `scripts/letter-config.js` | 편지 페이지 목록과 공개 일정 (웹 + 다운로드 공통) |
| `scripts/letter-renderer.js` | 편지 이미지 렌더링(1200x1600 Canvas) — 웹/CI가 동일 함수 사용 |
| `scripts/zip.js` | ZIP 생성 유틸 (워크플로우 공통) |
| `scripts/build-letter-download.mjs` | CI 빌드 스크립트 (Playwright) |
| `scripts/verify-letter-download.mjs` | ZIP 내용 검증 스크립트 |
| `scripts/config.js` | Worker URL 설정 (placeholder) |
| `scripts/app.js` | 웹: 저장 버튼 → Worker URL 이동 |
| `.github/workflows/deploy-pages.yml` | 자동 빌드 + Pages 배포 |
| `cloudflare-worker/` | Worker 소스 + wrangler 설정 |

---

## 2. 사용자가 한 번만 해야 하는 설정

### 2-1. GitHub Pages (필수, 1회)

이 저장소에는 기존 GitHub Pages 워크플로우가 없었으므로 새로 추가했습니다. 배포 방식 변경이 필요합니다.

1. GitHub 저장소 → `Settings > Pages`
2. `Build and deployment` → **`GitHub Actions`** 선택
   - (이전에 `Deploy from a branch`였다면 반드시 변경. Actions 배포 산출물이 필요하므로)
3. `Settings > Actions > General` → `Workflow permissions` → **`Read and write permissions`** 선택 (기본값이면 OK)
4. 첫 push 후 `Actions` 탭에서 `Deploy GitHub Pages with letters.zip` 워크플로우가 성공하는지 확인

배포 후 ZIP 주소(예상):

```text
https://codechoij.github.io/happyweb-lovelyjj/assets/downloads/letters.zip
```

### 2-2. Cloudflare Worker (필수, 1회)

카카오톡 인앱 브라우저 다운로드를 위해서는 Worker(HTTPS 다운로드 응답)가 필요합니다.

1. Cloudflare 계정 생성/로그인 (무료 tier로 충분)
   - 계정: https://dash.cloudflare.com/sign-up
2. `cloudflare-worker/` 디렉터리에서:

```bash
cd cloudflare-worker
npm install
npm install -g wrangler   # 또는 npx wrangler 사용
wrangler login             # 브라우저에서 로그인 (토큰 파일 불필요)
```

3. `wrangler.jsonc`의 placeholder 2개를 실제 값으로 교체
   - `"name": "$WORKER_NAME"` → 예: `"happyweb-letter-download"`
   - `account_id`는 의도적으로 저장소에 넣지 않았습니다. `wrangler login`으로 로그인하면 자동으로 인식됩니다.
4. 배포:

```bash
npx wrangler deploy
```

5. Worker URL 확인:
   - 배포 출력 또는 Cloudflare 대시보드 `Workers & Pages > <worker 이름>`
   - 예: `https://happyweb-letter-download.<your-subdomain>.workers.dev/letters.zip`

### 2-3. 사이트 코드에 Worker URL 설정 (필수)

배포된 Worker URL을 `scripts/config.js`에 넣습니다.

```js
window.SITE_CONFIG = {
  LETTER_ZIP_WORKER_URL: "https://happyweb-letter-download.<your-subdomain>.workers.dev/letters.zip",
};
```

`WORKER_NAME.YOUR_SUBDOMAIN` placeholder가 그대로면(또는 비어 있으면) 저장 버튼을 눌러도 다운로드가 시작되지 않고 안내 문구만 표시됩니다.

> Worker를 아직 배포하지 않았는데 저장 버튼이 비활성 상태로 보이는 문제를 피하려면, 배포 완료 후 이 파일을 수정하고 push하세요.

### 2-4. GitHub Secrets

다음을 저장소에 설정하세요 (`Settings > Secrets and variables > Actions > New repository secret`):

- **`CLOUDFLARE_API_TOKEN`** (선택): Worker를 GitHub Actions에서 자동 배포하려는 경우에만 필요. 로컬 `wrangler login`으로 직접 배포한다면 불필요
- **`CLOUDFLARE_ACCOUNT_ID`** (선택): 위와 동일한 조건에서 필요

> 이 저장소에 Cloudflare 계정 ID/토큰을 하드코딩하는 경우는 없습니다. `cloudflare-worker/wrangler.jsonc`에도 없습니다.

Worker를 GitHub Actions 자동 배포로 연결하고 싶다면 `deploy-pages.yml`에 아래 스텝을 추가하거나 별도 워크플로우로 구성할 수 있습니다(기본 구성은 사용자가 로컬에서 1회 배포하는 방식).

---

## 3. 이후 편지 내용 수정 방법

전체 과정은 push만 하면 됩니다.

```text
1. resources/Strings.resx 에서 LetterPage*Body 등 본문 수정
   (또는 scripts/letter-config.js 에서 페이지 목록/공개 일정 수정)
2. git add -A && git commit -m "..." && git push
3. GitHub Actions가 자동으로:
   - 최신 ZIP 생성 (assets/downloads/letters.zip)
   - ZIP 검증 (7개 파일명/크기/JPEG 유효성)
   - GitHub Pages 배포
4. 사용자가 "편지 저장하기" 클릭 시 Worker가 최신 ZIP 제공
```

사람이 `letters.zip`을 직접 만들거나 업로드할 필요가 없습니다.

### 공개 일정 변경

- 편지 설명 공개 시각: `scripts/letter-config.js`의 `descriptionReleaseAt`
- 각 장 공개 시각: `pages[].releaseAt`
- ISO 8601 + UTC 오프셋 형태로 유지하세요 (`2026-07-31T14:37:10+09:00`)

---

## 4. 로컬 테스트

### 4-1. 사이트 실행 (수동 확인)

```bash
npm install          # 루트에서 (playwright 포함)
npm run serve        # http://localhost:4173
```

브라우저에서 `http://localhost:4173/#letter`로 열어 확인합니다. (타임캡슐/비밀번호 게이트가 있어 문자 페이지는 서버 시간 동기화 후 접근 가능합니다.)

### 4-2. ZIP 생성 로컬 테스트

```bash
npm run build:letter     # assets/downloads/letters.zip 생성 (Playwright 필요)
npm run verify:letter    # 7개 파일 검증
```

Playwright 브라우저 바이너리가 없으면 먼저 `npx playwright install chromium` 실행.

### 4-3. Worker 로컬 테스트

```bash
cd cloudflare-worker
npm install
npx wrangler dev
# http://localhost:8787/letters.zip
```

---

## 5. 배포 테스트

1. push → `Actions` 탭에서 워크플로우 성공 확인
2. 브라우저에서 ZIP 직접 확인:
   ```text
   https://codechoij.github.io/happyweb-lovelyjj/assets/downloads/letters.zip
   ```
3. Worker URL 직접 확인:
   ```text
   https://<worker>.<subdomain>.workers.dev/letters.zip
   ```
   - 응답 헤더 확인(DevTools Network):
     ```text
     Content-Type: application/zip
     Content-Disposition: attachment; filename="letters.zip"
     Cache-Control: no-store
     ```
   - ZIP 안에 정확히 7개:
     ```text
     letter-description.jpg
     letter-page-1.jpg ... letter-page-6.jpg
     ```
4. 편지 내용을 한 줄 수정해서 push → 1~3 반복 → 내용이 이미지에 반영되는지 확인

### 자동 테스트 항목 (워크플로우가 수행)

- [x] GitHub Actions 정상 완료
- [x] `letters.zip`이 Pages 배포 결과에 포함
- [x] ZIP 내부 정확히 7개 파일
- [x] 파일명 정확
- [x] 각 JPG 크기 > 0
- [x] 각 JPG가 실제 JPEG(SOF 파싱으로 디코딩 가능)
- [x] 수정된 편지 내용이 이미지에 반영 (항상 최신 Strings.resx를 다시 읽어 렌더링)

---

## 6. 카카오톡 인앱 브라우저 수동 테스트

자동화가 불가능하므로 아래 절차를 따르세요.

준비: Worker 배포 + `scripts/config.js`에 Worker URL 설정 + Pages에 최신 ZIP 배포 완료.

1. **Android**
   1. 휴대폰 카카오톡에서 이 사이트 링크를 보낼 준비 (자기 자신 채팅에 링크 전송)
   2. 링크를 눌러 카카오톡 인앱 브라우저로 사이트 열기
   3. Letter 페이지에서 마지막 편지까지 진행
   4. `편지 저장하기` 버튼 탭
   5. 화면 하단/상단에 다운로드 알림이 뜨고, `내 파일/다운로드` 폴더에 `letters.zip`이 저장되는지 확인
   6. 실패 시:
      - "다운로드 서버 설정" 문구가 보이면 `scripts/config.js`의 URL 확인
      - "사용할 수 없는 파일" 또는 HTML이 열리면 Worker 배포/ORIGIN 확인
2. **iOS**
   1. 같은 방법으로 인앱 브라우저에서 열기
   2. 저장 버튼 탭 → "다운로드" → 파일 앱(iOS Files)에 저장되는지 확인
   3. iOS 사파리 기본 동작(파일 다운로드)은 사용자가 직접 "저장"을 눌러야 할 수 있음
3. **일반 브라우저 대조 테스트**
   - PC Chrome / 모바일 Chrome / 모바일 Safari에서 동일하게 다운로드되는지 확인

참고: 카카오톡 인앱 브라우저는 `Content-Disposition: attachment`가 있는 실제 HTTPS 응답은 다운로드로 처리합니다. ZIP을 열람하는 뷰어가 없으므로 "파일 저장"으로 처리됩니다.

---

## 7-1. Cloudflare는 필수인가요? 대안과 계정 소실 복구 절차

### 왜 Cloudflare Worker가 필요한가

**구조상 필수는 아니지만, "카카오톡 인앱 브라우저에서 확실히 저장"이라는 요구사항을 만족하려면 헤더를 추가해주는 가벼운 프록시가 하나 필요합니다.**

- 원인은 `blob:` URL이 아니라, **GitHub Pages가 응답 헤더를 바꿀 수 없는 정적 호스팅**이라는 점입니다.
- 요구사항의 `Content-Disposition: attachment; filename="letters.zip"` 헤더는 GitHub Pages가 붙여주지 않습니다.
- 데스크톱 브라우저는 `application/zip` Content-Type만으로도 다운로드되지만, 모바일/카카오톡 인앱 브라우저는 `Content-Disposition: attachment` 헤더가 있어야 "파일 저장"으로 처리하는 경우가 많습니다. 이 헤더가 없으면 ZIP이 열리지 않거나 저장이 안 되는 것처럼 보일 수 있습니다.
- Cloudflare Worker는 ZIP을 만들지 않고, GitHub Pages의 최신 ZIP을 가져와 **헤더만 추가해 내려주는** 최소 역할만 합니다.

### Cloudflare 계정이 사라지면 어떤 작업이 영향받나

| 기능 | 영향 |
| --- | --- |
| 편지 ZIP 다운로드 | **영향 있음** — 저장 버튼이 동작하지 않습니다 |
| 사이트 자체 (GitHub Pages) | 무관 |
| 비밀번호 / 관리자 (Google Apps Script) | 무관 |
| 방명록 (Google Form/Sheet) | 무관 |
| 선물 게임 / 카메라 / 달력 / 음악 | 무관 |

### 복구 절차 (계정 삭제·만료·정지 시)

ZIP 원본은 GitHub Pages에 계속 남아 있으므로 **ZIP 재생성 없이** 몇 분 내로 복구할 수 있습니다.

1. 같은 Cloudflare 계정 복구 → `cloudflare-worker/`에서 `npm install && npx wrangler login && npx wrangler deploy` → `scripts/config.js`의 Worker URL이 같다면 끝.
2. 새 Cloudflare 계정으로 새 Worker 배포 → `wrangler.jsonc`의 `name`을 새 값으로 → 배포 후 `scripts/config.js`의 `LETTER_ZIP_WORKER_URL`만 새 URL로 교체 → push.
3. Cloudflare를 아예 쓰지 않으려면 아래 "대안" 참고.

### 개인이 무료로 쓸 수 있나 (불특정 다수 전제)

- Cloudflare Workers **Free Tier는 무료**입니다. 계정 생성 비용이 없고, 신용카드도 필요 없습니다.
- 무료 티어 기본 한도는 **하루 100,000건 요청** 수준입니다.
- 1주년 이벤트 사이트처럼 하루 수천~수만 다운로드 규모라면 충분합니다. ZIP은 1회 다운로드당 1건 요청만 발생합니다.
- 하루 10만 건을 초과하는 규모가 되면 유료 전환이 필요하지만, 이 프로젝트의 성격상 현실적이지 않습니다.

### Cloudflare 없이 해결하는 대안

| 방법 | 설명 | 주의 |
| --- | --- | --- |
| GitHub Pages ZIP 직접 링크 | 저장 버튼을 `https://codechoij.github.io/happyweb-lovelyjj/assets/downloads/letters.zip`로 직접 연결. Worker 불필요 | `Content-Disposition` 헤더가 없어 카카오톡 인앱 브라우저에서 저장 실패가 재발할 확률이 높음. 데스크톱/일반 모바일 브라우저에서는 동작 |
| Netlify 호스팅 | `_headers` 파일로 `Content-Disposition` 지정 가능 | 사이트 주소가 바뀌고, Pages와 별도 배포 설정 필요. 배포 URL을 `scripts/config.js`에 반영 |
| Vercel 호스팅 | `vercel.json`의 `headers`로 지정 가능 | 위와 동일 |
| 직접 서버(자체 VPS 등) | 자유롭게 헤더 설정 가능 | 유지보수/비용 부담, 개인 프로젝트에는 과함 |

권장: 이 프로젝트 요구사항(카카오톡 인앱 브라우저 포함)을 만족하면서 최소 비용 구조라면 **현재 Cloudflare Worker 방식**이 가장 적합합니다.

---

## 7. 남아 있는 제약 또는 주의사항

- **GitHub Pages 배포 방식 변경 필요**: 기존 `Deploy from a branch`를 사용 중이라면 `Settings > Pages`에서 `GitHub Actions`로 변경해야 ZIP이 배포 산출물에 포함됩니다. 변경 없이는 `assets/downloads/letters.zip`이 접근 불가합니다.
- **폰트 차이**: 다운로드 이미지의 폰트는 기존 웹 렌더링(`Apple SD Gothic Neo`/`Malgun Gothic`)과 동일한 스택을 사용합니다. GitHub Actions(우분투)에는 이 폰트가 없어 가용한 CJK 폰트(기본 sans-serif)로 대체 렌더링됩니다. 로컬 macOS/Windows에서 `npm run build:letter`를 실행하면 PC 다운로드와 거의 동일한 결과물이 나옵니다. 웹 화면과 저장 이미지의 구조가 원래 완전히 동일하지 않았으므로, 요구사항에 따라 기존 PC 다운로드 결과(1200x1600)를 기준으로 동일하게 유지했습니다.
- **Worker 캐시**: Worker는 `Cache-Control: no-store` + 짧은 TTL(60초) 캐시를 사용해 새 배포 이후 최신 ZIP이 곧 반영됩니다. GitHub Pages 자체 CDN 캐시에 의해 수 초~수 분 지연이 있을 수 있습니다.
- **편지 공개 일정**: 웹 페이지의 공개 일정은 유지됩니다. ZIP 자체는 CI에서 항상 전체 7장(설명+6장)이 생성됩니다.
- **Google Apps Script**: 기존 비밀번호/방명록 연동은 그대로 유지됩니다. ZIP 바이너리 서버로 사용하지 않습니다.
- **ZIP 생성 실패 시**: 워크플로우 로그에 `[letter-build] ...` 단계별 로그가 남습니다. 실패하면 Pages 배포가 중단되므로 오래된 ZIP이 덮어쓰이지 않습니다(실패 시 배포 미수행).
- **Worker 미배포 상태**: 저장 버튼은 "다운로드 서버가 설정되지 않음" 문구를 표시하며 동작하지 않습니다. Worker URL 설정 전까지는 기능이 비활성입니다.
