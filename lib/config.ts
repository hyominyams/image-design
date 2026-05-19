export const generationConfig = {
  maxCount: 5,
  maxFileSizeBytes: 5 * 1024 * 1024,
  acceptedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  storageKeys: {
    count: "student_ai_image_generation_count",
    history: "student_ai_image_history",
    theme: "student_ai_image_theme",
  },
} as const;

export const uploadConfig = {
  acceptAttribute: generationConfig.acceptedMimeTypes.join(","),
  maxFileSizeLabel: "5MB",
} as const;
