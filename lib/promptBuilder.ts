import { getLibraryPreset } from "@/lib/referenceLibrary";

/**
 * Prompt assembly.
 *
 * The student writes in Korean: a short prompt plus a free-form note under each
 * picture ("내가 그린 손 그림", "이 디자인만 참고"). Those notes are the only
 * thing that decides how each picture is used, so they are handed to the
 * enhancer verbatim and keyed to the position the image occupies in the request.
 */

export type PromptReference = {
  kind: "upload" | "library";
  label: string;
  note: string;
  presetId?: string;
};

export const enhancerSystemPrompt = `You turn a student's Korean image request into one precise English prompt for an image generation model.

You receive:
- The student's own description of what they want.
- A numbered list of reference images that will be attached to the request, in that exact order. Each one carries a note the student wrote about it.

Your job:
1. Read each reference's note and decide what that image contributes: the subject itself, the art style, the composition, the colour palette, a material, or a specific detail. The note wins. If a note says only the style should be borrowed, say explicitly that the sample's own subject and props must not be copied.
2. Write a single English prompt that describes the finished picture, then states per-reference instructions using the same numbering ("Reference 1", "Reference 2", ...).
3. Keep every concrete requirement the student asked for: subject, mood, colour, framing, and intended use.
4. Fill in useful visual specifics the student left out (lighting, camera angle, material, background) in a way that serves their intent. Do not invent a different subject.
5. If a note says a drawing is the student's own work, instruct the model to preserve that drawing's shapes, proportions and character, and to refine the execution rather than replace the design.

Rules for the output:
- Output only the prompt. No preamble, no markdown, no quotes, no explanation.
- Write in English, 120-220 words.
- Never request readable text, logos, signatures or watermarks unless the student explicitly asked for text. If they did, state exactly which text.
- Keep the result appropriate for a school audience: no violent, sexual or hateful content.
- Describe one coherent finished image, not a set of options.`;

export function buildEnhancerInput(
  prompt: string,
  references: PromptReference[],
) {
  const referenceBlock = references.length
    ? references
        .map((reference, index) => {
          const preset = reference.presetId
            ? getLibraryPreset(reference.presetId)
            : undefined;
          const lines = [
            `Reference ${index + 1} — ${
              reference.kind === "upload"
                ? "uploaded by the student"
                : `built-in sample "${reference.label}"`
            }`,
            `Student's note (Korean): ${reference.note.trim() || "(비어 있음)"}`,
          ];

          if (preset) {
            lines.push(`Sample's art direction: ${preset.direction}`);
          }

          return lines.join("\n");
        })
        .join("\n\n")
    : "No reference images are attached. Build the image from the description alone.";

  return `Student's description (Korean):
"""
${prompt.trim()}
"""

Reference images, in the order they are attached:
${referenceBlock}`;
}

/**
 * Used when the enhancer call fails, so a student still gets a picture.
 * Deliberately mechanical — it just restates the notes in a structured way.
 */
export function buildFallbackPrompt(
  prompt: string,
  references: PromptReference[],
) {
  const referenceLines = references.map((reference, index) => {
    const preset = reference.presetId
      ? getLibraryPreset(reference.presetId)
      : undefined;
    const note = reference.note.trim();
    const parts = [
      `Reference ${index + 1} (${
        reference.kind === "upload" ? "student's own image" : reference.label
      }):`,
      note ? `the student says "${note}".` : "use it as supporting context.",
    ];

    if (preset) {
      parts.push(
        `Apply this visual direction: ${preset.direction}. Do not copy the sample's own subject or props.`,
      );
    }

    return `- ${parts.join(" ")}`;
  });

  return `Create one coherent finished image for this request.

Student's request (translate and follow faithfully):
"${prompt.trim()}"

${
  referenceLines.length
    ? `Attached reference images, in order:\n${referenceLines.join("\n")}`
    : "No reference images are attached."
}

Rules:
- The student's request decides the subject and intent; references only support it.
- Do not add readable text, logos, signatures or watermarks unless the request explicitly asks for text.
- Keep the image appropriate for a school audience.
- Produce a polished, visually coherent result.`;
}
