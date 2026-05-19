export const appCopy = {
  metadata: {
    title: "나의 디자인을 실제 제품처럼 보기",
    description:
      "학생이 직접 디자인한 상상 물건을 업로드하고 설명과 제품화 스타일을 선택해 실제 개발된 물품처럼 보는 수업용 웹앱입니다.",
  },
  hero: {
    eyebrow: "AI 제품 상상 미술시간",
    title: "나의 디자인을 실제 제품처럼 보기",
    description:
      "내가 그린 상상 물건을 올리고 설명과 제품화 스타일을 고르면, 실제로 개발된 물품 같은 이미지가 완성됩니다.",
    guideCta: "AI에게 설명하는 방법",
  },
  nav: [
    { id: "upload", label: "업로드" },
    { id: "description", label: "설명" },
    { id: "styles", label: "스타일" },
    { id: "result", label: "결과" },
    { id: "gallery", label: "보관함" },
  ],
  steps: [
    "디자인 그림 올리기",
    "물건 설명 쓰기",
    "제품화 스타일 선택",
    "AI 이미지 만들기",
    "완성 이미지 받기",
  ],
  theme: {
    light: "라이트",
    dark: "다크",
    toggleToLight: "라이트 모드로 전환",
    toggleToDark: "다크 모드로 전환",
  },
  upload: {
    title: "1. 이미지 업로드",
    description: "직접 디자인한 물건 그림을 올려요.",
    button: "이미지 고르기",
    helper: "이미지 파일은 5MB 이하로 올려 주세요.",
    empty: "내가 디자인한 물건 그림을 올려요",
  },
  description: {
    title: "2. 설명 작성",
    placeholder: "무엇을 위해 쓰는 물건인지, 꼭 남길 모양과 색을 적어 주세요.",
    example:
      "예시: 이 물건은 비 오는 날 책가방을 젖지 않게 지켜주는 자동 우산 문입니다. 문처럼 열리고 닫히며, 노란 손잡이와 둥근 파란 몸체가 꼭 남아야 합니다. 부드러운 플라스틱 제품처럼 보이면 좋겠습니다.",
    exampleParts: [
      {
        label: "목적",
        text: "비 오는 날 책가방을 젖지 않게 지켜요.",
      },
      {
        label: "모양",
        text: "문처럼 열리고, 노란 손잡이와 둥근 파란 몸체가 있어요.",
      },
      {
        label: "재료",
        text: "부드러운 플라스틱 제품처럼 보이면 좋겠어요.",
      },
    ],
  },
  styles: {
    title: "3. 스타일 선택",
    description: "내 디자인을 어떤 제품 모습으로 볼지 선택해요.",
  },
  counter: {
    title: "남은 생성 횟수",
    limitNotice:
      "이미지는 최대 5번까지 만들 수 있어요. 신중하게 설명을 작성한 뒤 생성해 주세요.",
    storageNotice:
      "이 제한은 브라우저에 저장되므로 브라우저 데이터 삭제 시 초기화될 수 있습니다.",
  },
  actions: {
    generate: "AI 이미지 생성하기",
    generating: "AI가 내 디자인을 실제 제품처럼 만들고 있어요. 잠시만 기다려 주세요.",
    download: "이미지 다운로드",
    resetResult: "결과 지우기",
  },
  result: {
    title: "4. 완성 이미지",
    empty: "생성된 이미지가 이곳에 나타나요.",
    success: "이미지가 완성되었습니다.",
  },
  history: {
    title: "완성 이미지 보관함",
    description: "이 기기에서 최대 5개까지 다시 볼 수 있어요.",
    empty: "아직 저장된 완성 이미지가 없어요.",
  },
  errors: {
    imageRequired: "먼저 이미지를 업로드해 주세요.",
    descriptionRequired: "내가 디자인한 물건에 대한 설명을 작성해 주세요.",
    styleRequired: "원하는 제품화 스타일을 선택해 주세요.",
    limitReached: "이미지 생성 가능 횟수를 모두 사용했습니다.",
    fileTooLarge: "이미지 파일 크기는 5MB 이하로 올려 주세요.",
    invalidFileType: "jpg, png, webp 형식의 이미지만 올릴 수 있습니다.",
    generationFailed: "이미지 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.",
  },
} as const;
