import type { ImageSize } from "@/lib/config";

/**
 * Reference library.
 *
 * Picking a preset is choosing a design direction for the result. It has no
 * note: the student describes only their own uploads. The preset's tile is
 * still sent to the image model, as a style/presentation sample.
 */

export type LibraryGroupId =
  | "product"
  | "graphic"
  | "photo"
  | "picturebook"
  | "comic"
  | "anime"
  | "painting"
  | "print"
  | "three-d"
  | "game"
  | "craft"
  | "poster"
  | "decor"
  | "concept"
  | "space";

export type LibraryGroup = {
  id: LibraryGroupId;
  label: string;
  /** Shown under the group heading in the library dialog. */
  hint: string;
};

export const libraryGroups: LibraryGroup[] = [
  { id: "product", label: "제품 상세", hint: "제품처럼 보여주는 컷. 말로 설명하기 어려운 것들이에요." },
  { id: "graphic", label: "그래픽", hint: "정보와 구조를 정리해서 보여줄 때." },
  { id: "photo", label: "사진", hint: "실제로 찍은 것처럼 보이는 결과." },
  { id: "picturebook", label: "그림책", hint: "부드럽고 손맛 있는 그림." },
  { id: "comic", label: "만화", hint: "인물과 장면이 또렷한 그림." },
  { id: "anime", label: "애니메이션", hint: "선이 또렷한 애니 화면." },
  { id: "painting", label: "회화", hint: "붓과 연필의 질감이 살아 있는 그림." },
  { id: "print", label: "판화", hint: "찍어낸 잉크의 질감." },
  { id: "three-d", label: "3D", hint: "입체감이 있는 그래픽." },
  { id: "game", label: "게임", hint: "게임 화면 같은 그래픽." },
  { id: "craft", label: "공예", hint: "실제 재료로 만든 듯한 질감." },
  { id: "poster", label: "포스터", hint: "면과 색으로 정리된 디자인." },
  { id: "decor", label: "장식", hint: "장식적인 패턴과 곡선." },
  { id: "concept", label: "콘셉트", hint: "상상 속 장면을 크게 그릴 때." },
  { id: "space", label: "공간", hint: "건물과 실내 공간." },
];

export type LibraryPreset = {
  id: string;
  name: string;
  /** One short line a student can scan quickly. */
  description: string;
  group: LibraryGroupId;
  /** English art direction handed to the prompt builder. */
  direction: string;
  /** Public path; also uploaded to the image model as a style reference. */
  image: string;
  /** Surfaced in the inline shortcut strip, outside the full library dialog. */
  featured?: boolean;
  /** Layouts that only read correctly at a particular aspect ratio. */
  suggestedSize?: ImageSize;
};

const imagePath = (id: string) => `/reference-library/${id}.jpg`;

function preset(
  input: Omit<LibraryPreset, "image"> & { image?: string },
): LibraryPreset {
  return { ...input, image: input.image ?? imagePath(input.id) };
}


export const libraryPresets: LibraryPreset[] = [
  preset({
    id: "product-hero-shot",
    name: "제품 히어로컷",
    description: "상세페이지 첫 화면용 16:9 대표 이미지",
    group: "product",
    featured: true,
    suggestedSize: "1536x864",
    direction:
      "ecommerce product detail page hero shot, forced wide 16:9 landscape composition, premium product photography, clear main product presence, polished studio styling, generous negative space, refined commercial finish",
  }),
  // No suggestedSize: a packshot works at any ratio, so the student picks it.
  preset({
    id: "product-packshot",
    name: "제품 단독컷",
    description: "배경 없이 제품만 보여주는 누끼컷",
    group: "product",
    featured: true,
    direction:
      "ecommerce product packshot, the product alone on a seamless pure white background, no props, no scene, no surface edge, whole product fully visible and centered with even margins that fit the requested canvas ratio, soft even studio lighting, subtle contact shadow only, true-to-life color and material, crisp catalog-ready edges",
  }),
  preset({
    id: "product-in-use-shot",
    name: "사용 장면컷",
    description: "제품이 실제로 쓰이는 생활 장면",
    group: "product",
    featured: true,
    direction:
      "realistic product-in-use scene, the product naturally used in context, believable scale, clean surroundings, natural interaction, clear product visibility",
  }),
  preset({
    id: "product-detail-shot",
    name: "디테일컷",
    description: "재료와 기능을 가까이 보여주는 클로즈업",
    group: "product",
    featured: true,
    direction:
      "product detail close-up, emphasis on material, construction, key functional parts, surface texture, seams and openings, macro product photography with crisp feature clarity and controlled lighting",
  }),
  preset({
    id: "flat-vector",
    name: "플랫 벡터",
    description: "단순한 도형과 또렷한 색면",
    group: "graphic",
    featured: true,
    direction:
      "flat vector illustration, clean geometric shapes, solid colors, simple modern composition",
  }),
  preset({
    id: "ui-mockup-illustration",
    name: "UI 목업",
    description: "앱 화면 같은 깔끔한 구성",
    group: "graphic",
    direction:
      "clean UI app mockup illustration, organized interface panels, modern digital product composition",
  }),
  preset({
    id: "educational-infographic",
    name: "교육 인포그래픽",
    description: "정보가 잘 보이는 도식형",
    group: "graphic",
    direction:
      "educational infographic style, clear visual structure, simple icons, organized explanatory layout",
  }),
  preset({
    id: "technical-blueprint",
    name: "설계도 드로잉",
    description: "정밀한 선과 도면 구도",
    group: "graphic",
    direction:
      "technical blueprint drawing style, precise thin blue ink linework, orthographic and perspective views, construction lines, clean drafting paper texture",
  }),
  preset({
    id: "photoreal-editorial",
    name: "실사 화보",
    description: "자연광과 선명한 디테일",
    group: "photo",
    direction:
      "photorealistic editorial photography, natural light, refined composition, real-world textures",
  }),
  preset({
    id: "studio-product-photo",
    name: "스튜디오 사진",
    description: "깔끔한 조명의 제품 사진",
    group: "photo",
    direction:
      "clean studio photography, controlled soft lighting, sharp subject detail, premium material focus",
  }),
  preset({
    id: "cinematic-film-still",
    name: "영화 장면",
    description: "영화 스틸컷 같은 조명",
    group: "photo",
    direction:
      "cinematic film still, dramatic lighting, filmic color grading, composed camera framing",
  }),
  preset({
    id: "instant-film-photo",
    name: "인스턴트 필름",
    description: "아날로그 필름의 따뜻함",
    group: "photo",
    direction:
      "nostalgic instant film photo, soft focus, analog grain, warm faded color, candid mood",
  }),
  preset({
    id: "childrens-book-watercolor",
    name: "동화 수채화",
    description: "부드러운 색감의 그림책",
    group: "picturebook",
    featured: true,
    direction:
      "children's book watercolor illustration, soft washes, gentle paper texture, warm whimsical mood",
  }),
  preset({
    id: "colored-pencil",
    name: "색연필",
    description: "색연필 결이 살아 있는 그림",
    group: "picturebook",
    direction:
      "colored pencil illustration, textured strokes, soft layered colors, gentle handmade look",
  }),
  preset({
    id: "webtoon-clean",
    name: "웹툰",
    description: "깔끔한 선과 읽기 쉬운 색감",
    group: "comic",
    direction:
      "clean Korean webtoon style, crisp line art, expressive characters, bright readable colors",
  }),
  preset({
    id: "graphic-novel-ink",
    name: "그래픽노블",
    description: "묵직한 펜선과 극적인 명암",
    group: "comic",
    direction:
      "western graphic novel ink style, strong linework, dramatic shading, cinematic panel energy",
  }),
  preset({
    id: "japanese-animation-2d",
    name: "2D 일본 애니",
    description: "선명한 선화와 감성적인 배경",
    group: "anime",
    featured: true,
    direction:
      "2D Japanese animation style, clean line art, painted background, expressive cinematic lighting",
  }),
  preset({
    id: "oil-painting",
    name: "유화",
    description: "깊은 색과 붓터치",
    group: "painting",
    direction:
      "oil painting story scene, rich brushwork, layered color, painterly depth and atmosphere",
  }),
  preset({
    id: "charcoal-sketch",
    name: "목탄 스케치",
    description: "거친 선과 부드러운 음영",
    group: "painting",
    direction:
      "charcoal sketch, expressive dark lines, soft smudged shading, raw drawing texture",
  }),
  preset({
    id: "ink-wash",
    name: "먹선 담채",
    description: "먹 번짐과 고요한 여백",
    group: "painting",
    direction:
      "ink wash illustration, expressive brush lines, diluted color, calm atmospheric negative space",
  }),
  preset({
    id: "natural-history-plate",
    name: "자연도감",
    description: "세밀한 관찰화와 담채",
    group: "painting",
    direction:
      "vintage natural history plate illustration, refined ink outlines, delicate watercolor fills, careful observational detail, balanced specimen layout",
  }),
  preset({
    id: "woodcut-print",
    name: "목판화",
    description: "굵은 칼자국과 강한 명암",
    group: "print",
    direction:
      "woodcut print style, bold carved lines, high contrast ink texture, limited warm palette",
  }),
  preset({
    id: "risograph-print",
    name: "리소그래프",
    description: "별색과 인쇄 질감",
    group: "print",
    direction:
      "risograph print style, vibrant spot colors, slight misregistration, grainy ink texture",
  }),
  preset({
    id: "claymation-miniature",
    name: "클레이 애니",
    description: "점토 인형 같은 입체감",
    group: "three-d",
    featured: true,
    direction:
      "claymation stop-motion miniature, soft sculpted shapes, tactile handmade material, shallow depth of field",
  }),
  preset({
    id: "rounded-3d-animation",
    name: "라운드 3D",
    description: "친근한 극장용 3D 애니",
    group: "three-d",
    direction:
      "rounded stylized 3D animation render, appealing proportions, polished materials, warm cinematic lighting",
  }),
  preset({
    id: "low-poly-3d",
    name: "로우폴리 3D",
    description: "단순한 다각형과 산뜻한 색",
    group: "three-d",
    direction:
      "low poly 3D style, simplified geometric forms, clean colors, stylized lighting",
  }),
  preset({
    id: "pixel-art",
    name: "픽셀아트",
    description: "레트로 게임 감성",
    group: "game",
    direction:
      "pixel art style, crisp low-resolution pixels, limited palette, retro game aesthetic",
  }),
  preset({
    id: "isometric-game-art",
    name: "아이소메트릭 게임",
    description: "입체적인 게임 맵 느낌",
    group: "game",
    direction:
      "isometric game art, detailed tile-based scene, clean stylized lighting, readable environment design",
  }),
  preset({
    id: "paper-cut-collage",
    name: "종이 콜라주",
    description: "오려 붙인 종이 레이어",
    group: "craft",
    direction:
      "paper cut collage illustration, layered paper shapes, tactile shadows, handcrafted composition",
  }),
  preset({
    id: "needle-felt-craft",
    name: "니들펠트",
    description: "보송한 섬유 공예 질감",
    group: "craft",
    direction:
      "needle-felt craft scene, fuzzy wool texture, handmade miniature feel, soft tactile lighting",
  }),
  preset({
    id: "ceramic-craft",
    name: "도자기 공예",
    description: "손맛 있는 유약과 흙 질감",
    group: "craft",
    direction:
      "handmade ceramic craft style, glazed clay surface, rounded imperfect forms, tactile material detail, soft studio lighting",
  }),
  preset({
    id: "embroidered-textile",
    name: "자수 일러스트",
    description: "실과 천의 촘촘한 질감",
    group: "craft",
    direction:
      "embroidered textile illustration, visible thread texture, fabric surface, handcrafted detail",
  }),
  preset({
    id: "pop-art-poster",
    name: "팝아트 포스터",
    description: "강렬한 색과 그래픽 구성",
    group: "poster",
    direction:
      "bright pop art poster, bold shapes, saturated colors, playful graphic composition",
  }),
  preset({
    id: "bauhaus-poster",
    name: "바우하우스",
    description: "기하학적 형태와 질서",
    group: "poster",
    direction:
      "Bauhaus geometric poster style, primary shapes, disciplined layout, modernist visual rhythm",
  }),
  preset({
    id: "art-deco",
    name: "아르데코",
    description: "대칭과 고급스러운 장식",
    group: "decor",
    direction:
      "art deco luxury illustration, symmetrical geometry, elegant ornament, polished glamorous mood",
  }),
  preset({
    id: "stained-glass",
    name: "스테인드글라스",
    description: "빛나는 유리 조각 표현",
    group: "decor",
    direction:
      "stained glass illustration, luminous colored glass pieces, lead outlines, decorative light",
  }),
  preset({
    id: "fantasy-concept",
    name: "판타지 콘셉트",
    description: "상상 세계의 장대한 분위기",
    group: "concept",
    direction:
      "fantasy concept art, imaginative worldbuilding, epic atmosphere, detailed environment design",
  }),
  preset({
    id: "sci-fi-concept",
    name: "SF 콘셉트",
    description: "미래적인 공간과 장치",
    group: "concept",
    direction:
      "science fiction concept art, futuristic design, advanced technology, cinematic environment detail",
  }),
  preset({
    id: "surreal-collage",
    name: "초현실 콜라주",
    description: "꿈 같은 조합과 낯선 장면",
    group: "concept",
    direction:
      "surreal dreamlike collage, unexpected scale, poetic composition, atmospheric visual contrast",
  }),
  preset({
    id: "cozy-interior-render",
    name: "인테리어 렌더",
    description: "따뜻한 공간 시각화",
    group: "space",
    direction:
      "cozy interior architecture render, balanced room composition, natural light, refined decor",
  }),
];

export const featuredPresets = libraryPresets.filter((item) => item.featured);

export function getLibraryPreset(id: string) {
  return libraryPresets.find((item) => item.id === id);
}

export function getLibraryGroup(id: LibraryGroupId) {
  return libraryGroups.find((group) => group.id === id);
}

/** Groups that actually have presets, in the order declared above. */
export function getPopulatedGroups() {
  return libraryGroups
    .map((group) => ({
      group,
      presets: libraryPresets.filter((item) => item.group === group.id),
    }))
    .filter((entry) => entry.presets.length > 0);
}

export function searchLibrary(query: string) {
  const term = query.trim().toLowerCase();

  if (!term) {
    return libraryPresets;
  }

  return libraryPresets.filter((item) =>
    [item.name, item.description, getLibraryGroup(item.group)?.label ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(term),
  );
}
