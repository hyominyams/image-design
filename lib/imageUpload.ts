import { uploadConfig } from "@/lib/config";

/**
 * Shrinks a picked image in the browser before it is sent.
 *
 * A phone photo is several megabytes, and the request carries it as base64,
 * which adds a third on top. Vercel refuses request bodies over 4.5MB, so
 * without this a student's own photo fails on the deployed site while working
 * fine locally. Smaller pictures also upload faster and cost less, and the
 * image model gets more resolution than it uses either way — the built-in
 * reference tiles are only 384x512.
 *
 * Encodes to JPEG on white: it is the safest input format, and transparency in
 * a reference picture is not worth the extra bytes.
 */

type EncodeStep = { edge: number; quality: number };

const steps: EncodeStep[] = [
  { edge: uploadConfig.maxImageEdge, quality: 0.82 },
  { edge: uploadConfig.maxImageEdge, quality: 0.7 },
  { edge: 1024, quality: 0.7 },
  { edge: 896, quality: 0.6 },
];

async function loadImage(file: File) {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // Safari can refuse some files here; fall through to the <img> path.
    }
  }

  const url = URL.createObjectURL(file);

  try {
    const image = new Image();
    image.src = url;
    await image.decode();

    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function drawToCanvas(
  source: ImageBitmap | HTMLImageElement,
  maxEdge: number,
) {
  const width = "naturalWidth" in source ? source.naturalWidth : source.width;
  const height = "naturalHeight" in source ? source.naturalHeight : source.height;
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  const canvas = document.createElement("canvas");

  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas 2D is unavailable.");
  }

  // JPEG has no alpha, so flatten onto white rather than onto black.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(source, 0, 0, canvas.width, canvas.height);

  return canvas;
}

function toDataUrl(canvas: HTMLCanvasElement, quality: number) {
  return canvas.toDataURL("image/jpeg", quality);
}

/** Roughly how many bytes a base64 data URL stands for. */
function byteLength(dataUrl: string) {
  return Math.ceil((dataUrl.length - dataUrl.indexOf(",") - 1) * 0.75);
}

export async function prepareUpload(file: File) {
  const source = await loadImage(file);
  let smallest = "";

  for (const step of steps) {
    const dataUrl = toDataUrl(drawToCanvas(source, step.edge), step.quality);

    smallest = dataUrl;

    if (byteLength(dataUrl) <= uploadConfig.targetUploadBytes) {
      break;
    }
  }

  if ("close" in source) {
    source.close();
  }

  return smallest;
}
