export type StylePreset = {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  thumbnail: string;
  referenceImages: string[];
  accentClass: string;
};

export const stylePresets: StylePreset[] = [
  {
    id: "real-product",
    name: "실물 제품 사진",
    description: "제품디자이너가 스튜디오에서 촬영한 완성품처럼",
    systemPrompt:
      "Transform the uploaded student design drawing into a realistic finished product prototype photo. Use the uploaded image as the core product concept. Preserve the main silhouette, important parts, colors, handles, openings, buttons, and unique identity from the student's design. Make it look like a real developed object placed in a clean studio product photo. Use safe, child-friendly, manufacturable materials such as soft plastic, rubber, fabric, wood, or metal when appropriate. Do not turn it into an unrelated fantasy illustration.",
    thumbnail: "/styles/real-product-03.png",
    referenceImages: [
      "/styles/real-product-01.png",
      "/styles/real-product-02.png",
      "/styles/real-product-03.png",
    ],
    accentClass: "bg-secondary",
  },
  {
    id: "prototype-3d",
    name: "3D 시제품 렌더",
    description: "개발자가 검토하는 3D 모델처럼",
    systemPrompt:
      "Transform the uploaded student design drawing into a polished 3D product prototype render. Preserve the main subject, shape, pose, colors, and important visual identity from the uploaded image. Make it look like a digital prototype that a product designer could review before manufacturing. Use rounded edges, clear materials, clean lighting, and a simple studio background. Keep the result appropriate for elementary school students.",
    thumbnail: "/styles/prototype-3d-01.png",
    referenceImages: [
      "/styles/prototype-3d-01.png",
      "/styles/prototype-3d-02.png",
      "/styles/prototype-3d-03.png",
    ],
    accentClass: "bg-ring",
  },
  {
    id: "in-use",
    name: "사용 장면",
    description: "학교나 생활 공간에서 쓰이는 제품처럼",
    systemPrompt:
      "Transform the uploaded student design drawing into a realistic scene showing the object being used in a friendly everyday environment. Preserve the designed object as the main focus and keep its important visual features recognizable. Show how the product might work or where it could be used, such as a classroom, desk, hallway, home, or playground, depending on the student's description. Avoid identifiable people and keep the scene safe and school-friendly.",
    thumbnail: "/styles/in-use-01.png",
    referenceImages: [
      "/styles/in-use-01.png",
      "/styles/in-use-02.png",
      "/styles/in-use-03.png",
    ],
    accentClass: "bg-primary",
  },
  {
    id: "architecture",
    name: "건축 공간 적용",
    description: "문, 벽, 공간 디자인으로 실제 시공된 모습처럼",
    systemPrompt:
      "Transform the uploaded student design drawing into a realistic architectural or interior design visualization. Treat the student's design as a door, portal, wall feature, small installation, furniture-like object, or spatial product when appropriate. Preserve the main design identity, shape, color, and important parts while showing how it could be used in a real school, classroom, library, hallway, playground, or public space. Make it feel buildable, inspiring, and connected to architecture or spatial design.",
    thumbnail: "/styles/architecture.png",
    referenceImages: [
      "/styles/architecture.png",
      "/styles/architecture-01.png",
      "/styles/architecture-02.png",
    ],
    accentClass: "bg-accent",
  },
  {
    id: "design-sheet",
    name: "디자인 개발 보드",
    description: "전문 디자이너의 아이디어 보드처럼",
    systemPrompt:
      "Transform the uploaded student design drawing into a clean product design concept sheet. Preserve the student's invention and show it as a manufacturable product idea with front and side views, material hints, and small visual detail callouts. Do not generate readable text. Use marker sketch, soft watercolor, and industrial design drawing aesthetics suitable for children.",
    thumbnail: "/styles/design-sheet-02.png",
    referenceImages: [
      "/styles/design-sheet-01.png",
      "/styles/design-sheet-02.png",
      "/styles/design-sheet-03.png",
    ],
    accentClass: "bg-muted-foreground",
  },
  {
    id: "exhibit",
    name: "전시 프레젠테이션",
    description: "디자인 전시회에 놓인 작품 모형처럼",
    systemPrompt:
      "Transform the uploaded student design drawing into a professional design exhibition presentation. Preserve the student's object or spatial idea and show it as a finished model, prototype, or architectural/product design piece on a clean pedestal, display table, or model base. Make the result feel suitable for a school design fair, invention exhibition, or architecture/product design portfolio. Do not generate readable text, logos, or brand names.",
    thumbnail: "/styles/exhibit-01.png",
    referenceImages: [
      "/styles/exhibit-01.png",
      "/styles/exhibit-02.png",
      "/styles/exhibit-03.png",
    ],
    accentClass: "bg-destructive",
  },
];

export function getStylePreset(styleId: string) {
  return stylePresets.find((style) => style.id === styleId);
}
