import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import OpenAI, { toFile } from "openai";

import { generationConfig } from "@/lib/config";
import { buildImagePrompt } from "@/lib/imagePrompt";
import { getStylePreset } from "@/lib/stylePresets";

export const runtime = "nodejs";
export const maxDuration = 120;

type GenerateImageRequest = {
  uploadedImageBase64?: string;
  prompt?: string;
  studentDescription?: string;
  styleId?: string;
};

const dataUrlPattern = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/;

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(dataUrlPattern);

  if (!match) {
    return null;
  }

  return {
    mimeType: match[1],
    base64: match[2],
  };
}

function getImageExtension(mimeType: string) {
  if (mimeType === "image/jpeg") {
    return "jpg";
  }

  if (mimeType === "image/webp") {
    return "webp";
  }

  return "png";
}

function getMimeTypeFromPath(filePath: string) {
  if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) {
    return "image/jpeg";
  }

  if (filePath.endsWith(".webp")) {
    return "image/webp";
  }

  return "image/png";
}

async function getStyleReferenceFile(imagePath: string) {
  const relativePath = imagePath.replace(/^\/+/, "");
  const referencePath = join(process.cwd(), "public", relativePath);
  const referenceStats = await stat(referencePath);

  if (referenceStats.size > generationConfig.maxReferenceFileSizeBytes) {
    throw new Error(`Style reference image is too large: ${imagePath}`);
  }

  const referenceBuffer = await readFile(referencePath);
  const mimeType = getMimeTypeFromPath(referencePath);

  return toFile(
    referenceBuffer,
    `style-reference.${getImageExtension(mimeType)}`,
    { type: mimeType },
  );
}

async function getStyleReferenceFiles(imagePaths: string[]) {
  return Promise.all(imagePaths.map((imagePath) => getStyleReferenceFile(imagePath)));
}

export async function POST(request: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { success: false, error: "OPENAI_API_KEY is not configured." },
      { status: 500 },
    );
  }

  const body = (await request.json()) as GenerateImageRequest;
  const uploadedImage = body.uploadedImageBase64
    ? parseDataUrl(body.uploadedImageBase64)
    : null;
  const prompt = (body.prompt ?? body.studentDescription)?.trim() ?? "";
  const selectedStyle = getStylePreset(body.styleId ?? "none");

  if (
    uploadedImage &&
    !generationConfig.acceptedMimeTypes.includes(uploadedImage.mimeType as never)
  ) {
    return NextResponse.json(
      { success: false, error: "Unsupported image type." },
      { status: 400 },
    );
  }

  if (!prompt) {
    return NextResponse.json(
      { success: false, error: "Prompt is required." },
      { status: 400 },
    );
  }

  if (!selectedStyle) {
    return NextResponse.json(
      { success: false, error: "Selected style is invalid." },
      { status: 400 },
    );
  }

  const imageBuffer = uploadedImage
    ? Buffer.from(uploadedImage.base64, "base64")
    : null;

  if (imageBuffer && imageBuffer.byteLength > generationConfig.maxFileSizeBytes) {
    return NextResponse.json(
      { success: false, error: "Image file is too large." },
      { status: 400 },
    );
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const imageFile =
    imageBuffer && uploadedImage
      ? await toFile(
          imageBuffer,
          `user-upload.${getImageExtension(uploadedImage.mimeType)}`,
          { type: uploadedImage.mimeType },
        )
      : null;
  const styleReferenceFiles = await getStyleReferenceFiles(
    selectedStyle.referenceImages,
  );
  const imageInputs = [
    ...(imageFile ? [imageFile] : []),
    ...styleReferenceFiles,
  ];

  if (imageInputs.length > generationConfig.maxInputImageCount) {
    return NextResponse.json(
      { success: false, error: "Too many reference images." },
      { status: 400 },
    );
  }
  const imagePrompt = buildImagePrompt(selectedStyle, prompt, {
    hasUploadedImage: Boolean(imageFile),
    hasReferenceImages: selectedStyle.referenceImages.length > 0,
  });

  try {
    const result =
      imageInputs.length > 0
        ? await openai.images.edit({
            image: imageInputs,
            input_fidelity: "high",
            model: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1.5",
            output_format: "png",
            prompt: imagePrompt,
            size: "1024x1024",
          })
        : await openai.images.generate({
            model: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1.5",
            output_format: "png",
            prompt: imagePrompt,
            size: "1024x1024",
          });
    const imageBase64 = result.data?.[0]?.b64_json;

    if (!imageBase64) {
      throw new Error("The image generation API did not return image data.");
    }

    return NextResponse.json({
      success: true,
      imageBase64,
      mimeType: "image/png",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { success: false, error: "이미지 생성에 실패했습니다." },
      { status: 500 },
    );
  }
}
