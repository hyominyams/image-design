import { NextRequest, NextResponse } from "next/server";

import { appCopy, fillCopy } from "@/lib/appContent";
import { defaultImageSize, generationConfig, imageSizeOptions, uploadConfig } from "@/lib/config";
import {
  buildEnhancerInput,
  buildFallbackPrompt,
  enhancerSystemPrompt,
  type PromptDesign,
  type PromptUpload,
} from "@/lib/promptBuilder";
import { getLibraryPreset } from "@/lib/referenceLibrary";
import {
  describeOpenAIError,
  getOpenAIClient,
  IMAGE_MODEL,
  readLibraryImage,
  readUploadedImage,
  TEXT_MODEL,
  UserFacingError,
} from "@/lib/server/openai";
import type { GenerationRequest } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 180;

function resolveImageSize(value: unknown) {
  return (
    imageSizeOptions.find((option) => option.value === value)?.value ??
    defaultImageSize
  );
}

/**
 * Rewrites the student's Korean request into a single English image prompt.
 * Never throws: if the text model is unavailable the caller falls back to a
 * locally assembled prompt so the student still gets a picture.
 */
async function enhancePrompt(
  client: NonNullable<ReturnType<typeof getOpenAIClient>>,
  prompt: string,
  uploads: PromptUpload[],
  design: PromptDesign | null,
) {
  try {
    const completion = await client.chat.completions.create({
      model: TEXT_MODEL,
      messages: [
        { role: "system", content: enhancerSystemPrompt },
        { role: "user", content: buildEnhancerInput(prompt, uploads, design) },
      ],
    });
    const enhanced = completion.choices[0]?.message?.content?.trim();

    if (!enhanced) {
      throw new Error("The enhancer returned an empty prompt.");
    }

    return { prompt: enhanced, fallback: false };
  } catch (error) {
    console.warn("Prompt enhancement failed, using the local fallback.", error);

    return {
      prompt: buildFallbackPrompt(prompt, uploads, design),
      fallback: true,
    };
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
    imageModel: IMAGE_MODEL,
    textModel: TEXT_MODEL,
  });
}

export async function POST(request: NextRequest) {
  const client = getOpenAIClient();

  if (!client) {
    return NextResponse.json(
      {
        success: false,
        code: "missing_api_key",
        error: appCopy.serverErrors.missingApiKey,
      },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => null)) as GenerationRequest | null;
  const prompt = body?.prompt?.trim() ?? "";
  const requestedReferences = body?.references ?? [];
  const imageSize = resolveImageSize(body?.imageSize);
  const design = body?.designId ? getLibraryPreset(body.designId) : null;

  if (!prompt) {
    return NextResponse.json(
      { success: false, error: appCopy.serverErrors.promptRequired },
      { status: 400 },
    );
  }

  if (prompt.length > generationConfig.maxPromptLength) {
    return NextResponse.json(
      { success: false, error: appCopy.serverErrors.promptTooLong },
      { status: 400 },
    );
  }

  if (body?.designId && !design) {
    return NextResponse.json(
      { success: false, error: appCopy.serverErrors.presetNotFound },
      { status: 400 },
    );
  }

  if (requestedReferences.length > uploadConfig.maxReferenceCount) {
    return NextResponse.json(
      {
        success: false,
        error: fillCopy(appCopy.serverErrors.tooManyReferences, {
          count: uploadConfig.maxReferenceCount,
        }),
      },
      { status: 400 },
    );
  }

  const uploads: PromptUpload[] = [];
  const imageInputs = [];

  try {
    for (const [index, reference] of requestedReferences.entries()) {
      if (!reference.dataUrl) {
        return NextResponse.json(
          { success: false, error: appCopy.serverErrors.uploadUnreadable },
          { status: 400 },
        );
      }

      uploads.push({
        label:
          reference.label ||
          fillCopy(appCopy.serverErrors.uploadFallbackLabel, { index: index + 1 }),
        note: (reference.note ?? "").slice(0, generationConfig.maxNoteLength),
      });
      imageInputs.push(
        await readUploadedImage(reference.dataUrl, `image-${index + 1}`),
      );
    }

    // The design always goes last, matching its number in the prompt.
    if (design) {
      imageInputs.push(
        await readLibraryImage(design.image, `image-${imageInputs.length + 1}`),
      );
    }
  } catch (error) {
    // Only messages written for students may reach the screen.
    if (error instanceof UserFacingError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 },
      );
    }

    console.error("Failed to prepare reference images", error);

    return NextResponse.json(
      { success: false, error: appCopy.serverErrors.referenceUnavailable },
      { status: 500 },
    );
  }

  if (imageInputs.length > generationConfig.maxInputImageCount) {
    return NextResponse.json(
      { success: false, error: appCopy.serverErrors.tooManyInputs },
      { status: 400 },
    );
  }

  const enhanced = await enhancePrompt(client, prompt, uploads, design ?? null);

  try {
    const result = imageInputs.length
      ? await client.images.edit({
          image: imageInputs,
          model: IMAGE_MODEL,
          output_format: "png",
          prompt: enhanced.prompt,
          size: imageSize,
        })
      : await client.images.generate({
          model: IMAGE_MODEL,
          output_format: "png",
          prompt: enhanced.prompt,
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
      // Not shown in the UI; kept so a teacher can see in devtools what the
      // model was actually asked for.
      enhancedPrompt: enhanced.prompt,
      enhancerFallback: enhanced.fallback,
    });
  } catch (error) {
    console.error("Image generation failed", { model: IMAGE_MODEL, error });
    const described = describeOpenAIError(error);

    return NextResponse.json(
      { success: false, code: described.code, error: described.message },
      { status: described.status },
    );
  }
}
