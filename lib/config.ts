export const generationConfig = {
  maxCount: 5,
  maxHistoryCount: 5,
  maxFileSizeBytes: 5 * 1024 * 1024,
  maxReferenceFileSizeBytes: 512 * 1024,
  maxInputImageCount: 16,
  acceptedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  storageKeys: {
    count: "general_ai_image_generation_count",
    draft: "general_ai_image_draft",
    history: "general_ai_image_history",
    theme: "general_ai_image_theme",
  },
} as const;

export const uploadConfig = {
  acceptAttribute: generationConfig.acceptedMimeTypes.join(","),
  maxFileSizeLabel: "5MB",
} as const;

export const imageSizeOptions = [
  { label: "정사각형", value: "1024x1024" },
  { label: "16:9 가로형", value: "1536x864" },
  { label: "가로형", value: "1536x1024" },
  { label: "세로형", value: "1024x1536" },
] as const;

export type ImageSize = (typeof imageSizeOptions)[number]["value"];

export const defaultImageSize = imageSizeOptions[0].value;
