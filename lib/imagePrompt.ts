import type { StylePreset } from "@/lib/stylePresets";

export function buildImagePrompt(
  style: StylePreset,
  prompt: string,
  options: { hasUploadedImage: boolean; hasReferenceImages: boolean },
) {
  return `${style.systemPrompt}

Priority order:
1. Follow the user's prompt for subject, scene, intent, required details, and any requested text.
2. Use the uploaded image only as a supporting visual reference when it helps fulfill the user's prompt.
3. Use the selected reference design only for style, medium, texture, lighting, rendering quality, and presentation.

Selected reference design: ${style.name} (${style.category}).
${options.hasUploadedImage ? "If an uploaded image is present, treat it as a user-provided reference. Keep only the parts that support the prompt, such as subject identity, pose, composition, color, texture, or object details. If the prompt conflicts with the uploaded image, follow the prompt." : "No user image was uploaded. Create the image directly from the prompt."}
${options.hasReferenceImages ? "The selected reference design image is a style sample with unrelated sample content. Do not copy or reuse the sample subject, character, book, cup, table, window, room layout, props, or composition unless the user prompt explicitly asks for them. Transfer the visual language, not the scene." : "No reference design was selected. Do not force a preset style beyond what the prompt requests."}
Create one coherent finished image for the user's requested use case.

User prompt:
"${prompt}"

Important rules:
- Do not add readable text, labels, logos, signatures, or watermarks unless the user explicitly requests text.
- If text is explicitly requested, render only the requested text and keep it legible.
- Keep the image appropriate for general audiences.
- Make the result polished, visually coherent, and faithful to the requested medium.
- Do not include violent, sexual, hateful, or inappropriate content.`;
}
