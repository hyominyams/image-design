"use client";

import Image from "next/image";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  GalleryHorizontal,
  HelpCircle,
  Home,
  ImagePlus,
  Loader2,
  Lock,
  Palette,
  Settings,
  Sparkles,
  Upload,
  User,
  X,
} from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { appCopy } from "@/lib/appContent";
import {
  defaultImageSize,
  generationConfig,
  imageSizeOptions,
  uploadConfig,
  type ImageSize,
} from "@/lib/config";
import { guideCopy } from "@/lib/guideContent";
import {
  addGeneratedImageHistory,
  getAppDraftState,
  getGeneratedImageHistory,
  getGenerationUsage,
  saveAppDraftState,
  setGenerationUsage,
  type AppDraftState,
  type GeneratedImageHistoryItem,
  type GenerationUsage,
} from "@/lib/localStorage";
import { StylePreset, styleCategories, stylePresets } from "@/lib/stylePresets";
import { cn } from "@/lib/utils";

type GeneratedImageResponse = {
  success: boolean;
  imageBase64?: string;
  mimeType?: string;
  error?: string;
};

type UploadedImage = {
  dataUrl: string;
  name: string;
};

type AppPage = "home" | "step-1" | "step-2" | "step-3" | "step-4";

const pageOrder: AppPage[] = ["home", "step-1", "step-2", "step-3", "step-4"];
const steps = [
  {
    page: "step-1" as const,
    label: "Upload & Prompt",
    icon: ImagePlus,
    description: "이미지와 프롬프트를 준비하세요.",
  },
  {
    page: "step-2" as const,
    label: "AI Reference",
    icon: Palette,
    description: "원하는 시각 방향을 선택하세요.",
  },
  {
    page: "step-3" as const,
    label: "Generating",
    icon: Sparkles,
    description: "결과를 생성하고 확인하세요.",
  },
  {
    page: "step-4" as const,
    label: "Gallery",
    icon: GalleryHorizontal,
    description: "완성 이미지를 보관하세요.",
  },
];

const studioAssets = {
  hero: "/studio/studio-showroom-hero.png",
  materialBoard: "/studio/studio-material-board.png",
  emptyPreview: "/studio/studio-empty-preview.png",
  livingPreview: "/studio/showroom-living-preview.png",
} as const;

function getActiveNavId(currentPage: AppPage) {
  if (currentPage === "step-1") {
    return "upload";
  }

  if (currentPage === "step-2") {
    return "styles";
  }

  if (currentPage === "step-3") {
    return "result";
  }

  if (currentPage === "step-4") {
    return "gallery";
  }

  return "";
}

function createDownloadFileName() {
  const timestamp = new Date()
    .toISOString()
    .replaceAll("-", "")
    .replace("T", "-")
    .slice(0, 15);

  return `ai-generated-image-${timestamp}.png`;
}

function getBase64ImageUrl(imageBase64: string, mimeType = "image/png") {
  return `data:${mimeType};base64,${imageBase64}`;
}

function readImageFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function saveImage(imageUrl: string, fileName = createDownloadFileName()) {
  const anchor = document.createElement("a");
  anchor.href = imageUrl;
  anchor.download = fileName;
  anchor.click();
}

function getPageFromHash(): AppPage {
  if (typeof window === "undefined") {
    return "home";
  }

  const hash = window.location.hash.replace("#", "");
  return pageOrder.includes(hash as AppPage) ? (hash as AppPage) : "home";
}

export function ImageGenerationApp() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasLoadedDraftRef = useRef(false);
  const [page, setPage] = useState<AppPage>("home");
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [studentDescription, setStudentDescription] = useState("");
  const [productName, setProductName] = useState("");
  const [productDetailDescription, setProductDetailDescription] = useState("");
  const [selectedImageSize, setSelectedImageSize] = useState<ImageSize>(defaultImageSize);
  const [selectedStyleId, setSelectedStyleId] = useState(stylePresets[0]?.id ?? "");
  const [generationUsage, setGenerationUsageState] = useState<GenerationUsage>({
    date: "",
    count: 0,
    extraCount: 0,
  });
  const [history, setHistory] = useState<GeneratedImageHistoryItem[]>([]);
  const [generatedImageUrl, setGeneratedImageUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const selectedStyle = useMemo(
    () => stylePresets.find((style) => style.id === selectedStyleId),
    [selectedStyleId],
  );
  const totalGenerationLimit = generationConfig.maxCount + generationUsage.extraCount;
  const remainingCount = Math.max(totalGenerationLimit - generationUsage.count, 0);
  const hasReachedLimit = generationUsage.count >= totalGenerationLimit;
  const canOpenStyleStep = Boolean(studentDescription.trim());
  const hasRequiredProductName = !selectedStyle?.requiresProductName || Boolean(productName.trim());
  const hasRequiredProductDetail =
    !selectedStyle?.requiresProductDetail || Boolean(productDetailDescription.trim());
  const canOpenGenerateStep = Boolean(
    canOpenStyleStep && selectedStyle && hasRequiredProductName && hasRequiredProductDetail,
  );

  useEffect(() => {
    document.documentElement.classList.remove("dark");
    window.localStorage.setItem(generationConfig.storageKeys.theme, "light");

    const syncGenerationUsage = () => {
      const savedUsage = getGenerationUsage();
      setGenerationUsage(savedUsage);
      setGenerationUsageState(savedUsage);
    };

    const syncPageFromHash = () => {
      setPage(getPageFromHash());
    };

    const frameId = window.requestAnimationFrame(() => {
      syncPageFromHash();
      syncGenerationUsage();
      void getGeneratedImageHistory().then(setHistory);
      void getAppDraftState().then((draft) => {
        if (!draft) {
          hasLoadedDraftRef.current = true;
          return;
        }

        const restoredStyle = stylePresets.find((style) => style.id === draft.selectedStyleId);
        const restoredStyleId =
          stylePresets.some((style) => style.id === draft.selectedStyleId)
            ? draft.selectedStyleId
            : stylePresets[0]?.id || "";

        setUploadedImages(draft.uploadedImages);
        setStudentDescription(draft.studentDescription);
        setProductName(draft.productName);
        setProductDetailDescription(draft.productDetailDescription);
        setSelectedImageSize(restoredStyle?.forcedImageSize ?? draft.selectedImageSize);
        setSelectedStyleId(restoredStyleId);
        setGeneratedImageUrl(draft.generatedImageUrl);
        hasLoadedDraftRef.current = true;
      });
    });

    const usageIntervalId = window.setInterval(syncGenerationUsage, 60_000);

    window.addEventListener("hashchange", syncPageFromHash);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearInterval(usageIntervalId);
      window.removeEventListener("hashchange", syncPageFromHash);
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedDraftRef.current) {
      return;
    }

    const draft: AppDraftState = {
      uploadedImages,
      studentDescription,
      productName,
      productDetailDescription,
      selectedImageSize,
      selectedStyleId,
      generatedImageUrl,
    };
    const timeoutId = window.setTimeout(() => {
      void saveAppDraftState(draft);
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    generatedImageUrl,
    productDetailDescription,
    productName,
    selectedImageSize,
    selectedStyleId,
    studentDescription,
    uploadedImages,
  ]);

  function goToPage(nextPage: AppPage) {
    setPage(nextPage);
    if (nextPage === "home") {
      window.history.pushState(null, "", "/");
    } else {
      window.location.hash = nextPage;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    setErrorMessage("");
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      return;
    }

    setErrorMessage("");
    setStatusMessage("");

    if (uploadedImages.length + files.length > generationConfig.maxUploadImageCount) {
      setErrorMessage(`이미지는 최대 ${generationConfig.maxUploadImageCount}장까지 추가할 수 있습니다.`);
      event.target.value = "";
      return;
    }

    if (files.some((file) => !generationConfig.acceptedMimeTypes.includes(file.type as never))) {
      setErrorMessage(appCopy.errors.invalidFileType);
      event.target.value = "";
      return;
    }

    if (files.some((file) => file.size > generationConfig.maxFileSizeBytes)) {
      setErrorMessage(appCopy.errors.fileTooLarge);
      event.target.value = "";
      return;
    }

    const nextImages = await Promise.all(
      files.map(async (file) => ({
        dataUrl: await readImageFile(file),
        name: file.name,
      })),
    );
    setUploadedImages((currentImages) =>
      [...currentImages, ...nextImages].slice(0, generationConfig.maxUploadImageCount),
    );
    event.target.value = "";
  }

  function handleRemoveUploadedImage(index: number) {
    setUploadedImages((currentImages) =>
      currentImages.filter((_, imageIndex) => imageIndex !== index),
    );
    setErrorMessage("");
  }

  function validateStepOne() {
    if (!studentDescription.trim()) {
      return appCopy.errors.descriptionRequired;
    }

    return "";
  }

  function validateGenerate() {
    const stepOneError = validateStepOne();

    if (stepOneError) {
      return stepOneError;
    }

    if (!selectedStyle) {
      return appCopy.errors.styleRequired;
    }

    if (selectedStyle.requiresProductName && !productName.trim()) {
      return appCopy.errors.productNameRequired;
    }

    if (
      selectedStyle.requiresProductDetail &&
      !productDetailDescription.trim()
    ) {
      return appCopy.errors.productDetailRequired;
    }

    if (hasReachedLimit) {
      return appCopy.errors.limitReached;
    }

    return "";
  }

  function handleSelectStyle(styleId: string) {
    const nextStyle = stylePresets.find((style) => style.id === styleId);

    setSelectedStyleId(styleId);
    setErrorMessage("");

    if (nextStyle?.forcedImageSize) {
      setSelectedImageSize(nextStyle.forcedImageSize);
    }
  }

  async function handleGenerate() {
    const validationError = validateGenerate();

    if (validationError || !selectedStyle) {
      setErrorMessage(validationError);
      setStatusMessage("");
      return;
    }

    setIsGenerating(true);
    setErrorMessage("");
    setStatusMessage(appCopy.actions.generating);

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productDetailDescription: productDetailDescription.trim(),
          productName: productName.trim(),
          uploadedImageBase64s: uploadedImages.map((image) => image.dataUrl),
          imageSize: selectedStyle.forcedImageSize ?? selectedImageSize,
          prompt: studentDescription.trim(),
          styleId: selectedStyle.id,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | GeneratedImageResponse
        | null;

      if (!response.ok || !result?.success || !result.imageBase64) {
        throw new Error(result?.error ?? appCopy.errors.generationFailed);
      }

      const imageUrl = getBase64ImageUrl(result.imageBase64, result.mimeType);
      const nextUsage = {
        ...generationUsage,
        count: generationUsage.count + 1,
      };
      const historyItem = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        styleId: selectedStyle.id,
        studentDescription: studentDescription.trim(),
        imageUrl,
      };

      setGenerationUsage(nextUsage);
      setGenerationUsageState(nextUsage);
      setHistory(await addGeneratedImageHistory(historyItem));
      setGeneratedImageUrl(imageUrl);
      setStatusMessage("완성 이미지가 보관함에 저장되었어요.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : appCopy.errors.generationFailed,
      );
      setStatusMessage("");
    } finally {
      setIsGenerating(false);
    }
  }

  function handleRequestExtraCount(password: string) {
    if (password !== generationConfig.extraRequestPassword) {
      return {
        success: false,
        message: "암호가 맞지 않습니다.",
      };
    }

    const remainingExtraCount =
      generationConfig.maxExtraCount - generationUsage.extraCount;

    if (remainingExtraCount <= 0) {
      return {
        success: false,
        message: "오늘 받을 수 있는 추가 횟수를 모두 받았습니다.",
      };
    }

    const nextUsage = {
      ...generationUsage,
      extraCount: generationUsage.extraCount + remainingExtraCount,
    };

    setGenerationUsage(nextUsage);
    setGenerationUsageState(nextUsage);

    return {
      success: true,
      message: `추가 횟수 ${remainingExtraCount}회가 추가되었습니다.`,
    };
  }

  return (
    <main className="studio-shell min-h-screen p-3 sm:p-4">
      <div className="mx-auto grid h-[calc(100dvh-1.5rem)] min-h-[680px] w-full max-w-[1540px] overflow-hidden rounded-xl border border-[var(--studio-line)] bg-[#fffdfa]/82 shadow-[var(--studio-shadow-md)] sm:h-[calc(100dvh-2rem)] lg:grid-cols-[132px_minmax(0,1fr)]">
        <StudioSidebar currentPage={page} onNavigate={goToPage} />
        <section className="min-h-0 min-w-0 overflow-y-auto border-t border-[var(--studio-line)] bg-[#fffdfa]/72 lg:border-l lg:border-t-0">
          <AppHeader
            currentPage={page}
            onGuideOpen={() => setIsGuideOpen(true)}
            remainingCount={remainingCount}
            totalGenerationLimit={totalGenerationLimit}
          />

          <div className="min-w-0 p-4 sm:p-6 lg:p-8">
            {page === "home" && (
              <HomePage
                history={history}
                onGuideOpen={() => setIsGuideOpen(true)}
                onStart={() => goToPage("step-1")}
                selectedStyle={selectedStyle}
              />
            )}

            {page !== "home" && page !== "step-4" && (
              <CreateWorkspace
                canOpenGenerateStep={canOpenGenerateStep}
                canOpenStyleStep={canOpenStyleStep}
                errorMessage={errorMessage}
                fileInputRef={fileInputRef}
                generatedImageUrl={generatedImageUrl}
                hasReachedLimit={hasReachedLimit}
                isGenerating={isGenerating}
                onFileChange={handleFileChange}
                onGenerate={handleGenerate}
                onGuideOpen={() => setIsGuideOpen(true)}
                onRemoveUploadedImage={handleRemoveUploadedImage}
                onRequestExtraCount={handleRequestExtraCount}
                onSelectStyle={handleSelectStyle}
                productDetailDescription={productDetailDescription}
                productName={productName}
                remainingCount={remainingCount}
                selectedImageSize={selectedImageSize}
                selectedStyle={selectedStyle}
                selectedStyleId={selectedStyleId}
                setProductDetailDescription={(description) => {
                  setProductDetailDescription(description);
                  setErrorMessage("");
                }}
                setProductName={(name) => {
                  setProductName(name);
                  setErrorMessage("");
                }}
                setSelectedImageSize={setSelectedImageSize}
                setStudentDescription={(description) => {
                  setStudentDescription(description);
                  setErrorMessage("");
                }}
                statusMessage={statusMessage}
                studentDescription={studentDescription}
                totalGenerationLimit={totalGenerationLimit}
                uploadedImages={uploadedImages}
              />
            )}

            {page === "step-4" && (
              <StepFourPage
                generatedImageUrl={generatedImageUrl}
                history={history}
                onSelectSaved={setGeneratedImageUrl}
              />
            )}
          </div>
        </section>
      </div>

      {isGuideOpen && <GuideModal onClose={() => setIsGuideOpen(false)} />}
    </main>
  );
}

function StudioSidebar({
  currentPage,
  onNavigate,
}: {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
}) {
  const isHomeActive = currentPage === "home";
  const isCreateActive = currentPage !== "home" && currentPage !== "step-4";
  const isGalleryActive = currentPage === "step-4";

  return (
    <aside className="flex h-20 shrink-0 flex-row items-center gap-2 overflow-x-auto bg-[#fffdfa]/84 px-3 py-3 lg:h-auto lg:min-h-0 lg:flex-col lg:items-stretch lg:overflow-visible lg:px-3 lg:py-5">
      <button
        className="flex shrink-0 items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-semibold text-[var(--studio-subtle)]"
        onClick={() => onNavigate("home")}
        type="button"
      >
        <Home className="size-4 text-[var(--studio-clay)]" />
        <span className="whitespace-nowrap text-xs font-bold">Showroom AI</span>
      </button>

      <nav className="flex gap-2 lg:mt-8 lg:flex-col" aria-label="사이드바">
        <button
          className={cn(
            "flex h-11 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-bold transition-colors",
            isHomeActive
              ? "bg-[#f3eadf] text-[var(--studio-clay)]"
              : "text-[var(--studio-subtle)] hover:bg-[#f3eadf]/72",
          )}
          onClick={() => onNavigate("home")}
          onPointerEnter={(event) => {
            if (event.pointerType === "mouse" && !isHomeActive) {
              onNavigate("home");
            }
          }}
          type="button"
        >
          <Home className="size-4" />
          Home
        </button>
        <button
          className={cn(
            "flex h-11 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-bold transition-colors",
            isCreateActive
              ? "bg-[#f3eadf] text-[var(--studio-clay)]"
              : "text-[var(--studio-subtle)] hover:bg-[#f3eadf]/72",
          )}
          onClick={() => onNavigate("step-1")}
          type="button"
        >
          <ImagePlus className="size-4" />
          Create
        </button>
        <button
          className={cn(
            "flex h-11 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-bold transition-colors",
            isGalleryActive
              ? "bg-[#f3eadf] text-[var(--studio-clay)]"
              : "text-[var(--studio-subtle)] hover:bg-[#f3eadf]/72",
          )}
          onClick={() => onNavigate("step-4")}
          type="button"
        >
          <GalleryHorizontal className="size-4" />
          Gallery
        </button>
        <button
          className="flex h-11 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-bold text-[var(--studio-subtle)] transition-colors hover:bg-[#f3eadf]/72"
          onClick={() => onNavigate("home")}
          type="button"
        >
          <User className="size-4" />
          Profile
        </button>
      </nav>

      <button
        className="mt-0 flex h-11 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-bold text-[var(--studio-subtle)] transition-colors hover:bg-[#f3eadf]/72 lg:mt-auto"
        onClick={() => onNavigate("home")}
        type="button"
      >
        <Settings className="size-4" />
        Settings
      </button>
    </aside>
  );
}

function AppHeader({
  currentPage,
  onGuideOpen,
  remainingCount,
  totalGenerationLimit,
}: {
  currentPage: AppPage;
  onGuideOpen: () => void;
  remainingCount: number;
  totalGenerationLimit: number;
}) {
  const activeNavId = getActiveNavId(currentPage);
  const title =
    currentPage === "step-4"
      ? "Gallery"
      : currentPage === "home"
        ? "Showroom AI"
        : "AI 이미지 만들기";
  const subtitle =
    currentPage === "step-4"
      ? "생성된 이미지를 보관하고 다시 확인하세요."
      : currentPage === "home"
        ? "프롬프트와 레퍼런스로 이미지를 만드세요."
        : "이미지, 프롬프트, 레퍼런스를 한 화면에서 선택하세요.";

  return (
    <header className="flex flex-col gap-4 border-b border-[var(--studio-line)] bg-[#fffdfa]/72 px-4 py-4 sm:px-6 lg:flex-row lg:items-start lg:justify-between lg:px-8 lg:py-6">
      <div>
        <h1 className="text-balance text-2xl font-normal leading-tight text-[var(--studio-ink)] sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-[var(--studio-subtle)]">
          {subtitle}
        </p>
      </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="studio-chip rounded-md px-3 py-2 text-sm font-bold">
            남은 횟수 {remainingCount}/{totalGenerationLimit}
          </span>
          <button
            className="studio-button-secondary inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-bold transition-colors"
            onClick={onGuideOpen}
            type="button"
          >
            <HelpCircle className="size-4" />
            프롬프트 도움
          </button>
          <span className="flex size-10 items-center justify-center rounded-full border border-[var(--studio-line)] bg-[#fffdfa] text-sm font-extrabold text-[var(--studio-ink)]">
            S
          </span>
        </div>
      {activeNavId && (
        <div className="sr-only" aria-live="polite">
          {activeNavId}
        </div>
      )}
    </header>
  );
}

function HomePage({
  history,
  onGuideOpen,
  onStart,
  selectedStyle,
}: {
  history: GeneratedImageHistoryItem[];
  onGuideOpen: () => void;
  onStart: () => void;
  selectedStyle?: StylePreset;
}) {
  const recentHistory = history.slice(0, 5);

  return (
    <section className="space-y-5">
      <div className="studio-frame relative isolate overflow-hidden rounded-xl">
        <Image
          alt=""
          aria-hidden="true"
          className="absolute inset-0 -z-20 h-full w-full object-cover opacity-[0.18]"
          height={920}
          priority
          src={studioAssets.hero}
          width={1280}
        />
        <div className="absolute inset-0 -z-10 bg-[#fffdfa]/86" />

        <div className="grid min-h-[620px] gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_430px] lg:p-7">
          <div className="flex min-w-0 flex-col gap-4">
            <div className="relative min-h-[440px] flex-1 overflow-hidden rounded-lg border border-[var(--studio-line)] bg-[#fffdfa]/68 shadow-[var(--studio-shadow-xs)]">
              <Image
                alt="밝은 쇼룸 작업 공간"
                className="h-full w-full object-cover"
                fill
                priority
                sizes="(min-width: 1024px) calc(100vw - 620px), 100vw"
                src={studioAssets.hero}
              />
              <div className="absolute left-4 top-4 flex max-w-[calc(100%-2rem)] flex-wrap items-center gap-2">
                {appCopy.nav.slice(0, 4).map((item) => (
                  <span
                    className="rounded-md border border-[var(--studio-line)] bg-[#fffdfa]/86 px-3 py-1.5 text-sm font-bold text-[var(--studio-subtle)] shadow-[var(--studio-shadow-xs)]"
                    key={item.id}
                  >
                    {item.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-lg border border-[var(--studio-line)] bg-[#fffdfa]/76 p-3 shadow-[var(--studio-shadow-xs)] sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-bold leading-6 text-[var(--studio-subtle)]">
                프롬프트와 레퍼런스를 준비하고 바로 생성하세요.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
              <button
                className="studio-button-primary inline-flex h-11 min-h-11 items-center justify-center gap-2 rounded-md px-5 text-sm font-extrabold transition-transform hover:-translate-y-0.5"
                onClick={onStart}
                type="button"
              >
                작업 시작 <ArrowRight className="size-4" />
              </button>
              <button
                className="studio-button-secondary inline-flex h-11 min-h-11 items-center justify-center gap-2 rounded-md px-5 text-sm font-bold transition-colors"
                onClick={onGuideOpen}
                type="button"
              >
                <HelpCircle className="size-4" />
                프롬프트 도움
              </button>
              </div>
            </div>
          </div>

          <aside className="grid min-w-0 grid-rows-[auto_auto_1fr] gap-3">
            <div className="overflow-hidden rounded-lg border border-[var(--studio-line)] bg-[#fffdfa]/82 p-3 shadow-[var(--studio-shadow-xs)]">
              <Image
                alt="스튜디오 재료 보드"
                className="aspect-[4/3] w-full rounded-md object-cover"
                height={520}
                priority
                src={studioAssets.materialBoard}
                width={520}
              />
              <div className="mt-3 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-[var(--studio-clay)]">현재 레퍼런스</p>
                  <p className="mt-1 text-pretty text-lg font-extrabold">
                    {selectedStyle?.name ?? "레퍼런스 선택"}
                  </p>
                </div>
                <Palette className="mt-1 size-5 shrink-0 text-[var(--studio-sage)]" />
              </div>
            </div>

            <div className="rounded-lg border border-[var(--studio-line)] bg-[#fffdfa]/82 p-4 shadow-[var(--studio-shadow-xs)]">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-extrabold">최근 작업</h3>
                <span className="text-xs font-bold text-[var(--studio-subtle)]">
                  {recentHistory.length}/5
                </span>
              </div>
              {recentHistory.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
                  {recentHistory.map((item) => (
                    <Image
                      alt="최근 완성 이미지"
                      className="aspect-square rounded-md border border-[var(--studio-line)] object-cover"
                      height={180}
                      key={item.id}
                      src={item.imageUrl}
                      unoptimized
                      width={180}
                    />
                  ))}
                </div>
              ) : (
                <div className="studio-paper flex min-h-32 items-center justify-center rounded-md p-4 text-center">
                  <p className="text-sm font-bold leading-6 text-[var(--studio-subtle)]">
                    완성 이미지가 여기에 저장됩니다
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-[var(--studio-line)] bg-[#fffdfa]/72 p-4">
                <p className="text-sm font-bold text-[var(--studio-clay)]">레퍼런스</p>
                <p className="mt-1 text-lg font-extrabold">52개</p>
              </div>
              <div className="rounded-lg border border-[var(--studio-line)] bg-[#fffdfa]/72 p-4">
                <p className="text-sm font-bold text-[var(--studio-teal)]">보관함</p>
                <p className="mt-1 text-lg font-extrabold">최근 5개</p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className="grid gap-3 rounded-xl border border-[var(--studio-line)] bg-[#fffdfa]/64 p-3 md:grid-cols-2">
        {steps.map((step, index) => {
          const Icon = step.icon;

          return (
            <div
              className="rounded-lg border border-[var(--studio-line)] bg-[#fffdfa]/74 p-4"
              key={step.page}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="flex size-9 items-center justify-center rounded-md bg-[var(--studio-paper)] text-[var(--studio-sage)]">
                  <Icon className="size-5" />
                </span>
                <span className="rounded-md border border-[var(--studio-line)] bg-[#fffdfa]/78 px-3 py-1 text-xs font-bold text-[var(--studio-clay)]">
                  STEP {index + 1}
                </span>
              </div>
              <h3 className="mt-4 text-balance text-lg font-extrabold">{step.label}</h3>
              <p className="mt-2 text-pretty text-sm font-semibold leading-6 text-[var(--studio-subtle)]">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CreateWorkspace({
  canOpenGenerateStep,
  canOpenStyleStep,
  errorMessage,
  fileInputRef,
  generatedImageUrl,
  hasReachedLimit,
  isGenerating,
  onFileChange,
  onGenerate,
  onGuideOpen,
  onRemoveUploadedImage,
  onRequestExtraCount,
  onSelectStyle,
  productDetailDescription,
  productName,
  remainingCount,
  selectedImageSize,
  selectedStyle,
  selectedStyleId,
  setProductDetailDescription,
  setProductName,
  setSelectedImageSize,
  setStudentDescription,
  statusMessage,
  studentDescription,
  totalGenerationLimit,
  uploadedImages,
}: {
  canOpenGenerateStep: boolean;
  canOpenStyleStep: boolean;
  errorMessage: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  generatedImageUrl: string;
  hasReachedLimit: boolean;
  isGenerating: boolean;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onGenerate: () => void;
  onGuideOpen: () => void;
  onRemoveUploadedImage: (index: number) => void;
  onRequestExtraCount: (password: string) => {
    success: boolean;
    message: string;
  };
  onSelectStyle: (styleId: string) => void;
  productDetailDescription: string;
  productName: string;
  remainingCount: number;
  selectedImageSize: ImageSize;
  selectedStyle?: StylePreset;
  selectedStyleId: string;
  setProductDetailDescription: (description: string) => void;
  setProductName: (name: string) => void;
  setSelectedImageSize: (imageSize: ImageSize) => void;
  setStudentDescription: (description: string) => void;
  statusMessage: string;
  studentDescription: string;
  totalGenerationLimit: number;
  uploadedImages: UploadedImage[];
}) {
  const [isReferenceLightboxOpen, setIsReferenceLightboxOpen] = useState(false);
  const [isExtraRequestOpen, setIsExtraRequestOpen] = useState(false);
  const [extraPassword, setExtraPassword] = useState("");
  const [extraRequestError, setExtraRequestError] = useState("");
  const [extraRequestMessage, setExtraRequestMessage] = useState("");
  const selectedImageSizeValue = selectedStyle?.forcedImageSize ?? selectedImageSize;
  const hasMaxExtraCount =
    totalGenerationLimit >= generationConfig.maxCount + generationConfig.maxExtraCount;
  const uploadSlots = Array.from({ length: generationConfig.maxUploadImageCount });

  function handleExtraSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!extraPassword.trim()) {
      setExtraRequestError("암호를 입력해 주세요.");
      setExtraRequestMessage("");
      return;
    }

    const result = onRequestExtraCount(extraPassword.trim());

    if (result.success) {
      setExtraRequestMessage(result.message);
      setExtraRequestError("");
      setExtraPassword("");
      setIsExtraRequestOpen(false);
      return;
    }

    setExtraRequestError(result.message);
    setExtraRequestMessage("");
  }

  return (
    <>
      <section className="space-y-4">
        <div className="studio-toolbar sticky top-0 z-20 flex flex-wrap items-center gap-2 rounded-xl p-2">
          {[
            { label: "입력", active: true, complete: canOpenStyleStep },
            { label: "레퍼런스", active: canOpenStyleStep, complete: Boolean(selectedStyle) },
            { label: "생성", active: canOpenGenerateStep, complete: Boolean(generatedImageUrl) },
          ].map((item, index) => (
            <div
              className={cn(
                "flex h-11 items-center gap-2 rounded-md border px-3 text-sm font-extrabold",
                item.active
                  ? "border-[var(--studio-line-strong)] bg-[#fffdfa] text-[var(--studio-ink)]"
                  : "border-[var(--studio-line)] bg-[#f3eadf]/52 text-[var(--studio-subtle)]",
              )}
              key={item.label}
            >
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-xs",
                  item.complete
                    ? "bg-[var(--studio-ink)] text-[#fffaf3]"
                    : "bg-[var(--studio-panel-soft)] text-[var(--studio-subtle)]",
                )}
              >
                {item.complete ? <CheckCircle2 className="size-4" /> : index + 1}
              </span>
              {item.label}
              {index < 2 && <ArrowRight className="size-4 text-[var(--studio-subtle)]" />}
            </div>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
          <Panel title="작업 입력" subtitle="이미지, 프롬프트, 레퍼런스를 한 화면에서 선택하세요.">
            <input
              accept={uploadConfig.acceptAttribute}
              className="hidden"
              multiple
              onChange={onFileChange}
              ref={fileInputRef}
              type="file"
            />

            <div className="grid gap-5">
              <section>
                <div className="mb-3 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="text-base font-extrabold text-[var(--studio-ink)]">
                      이미지 첨부
                    </h3>
                    <p className="mt-1 text-sm font-bold text-[var(--studio-subtle)]">
                      {uploadedImages.length}/{generationConfig.maxUploadImageCount}
                    </p>
                  </div>
                  <SecondaryButton
                    className="h-10 px-3 sm:w-auto"
                    disabled={uploadedImages.length >= generationConfig.maxUploadImageCount}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImagePlus className="size-4" />
                    이미지 추가
                  </SecondaryButton>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  {uploadSlots.map((_, index) => {
                    const uploadedImage = uploadedImages[index];

                    return (
                      <div
                        className={cn(
                          "relative flex aspect-[4/3] min-h-36 overflow-hidden rounded-lg border bg-[var(--studio-paper)]",
                          uploadedImage
                            ? "border-[var(--studio-line-strong)]"
                            : "border-dashed border-[var(--studio-line)]",
                        )}
                        key={index}
                      >
                        {uploadedImage ? (
                          <>
                            <Image
                              alt={`첨부 이미지 ${index + 1}`}
                              className="h-full w-full object-contain p-2"
                              height={320}
                              src={uploadedImage.dataUrl}
                              unoptimized
                              width={420}
                            />
                            <span className="absolute left-2 top-2 rounded-md bg-[#fffdfa]/90 px-2 py-1 text-xs font-extrabold text-[var(--studio-ink)]">
                              이미지 {index + 1}
                            </span>
                            <button
                              aria-label={`첨부 이미지 ${index + 1} 삭제`}
                              className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-md bg-[var(--studio-ink)] text-[#fffaf3]"
                              onClick={() => onRemoveUploadedImage(index)}
                              type="button"
                            >
                              <X className="size-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            className="flex h-full w-full flex-col items-center justify-center gap-3 p-4 text-center text-[var(--studio-subtle)] transition-colors hover:bg-[#fffdfa]/64"
                            onClick={() => fileInputRef.current?.click()}
                            type="button"
                          >
                            <Upload className="size-7" />
                            <span className="text-sm font-extrabold">
                              이미지 {index + 1}
                            </span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="grid gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-base font-extrabold text-[var(--studio-ink)]">
                    프롬프트
                  </h3>
                  <button
                    className="text-sm font-bold text-[var(--studio-clay)] underline underline-offset-4"
                    onClick={onGuideOpen}
                    type="button"
                  >
                    프롬프트 도움
                  </button>
                </div>
                <textarea
                  className="studio-focus min-h-40 w-full rounded-md border border-[var(--studio-line)] bg-[var(--studio-paper)] p-4 text-base font-semibold leading-7 placeholder:text-[var(--studio-subtle)]"
                  maxLength={500}
                  onChange={(event) => setStudentDescription(event.target.value)}
                  placeholder="만들고 싶은 장면을 적어 주세요."
                  value={studentDescription}
                />
                <p className="text-right text-sm font-bold text-[var(--studio-subtle)]">
                  {studentDescription.length}/500
                </p>
              </section>

              <section>
                <h3 className="mb-3 text-base font-extrabold text-[var(--studio-ink)]">
                  이미지 비율
                </h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {imageSizeOptions.map((option) => (
                    <button
                      aria-pressed={selectedImageSizeValue === option.value}
                      className={cn(
                        "h-12 rounded-md border px-3 text-sm font-extrabold transition-colors",
                        selectedImageSizeValue === option.value
                          ? "border-[var(--studio-ink)] bg-[var(--studio-ink)] text-[#fffaf3]"
                          : "border-[var(--studio-line)] bg-[#fffdfa]/72 text-[var(--studio-subtle)] hover:bg-[#f3eadf]",
                        selectedStyle?.forcedImageSize && selectedStyle.forcedImageSize !== option.value
                          ? "cursor-not-allowed opacity-45"
                          : "",
                      )}
                      disabled={Boolean(
                        selectedStyle?.forcedImageSize &&
                          selectedStyle.forcedImageSize !== option.value,
                      )}
                      key={option.value}
                      onClick={() => setSelectedImageSize(option.value)}
                      type="button"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <div className="mb-3 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="text-base font-extrabold text-[var(--studio-ink)]">
                      레퍼런스
                    </h3>
                    <p className="mt-1 text-sm font-bold text-[var(--studio-subtle)]">
                      1개 선택
                    </p>
                  </div>
                  <SecondaryButton
                    className="h-10 px-3 sm:w-auto"
                    onClick={() => setIsReferenceLightboxOpen(true)}
                  >
                    <Palette className="size-4" />
                    레퍼런스 선택
                  </SecondaryButton>
                </div>

                <button
                  className="grid w-full gap-3 rounded-lg border border-[var(--studio-line)] bg-[var(--studio-paper)] p-3 text-left transition-colors hover:border-[var(--studio-teal)] md:grid-cols-[160px_minmax(0,1fr)]"
                  onClick={() => setIsReferenceLightboxOpen(true)}
                  type="button"
                >
                  {selectedStyle?.thumbnail ? (
                    <Image
                      alt={`${selectedStyle.name} 레퍼런스`}
                      className="aspect-[4/3] w-full rounded-md object-cover"
                      height={160}
                      src={selectedStyle.thumbnail}
                      width={220}
                    />
                  ) : (
                    <div className="flex aspect-[4/3] items-center justify-center rounded-md border border-[var(--studio-line)] bg-[#fffdfa]/72 text-[var(--studio-subtle)]">
                      <Palette className="size-10" />
                    </div>
                  )}
                  <div className="min-w-0 self-center">
                    <p className="text-sm font-bold text-[var(--studio-clay)]">
                      {selectedStyle?.category ?? "레퍼런스"}
                    </p>
                    <p className="mt-1 text-xl font-extrabold text-[var(--studio-ink)]">
                      {selectedStyle?.name ?? "선택 없음"}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-[var(--studio-subtle)]">
                      {selectedStyle?.description ?? "결과에 적용할 시각 방향을 선택하세요."}
                    </p>
                  </div>
                </button>

                {selectedStyle &&
                  (selectedStyle.requiresProductName || selectedStyle.requiresProductDetail) && (
                    <div className="mt-3 grid gap-3 rounded-lg border border-[var(--studio-line)] bg-[#fffdfa]/58 p-4">
                      {selectedStyle.requiresProductName && (
                        <label className="block">
                          <span className="text-sm font-extrabold text-[var(--studio-ink)]">
                            제품명
                          </span>
                          <input
                            className="studio-focus mt-2 h-11 w-full rounded-md border border-[var(--studio-line)] bg-[var(--studio-paper)] px-3 text-sm font-bold text-[var(--studio-ink)] placeholder:text-[var(--studio-subtle)]"
                            maxLength={60}
                            onChange={(event) => setProductName(event.target.value)}
                            placeholder="예: 모듈형 스마트 책상 조명"
                            value={productName}
                          />
                        </label>
                      )}
                      {selectedStyle.requiresProductDetail && (
                        <label className="block">
                          <span className="text-sm font-extrabold text-[var(--studio-ink)]">
                            제품 디테일
                          </span>
                          <textarea
                            className="studio-focus mt-2 min-h-24 w-full rounded-md border border-[var(--studio-line)] bg-[var(--studio-paper)] px-3 py-3 text-sm font-bold leading-6 text-[var(--studio-ink)] placeholder:text-[var(--studio-subtle)]"
                            maxLength={260}
                            onChange={(event) => setProductDetailDescription(event.target.value)}
                            placeholder="재료, 기능, 보여주고 싶은 부분을 적어 주세요."
                            value={productDetailDescription}
                          />
                        </label>
                      )}
                    </div>
                  )}
              </section>

              {errorMessage && <AlertMessage>{errorMessage}</AlertMessage>}
            </div>
          </Panel>

          <Panel className="xl:sticky xl:top-4 xl:self-start" title="결과" subtitle="완성 이미지는 보관함에도 저장됩니다.">
            <div
              className={cn(
                "relative flex items-center justify-center overflow-hidden rounded-lg border border-[var(--studio-line)] bg-[var(--studio-paper)]",
                selectedImageSizeValue === "1536x864"
                  ? "aspect-video"
                  : selectedImageSizeValue === "1152x1536"
                    ? "aspect-[3/4]"
                    : selectedImageSizeValue === "1536x1152"
                      ? "aspect-[4/3]"
                      : "aspect-square",
              )}
            >
              {generatedImageUrl ? (
                <Image
                  alt="생성된 AI 이미지"
                  className="h-full w-full object-contain p-3"
                  height={720}
                  src={generatedImageUrl}
                  unoptimized
                  width={720}
                />
              ) : (
                <>
                  <Image
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full object-cover opacity-70"
                    height={720}
                    src={studioAssets.emptyPreview}
                    width={720}
                  />
                  <div className="relative rounded-lg border border-[var(--studio-line)] bg-[#fffdfa]/88 px-5 py-4 text-center text-[var(--studio-subtle)] shadow-[var(--studio-shadow-xs)] backdrop-blur-sm">
                    <Palette className="mx-auto size-12" />
                    <p className="mt-3 text-base font-extrabold text-[var(--studio-ink)]">
                      생성 대기 중
                    </p>
                  </div>
                </>
              )}
              {isGenerating && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#fffdfa]/78 backdrop-blur-sm">
                  <div className="flex items-center gap-2 rounded-md border border-[var(--studio-line)] bg-[#fffdfa] px-4 py-3 text-sm font-extrabold text-[var(--studio-ink)] shadow-[var(--studio-shadow-xs)]">
                    <Loader2 className="size-5 animate-spin" />
                    생성 중
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 grid gap-2 rounded-lg border border-[var(--studio-line)] bg-[var(--studio-paper)] p-3 text-sm font-bold text-[var(--studio-subtle)]">
              <div className="flex items-center justify-between gap-3">
                <span>첨부 이미지</span>
                <span>{uploadedImages.length}/{generationConfig.maxUploadImageCount}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>레퍼런스</span>
                <span>{selectedStyle?.name ?? "선택 없음"}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>비율</span>
                <span>
                  {imageSizeOptions.find((option) => option.value === selectedImageSizeValue)?.label ??
                    "1:1"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>남은 횟수</span>
                <span>{remainingCount}/{totalGenerationLimit}</span>
              </div>
            </div>

            {statusMessage && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-[rgb(86_127_132_/_0.34)] bg-[rgb(86_127_132_/_0.10)] p-3 text-sm font-bold text-[var(--studio-teal)]">
                <CheckCircle2 className="size-5" />
                {statusMessage}
              </div>
            )}

            <div className="mt-4 grid gap-2">
              <PrimaryButton
                className="sm:w-full"
                disabled={isGenerating || hasReachedLimit}
                onClick={onGenerate}
              >
                {isGenerating ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <Sparkles className="size-5" />
                )}
                AI 이미지 생성
              </PrimaryButton>
              <SecondaryButton
                className="sm:w-full"
                disabled={hasMaxExtraCount}
                onClick={() => {
                  setIsExtraRequestOpen((isOpen) => !isOpen);
                  setExtraRequestError("");
                  setExtraRequestMessage("");
                }}
              >
                <Lock className="size-5" />
                {hasMaxExtraCount ? "오늘 추가 완료" : "추가 횟수 요청"}
              </SecondaryButton>
              {isExtraRequestOpen && (
                <form className="space-y-2" onSubmit={handleExtraSubmit}>
                  <label className="block text-sm font-bold text-[var(--studio-subtle)]" htmlFor="workspace-extra-count-password">
                    암호
                  </label>
                  <div className="flex gap-2">
                    <input
                      autoComplete="off"
                      className="studio-focus h-11 min-w-0 flex-1 rounded-md border border-[var(--studio-line)] bg-[#fffdfa] px-3 text-sm font-bold text-[var(--studio-ink)]"
                      id="workspace-extra-count-password"
                      onChange={(event) => {
                        setExtraPassword(event.target.value);
                        setExtraRequestError("");
                      }}
                      type="password"
                      value={extraPassword}
                    />
                    <button
                      className="studio-button-primary inline-flex h-11 shrink-0 items-center justify-center rounded-md px-4 text-sm font-extrabold transition-colors"
                      type="submit"
                    >
                      확인
                    </button>
                  </div>
                </form>
              )}
              {extraRequestMessage && (
                <div className="flex items-center gap-2 rounded-lg border border-[rgb(86_127_132_/_0.34)] bg-[rgb(86_127_132_/_0.10)] p-3 text-sm font-bold text-[var(--studio-teal)]">
                  <CheckCircle2 className="size-5" />
                  {extraRequestMessage}
                </div>
              )}
              {extraRequestError && (
                <div className="rounded-lg border border-[rgb(180_92_106_/_0.38)] bg-[rgb(180_92_106_/_0.10)] p-3 text-sm font-bold text-[var(--destructive)]">
                  {extraRequestError}
                </div>
              )}
              <SecondaryButton
                className="sm:w-full"
                disabled={!generatedImageUrl}
                onClick={() => saveImage(generatedImageUrl)}
              >
                <Download className="size-5" />
                다운로드
              </SecondaryButton>
            </div>
          </Panel>
        </div>
      </section>

      {isReferenceLightboxOpen && (
        <ReferenceLightbox
          onClose={() => setIsReferenceLightboxOpen(false)}
          onSelect={onSelectStyle}
          selectedStyleId={selectedStyleId}
        />
      )}
    </>
  );
}

function ReferenceLightbox({
  onClose,
  onSelect,
  selectedStyleId,
}: {
  onClose: () => void;
  onSelect: (styleId: string) => void;
  selectedStyleId: string;
}) {
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const visibleStylePresets = useMemo(
    () =>
      selectedCategory === "전체"
        ? stylePresets
        : stylePresets.filter((style) => style.category === selectedCategory),
    [selectedCategory],
  );

  return (
    <div
      aria-label="레퍼런스 선택"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-[#f6f0e7]/88 p-3 backdrop-blur-sm sm:p-5"
      role="dialog"
    >
      <div className="studio-surface mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-xl">
        <div className="flex flex-col gap-4 border-b border-[var(--studio-line)] p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
          <div>
            <p className="text-sm font-bold text-[var(--studio-clay)]">레퍼런스</p>
            <h2 className="mt-1 text-2xl font-extrabold text-[var(--studio-ink)]">
              시각 방향 선택
            </h2>
          </div>
          <div className="flex gap-2">
            <button
              className="studio-button-secondary inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-bold"
              onClick={onClose}
              type="button"
            >
              선택 완료
            </button>
            <button
              aria-label="레퍼런스 선택 닫기"
              className="studio-button-secondary flex size-10 items-center justify-center rounded-md"
              onClick={onClose}
              type="button"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto border-b border-[var(--studio-line)] p-3 sm:p-4">
          {styleCategories.map((category) => (
            <button
              className={cn(
                "h-9 shrink-0 rounded-md px-3 text-sm font-bold transition-colors",
                selectedCategory === category
                  ? "studio-chip-active"
                  : "border border-[var(--studio-line)] bg-[#fffdfa]/72 text-[var(--studio-subtle)] hover:bg-[#f3eadf]",
              )}
              key={category}
              onClick={() => setSelectedCategory(category)}
              type="button"
            >
              {category}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleStylePresets.map((style) => (
              <button
                aria-pressed={style.id === selectedStyleId}
                className={cn(
                  "studio-thumbnail relative grid h-full overflow-hidden rounded-md text-left transition-all",
                  style.id === selectedStyleId
                    ? "border-[var(--studio-clay)] shadow-[0_0_0_2px_rgba(169,101,72,0.18),0_10px_22px_rgba(34,40,42,0.08)]"
                    : "hover:border-[var(--studio-teal)] hover:shadow-[0_8px_20px_rgba(34,40,42,0.07)]",
                )}
                key={style.id}
                onClick={() => onSelect(style.id)}
                type="button"
              >
                {style.id === selectedStyleId && (
                  <span className="absolute right-3 top-3 z-10 flex size-9 items-center justify-center rounded-md bg-[var(--studio-ink)] text-[#fffaf3] shadow-[var(--studio-shadow-xs)]">
                    <CheckCircle2 className="size-5" />
                  </span>
                )}
                {style.thumbnail ? (
                  <Image
                    alt={`${style.name} 썸네일`}
                    className={cn(
                      "aspect-[4/3] w-full",
                      style.forcedImageSize
                        ? "bg-[var(--studio-paper)] object-contain p-2"
                        : "object-cover",
                    )}
                    height={300}
                    src={style.thumbnail}
                    width={400}
                  />
                ) : (
                  <div className="flex aspect-[4/3] w-full items-center justify-center bg-[var(--studio-panel-soft)] text-[var(--studio-subtle)]">
                    <Palette className="size-12" />
                  </div>
                )}
                <div className="p-3">
                  <p className="text-xs font-bold text-[var(--studio-clay)]">
                    {style.category}
                  </p>
                  <p className="mt-1 text-base font-extrabold text-[var(--studio-ink)]">
                    {style.name}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-[var(--studio-subtle)]">
                    {style.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepFourPage({
  generatedImageUrl,
  history,
  onSelectSaved,
}: {
  generatedImageUrl: string;
  history: GeneratedImageHistoryItem[];
  onSelectSaved: (imageUrl: string) => void;
}) {
  const galleryItems = history;
  const selectedItem = generatedImageUrl || galleryItems[0]?.imageUrl || studioAssets.livingPreview;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Panel title="Gallery" subtitle="완성 이미지를 확인하고 다시 사용하세요.">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <button className="studio-chip-active h-9 rounded-md px-3 text-sm font-bold" type="button">
            전체
          </button>
          <div className="flex gap-2">
            <div className="h-9 rounded-md border border-[var(--studio-line)] bg-[#fffdfa]/72 px-4 text-sm font-bold leading-9 text-[var(--studio-subtle)]">
              최근순
            </div>
            <div className="h-9 rounded-md border border-[var(--studio-line)] bg-[#fffdfa]/72 px-4 text-sm font-bold leading-9 text-[var(--studio-subtle)]">
              검색
            </div>
          </div>
        </div>

        {galleryItems.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {galleryItems.map((item, index) => (
              <article
                className="studio-thumbnail overflow-hidden rounded-md"
                key={item.id}
              >
                <button
                  className="block w-full"
                  onClick={() => onSelectSaved(item.imageUrl)}
                  type="button"
                >
                  <Image
                    alt="저장된 완성 이미지"
                    className="aspect-[4/3] w-full object-cover"
                    height={360}
                    src={item.imageUrl}
                    unoptimized
                    width={480}
                  />
                </button>
                <div className="flex items-center justify-between gap-2 p-3">
                  <div>
                    <p className="text-sm font-extrabold">완성 이미지 {index + 1}</p>
                    <p className="text-xs font-semibold text-[var(--studio-subtle)]">
                      저장됨
                    </p>
                  </div>
                  <button
                    className="studio-button-secondary flex size-9 items-center justify-center rounded-full"
                    onClick={() => saveImage(item.imageUrl)}
                    type="button"
                  >
                    <Download className="size-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {[studioAssets.livingPreview, studioAssets.materialBoard, studioAssets.emptyPreview].map((src, index) => (
              <div className="studio-thumbnail overflow-hidden rounded-md" key={src}>
                <Image
                  alt="갤러리 예시"
                  className="aspect-[4/3] w-full object-cover"
                  height={360}
                  src={src}
                  width={480}
                />
                <div className="p-3">
                  <p className="text-sm font-extrabold">Showroom Sample {index + 1}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="선택 이미지" subtitle="이미지를 저장하거나 다시 확인하세요.">
        {selectedItem ? (
          <>
            <Image
              alt="선택 이미지"
              className="aspect-[4/3] w-full rounded-lg border border-[var(--studio-line)] object-cover"
              height={360}
              src={selectedItem}
              unoptimized={selectedItem.startsWith("data:")}
              width={480}
            />
            <SecondaryButton className="mt-4 sm:w-full" onClick={() => saveImage(selectedItem)}>
              <Download className="size-5" />
              다운로드
            </SecondaryButton>
          </>
        ) : (
          <div className="flex min-h-72 items-center justify-center rounded-lg border border-dashed border-[var(--studio-line)] bg-[var(--studio-paper)] p-6 text-center text-[var(--studio-subtle)]">
            <p className="text-lg font-extrabold">아직 저장된 이미지가 없어요.</p>
          </div>
        )}
      </Panel>
    </div>
  );
}

function Panel({
  children,
  className,
  subtitle,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  subtitle: string;
  title: string;
}) {
  return (
    <section className={cn("studio-panel min-w-0 rounded-xl p-4 sm:p-5", className)}>
      <div className="mb-4 border-b border-[var(--studio-line)] pb-4">
        <h2 className="text-balance text-2xl font-extrabold">{title}</h2>
        <p className="mt-1 text-pretty text-sm font-semibold leading-6 text-[var(--studio-clay)]">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function PrimaryButton({
  children,
  className,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "studio-button-primary inline-flex h-[52px] min-h-[52px] w-full items-center justify-center gap-2 rounded-md px-5 text-base font-extrabold transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50 sm:w-auto",
        className,
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function SecondaryButton({
  children,
  className,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "studio-button-secondary inline-flex h-12 w-full items-center justify-center gap-2 rounded-md px-5 text-sm font-bold transition-colors disabled:opacity-50 sm:w-auto",
        className,
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function AlertMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-lg border border-[rgb(180_92_106_/_0.38)] bg-[rgb(180_92_106_/_0.10)] p-3 text-sm font-bold text-[var(--destructive)]">
      {children}
    </div>
  );
}

function GuideModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      aria-label={guideCopy.title}
      aria-modal="true"
      className="fixed inset-0 z-50 bg-[#f6f0e7]/84 p-4 backdrop-blur"
      role="dialog"
    >
      <div className="studio-surface mx-auto max-h-[calc(100vh-2rem)] max-w-2xl overflow-auto rounded-xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-[var(--studio-clay)]">프롬프트 가이드</p>
            <h2 className="text-2xl font-extrabold">{guideCopy.title}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-[var(--studio-subtle)]">
              {guideCopy.description}
            </p>
          </div>
          <button
            className="studio-button-secondary flex size-10 items-center justify-center rounded-md"
            onClick={onClose}
            type="button"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {guideCopy.sections.map((section, index) => {
            const Icon = steps[index]?.icon ?? Palette;

            return (
            <div
              className="studio-workbench rounded-lg p-4"
              key={section.title}
            >
              <span className="flex size-9 items-center justify-center rounded-md bg-[var(--studio-panel)] text-[var(--studio-sage)] shadow-[var(--studio-shadow-xs)]">
                <Icon className="size-4" />
              </span>
              <h3 className="mt-3 font-extrabold">{section.title}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-[var(--studio-subtle)]">
                {section.example}
              </p>
            </div>
            );
          })}
        </div>

        <div className="mt-4 rounded-lg border border-dashed border-[var(--studio-line)] bg-[var(--studio-paper)] p-4 text-sm font-extrabold leading-7">
          {guideCopy.template}
        </div>
      </div>
    </div>
  );
}
