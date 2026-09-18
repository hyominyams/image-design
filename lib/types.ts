import type { ImageSize } from "@/lib/config";

/**
 * A single picture the student put on the table, whatever its origin.
 *
 * Uploads and library picks deliberately share one shape: the only thing that
 * tells the model how to treat a picture is the student's own `note`, not where
 * the file came from.
 */
export type ReferenceItem = {
  id: string;
  kind: "upload" | "library";
  /** Data URL for uploads, public path for library picks. */
  src: string;
  /** File name, or the library preset's Korean name. */
  label: string;
  /** "이 이미지는 내가 그린 손 그림", "이 디자인만 참고" — written by the student. */
  note: string;
  /** Set for library picks so the server can attach the preset's art direction. */
  presetId?: string;
};

export type GenerationRequest = {
  prompt: string;
  imageSize: ImageSize;
  references: {
    kind: ReferenceItem["kind"];
    note: string;
    label: string;
    /** Uploads send their data URL; library picks send only the preset id. */
    dataUrl?: string;
    presetId?: string;
  }[];
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
  code?: string;
};

export type HistoryItem = {
  id: string;
  createdAt: string;
  prompt: string;
  imageSize: ImageSize;
  imageUrl: string;
  /** Kept so a student can see which references produced a saved result. */
  referenceLabels: string[];
};

export type DraftState = {
  prompt: string;
  imageSize: ImageSize;
  references: ReferenceItem[];
};
