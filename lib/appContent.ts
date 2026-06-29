export const appCopy = {
  metadata: {
    title: "AI 이미지 스튜디오",
    description:
      "프롬프트와 선택 이미지, 레퍼런스 디자인을 바탕으로 이미지를 생성하는 웹앱입니다.",
  },
  hero: {
    eyebrow: "AI 이미지 스튜디오",
    title: "스튜디오에서 이미지 만들기",
    description:
      "프롬프트, 참고 이미지, 레퍼런스 디자인으로 원하는 이미지를 만드세요.",
    guideCta: "프롬프트 도움",
  },
  nav: [
    { id: "upload", label: "작업 이미지" },
    { id: "description", label: "프롬프트" },
    { id: "styles", label: "레퍼런스" },
    { id: "result", label: "결과" },
    { id: "gallery", label: "보관함" },
  ],
  steps: [
    "이미지 추가",
    "프롬프트 쓰기",
    "레퍼런스 디자인 선택",
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
    title: "작업 이미지",
    description: "참고할 이미지가 있으면 추가하세요.",
    button: "이미지 고르기",
    helper: "이미지 파일은 5MB 이하로 올려 주세요.",
    empty: "참고 이미지 추가",
  },
  description: {
    title: "프롬프트",
    placeholder: "만들고 싶은 이미지의 대상, 분위기, 색감, 구도, 용도를 적어 주세요.",
    example:
      "예시: 햇빛이 들어오는 작은 작업실 책상 위에 세라믹 머그컵과 스케치북이 놓인 사진. 따뜻한 자연광, 차분한 색감, 잡지 화보 같은 구도.",
    exampleParts: [
      {
        label: "대상",
        text: "무엇이 중심에 보여야 하는지 적어요.",
      },
      {
        label: "분위기",
        text: "밝고 따뜻한지, 차분한지, 역동적인지 정해요.",
      },
      {
        label: "구도",
        text: "가까운 장면, 넓은 장면, 정면, 위에서 본 장면처럼 적어요.",
      },
    ],
  },
  styles: {
    title: "레퍼런스",
    description: "결과에 어울리는 시각 방향을 선택하세요.",
  },
  counter: {
    title: "남은 생성 횟수",
    limitNotice:
      "이미지는 최대 5번까지 만들 수 있어요. 프롬프트를 확인한 뒤 생성해 주세요.",
    storageNotice:
      "이 제한은 브라우저에 저장되므로 브라우저 데이터 삭제 시 초기화될 수 있습니다.",
  },
  actions: {
    generate: "AI 이미지 생성하기",
    generating: "AI가 이미지를 만들고 있어요. 잠시만 기다려 주세요.",
    download: "이미지 다운로드",
    resetResult: "결과 지우기",
  },
  result: {
    title: "결과",
    empty: "생성된 이미지가 이곳에 나타나요.",
    success: "이미지가 완성되었습니다.",
  },
  history: {
    title: "완성 이미지 보관함",
    description: "이 기기에서 최근 5개까지 다시 볼 수 있어요.",
    empty: "아직 저장된 완성 이미지가 없어요.",
  },
  errors: {
    imageRequired: "참고 이미지를 다시 확인해 주세요.",
    descriptionRequired: "프롬프트를 작성해 주세요.",
    productNameRequired: "제품명을 입력해 주세요.",
    productDetailRequired: "제품의 재료와 기능을 입력해 주세요.",
    styleRequired: "레퍼런스 디자인을 선택해 주세요.",
    limitReached: "이미지 생성 가능 횟수를 모두 사용했습니다.",
    fileTooLarge: "이미지 파일 크기는 5MB 이하로 올려 주세요.",
    invalidFileType: "jpg, png, webp 형식의 이미지만 올릴 수 있습니다.",
    generationFailed: "이미지 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.",
  },
} as const;
