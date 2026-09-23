import { readFile, stat } from "node:fs/promises";
import { join, normalize, sep } from "node:path";
import OpenAI, { APIError, toFile } from "openai";

import { appCopy, fillCopy } from "@/lib/appContent";
import { generationConfig, uploadConfig } from "@/lib/config";

export const dataUrlPattern = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/;

/**
 * An error whose message is written for the student. Anything else thrown on
 * the server is an implementation detail and must not reach the screen — the
 * route used to forward raw messages like "Image file is too large." verbatim.
 */
export class UserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserFacingError";
  }
}

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new OpenAI({ apiKey });
}

/**
 * Models are fixed in code on purpose, not read from env: the prompts are
 * tuned for these models, and a stale deploy-time variable must not be able to
 * silently swap one in production. Change them here and redeploy.
 */
export const IMAGE_MODEL = "gpt-image-2.5-flare";

/** Rewrites the student's request. Any failure degrades to a local prompt. */
export const TEXT_MODEL = "gpt-5-mini";

export function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(dataUrlPattern);

  if (!match) {
    return null;
  }

  return { mimeType: match[1], base64: match[2] };
}

export function getImageExtension(mimeType: string) {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/webp") return "webp";
  return "png";
}

function getMimeTypeFromPath(filePath: string) {
  if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) {
    return "image/jpeg";
  }
  if (filePath.endsWith(".webp")) return "image/webp";
  return "image/png";
}

/** Reads a bundled library tile out of `public/`, refusing anything outside it. */
export async function readLibraryImage(publicPath: string, fileName: string) {
  const publicRoot = join(process.cwd(), "public");
  const resolved = normalize(join(publicRoot, publicPath.replace(/^\/+/, "")));

  if (!resolved.startsWith(publicRoot + sep)) {
    // A path outside public/ means tampered input or a broken preset; log it,
    // but tell the student only that the reference was unavailable.
    console.error("Reference path escapes the public directory", publicPath);
    throw new UserFacingError(appCopy.serverErrors.referenceUnavailable);
  }

  const stats = await stat(resolved);

  if (stats.size > generationConfig.maxLibraryImageBytes) {
    console.error("Library reference exceeds the size limit", publicPath);
    throw new UserFacingError(appCopy.serverErrors.referenceUnavailable);
  }

  const mimeType = getMimeTypeFromPath(resolved);

  return toFile(await readFile(resolved), `${fileName}.${getImageExtension(mimeType)}`, {
    type: mimeType,
  });
}

export async function readUploadedImage(dataUrl: string, fileName: string) {
  const parsed = parseDataUrl(dataUrl);

  if (!parsed) {
    throw new UserFacingError(appCopy.serverErrors.uploadUnreadable);
  }

  if (!uploadConfig.acceptedMimeTypes.includes(parsed.mimeType as never)) {
    throw new UserFacingError(appCopy.serverErrors.uploadInvalidType);
  }

  const buffer = Buffer.from(parsed.base64, "base64");

  if (buffer.byteLength > uploadConfig.maxFileSizeBytes) {
    throw new UserFacingError(
      fillCopy(appCopy.serverErrors.uploadTooLarge, {
        size: uploadConfig.maxFileSizeLabel,
      }),
    );
  }

  return toFile(buffer, `${fileName}.${getImageExtension(parsed.mimeType)}`, {
    type: parsed.mimeType,
  });
}

export function describeOpenAIError(error: unknown) {
  if (!(error instanceof APIError)) {
    return {
      status: 500,
      code: "image_generation_failed",
      message: appCopy.serverErrors.generic,
    };
  }

  if (error.status === 400) {
    return {
      status: 400,
      code: "rejected_request",
      message: appCopy.serverErrors.rejected,
    };
  }

  if (error.status === 401) {
    return {
      status: 500,
      code: "invalid_api_key",
      message: appCopy.serverErrors.invalidApiKey,
    };
  }

  if (error.status === 403) {
    return {
      status: 403,
      code: "forbidden",
      message: appCopy.serverErrors.forbidden,
    };
  }

  if (error.status === 404) {
    return {
      status: 500,
      code: "model_not_found",
      message: appCopy.serverErrors.modelNotFound,
    };
  }

  if (error.status === 429) {
    return {
      status: 429,
      code: "rate_limited",
      message: appCopy.serverErrors.rateLimited,
    };
  }

  if (error.status && error.status >= 500) {
    return {
      status: 502,
      code: "upstream_unavailable",
      message: appCopy.serverErrors.upstreamUnavailable,
    };
  }

  return {
    status: 500,
    code: "request_failed",
    message: appCopy.serverErrors.requestFailed,
  };
}
