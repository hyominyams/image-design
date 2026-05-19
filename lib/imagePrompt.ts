import type { StylePreset } from "@/lib/stylePresets";

export function buildImagePrompt(style: StylePreset, studentDescription: string) {
  return `${style.systemPrompt}

Use the uploaded image as the main product design reference.
Preserve the main object, shape, pose, colors, important parts, and visual identity from the uploaded image.
The uploaded image and student description define the subject. They have priority over every reference image.
Use the selected style reference images only as examples of style, design quality, realism, material finish, lighting, camera angle, scale, and presentation.
The style reference images may show different subjects such as bags, bottles, chairs, doors, or interiors. Do not generate those subjects just because they appear in the references.
Blend the shared visual pattern across the style reference images instead of copying one reference image.
Do not copy the objects, layouts, colors, decorations, or exact shapes from the style reference images unless they already match the student's uploaded design.
Apply the selected product visualization style.
Make the result look like the student's idea has been developed into a real object or prototype.

Student description:
"${studentDescription}"

Important rules:
- Do not add text unless explicitly requested.
- Keep the image appropriate for elementary school students.
- Make the result polished and suitable for classroom product design presentation.
- Do not include violent, sexual, hateful, or inappropriate content.`;
}
