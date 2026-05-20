# AI 이미지 생성 수업용 웹앱

학생이 직접 만든 이미지를 업로드하고 설명과 스타일을 선택하면, 서버 라우트가 OpenAI 이미지 생성 API를 호출해 새 이미지를 만들어 주는 Next.js 웹앱입니다.

## 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://127.0.0.1:3000` 또는 `http://localhost:3000`을 엽니다.

## 환경 변수

`image-design/.env.local`에 API 키를 넣고 개발 서버를 다시 시작합니다.

```bash
OPENAI_API_KEY=your_api_key_here
```

API 키는 프론트엔드에 노출되지 않고 `/api/generate-image` 서버 라우트에서만 사용됩니다.

## 주요 파일

- `app/page.tsx`: 한 페이지 웹앱 진입점
- `app/api/generate-image/route.ts`: 이미지 생성 서버 라우트
- `components/ImageGenerationApp.tsx`: 학생 화면
- `lib/stylePresets.ts`: 교사용 스타일 프리셋
- `lib/config.ts`: 업로드 제한, 생성 횟수, localStorage 키
- `lib/localStorage.ts`: 생성 횟수와 최근 결과 저장
- `public/styles`: 스타일 썸네일과 팔레트 이미지

## 생성 제한

생성 횟수는 브라우저 localStorage에 저장되며 성공한 생성만 1회로 계산합니다. 브라우저 데이터나 localStorage를 삭제하면 제한이 초기화될 수 있으므로, 이 기능은 수업 운영용 간단 제한 장치입니다.
