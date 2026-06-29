"use client";

import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  FileImage,
  GalleryHorizontal,
  HelpCircle,
  Home,
  ImagePlus,
  KeyRound,
  Loader2,
  Lock,
  Palette,
  Settings,
  RefreshCw,
  Sparkles,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

import { accessCodes } from "@/lib/accessCodes";
import { appCopy } from "@/lib/appContent";
import { generationConfig, uploadConfig } from "@/lib/config";
import { guideCopy } from "@/lib/guideContent";
import {
  addGeneratedImageHistory,
  GeneratedImageHistoryItem,
  getGeneratedImageHistory,
  getGenerationCount,
  setGenerationCount,
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
  const [hasCheckedAccess, setHasCheckedAccess] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [page, setPage] = useState<AppPage>("home");
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [studentDescription, setStudentDescription] = useState("");
  const [selectedStyleId, setSelectedStyleId] = useState(stylePresets[0]?.id ?? "");
  const [generationCount, setGenerationCountState] = useState(0);
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
  const remainingCount = Math.max(generationConfig.maxCount - generationCount, 0);
  const hasReachedLimit = generationCount >= generationConfig.maxCount;
  const canOpenStyleStep = Boolean(studentDescription.trim());
  const canOpenGenerateStep = Boolean(canOpenStyleStep && selectedStyle);

  useEffect(() => {
    document.documentElement.classList.remove("dark");
    window.localStorage.setItem(generationConfig.storageKeys.theme, "light");

    const syncPageFromHash = () => {
      setPage(getPageFromHash());
    };

    const frameId = window.requestAnimationFrame(() => {
      setHasAccess(window.localStorage.getItem(generationConfig.storageKeys.access) === "granted");
      setHasCheckedAccess(true);
      syncPageFromHash();
      setGenerationCountState(getGenerationCount());
      void getGeneratedImageHistory().then(setHistory);
    });

    window.addEventListener("hashchange", syncPageFromHash);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("hashchange", syncPageFromHash);
    };
  }, []);

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

  function unlockWithCode(code: string) {
    if (!accessCodes.some((accessCode) => accessCode === code)) {
      return false;
    }

    window.localStorage.setItem(generationConfig.storageKeys.access, "granted");
    setHasAccess(true);
    return true;
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setErrorMessage("");
    setStatusMessage("");

    if (!generationConfig.acceptedMimeTypes.includes(file.type as never)) {
      setErrorMessage(appCopy.errors.invalidFileType);
      return;
    }

    if (file.size > generationConfig.maxFileSizeBytes) {
      setErrorMessage(appCopy.errors.fileTooLarge);
      return;
    }

    const dataUrl = await readImageFile(file);
    setUploadedImage({ dataUrl, name: file.name });
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

    if (hasReachedLimit) {
      return appCopy.errors.limitReached;
    }

    return "";
  }

  function goToStyleStep() {
    const validationError = validateStepOne();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    goToPage("step-2");
  }

  function goToGenerateStep() {
    if (!selectedStyle) {
      setErrorMessage(appCopy.errors.styleRequired);
      return;
    }

    goToPage("step-3");
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
          uploadedImageBase64: uploadedImage?.dataUrl,
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
      const nextCount = generationCount + 1;
      const historyItem = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        styleId: selectedStyle.id,
        studentDescription: studentDescription.trim(),
        imageUrl,
      };

      setGenerationCount(nextCount);
      setGenerationCountState(nextCount);
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

  if (!hasCheckedAccess) {
    return <main className="studio-shell min-h-screen" />;
  }

  if (!hasAccess) {
    return <AccessCodePage onUnlock={unlockWithCode} />;
  }

  return (
    <main className="studio-shell min-h-screen p-3 sm:p-4">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-[1540px] overflow-hidden rounded-xl border border-[var(--studio-line)] bg-[#fffdfa]/82 shadow-[var(--studio-shadow-md)] lg:grid-cols-[132px_minmax(0,1fr)]">
        <StudioSidebar currentPage={page} onNavigate={goToPage} />
        <section className="min-w-0 border-t border-[var(--studio-line)] bg-[#fffdfa]/72 lg:border-l lg:border-t-0">
          <AppHeader
            currentPage={page}
            onGuideOpen={() => setIsGuideOpen(true)}
            remainingCount={remainingCount}
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

            {page !== "home" && (
              <StepShell
                canOpenGenerateStep={canOpenGenerateStep}
                canOpenStyleStep={canOpenStyleStep}
                currentPage={page}
                onStepClick={goToPage}
              >
                {page === "step-1" && (
                  <StepOnePage
                    errorMessage={errorMessage}
                    fileInputRef={fileInputRef}
                    onClearImage={() => {
                      setUploadedImage(null);
                      setErrorMessage("");
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                    onFileChange={handleFileChange}
                    onGuideOpen={() => setIsGuideOpen(true)}
                    onNext={goToStyleStep}
                    setStudentDescription={setStudentDescription}
                    studentDescription={studentDescription}
                    uploadedImage={uploadedImage}
                  />
                )}

                {page === "step-2" && (
                  <StepTwoPage
                    onBack={() => goToPage("step-1")}
                    onNext={goToGenerateStep}
                    onSelect={setSelectedStyleId}
                    selectedStyle={selectedStyle}
                    selectedStyleId={selectedStyleId}
                  />
                )}

                {page === "step-3" && (
                  <StepThreePage
                    errorMessage={errorMessage}
                    generatedImageUrl={generatedImageUrl}
                    hasReachedLimit={hasReachedLimit}
                    isGenerating={isGenerating}
                    onBack={() => goToPage("step-2")}
                    onGenerate={handleGenerate}
                    remainingCount={remainingCount}
                    selectedStyle={selectedStyle}
                    statusMessage={statusMessage}
                  />
                )}

                {page === "step-4" && (
                  <StepFourPage
                    generatedImageUrl={generatedImageUrl}
                    history={history}
                    onSelectSaved={setGeneratedImageUrl}
                  />
                )}
              </StepShell>
            )}
          </div>
        </section>
      </div>

      {isGuideOpen && <GuideModal onClose={() => setIsGuideOpen(false)} />}
    </main>
  );
}

function AccessCodePage({ onUnlock }: { onUnlock: (code: string) => boolean }) {
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  function submitCode() {
    const normalizedCode = code.replace(/\D/g, "").slice(0, 6);

    if (normalizedCode.length !== 6 || !onUnlock(normalizedCode)) {
      setErrorMessage("접속 코드를 확인해 주세요.");
      return;
    }

    setErrorMessage("");
  }

  return (
    <main className="studio-shell relative isolate flex min-h-screen items-center justify-center overflow-hidden px-4 py-8">
      <Image
        alt=""
        aria-hidden="true"
        className="absolute inset-0 -z-20 h-full w-full object-cover opacity-30"
        height={920}
        priority
        src={studioAssets.hero}
        width={1280}
      />
      <div className="absolute inset-0 -z-10 bg-[#f6f0e7]/78" />
      <section className="studio-surface w-full max-w-sm rounded-xl p-5">
        <div className="flex size-11 items-center justify-center rounded-md bg-[var(--studio-panel-soft)] text-[var(--studio-clay)]">
          <KeyRound className="size-6" />
        </div>
        <div className="mt-5">
          <p className="text-sm font-bold text-[var(--studio-clay)]">AI 이미지 스튜디오</p>
          <h1 className="mt-1 text-3xl font-extrabold leading-tight">접속 코드</h1>
        </div>
        <label className="mt-5 block">
          <span className="text-sm font-bold text-[var(--studio-subtle)]">접속 코드</span>
          <input
            className="studio-focus mt-2 h-14 w-full rounded-md border border-[var(--studio-line)] bg-[var(--studio-paper)] px-4 text-center text-2xl font-extrabold tracking-[0.28em]"
            inputMode="numeric"
            maxLength={6}
            onChange={(event) => {
              setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
              setErrorMessage("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                submitCode();
              }
            }}
            placeholder="000000"
            value={code}
          />
        </label>
        {errorMessage && <AlertMessage>{errorMessage}</AlertMessage>}
        <PrimaryButton className="mt-5 sm:w-full" onClick={submitCode}>
          입장 <ArrowRight className="size-5" />
        </PrimaryButton>
      </section>
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
  const isCreateActive = currentPage !== "step-4";
  const isGalleryActive = currentPage === "step-4";

  return (
    <aside className="flex min-h-20 flex-row items-center gap-2 overflow-x-auto bg-[#fffdfa]/84 px-3 py-3 lg:min-h-0 lg:flex-col lg:items-stretch lg:overflow-visible lg:px-3 lg:py-5">
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
}: {
  currentPage: AppPage;
  onGuideOpen: () => void;
  remainingCount: number;
}) {
  const activeNavId = getActiveNavId(currentPage);
  const title =
    currentPage === "step-1"
      ? "1. Upload & Prompt"
      : currentPage === "step-2"
        ? "2. AI Reference"
        : currentPage === "step-3"
          ? "3. Generating"
          : currentPage === "step-4"
            ? "4. Gallery"
            : "Showroom AI";
  const subtitle =
    currentPage === "step-1"
      ? "사진을 업로드하고 원하는 공간을 설명해 주세요."
      : currentPage === "step-2"
        ? "원하는 스타일을 선택해 AI가 공간감을 반영합니다."
        : currentPage === "step-3"
          ? "AI가 이미지를 생성하는 동안 결과를 확인하세요."
          : currentPage === "step-4"
            ? "생성된 이미지를 보관하고 다시 확인하세요."
            : "프롬프트와 레퍼런스로 이미지를 만드세요.";

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
            남은 횟수 {remainingCount}/5
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

function StepShell({
  canOpenGenerateStep,
  canOpenStyleStep,
  children,
  currentPage,
  onStepClick,
}: {
  canOpenGenerateStep: boolean;
  canOpenStyleStep: boolean;
  children: React.ReactNode;
  currentPage: AppPage;
  onStepClick: (page: AppPage) => void;
}) {
  const isStepAvailable = (stepPage: AppPage) => {
    if (stepPage === currentPage) {
      return true;
    }

    if (stepPage === "step-4") {
      return true;
    }

    if (stepPage === "step-1") {
      return true;
    }

    if (stepPage === "step-2") {
      return canOpenStyleStep;
    }

    if (stepPage === "step-3") {
      return canOpenGenerateStep;
    }

    return false;
  };

  return (
    <section className="space-y-4">
      <div className="studio-toolbar grid gap-2 rounded-xl p-2 sm:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const available = isStepAvailable(step.page);

          return (
            <button
              className={cn(
                "flex min-h-14 items-center gap-3 rounded-md px-3 py-2 text-left transition-colors",
                currentPage === step.page
                  ? "bg-[var(--studio-ink)] text-[#fffaf3]"
                  : "bg-transparent text-[var(--studio-subtle)] hover:bg-[#fffdfa]/72",
                !available && "cursor-not-allowed opacity-45 hover:bg-[var(--studio-panel-soft)]",
              )}
              key={step.page}
              onClick={() => available && onStepClick(step.page)}
              disabled={!available}
              type="button"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-[var(--studio-line)] bg-[#fffdfa]/64">
                {available ? <Icon className="size-5" /> : <Lock className="size-5" />}
              </span>
              <span>
                <span className="block text-xs font-extrabold">STEP {index + 1}</span>
                <span className="block text-sm font-extrabold">{step.label}</span>
                {!available && (
                  <span className="mt-0.5 block text-[11px] font-extrabold">이전 단계 필요</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
      {children}
    </section>
  );
}

function StepOnePage({
  errorMessage,
  fileInputRef,
  onClearImage,
  onFileChange,
  onGuideOpen,
  onNext,
  setStudentDescription,
  studentDescription,
  uploadedImage,
}: {
  errorMessage: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onClearImage: () => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onGuideOpen: () => void;
  onNext: () => void;
  setStudentDescription: (description: string) => void;
  studentDescription: string;
  uploadedImage: UploadedImage | null;
}) {
  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <Panel title={appCopy.upload.title} subtitle={appCopy.upload.description}>
        <input
          accept={uploadConfig.acceptAttribute}
          className="hidden"
          onChange={onFileChange}
          ref={fileInputRef}
          type="file"
        />
        <div className="min-w-0 rounded-lg border border-[var(--studio-line)] bg-[var(--studio-paper)] p-3">
          <button
            className={cn(
              "group relative flex aspect-[16/11] min-w-0 w-full items-center justify-center overflow-hidden rounded-md border text-left transition-all",
              uploadedImage
                ? "border-[rgb(99_116_105_/_0.34)] bg-[#fffdfa] shadow-[0_10px_24px_rgba(34,40,42,0.07)]"
                : "border-dashed border-[var(--studio-line)] bg-[#fffdfa]/56 hover:border-[var(--studio-teal)]",
            )}
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            {uploadedImage ? (
              <>
                <Image
                  alt="업로드 이미지 미리보기"
                  className="h-full w-full object-contain p-4"
                  height={720}
                  src={uploadedImage.dataUrl}
                  unoptimized
                  width={1040}
                />
                <span className="absolute left-3 top-3 rounded-md border border-[rgb(255_253_250_/_0.72)] bg-[#fffdfa]/88 px-3 py-1 text-xs font-bold text-[var(--studio-sage)] shadow-[var(--studio-shadow-xs)] backdrop-blur-sm">
                  참고 이미지
                </span>
                <span className="absolute right-3 top-3 flex items-center gap-1 rounded-md bg-[var(--studio-ink)] px-3 py-1 text-xs font-bold text-[#fffaf3] shadow-[var(--studio-shadow-xs)]">
                  <CheckCircle2 className="size-3.5" />
                  사용 중
                </span>
                <span className="pointer-events-none absolute inset-3 rounded-md border border-[#fffdfa]/64" />
              </>
            ) : (
                <span className="flex w-full max-w-sm flex-col items-start gap-4 p-5 text-[var(--studio-subtle)]">
                <span className="flex size-11 items-center justify-center rounded-md bg-[var(--studio-panel)] text-[var(--studio-sage)] shadow-[var(--studio-shadow-xs)]">
                  <Upload className="size-6" />
                </span>
                <span>
                  <span className="block text-lg font-extrabold text-[var(--studio-ink)]">
                    {appCopy.upload.empty}
                  </span>
                  <span className="mt-2 block text-sm font-semibold leading-6">
                    jpg, png, webp / 최대 5MB
                  </span>
                </span>
              </span>
            )}
          </button>

          <div className="mt-3 grid min-w-0 gap-2">
            {uploadedImage ? (
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3 overflow-hidden rounded-md border border-[var(--studio-line)] bg-[#fffdfa]/82 px-3 py-2">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[var(--studio-panel-soft)] text-[var(--studio-sage)]">
                    <FileImage className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-[var(--studio-ink)]">
                      {uploadedImage.name}
                    </p>
                    <p className="text-xs font-semibold text-[var(--studio-subtle)]">
                      참고 이미지
                    </p>
                  </div>
                </div>
                <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2 sm:flex">
                  <button
                    className="studio-button-secondary inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-md px-2 text-sm font-bold transition-colors sm:px-3"
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                  >
                    <RefreshCw className="size-4" />
                    이미지 바꾸기
                  </button>
                  <button
                    className="inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-md border border-[rgb(180_92_106_/_0.28)] bg-[rgb(180_92_106_/_0.08)] px-2 text-sm font-bold text-[var(--destructive)] transition-colors hover:bg-[rgb(180_92_106_/_0.13)] sm:px-3"
                    onClick={onClearImage}
                    type="button"
                  >
                    <Trash2 className="size-4" />
                    삭제
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="studio-button-secondary inline-flex h-11 w-full items-center justify-center gap-2 rounded-md px-4 text-sm font-bold transition-colors"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                <ImagePlus className="size-4" />
                이미지 고르기
              </button>
            )}
          </div>
        </div>
      </Panel>

      <Panel title={appCopy.description.title} subtitle="만들고 싶은 이미지를 적어 주세요.">
        <textarea
          className="studio-focus min-h-56 w-full rounded-md border border-[var(--studio-line)] bg-[var(--studio-paper)] p-4 text-base font-semibold leading-7 placeholder:text-[var(--studio-subtle)]"
          maxLength={500}
          onChange={(event) => setStudentDescription(event.target.value)}
          placeholder={appCopy.description.placeholder}
          value={studentDescription}
        />
        <div className="mt-3 rounded-lg border border-[var(--studio-line)] bg-[#fffdfa]/58 p-4">
          <p className="mb-3 text-sm font-bold text-[var(--studio-clay)]">프롬프트 예시</p>
          <div className="grid gap-2 text-sm font-semibold leading-6 text-[var(--studio-subtle)] sm:grid-cols-3">
            {appCopy.description.exampleParts.map((part) => (
              <div className="rounded-md border border-[var(--studio-line)] bg-[var(--studio-panel)] p-3" key={part.label}>
                <p className="font-extrabold text-[var(--studio-ink)]">{part.label}</p>
                <p className="mt-1 text-pretty">{part.text}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-bold text-[var(--studio-subtle)]">
            {studentDescription.length}/500
          </p>
          <button
            className="text-sm font-bold text-[var(--studio-clay)] underline underline-offset-4"
            onClick={onGuideOpen}
            type="button"
          >
            프롬프트 도움
          </button>
        </div>
        {errorMessage && <AlertMessage>{errorMessage}</AlertMessage>}
        <div className="mt-5 flex justify-end">
          <PrimaryButton onClick={onNext}>
            다음: 레퍼런스 선택 <ArrowRight className="size-5" />
          </PrimaryButton>
        </div>
      </Panel>
    </div>
  );
}

function StepTwoPage({
  onBack,
  onNext,
  onSelect,
  selectedStyle,
  selectedStyleId,
}: {
  onBack: () => void;
  onNext: () => void;
  onSelect: (styleId: string) => void;
  selectedStyle?: StylePreset;
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
    <div className="grid gap-4 pb-28 lg:grid-cols-[minmax(0,1fr)_340px] lg:pb-32">
      <Panel
        className="order-1 lg:order-1"
        title={appCopy.styles.title}
        subtitle={appCopy.styles.description}
      >
        <div className="mb-4 flex gap-2 overflow-x-auto rounded-lg border border-[var(--studio-line)] bg-[#fffdfa]/58 p-2">
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

        <div className="mb-3 text-sm font-bold text-[var(--studio-subtle)]">
          {visibleStylePresets.length}개 레퍼런스
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {visibleStylePresets.map((style) => (
            <button
              aria-pressed={style.id === selectedStyleId}
              className={cn(
                "studio-thumbnail relative grid h-full min-h-[218px] grid-rows-[auto_1fr] overflow-hidden rounded-md text-left transition-all",
                style.id === selectedStyleId
                  ? "border-[var(--studio-clay)] shadow-[0_0_0_2px_rgba(169,101,72,0.16),0_10px_22px_rgba(34,40,42,0.07)]"
                  : "hover:border-[var(--studio-teal)] hover:shadow-[0_8px_20px_rgba(34,40,42,0.07)]",
              )}
              key={style.id}
              onClick={() => onSelect(style.id)}
              type="button"
            >
              {style.id === selectedStyleId && (
                <span className="absolute right-2 top-2 z-10 flex size-8 items-center justify-center rounded-md bg-[var(--studio-ink)] text-[#fffaf3] shadow-[var(--studio-shadow-xs)]">
                  <CheckCircle2 className="size-5" />
                </span>
              )}
              {style.thumbnail ? (
                <Image
                  alt={`${style.name} 썸네일`}
                  className="aspect-[4/5] w-full object-cover"
                  height={320}
                  src={style.thumbnail}
                  width={240}
                />
              ) : (
                <div className="flex aspect-[4/5] w-full items-center justify-center bg-[var(--studio-panel-soft)] text-[var(--studio-subtle)]">
                  <Palette className="size-12" />
                </div>
              )}
              <div className="flex min-h-22 flex-col p-3">
                <p className="text-pretty font-extrabold">{style.name}</p>
                <p className="mt-1 text-pretty text-sm font-semibold leading-5 text-[var(--studio-subtle)]">
                  {style.description}
                </p>
              </div>
            </button>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap justify-between gap-3">
          <SecondaryButton onClick={onBack}>
            <ArrowLeft className="size-5" />
            이전
          </SecondaryButton>
          <PrimaryButton onClick={onNext}>
            다음: 생성하기 <ArrowRight className="size-5" />
          </PrimaryButton>
        </div>
      </Panel>

      <Panel
        className="order-2 lg:sticky lg:top-4 lg:order-2 lg:self-start"
        title="선택한 레퍼런스"
        subtitle="이 방향을 결과에 반영합니다."
      >
        {selectedStyle && (
          <>
            {selectedStyle.thumbnail ? (
              <Image
                alt={`${selectedStyle.name} 미리보기`}
                className="aspect-[4/5] w-full rounded-lg border border-[var(--studio-line)] object-cover"
                height={520}
                src={selectedStyle.thumbnail}
                width={390}
              />
            ) : (
              <div className="flex aspect-[4/5] w-full items-center justify-center rounded-lg border border-[var(--studio-line)] bg-[var(--studio-panel-soft)] text-[var(--studio-subtle)]">
                <Palette className="size-16" />
              </div>
            )}
            <h2 className="mt-4 text-2xl font-extrabold">{selectedStyle.name}</h2>
            <p className="mt-2 text-pretty text-base font-semibold leading-7 text-[var(--studio-subtle)]">
              {selectedStyle.description}
            </p>
          </>
        )}
      </Panel>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--studio-line)] bg-[#fffdfa]/94 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-10px_28px_rgba(34,40,42,0.075)] backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1376px] items-center gap-3">
          <SecondaryButton className="hidden shrink-0 sm:inline-flex" onClick={onBack}>
            <ArrowLeft className="size-5" />
            이전
          </SecondaryButton>

          <div className="flex min-w-0 flex-1 items-center gap-3 rounded-md border border-[var(--studio-line)] bg-[#f3eadf]/72 p-2">
            {selectedStyle?.thumbnail ? (
              <Image
                alt=""
                aria-hidden="true"
                className="size-12 shrink-0 rounded object-cover"
                height={48}
                src={selectedStyle.thumbnail}
                width={48}
              />
            ) : (
              <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-[var(--studio-panel)] text-[var(--studio-subtle)]">
                <Palette className="size-6" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-[var(--studio-clay)]">
                {selectedStyle?.category}
              </p>
              <p className="truncate text-sm font-extrabold text-[var(--studio-ink)] sm:text-base">
                {selectedStyle?.name}
              </p>
            </div>
          </div>

          <PrimaryButton className="w-auto shrink-0 px-4 sm:px-6" onClick={onNext}>
            생성 단계로 <ArrowRight className="size-5" />
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

function StepThreePage({
  errorMessage,
  generatedImageUrl,
  hasReachedLimit,
  isGenerating,
  onBack,
  onGenerate,
  remainingCount,
  selectedStyle,
  statusMessage,
}: {
  errorMessage: string;
  generatedImageUrl: string;
  hasReachedLimit: boolean;
  isGenerating: boolean;
  onBack: () => void;
  onGenerate: () => void;
  remainingCount: number;
  selectedStyle?: StylePreset;
  statusMessage: string;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Panel title="결과" subtitle="완성 이미지를 확인하고 저장하세요.">
        <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-[var(--studio-line)] bg-[var(--studio-paper)]">
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
                  <Palette className="mx-auto size-14" />
                  <p className="mt-3 text-lg font-extrabold text-[var(--studio-ink)]">완성 이미지 대기 중</p>
                </div>
              </>
            )}
          </div>

        {statusMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-[rgb(86_127_132_/_0.34)] bg-[rgb(86_127_132_/_0.10)] p-3 text-sm font-bold text-[var(--studio-teal)]">
            <CheckCircle2 className="size-5" />
            {statusMessage}
          </div>
        )}
        {errorMessage && <AlertMessage>{errorMessage}</AlertMessage>}

        <div className="mt-5">
          <SecondaryButton className="sm:w-full" onClick={onBack}>
            <ArrowLeft className="size-5" />
            레퍼런스 다시 고르기
          </SecondaryButton>
        </div>
      </Panel>

      <Panel title="생성 컨트롤" subtitle="레퍼런스와 횟수를 확인하세요.">
        <div className="space-y-3 rounded-lg border border-[var(--studio-line)] bg-[var(--studio-paper)] p-4">
          <p className="text-sm font-bold text-[var(--studio-clay)]">선택한 레퍼런스</p>
          <p className="text-pretty text-xl font-extrabold">{selectedStyle?.name}</p>
          <p className="rounded-md border border-[var(--studio-line)] bg-[#fffdfa]/72 px-3 py-2 text-sm font-bold text-[var(--studio-subtle)]">
            남은 횟수 {remainingCount}/5
          </p>
          <PrimaryButton className="sm:w-full" disabled={isGenerating || hasReachedLimit} onClick={onGenerate}>
            {isGenerating ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Sparkles className="size-5" />
            )}
            AI 이미지 생성
          </PrimaryButton>
          <SecondaryButton className="sm:w-full" disabled={!generatedImageUrl} onClick={() => saveImage(generatedImageUrl)}>
            <Download className="size-5" />
            다운로드
          </SecondaryButton>
        </div>
      </Panel>

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
