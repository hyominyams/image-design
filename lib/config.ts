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
  /** Pictures a student may attach. */
  maxReferenceCount: 6,
  /** What they may pick: phone photos are several MB straight out of camera. */
  maxSourceFileBytes: 12 * 1024 * 1024,
  maxSourceFileLabel: "12MB",
  /**
   * The browser shrinks every picture before sending. Vercel refuses request
   * bodies over 4.5MB and base64 adds a third on top, so six pictures have to
   * fit comfortably inside that: 6 x 400KB ≈ 3.2MB once encoded.
   */
  maxImageEdge: 1280,
  targetUploadBytes: 400 * 1024,
  /** Server-side guard for a single picture, after the browser shrank it. */
  maxUploadBytes: 1024 * 1024,
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

/**
 * When a class all presses at once, OpenAI refuses the extra requests with a
 * rate limit. Rather than failing, the browser waits and retries: the wait
 * happens here, not in a server function that would time out.
 */
export const queueConfig = {
  /** Give up only after this long. */
  maxWaitMs: 5 * 60 * 1000,
  /**
   * Tuned for tier 3 (50 images per minute), where a class of ~30 rarely hits
   * the limit at all, and the allowance refills within the minute when it
   * does — so waits are seconds, not the minutes a low tier would need.
   */
  minRetryMs: 3_000,
  maxRetryMs: 20_000,
  /** Spread retries so a class that pressed together doesn't collide again. */
  jitterMs: 3_000,
} as const;

export const storageKeys = {
  draft: "design_model_draft",
  history: "design_model_history",
} as const;
