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
- `assets/gift-photos/`: Gift 1 사진 잡기 게임용 사진 폴더
- `ASSET_SOURCES.md`: 이미지 출처 기록

## Gift 1 사진 추가

Gift 1은 화면 위에서 아래로 떨어지는 사진을 클릭해 잡는 미니게임입니다. 사진을 잡으면 큰 화면으로 열리고 저장 버튼이 표시됩니다.

정적 사이트에서는 브라우저가 폴더 안 파일명을 자동으로 읽을 수 없으므로, 관리자는 사진 파일을 아래 이름 규칙으로 추가합니다.

```txt
assets/gift-photos/photo (1).jpg
assets/gift-photos/photo (2).jpg
assets/gift-photos/photo (3).png
```

지원 확장자는 `jpg`, `jpeg`, `png`, `webp`이고, `photo (1)`부터 `photo (30)`까지 자동으로 찾습니다.

## Google Form 방명록 연결

Love 페이지 방명록은 Google Form에 제출하고, 연결된 Google Sheet의 공개 CSV를 다시 읽어서 최신순으로 보여주는 구조입니다.
Google Sheet CSV를 브라우저에서 읽어야 하므로 `file://`로 직접 열지 말고 GitHub Pages 같은 HTTPS 배포 주소나 `localhost` 서버에서 확인해야 합니다.

1. Google Form을 만들고 질문 2개를 추가합니다.
   - `닉네임`
   - `메세지`
2. Form 응답을 Google Sheet와 연결합니다.
3. Google Sheet에서 응답 시트를 공개 CSV로 읽을 수 있게 설정합니다.
   - 간단한 방식: `Share`에서 `링크가 있는 모든 사용자`를 `뷰어`로 바꾸고 `https://docs.google.com/spreadsheets/d/SHEET_ID/gviz/tq?tqx=out:csv&gid=0` 형식을 사용합니다.
   - 게시 방식: `File > Share > Publish to web`로 응답 시트를 CSV로 게시하고 생성된 CSV URL을 사용합니다.
4. Form 미리보기에서 개발자 도구를 열고 `entry.`를 검색해 각 질문의 entry id를 확인합니다.
5. `scripts/app.js`의 `GUESTBOOK_CONFIG`를 채웁니다.

```js
const GUESTBOOK_CONFIG = {
  formAction: "https://docs.google.com/forms/d/e/FORM_ID/formResponse",
  nameEntry: "entry.111111111",
  messageEntry: "entry.222222222",
  sheetCsvUrl: "https://docs.google.com/spreadsheets/d/SHEET_ID/gviz/tq?tqx=out:csv&gid=0",
  nameColumn: "닉네임",
  messageColumn: "메세지",
  timestampColumn: "타임스탬프",
};
```

저장 확인은 Google Form 응답 직후 공개 CSV에서 같은 닉네임과 메세지가 조회되는지 확인하는 방식입니다. 실패하면 새로고침하지 않고 아래 문구를 팝업으로 띄웁니다.

```txt
잠깐! 소중한 당신의 진심이 날라가지 않게 메세지를 먼저 클립보드에 복사해놔주세요...
```
