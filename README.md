# happy-web1

1주년 기념용 정적 웹페이지 초안입니다.

## Pages 배포

이 프로젝트는 빌드 과정이 없는 정적 사이트입니다. GitHub Pages에서 바로 배포할 수 있습니다.

1. 변경사항을 commit/push 합니다.
2. GitHub 저장소에서 `Settings > Pages`로 이동합니다.
3. `Build and deployment`를 `Deploy from a branch`로 선택합니다.
4. 배포 브랜치를 `main` 또는 현재 작업 브랜치인 `develop`으로 선택하고, 폴더는 `/root`로 둡니다.
5. 배포 후 주소는 보통 `https://codechoij.github.io/happy-web1/` 형식입니다.

Camera 기능은 브라우저 보안 정책 때문에 `file://`로 열었을 때 동작하지 않을 수 있습니다. GitHub Pages처럼 HTTPS로 배포하거나 `localhost` 서버에서 확인해야 합니다.

## 파일 구조

- `index.html`: 전체 페이지 구조
- `styles/main.css`: 화면 스타일
- `scripts/app.js`: 페이지 전환, Home 게이트, 카운트다운, 카메라, 달력 동작
- `assets/`: 이미지 에셋
- `ASSET_SOURCES.md`: 이미지 출처 기록

## Google Form 방명록 연결

Love 페이지 방명록은 Google Form에 제출하고, 연결된 Google Sheet의 공개 CSV를 다시 읽어서 최신순으로 보여주는 구조입니다.

1. Google Form을 만들고 질문 2개를 추가합니다.
   - `이름`
   - `메시지`
2. Form 응답을 Google Sheet와 연결합니다.
3. Google Sheet에서 `File > Share > Publish to web`로 응답 시트를 CSV로 게시합니다.
4. Form 미리보기에서 개발자 도구를 열고 `entry.`를 검색해 각 질문의 entry id를 확인합니다.
5. `scripts/app.js`의 `GUESTBOOK_CONFIG`를 채웁니다.

```js
const GUESTBOOK_CONFIG = {
  formAction: "https://docs.google.com/forms/d/e/FORM_ID/formResponse",
  nameEntry: "entry.111111111",
  messageEntry: "entry.222222222",
  sheetCsvUrl: "https://docs.google.com/spreadsheets/d/e/SHEET_ID/pub?gid=0&single=true&output=csv",
  nameColumn: "이름",
  messageColumn: "메시지",
  timestampColumn: "타임스탬프",
};
```

저장 확인은 Google Form 응답 직후 공개 CSV에서 같은 이름과 메시지가 조회되는지 확인하는 방식입니다. 실패하면 새로고침하지 않고 아래 문구를 팝업으로 띄웁니다.

```txt
잠깐! 소중한 당신의 진심이 날라가지 않게 메세지를 먼저 클립보드에 복사해놔주세요...
```
