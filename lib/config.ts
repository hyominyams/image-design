export const imageSizeOptions = [
  { label: "정사각형", ratio: "1:1", value: "1024x1024" },
  { label: "가로형", ratio: "16:9", value: "1536x864" },
  { label: "가로 살짝", ratio: "4:3", value: "1536x1152" },
  { label: "세로 살짝", ratio: "3:4", value: "1152x1536" },
  { label: "세로형", ratio: "9:16", value: "864x1536" },
] as const;

export type ImageSize = (typeof imageSizeOptions)[number]["value"];

export const defaultImageSize: ImageSize = "1024x1024";

export const uploadConfig = {
  /** Files a student may attach. Library picks share the same budget. */
  maxReferenceCount: 6,
  maxFileSizeBytes: 5 * 1024 * 1024,
  maxFileSizeLabel: "5MB",
  acceptedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  get acceptAttribute() {
    return this.acceptedMimeTypes.join(",");
  },
} as const;

export const generationConfig = {
  /** Upper bound the image model accepts in a single edit call. */
  maxInputImageCount: 16,
  /** Guard against shipping an oversized library tile to the model. */
  maxLibraryImageBytes: 512 * 1024,
  maxPromptLength: 1200,
  maxNoteLength: 240,
  maxHistoryCount: 12,
} as const;

export const storageKeys = {
  draft: "design_model_draft",
  history: "design_model_history",
} as const;
