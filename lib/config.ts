export const generationConfig = {
  maxCount: 5,
  maxFileSizeBytes: 5 * 1024 * 1024,
  maxReferenceFileSizeBytes: 512 * 1024,
  maxInputImageCount: 16,
  acceptedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  storageKeys: {
    access: "general_ai_image_access",
    count: "general_ai_image_generation_count",
    history: "general_ai_image_history",
    theme: "general_ai_image_theme",
  },
} as const;

export const uploadConfig = {
  acceptAttribute: generationConfig.acceptedMimeTypes.join(","),
  maxFileSizeLabel: "5MB",
} as const;
