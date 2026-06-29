import type { ImageSize } from "@/lib/config";

export type StylePreset = {
  id: string;
  name: string;
  description: string;
  category: string;
  systemPrompt: string;
  thumbnail?: string;
  referenceImages: string[];
  accentClass: string;
  forcedImageSize?: ImageSize;
  requiresProductName?: boolean;
  requiresProductDetail?: boolean;
};

const generatedReferenceBasePath = "/styles/generated-references/tiles";

function referencePath(id: string) {
  return `${generatedReferenceBasePath}/${id}-v2.jpg`;
}

function createReferencePreset({
  category,
  description,
  id,
  name,
  prompt,
}: {
  category: string;
  description: string;
  id: string;
  name: string;
  prompt: string;
}): StylePreset {
  const thumbnail = referencePath(id);

  return {
    id,
    name,
    description,
    category,
    systemPrompt: `Apply this visual direction: ${prompt}. Use the reference image as style evidence only, not as content evidence. Preserve the user's requested subject, details, setting, and intent.`,
    thumbnail,
    referenceImages: [thumbnail],
    accentClass: "bg-secondary",
  };
}

export const stylePresets: StylePreset[] = [
  {
    id: "none",
    name: "없음",
    description: "프롬프트만 반영",
    category: "기본",
    systemPrompt:
      "Follow the user's prompt directly. Do not apply a separate reference design style.",
    referenceImages: [],
    accentClass: "bg-muted",
  },
  createReferencePreset({
    id: "childrens-book-watercolor",
    name: "동화 수채화",
    description: "부드러운 색감의 그림책",
    category: "그림책",
    prompt:
      "children's book watercolor illustration, soft washes, gentle paper texture, warm whimsical mood",
  }),
  createReferencePreset({
    id: "woodcut-print",
    name: "목판화",
    description: "굵은 칼자국과 강한 명암",
    category: "판화",
    prompt:
      "woodcut print style, bold carved lines, high contrast ink texture, limited warm palette",
  }),
  createReferencePreset({
    id: "storybook-gouache",
    name: "구아슈 동화",
    description: "불투명한 물감과 포근한 질감",
    category: "그림책",
    prompt:
      "storybook gouache illustration, matte paint texture, cozy character design, charming details",
  }),
  createReferencePreset({
    id: "colored-pencil",
    name: "색연필",
    description: "색연필 결이 살아 있는 그림",
    category: "그림책",
    prompt:
      "colored pencil illustration, textured strokes, soft layered colors, gentle handmade look",
  }),
  createReferencePreset({
    id: "japanese-animation-2d",
    name: "2D 일본 애니",
    description: "선명한 선화와 감성적인 배경",
    category: "애니메이션",
    prompt:
      "2D Japanese animation style, clean line art, painted background, expressive cinematic lighting",
  }),
  createReferencePreset({
    id: "cel-anime",
    name: "셀 애니",
    description: "깔끔한 캐릭터와 밝은 색면",
    category: "애니메이션",
    prompt:
      "cel-shaded anime illustration, clean outlines, bright readable colors, warm emotional atmosphere",
  }),
  createReferencePreset({
    id: "claymation-miniature",
    name: "클레이 애니",
    description: "점토 인형 같은 입체감",
    category: "3D",
    prompt:
      "claymation stop-motion miniature, soft sculpted shapes, tactile handmade material, shallow depth of field",
  }),
  createReferencePreset({
    id: "rounded-3d-animation",
    name: "라운드 3D",
    description: "친근한 극장용 3D 애니",
    category: "3D",
    prompt:
      "rounded stylized 3D animation render, appealing proportions, polished materials, warm cinematic lighting",
  }),
  createReferencePreset({
    id: "photoreal-editorial",
    name: "실사 화보",
    description: "자연광과 선명한 디테일",
    category: "사진",
    prompt:
      "photorealistic editorial photography, natural light, refined composition, real-world textures",
  }),
  createReferencePreset({
    id: "studio-product-photo",
    name: "스튜디오 사진",
    description: "깔끔한 조명의 제품 사진",
    category: "사진",
    prompt:
      "clean studio photography, controlled soft lighting, sharp subject detail, premium material focus",
  }),
  {
    id: "product-hero-shot",
    name: "제품 히어로컷",
    description: "상세페이지 첫 화면용 16:9 대표 이미지",
    category: "제품 상세",
    systemPrompt:
      "Create an ecommerce product detail page hero shot. Use a forced wide 16:9 landscape composition, premium product photography, clear main product presence, polished studio styling, generous negative space, and a refined commercial finish. Use the reference image as product presentation evidence only, not as content evidence. Preserve the user's requested product concept, features, materials, and intent.",
    thumbnail: referencePath("product-hero-shot"),
    referenceImages: [referencePath("product-hero-shot")],
    accentClass: "bg-secondary",
    forcedImageSize: "1536x864",
    requiresProductName: true,
  },
  {
    id: "product-in-use-shot",
    name: "사용 장면컷",
    description: "제품이 실제로 쓰이는 생활 장면",
    category: "제품 상세",
    systemPrompt:
      "Create a realistic product-in-use scene for an ecommerce detail page. Show the product naturally used in context, with believable scale, clean surroundings, natural interaction, and clear product visibility. Use the reference image as product presentation evidence only, not as content evidence. Preserve the user's requested product concept, features, materials, and intent.",
    thumbnail: referencePath("product-in-use-shot"),
    referenceImages: [referencePath("product-in-use-shot")],
    accentClass: "bg-secondary",
  },
  {
    id: "product-detail-shot",
    name: "디테일컷",
    description: "재료와 기능을 가까이 보여주는 클로즈업",
    category: "제품 상세",
    systemPrompt:
      "Create a product detail close-up for an ecommerce detail page. Emphasize material, construction, key functional parts, surface texture, seams, buttons, openings, or other useful product details. Use macro product photography language with crisp feature clarity and controlled lighting. Use the reference image as product presentation evidence only, not as content evidence. Preserve the user's requested product concept, features, materials, and intent.",
    thumbnail: referencePath("product-detail-shot"),
    referenceImages: [referencePath("product-detail-shot")],
    accentClass: "bg-secondary",
    requiresProductDetail: true,
  },
  createReferencePreset({
    id: "cinematic-film-still",
    name: "영화 장면",
    description: "영화 스틸컷 같은 조명",
    category: "사진",
    prompt:
      "cinematic film still, dramatic lighting, filmic color grading, composed camera framing",
  }),
  createReferencePreset({
    id: "instant-film-photo",
    name: "인스턴트 필름",
    description: "아날로그 필름의 따뜻함",
    category: "사진",
    prompt:
      "nostalgic instant film photo, soft focus, analog grain, warm faded color, candid mood",
  }),
  createReferencePreset({
    id: "pop-art-poster",
    name: "팝아트 포스터",
    description: "강렬한 색과 그래픽 구성",
    category: "포스터",
    prompt:
      "bright pop art poster, bold shapes, saturated colors, playful graphic composition",
  }),
  createReferencePreset({
    id: "risograph-print",
    name: "리소그래프",
    description: "별색과 인쇄 질감",
    category: "판화",
    prompt:
      "risograph print style, vibrant spot colors, slight misregistration, grainy ink texture",
  }),
  createReferencePreset({
    id: "paper-cut-collage",
    name: "종이 콜라주",
    description: "오려 붙인 종이 레이어",
    category: "공예",
    prompt:
      "paper cut collage illustration, layered paper shapes, tactile shadows, handcrafted composition",
  }),
  createReferencePreset({
    id: "flat-vector",
    name: "플랫 벡터",
    description: "단순한 도형과 또렷한 색면",
    category: "그래픽",
    prompt:
      "flat vector illustration, clean geometric shapes, solid colors, simple modern composition",
  }),
  createReferencePreset({
    id: "editorial-illustration",
    name: "에디토리얼 일러스트",
    description: "기사 삽화 같은 세련된 표현",
    category: "그래픽",
    prompt:
      "modern editorial illustration, refined shapes, thoughtful composition, sophisticated color palette",
  }),
  createReferencePreset({
    id: "webtoon-clean",
    name: "웹툰",
    description: "깔끔한 선과 읽기 쉬운 색감",
    category: "만화",
    prompt:
      "clean Korean webtoon style, crisp line art, expressive characters, bright readable colors",
  }),
  createReferencePreset({
    id: "graphic-novel-ink",
    name: "그래픽노블",
    description: "묵직한 펜선과 극적인 명암",
    category: "만화",
    prompt:
      "western graphic novel ink style, strong linework, dramatic shading, cinematic panel energy",
  }),
  createReferencePreset({
    id: "manga-screentone",
    name: "망가 펜화",
    description: "흑백 선화와 스크린톤",
    category: "만화",
    prompt:
      "manga black-and-white ink style, screentone shading, dynamic composition, clean panel readability",
  }),
  createReferencePreset({
    id: "pixel-art",
    name: "픽셀아트",
    description: "레트로 게임 감성",
    category: "게임",
    prompt:
      "pixel art style, crisp low-resolution pixels, limited palette, retro game aesthetic",
  }),
  createReferencePreset({
    id: "isometric-game-art",
    name: "아이소메트릭 게임",
    description: "입체적인 게임 맵 느낌",
    category: "게임",
    prompt:
      "isometric game art, detailed tile-based scene, clean stylized lighting, readable environment design",
  }),
  createReferencePreset({
    id: "fantasy-concept",
    name: "판타지 콘셉트",
    description: "상상 세계의 장대한 분위기",
    category: "콘셉트",
    prompt:
      "fantasy concept art, imaginative worldbuilding, epic atmosphere, detailed environment design",
  }),
  createReferencePreset({
    id: "sci-fi-concept",
    name: "SF 콘셉트",
    description: "미래적인 공간과 장치",
    category: "콘셉트",
    prompt:
      "science fiction concept art, futuristic design, advanced technology, cinematic environment detail",
  }),
  createReferencePreset({
    id: "cozy-interior-render",
    name: "인테리어 렌더",
    description: "따뜻한 공간 시각화",
    category: "공간",
    prompt:
      "cozy interior architecture render, balanced room composition, natural light, refined decor",
  }),
  createReferencePreset({
    id: "scandinavian-lifestyle",
    name: "북유럽 라이프스타일",
    description: "정돈된 생활 사진 감성",
    category: "사진",
    prompt:
      "minimal Scandinavian lifestyle image, calm natural materials, clean composition, soft daylight",
  }),
  createReferencePreset({
    id: "bauhaus-poster",
    name: "바우하우스",
    description: "기하학적 형태와 질서",
    category: "포스터",
    prompt:
      "Bauhaus geometric poster style, primary shapes, disciplined layout, modernist visual rhythm",
  }),
  createReferencePreset({
    id: "art-nouveau",
    name: "아르누보",
    description: "곡선 장식과 식물 문양",
    category: "장식",
    prompt:
      "art nouveau decorative illustration, flowing organic lines, botanical ornament, elegant composition",
  }),
  createReferencePreset({
    id: "art-deco",
    name: "아르데코",
    description: "대칭과 고급스러운 장식",
    category: "장식",
    prompt:
      "art deco luxury illustration, symmetrical geometry, elegant ornament, polished glamorous mood",
  }),
  createReferencePreset({
    id: "surreal-collage",
    name: "초현실 콜라주",
    description: "꿈 같은 조합과 낯선 장면",
    category: "콘셉트",
    prompt:
      "surreal dreamlike collage, unexpected scale, poetic composition, atmospheric visual contrast",
  }),
  createReferencePreset({
    id: "low-poly-3d",
    name: "로우폴리 3D",
    description: "단순한 다각형과 산뜻한 색",
    category: "3D",
    prompt:
      "low poly 3D style, simplified geometric forms, clean colors, stylized lighting",
  }),
  createReferencePreset({
    id: "voxel-world",
    name: "복셀 월드",
    description: "블록 장난감 같은 3D 장면",
    category: "게임",
    prompt:
      "voxel toy world, blocky 3D forms, playful scale, colorful game-like environment",
  }),
  createReferencePreset({
    id: "needle-felt-craft",
    name: "니들펠트",
    description: "보송한 섬유 공예 질감",
    category: "공예",
    prompt:
      "needle-felt craft scene, fuzzy wool texture, handmade miniature feel, soft tactile lighting",
  }),
  createReferencePreset({
    id: "paper-diorama",
    name: "종이 디오라마",
    description: "작은 종이 무대 같은 장면",
    category: "공예",
    prompt:
      "paper diorama miniature, folded paper layers, crafted shadows, small theatrical scene",
  }),
  createReferencePreset({
    id: "ceramic-craft",
    name: "도자기 공예",
    description: "손맛 있는 유약과 흙 질감",
    category: "공예",
    prompt:
      "handmade ceramic craft style, glazed clay surface, rounded imperfect forms, tactile material detail, soft studio lighting",
  }),
  createReferencePreset({
    id: "stained-glass",
    name: "스테인드글라스",
    description: "빛나는 유리 조각 표현",
    category: "장식",
    prompt:
      "stained glass illustration, luminous colored glass pieces, lead outlines, decorative light",
  }),
  createReferencePreset({
    id: "embroidered-textile",
    name: "자수 일러스트",
    description: "실과 천의 촘촘한 질감",
    category: "공예",
    prompt:
      "embroidered textile illustration, visible thread texture, fabric surface, handcrafted detail",
  }),
  createReferencePreset({
    id: "oil-painting",
    name: "유화",
    description: "깊은 색과 붓터치",
    category: "회화",
    prompt:
      "oil painting story scene, rich brushwork, layered color, painterly depth and atmosphere",
  }),
  createReferencePreset({
    id: "acrylic-folk-art",
    name: "아크릴 민속화",
    description: "밝은 색과 장식적 화면",
    category: "회화",
    prompt:
      "acrylic folk art, vivid colors, decorative flat forms, cheerful handmade painting",
  }),
  createReferencePreset({
    id: "charcoal-sketch",
    name: "목탄 스케치",
    description: "거친 선과 부드러운 음영",
    category: "회화",
    prompt:
      "charcoal sketch, expressive dark lines, soft smudged shading, raw drawing texture",
  }),
  createReferencePreset({
    id: "ink-wash",
    name: "먹선 담채",
    description: "먹 번짐과 고요한 여백",
    category: "회화",
    prompt:
      "ink wash illustration, expressive brush lines, diluted color, calm atmospheric negative space",
  }),
  createReferencePreset({
    id: "natural-history-plate",
    name: "자연도감",
    description: "세밀한 관찰화와 담채",
    category: "회화",
    prompt:
      "vintage natural history plate illustration, refined ink outlines, delicate watercolor fills, careful observational detail, balanced specimen layout",
  }),
  createReferencePreset({
    id: "pastel-chalk",
    name: "파스텔",
    description: "분필 같은 부드러운 색감",
    category: "회화",
    prompt:
      "pastel chalk illustration, soft powdery texture, gentle blended colors, dreamy surface",
  }),
  createReferencePreset({
    id: "neon-cyberpunk",
    name: "네온 사이버펑크",
    description: "강한 네온 빛과 미래 도시",
    category: "콘셉트",
    prompt:
      "neon cyberpunk animation style, electric lighting, futuristic city mood, saturated night colors",
  }),
  createReferencePreset({
    id: "ui-mockup-illustration",
    name: "UI 목업",
    description: "앱 화면 같은 깔끔한 구성",
    category: "그래픽",
    prompt:
      "clean UI app mockup illustration, organized interface panels, modern digital product composition",
  }),
  createReferencePreset({
    id: "educational-infographic",
    name: "교육 인포그래픽",
    description: "정보가 잘 보이는 도식형",
    category: "그래픽",
    prompt:
      "educational infographic style, clear visual structure, simple icons, organized explanatory layout",
  }),
  createReferencePreset({
    id: "technical-blueprint",
    name: "설계도 드로잉",
    description: "정밀한 선과 도면 구도",
    category: "그래픽",
    prompt:
      "technical blueprint drawing style, precise thin blue ink linework, orthographic and perspective views, construction lines, clean drafting paper texture",
  }),
  createReferencePreset({
    id: "fashion-editorial",
    name: "패션 에디토리얼",
    description: "잡지 화보 같은 세련미",
    category: "사진",
    prompt:
      "fashion magazine editorial, refined styling, elegant pose, premium lighting, polished composition",
  }),
  createReferencePreset({
    id: "food-editorial",
    name: "푸드 화보",
    description: "음식과 식탁 질감 강조",
    category: "사진",
    prompt:
      "food magazine tabletop photography, appetizing texture, natural styling, soft directional light",
  }),
  createReferencePreset({
    id: "travel-postcard",
    name: "여행 엽서",
    description: "장소의 매력을 담은 그림",
    category: "포스터",
    prompt:
      "travel postcard illustration, scenic location, inviting composition, warm memorable color",
  }),
  createReferencePreset({
    id: "soft-focus-fairytale",
    name: "몽환 동화",
    description: "부드러운 초점과 꿈 같은 빛",
    category: "그림책",
    prompt:
      "dreamy soft-focus fairytale image, gentle glow, magical atmosphere, tender storybook composition",
  }),
];

export const styleCategories = [
  "전체",
  ...Array.from(new Set(stylePresets.map((style) => style.category))),
];

export function getStylePreset(styleId: string) {
  return stylePresets.find((style) => style.id === styleId);
}
