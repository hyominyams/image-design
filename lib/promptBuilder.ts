import type { LibraryPreset } from "@/lib/referenceLibrary";

/**
 * Prompt assembly.
 *
 * Only the student's uploads are attached as pictures, each with a Korean note
 * that decides how it is used ("내가 그린 손 그림", "색감만 참고"). Image
 * numbering in the prompt matches the order they are attached.
 *
 * A design chosen from the library is passed as words only — its `direction`.
 * Its tile is never attached: the image model copies what it sees, so the
 * sample's subject kept leaking into results.
 */

export type PromptUpload = {
  label: string;
  note: string;
};

export type PromptDesign = Pick<LibraryPreset, "name" | "direction">;

/** The fixed role of a chosen design, shared by the enhancer and the fallback. */
const designRule =
  "This is a style only. It decides how the picture is rendered (medium, technique, colour treatment, lighting, framing), never what is in it. The subject comes from the student's description and uploads.";

export const enhancerSystemPrompt = `You turn a student's Korean image request into one precise English prompt for an image generation model.

You receive:
- The student's own description of what they want.
- A numbered list of the student's uploaded images, in the order they are attached. Each carries a note the student wrote about how to use it.
- Optionally, one design style the student chose from a library, given as an English art direction. It is text only; no image of it is attached.

Your job:
1. For each upload, read its note and decide what that image contributes: the subject itself, the art style, the composition, the colour palette, a material, or a specific detail. The note wins. If a note says only the style should be borrowed, say explicitly that the image's own subject and props must not be copied.
2. If a design style is given, render the whole picture in that style. It sets only the look; the student's description and uploads set the content. Do not add objects, characters, products or scenes because a style name suggests them (a "product hero shot" style does not mean a lamp; a "picture book" style does not mean a child or an animal).
3. Write a single English prompt that describes the finished picture, then give per-image instructions using the same numbering ("Image 1", "Image 2", ...).
4. Keep every concrete requirement the student asked for: subject, mood, colour, framing and intended use.
5. Fill in useful visual specifics the student left out (lighting, camera angle, material, background) in a way that serves their intent. Do not invent a different subject.
6. If a note says a drawing is the student's own work, preserve that drawing's shapes, proportions and character, and refine the execution rather than replace the design.

Rules for the output:
- Output only the prompt. No preamble, no markdown, no quotes, no explanation.
- Write in English, 120-220 words.
- Never request readable text, logos, signatures or watermarks unless the student explicitly asked for text. If they did, state exactly which text.
- Keep the result appropriate for a school audience: no violent, sexual or hateful content.
- Describe one coherent finished image, not a set of options.`;

export function buildEnhancerInput(
  prompt: string,
  uploads: PromptUpload[],
  design: PromptDesign | null,
) {
  const lines = uploads.map(
    (upload, index) =>
      `Image ${index + 1} — uploaded by the student ("${upload.label}")\nStudent's note (Korean): ${upload.note.trim() || "(비어 있음)"}`,
  );

  const style = design
    ? `Design style chosen by the student ("${design.name}"):\n${design.direction}\n${designRule}`
    : "No design style chosen.";

  return `Student's description (Korean):
"""
${prompt.trim()}
"""

Uploaded images, in the order they are attached:
${lines.length ? lines.join("\n\n") : "None. Build the image from the description alone."}

${style}`;
}

/**
 * Used when the enhancer call fails, so a student still gets a picture.
 * Deliberately mechanical — it restates the inputs in a structured way.
 */
export function buildFallbackPrompt(
  prompt: string,
  uploads: PromptUpload[],
  design: PromptDesign | null,
) {
  const lines = uploads.map((upload, index) => {
    const note = upload.note.trim();

    return `- Image ${index + 1} (the student's upload): ${
      note ? `the student says "${note}".` : "use it as supporting context."
    }`;
  });

  return `Create one coherent finished image for this request.

Student's request (translate and follow faithfully):
"${prompt.trim()}"

${lines.length ? `Attached images, in order:\n${lines.join("\n")}` : "No images are attached."}
${design ? `\nVisual style: ${design.direction}. ${designRule}\n` : ""}
Rules:
- The student's request decides the subject and intent; images only support it.
- Do not add readable text, logos, signatures or watermarks unless the request explicitly asks for text.
- Keep the image appropriate for a school audience.
- Produce a polished, visually coherent result.`;
}
