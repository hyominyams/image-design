export const generationConfig = {
  maxCount: 5,
  maxExtraCount: 3,
  extraRequestPassword: "1234",
  maxHistoryCount: 5,
  maxUploadImageCount: 3,
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
  { label: "1:1", value: "1024x1024" },
  { label: "16:9", value: "1536x864" },
  { label: "4:3", value: "1536x1152" },
  { label: "3:4", value: "1152x1536" },
  { label: "9:16", value: "864x1536" },
] as const;

export type ImageSize = (typeof imageSizeOptions)[number]["value"];

export const defaultImageSize = imageSizeOptions[0].value;
