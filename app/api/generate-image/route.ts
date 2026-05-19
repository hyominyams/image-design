import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import OpenAI, { toFile } from "openai";

import { generationConfig } from "@/lib/config";
import { buildImagePrompt } from "@/lib/imagePrompt";
import { getStylePreset } from "@/lib/stylePresets";

export const runtime = "nodejs";
export const maxDuration = 120;

type GenerateImageRequest = {
  uploadedImageBase64?: string;
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
  const studentDescription = body.studentDescription?.trim() ?? "";
  const selectedStyle = body.styleId ? getStylePreset(body.styleId) : null;

  if (!uploadedImage) {
    return NextResponse.json(
      { success: false, error: "A valid image file is required." },
      { status: 400 },
    );
  }

  if (!generationConfig.acceptedMimeTypes.includes(uploadedImage.mimeType as never)) {
    return NextResponse.json(
      { success: false, error: "Unsupported image type." },
      { status: 400 },
    );
  }

  if (!studentDescription) {
    return NextResponse.json(
      { success: false, error: "Student description is required." },
      { status: 400 },
    );
  }

  if (!selectedStyle) {
    return NextResponse.json(
      { success: false, error: "Selected style is invalid." },
      { status: 400 },
    );
  }

  const imageBuffer = Buffer.from(uploadedImage.base64, "base64");

  if (imageBuffer.byteLength > generationConfig.maxFileSizeBytes) {
    return NextResponse.json(
      { success: false, error: "Image file is too large." },
      { status: 400 },
    );
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const imageFile = await toFile(
    imageBuffer,
    `student-upload.${getImageExtension(uploadedImage.mimeType)}`,
    { type: uploadedImage.mimeType },
  );
  const styleReferenceFiles = await getStyleReferenceFiles(
    selectedStyle.referenceImages,
  );

  try {
    const result = await openai.images.edit({
      image: [imageFile, ...styleReferenceFiles],
      input_fidelity: "high",
      model: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1.5",
      output_format: "png",
      prompt: buildImagePrompt(selectedStyle, studentDescription),
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
