import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import OpenAI, { APIError, toFile } from "openai";

import { defaultImageSize, generationConfig, imageSizeOptions } from "@/lib/config";
import { buildImagePrompt } from "@/lib/imagePrompt";
import { getStylePreset } from "@/lib/stylePresets";

export const runtime = "nodejs";
export const maxDuration = 120;

type GenerateImageRequest = {
  productDetailDescription?: string;
  productName?: string;
  uploadedImageBase64?: string;
  imageSize?: string;
  prompt?: string;
  studentDescription?: string;
  styleId?: string;
};

const dataUrlPattern = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/;
const defaultImageModel = "gpt-image-2";
const missingApiKeyError =
  "이미지 생성 설정이 필요합니다. OPENAI_API_KEY 환경 변수를 추가한 뒤 서버를 다시 시작해 주세요.";

function getImageModel() {
  return process.env.OPENAI_IMAGE_MODEL ?? defaultImageModel;
}

function getImageSize(imageSize?: string) {
  const selectedOption = imageSizeOptions.find((option) => option.value === imageSize);

  return selectedOption?.value ?? defaultImageSize;
}

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

function getOpenAIErrorMessage(error: unknown) {
  if (!(error instanceof APIError)) {
    return {
      status: 500,
      code: "image_generation_failed",
      message: "이미지 생성 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }

  if (error.status === 401) {
    return {
      status: 500,
      code: "invalid_api_key",
      message: "이미지 생성 설정을 확인해 주세요. API 키가 올바르지 않습니다.",
    };
  }

  if (error.status === 403) {
    return {
      status: 403,
      code: "image_model_forbidden",
      message:
        "이미지 생성 권한을 확인해 주세요. OpenAI 프로젝트 또는 조직 설정이 필요합니다.",
    };
  }

  if (error.status === 404) {
    return {
      status: 500,
      code: "image_model_not_found",
      message: "이미지 생성 모델을 찾을 수 없습니다. 배포된 모델 설정을 확인해 주세요.",
    };
  }

  if (error.status === 429) {
    return {
      status: 429,
      code: "rate_limited",
      message: "이미지 생성 요청이 많습니다. 잠시 후 다시 시도해 주세요.",
    };
  }

  if (error.status && error.status >= 500) {
    return {
      status: 502,
      code: "openai_unavailable",
      message: "OpenAI 서비스 응답이 불안정합니다. 잠시 후 다시 시도해 주세요.",
    };
  }

  return {
    status: 500,
    code: "openai_request_failed",
    message: "이미지 생성 요청을 처리하지 못했습니다. 입력 내용을 확인해 주세요.",
  };
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
    imageModel: getImageModel(),
  });
}

export async function POST(request: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      {
        success: false,
        code: "missing_api_key",
        error: missingApiKeyError,
      },
      { status: 500 },
    );
  }

  const body = (await request.json()) as GenerateImageRequest;
  const uploadedImage = body.uploadedImageBase64
    ? parseDataUrl(body.uploadedImageBase64)
    : null;
  const prompt = (body.prompt ?? body.studentDescription)?.trim() ?? "";
  const selectedStyle = getStylePreset(body.styleId ?? "none");
  const productName = body.productName?.trim() ?? "";
  const productDetailDescription = body.productDetailDescription?.trim() ?? "";
  const imageSize = selectedStyle?.forcedImageSize ?? getImageSize(body.imageSize);

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

  if (selectedStyle.requiresProductName && !productName) {
    return NextResponse.json(
      { success: false, error: "제품명을 입력해 주세요." },
      { status: 400 },
    );
  }

  if (selectedStyle.requiresProductDetail && !productDetailDescription) {
    return NextResponse.json(
      { success: false, error: "제품의 재료와 기능을 입력해 주세요." },
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

  const imageModel = getImageModel();
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
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
      productDetailDescription,
      productName,
    });

    const result =
      imageInputs.length > 0
        ? await openai.images.edit({
            image: imageInputs,
            model: imageModel,
            output_format: "png",
            prompt: imagePrompt,
            size: imageSize,
          })
        : await openai.images.generate({
            model: imageModel,
            output_format: "png",
            prompt: imagePrompt,
            size: imageSize,
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
    console.error("Image generation failed", {
      model: imageModel,
      error,
    });
    const openAIError = getOpenAIErrorMessage(error);

    return NextResponse.json(
      {
        success: false,
        code: openAIError.code,
        error: openAIError.message,
      },
      { status: openAIError.status },
    );
  }
}
