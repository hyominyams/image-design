import type { ImageSize } from "@/lib/config";

/**
 * A picture the student uploaded: their own drawing, or something they found.
 * The `note` is the only thing that tells the model how to use it.
 *
 * Library presets are not references — picking one is choosing a design,
 * so it is a single id with no note (see `DraftState.designId`).
 */
export type ReferenceItem = {
  id: string;
  /** Data URL of the uploaded file. */
  src: string;
  /** Original file name. */
  label: string;
  /** "이 이미지는 내가 그린 손 그림", "색감만 참고" — written by the student. */
  note: string;
};

export type GenerationRequest = {
  prompt: string;
  imageSize: ImageSize;
  references: {
    note: string;
    label: string;
    dataUrl: string;
  }[];
  /** Library preset chosen as the design direction, if any. */
  designId?: string;
};

/**
 * What the client reads from the API. The route also returns the enhanced
 * prompt for debugging in devtools; the UI deliberately never shows it.
 */
export type GenerationResponse = {
  success: boolean;
  imageBase64?: string;
  mimeType?: string;
  error?: string;
  /** "rate_limited" means the browser should wait and try the same request again. */
  code?: string;
  retryAfterSeconds?: number;
};

export type HistoryItem = {
  id: string;
  createdAt: string;
  prompt: string;
  imageSize: ImageSize;
  imageUrl: string;
  /** Upload file names and the design name, kept as a record of the inputs. */
  referenceLabels: string[];
};

export type DraftState = {
  prompt: string;
  imageSize: ImageSize;
  references: ReferenceItem[];
  designId: string | null;
};
