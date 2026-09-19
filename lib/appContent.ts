/**
 * All user-facing copy. Components never inline Korean strings, so wording can
 * be revised (or translated) without touching layout.
 */
export const appCopy = {
  metadata: {
    title: "디자인 스튜디오",
    description:
      "직접 그린 그림이나 찾은 레퍼런스를 올리고, 짧은 설명만으로 원하는 이미지를 만드는 도구입니다.",
  },
  app: {
    name: "디자인 스튜디오",
    tagline: "그림을 올리고, 설명을 쓰고, 만들기",
  },
  steps: {
    references: {
      label: "내 이미지",
      title: "참고할 이미지를 올려 주세요",
      description:
        "직접 그린 그림이나 찾은 이미지를 올리고, 어떻게 쓸지 적어 주세요. 없어도 괜찮아요.",
    },
    design: {
      label: "디자인",
      description: "결과물을 어떤 디자인으로 만들지 골라 주세요. 고르지 않아도 돼요.",
    },
    prompt: {
      label: "설명",
      title: "무엇을 만들고 싶나요?",
      description: "짧아도 괜찮아요. 나머지는 AI가 채워 줍니다.",
    },
    result: {
      label: "결과",
      title: "완성된 이미지",
      description: "마음에 들지 않으면 설명을 고쳐서 다시 만들어 보세요.",
    },
  },
  references: {
    uploadTitle: "이미지 올리기",
    uploadHint: "클릭하거나 파일을 끌어다 놓으세요",
    uploadMeta: "JPG · PNG · WEBP / 최대 {size} / 최대 {count}장",
    emptyTitle: "아직 올린 이미지가 없어요",
    emptyDescription: "이미지 없이 설명만으로 만들 수도 있습니다.",
    noteLabel: "이 이미지를 어떻게 쓸까요?",
    notePlaceholder: "예: 내가 그린 손 그림이에요. 이 모양을 그대로 살려 주세요.",
    noteHelp: "이 칸에 쓴 내용대로 AI가 각 이미지를 다르게 사용합니다.",
    removeLabel: "이미지 빼기",
    countLabel: "{count}장",
    fallbackLabel: "참고 이미지",
    fullTitle: "참고 이미지를 가득 채웠어요",
    fullDescription: "하나를 빼면 더 넣을 수 있어요.",
  },
  /** One-tap fillers for the per-image note field. */
  noteSuggestions: [
    { label: "내가 그린 그림", note: "제가 직접 그린 그림이에요. 이 모양과 특징을 그대로 살려 주세요." },
    { label: "화풍만 참고", note: "이 이미지의 화풍과 질감만 참고해 주세요. 그려진 대상은 따라하지 마세요." },
    { label: "색감만 참고", note: "이 이미지의 색감만 참고해 주세요." },
    { label: "구도만 참고", note: "이 이미지의 구도와 화면 배치만 참고해 주세요." },
    { label: "이 물건이 주인공", note: "이 이미지에 있는 물건이 결과물의 주인공이에요." },
  ],
  library: {
    title: "레퍼런스 디자인",
    description:
      "마음에 드는 디자인을 하나 고르세요. 결과물이 이 디자인처럼 만들어져요.",
    searchPlaceholder: "이름으로 찾기",
    empty: "검색 결과가 없어요.",
    selected: "선택됨",
    openAll: "전체 레퍼런스 보기 ({count}개)",
    close: "닫기",
  },
  prompt: {
    label: "만들고 싶은 이미지 설명",
    placeholder:
      "예: 내가 그린 가방을 실제 제품 사진처럼 만들어 줘. 밝은 회색 배경에, 옆에서 본 모습으로.",
    help: "무엇을 / 어떤 분위기로 / 어디에 쓸 건지 정도만 적어도 충분해요.",
    tipsTitle: "이렇게 적으면 좋아요",
    tips: [
      "무엇이 주인공인지 — 가방, 캐릭터, 포스터처럼",
      "어떤 느낌인지 — 밝고 따뜻하게, 차분하게",
      "어디에 쓸 건지 — 발표 자료, 상세페이지, 전시",
    ],
    counter: "{current} / {max}자",
  },
  sections: {
    optional: "선택",
    required: "필수",
  },
  size: {
    label: "이미지 비율",
    help: "고른 디자인에 어울리는 비율이 자동으로 맞춰집니다.",
  },
  actions: {
    generate: "이미지 만들기",
    generating: "만드는 중...",
    regenerate: "다시 만들기",
    download: "내려받기",
    next: "다음",
    back: "이전",
    startOver: "처음부터",
  },
  startOver: {
    title: "처음부터 다시 할까요?",
    description:
      "올린 이미지와 이미지별 설명, 고른 디자인, 프롬프트가 모두 지워지고 되돌릴 수 없어요. 만든 이미지 보관함은 그대로 남아요.",
    cancel: "계속 작업하기",
    confirm: "모두 지우기",
  },
  result: {
    imageAlt: "생성된 이미지",
    emptyTitle: "아직 만든 이미지가 없어요",
    emptyDescription: "왼쪽에서 설명을 쓰고 만들기를 눌러 보세요.",
    loadingTitle: "이미지를 만들고 있어요",
    loadingDescription: "정밀하게 만드는 모델이라 1~2분 정도 걸릴 수 있어요.",
  },
  history: {
    title: "만든 이미지",
    description: "이 기기에 최근 {count}개까지 남아요.",
    empty: "아직 저장된 이미지가 없어요.",
    clear: "모두 지우기",
    remove: "지우기",
  },
  errors: {
    promptRequired: "만들고 싶은 이미지를 설명해 주세요.",
    tooManyReferences: "참고 이미지는 최대 {count}장까지 넣을 수 있어요.",
    fileTooLarge: "이미지는 {size} 이하로 올려 주세요.",
    invalidFileType: "JPG, PNG, WEBP 형식만 올릴 수 있어요.",
    readFailed: "이미지를 읽지 못했어요. 다른 파일로 시도해 주세요.",
    generationFailed: "이미지 생성에 실패했어요. 잠시 후 다시 시도해 주세요.",
  },
  /** Returned by the API route; shown to the student verbatim. */
  serverErrors: {
    missingApiKey:
      "이미지 생성 설정이 필요합니다. OPENAI_API_KEY 환경 변수를 추가한 뒤 서버를 다시 시작해 주세요.",
    promptRequired: "만들고 싶은 이미지를 설명해 주세요.",
    promptTooLong: "설명이 너무 길어요. 조금 줄여 주세요.",
    tooManyReferences: "참고 이미지는 최대 {count}장까지 넣을 수 있어요.",
    tooManyInputs: "참고 이미지가 너무 많아요.",
    presetNotFound: "선택한 레퍼런스를 찾을 수 없어요.",
    uploadUnreadable: "올린 이미지를 읽지 못했어요. 다른 파일로 시도해 주세요.",
    uploadInvalidType: "JPG, PNG, WEBP 형식만 올릴 수 있어요.",
    uploadTooLarge: "이미지는 {size} 이하로 올려 주세요.",
    referenceUnavailable: "참고 이미지를 준비하지 못했어요. 잠시 후 다시 시도해 주세요.",
    uploadFallbackLabel: "이미지 {index}",
    generic: "이미지를 만드는 중에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.",
    rejected:
      "이 요청으로는 이미지를 만들 수 없어요. 프롬프트나 올린 이미지를 바꿔서 다시 시도해 주세요.",
    invalidApiKey: "API 키 설정을 확인해 주세요.",
    forbidden: "이미지 생성 권한을 확인해 주세요. OpenAI 프로젝트 설정이 필요합니다.",
    modelNotFound: "이미지 생성 모델을 찾을 수 없어요. 모델 설정을 확인해 주세요.",
    rateLimited: "요청이 몰리고 있어요. 잠시 후 다시 시도해 주세요.",
    upstreamUnavailable: "이미지 생성 서버가 불안정해요. 잠시 후 다시 시도해 주세요.",
    requestFailed: "요청을 처리하지 못했어요. 입력 내용을 확인해 주세요.",
  },
  toasts: {
    generated: "이미지가 완성됐어요.",
    saved: "내려받기를 시작했어요.",
    historyCleared: "저장된 이미지를 모두 지웠어요.",
  },
} as const;

/** Replaces `{token}` placeholders in the copy above. */
export function fillCopy(
  template: string,
  values: Record<string, string | number>,
) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
