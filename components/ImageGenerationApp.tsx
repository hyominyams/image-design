"use client";

import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  HelpCircle,
  ImagePlus,
  KeyRound,
  Loader2,
  Lock,
  Palette,
  Sparkles,
  Upload,
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

type AppPage = "home" | "step-1" | "step-2" | "step-3";

const pageOrder: AppPage[] = ["home", "step-1", "step-2", "step-3"];
const steps = [
  {
    page: "step-1" as const,
    label: "이미지와 프롬프트",
    emoji: "🖼️",
    description: "참고 이미지는 선택하고, 만들 이미지는 프롬프트로 정해요.",
  },
  {
    page: "step-2" as const,
    label: "레퍼런스 선택",
    emoji: "🎨",
    description: "없음 또는 원하는 시각 방향을 골라요.",
  },
  {
    page: "step-3" as const,
    label: "생성하고 저장",
    emoji: "✨",
    description: "완성 이미지를 확인하고 보관함에 저장해요.",
  },
];

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
      setHistory(getGeneratedImageHistory());
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
      setHistory(addGeneratedImageHistory(historyItem));
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
    return <main className="min-h-screen bg-[#fff7ea]" />;
  }

  if (!hasAccess) {
    return <AccessCodePage onUnlock={unlockWithCode} />;
  }

  return (
    <main className="min-h-screen bg-[#fff7ea] text-[#29323a]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <AppHeader
          currentPage={page}
          onGuideOpen={() => setIsGuideOpen(true)}
          onHome={() => goToPage("home")}
          remainingCount={remainingCount}
        />

        {page === "home" && (
          <HomePage
            onGuideOpen={() => setIsGuideOpen(true)}
            onStart={() => goToPage("step-1")}
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
                history={history}
                isGenerating={isGenerating}
                onBack={() => goToPage("step-2")}
                onGenerate={handleGenerate}
                onSelectSaved={setGeneratedImageUrl}
                remainingCount={remainingCount}
                selectedStyle={selectedStyle}
                statusMessage={statusMessage}
                studentDescription={studentDescription}
                uploadedImage={uploadedImage}
              />
            )}
          </StepShell>
        )}
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
    <main className="flex min-h-screen items-center justify-center bg-[#fff7ea] px-4 py-8 text-[#29323a]">
      <section className="w-full max-w-md rounded-lg border border-[#efd6ad] bg-white p-5 shadow-[0_4px_0_#f0d7ab]">
        <div className="flex size-12 items-center justify-center rounded-md bg-[#fff0d8] text-[#d16f91]">
          <KeyRound className="size-6" />
        </div>
        <div className="mt-5">
          <p className="text-sm font-extrabold text-[#d16f91]">AI 이미지 스튜디오</p>
          <h1 className="mt-1 text-3xl font-extrabold leading-tight">접속 코드 입력</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#7c5566]">
            6자리 코드를 입력하면 이미지 생성 화면으로 이동합니다.
          </p>
        </div>
        <label className="mt-5 block">
          <span className="text-sm font-extrabold text-[#7c5566]">접속 코드</span>
          <input
            className="mt-2 h-14 w-full rounded-md border border-[#efd6ad] bg-white px-4 text-center text-2xl font-extrabold tracking-[0.28em] outline-none focus:border-[#6ebfc4] focus:ring-2 focus:ring-[#6ebfc4]/40"
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
          입장하기 <ArrowRight className="size-5" />
        </PrimaryButton>
      </section>
    </main>
  );
}

function AppHeader({
  currentPage,
  onGuideOpen,
  onHome,
  remainingCount,
}: {
  currentPage: AppPage;
  onGuideOpen: () => void;
  onHome: () => void;
  remainingCount: number;
}) {
  return (
    <header className="flex flex-col gap-3 rounded-lg border border-[#efd6ad] bg-white p-4 shadow-[0_4px_0_#f0d7ab] sm:flex-row sm:items-center sm:justify-between">
      <button className="text-left" onClick={onHome} type="button">
        <p className="text-xs font-extrabold text-[#d16f91]">AI 이미지 스튜디오</p>
        <h1 className="text-balance text-xl font-extrabold leading-tight sm:text-2xl">
          프롬프트로 이미지 만들기
        </h1>
      </button>

      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md border border-[#efd6ad] bg-[#fff0d8] px-3 py-2 text-sm font-extrabold text-[#7c5566]">
          남은 생성 횟수 {remainingCount}/5
        </span>
        <button
          className="inline-flex h-11 items-center gap-2 rounded-md bg-[#d97896] px-4 text-sm font-extrabold text-white shadow-[0_4px_0_#6ebfc4]"
          onClick={onGuideOpen}
          type="button"
        >
          <HelpCircle className="size-4" />
          프롬프트 도움
        </button>
        {currentPage !== "home" && (
          <button
            className="h-11 rounded-md border border-[#efd6ad] bg-white px-4 text-sm font-extrabold text-[#7c5566]"
            onClick={onHome}
            type="button"
          >
            처음으로
          </button>
        )}
      </div>
    </header>
  );
}

function HomePage({
  onGuideOpen,
  onStart,
}: {
  onGuideOpen: () => void;
  onStart: () => void;
}) {
  return (
    <section className="space-y-5">
      <div className="relative isolate overflow-hidden rounded-xl border-2 border-[#e7cfae] bg-white shadow-[0_8px_0_#f0d7ab]">
        <Image
          alt=""
          aria-hidden="true"
          className="absolute inset-0 -z-20 h-full w-full object-cover opacity-[0.18]"
          height={920}
          priority
          src="/styles/poster.png"
          width={1280}
        />
        <div className="absolute inset-0 -z-10 bg-white/78" />

        <div className="grid min-h-[520px] gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_360px] lg:p-9">
          <div className="flex max-w-3xl flex-col justify-center gap-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[#efd6ad] bg-[#fff0d8] px-3 py-1 text-sm font-extrabold text-[#d16f91]">
                이미지 생성
              </span>
              <span className="rounded-full border border-[#c7e8e9] bg-[#e8fbfb] px-3 py-1 text-sm font-extrabold text-[#277077]">
                프롬프트 + 선택 이미지
              </span>
            </div>

            <div className="space-y-4">
              <h2 className="text-balance max-w-2xl text-[38px] font-extrabold leading-[1.12] tracking-normal text-[#202b33] sm:text-[54px] lg:text-[62px]">
                원하는 장면을 이미지로
              </h2>
              <p className="text-pretty max-w-xl text-lg font-semibold leading-8 text-[#6f5a63]">
                프롬프트를 쓰고 필요한 경우 참고 이미지를 더하세요. 레퍼런스 디자인은
                사진, 포스터, 일러스트, 3D 렌더 같은 시각 방향을 잡아줍니다.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                className="inline-flex h-14 items-center justify-center gap-2 rounded-lg bg-[#f4bf5f] px-7 text-base font-extrabold text-[#2b2b22] shadow-[0_5px_0_#d97896] transition-transform hover:-translate-y-0.5"
                onClick={onStart}
                type="button"
              >
                이미지 만들기 <ArrowRight className="size-5" />
              </button>
              <button
                className="inline-flex h-14 items-center justify-center gap-2 rounded-lg border-2 border-[#e7cfae] bg-white/92 px-7 text-base font-extrabold text-[#7c5566] transition-colors hover:bg-[#fff0d8]"
                onClick={onGuideOpen}
                type="button"
              >
                <HelpCircle className="size-5" />
                프롬프트 도움
              </button>
            </div>
          </div>

          <div className="grid content-center gap-3">
            <div className="rounded-xl border-2 border-[#e7cfae] bg-white/90 p-3 shadow-[0_5px_0_#f0d7ab]">
              <Image
                alt="AI 이미지 생성 예시"
                className="aspect-[4/3] w-full rounded-lg object-cover"
                height={520}
                priority
                src="/styles/watercolor.png"
                width={520}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-[#efd6ad] bg-white/92 p-4">
                <p className="text-sm font-extrabold text-[#d16f91]">입력</p>
                <p className="mt-1 text-pretty text-base font-extrabold">
                  프롬프트 필수
                </p>
              </div>
              <div className="rounded-lg border border-[#c7e8e9] bg-[#e8fbfb]/92 p-4">
                <p className="text-sm font-extrabold text-[#277077]">참고</p>
                <p className="mt-1 text-pretty text-base font-extrabold">
                  이미지는 선택
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {steps.map((step, index) => (
          <div
            className="rounded-xl border-2 border-[#e7cfae] bg-white p-5 shadow-[0_5px_0_#f0d7ab]"
            key={step.page}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-3xl">{step.emoji}</span>
              <span className="rounded-full bg-[#fff0d8] px-3 py-1 text-xs font-extrabold text-[#d16f91]">
                STEP {index + 1}
              </span>
            </div>
            <h3 className="mt-4 text-balance text-xl font-extrabold">{step.label}</h3>
            <p className="mt-2 text-pretty text-sm font-semibold leading-6 text-[#7c5566]">
              {step.description}
            </p>
          </div>
        ))}
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
      <div className="grid gap-2 rounded-lg border border-[#efd6ad] bg-white p-2 shadow-[0_4px_0_#f0d7ab] sm:grid-cols-3">
        {steps.map((step, index) => (
          <button
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-3 text-left transition-colors",
              currentPage === step.page
                ? "bg-[#f4bf5f] text-[#2b2b22]"
                : "bg-[#fff0d8] text-[#7c5566] hover:bg-[#f7e7d4]",
              !isStepAvailable(step.page) && "cursor-not-allowed opacity-45 hover:bg-[#fff0d8]",
            )}
            key={step.page}
            onClick={() => isStepAvailable(step.page) && onStepClick(step.page)}
            disabled={!isStepAvailable(step.page)}
            type="button"
          >
            <span className="text-2xl">
              {isStepAvailable(step.page) ? step.emoji : <Lock className="size-6" />}
            </span>
            <span>
              <span className="block text-xs font-extrabold">STEP {index + 1}</span>
              <span className="block text-sm font-extrabold">{step.label}</span>
              {!isStepAvailable(step.page) && (
                <span className="mt-0.5 block text-[11px] font-extrabold">먼저 이전 단계</span>
              )}
            </span>
          </button>
        ))}
      </div>
      {children}
    </section>
  );
}

function StepOnePage({
  errorMessage,
  fileInputRef,
  onFileChange,
  onGuideOpen,
  onNext,
  setStudentDescription,
  studentDescription,
  uploadedImage,
}: {
  errorMessage: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onGuideOpen: () => void;
  onNext: () => void;
  setStudentDescription: (description: string) => void;
  studentDescription: string;
  uploadedImage: UploadedImage | null;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
      <Panel title="이미지 업로드" subtitle="참고 이미지는 선택 사항입니다.">
        <input
          accept={uploadConfig.acceptAttribute}
          className="hidden"
          onChange={onFileChange}
          ref={fileInputRef}
          type="file"
        />
        <button
          className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-[#d8b985] bg-[#fff0d8]"
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          {uploadedImage ? (
            <Image
              alt="업로드 이미지 미리보기"
              className="h-full w-full object-contain p-3"
              height={600}
              src={uploadedImage.dataUrl}
              unoptimized
              width={800}
            />
          ) : (
              <span className="flex flex-col items-center gap-3 text-center text-[#9b6176]">
                <Upload className="size-12" />
              <span className="text-xl font-extrabold">참고 이미지 추가</span>
              <span className="text-sm font-semibold">jpg, png, webp / 최대 5MB</span>
            </span>
          )}
        </button>
        <button
          className="mt-4 inline-flex h-12 items-center gap-2 rounded-md border border-[#efd6ad] bg-white px-4 text-sm font-extrabold text-[#7c5566]"
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          <ImagePlus className="size-4" />
          이미지 고르기
        </button>
      </Panel>

      <Panel title="프롬프트 쓰기" subtitle="원하는 이미지를 직접 적어 주세요.">
        <textarea
          className="min-h-48 w-full rounded-lg border border-[#efd6ad] bg-white p-4 text-base font-semibold leading-7 outline-none placeholder:text-gray-500 focus:border-[#6ebfc4] focus:ring-2 focus:ring-[#6ebfc4]/40"
          maxLength={500}
          onChange={(event) => setStudentDescription(event.target.value)}
          placeholder={appCopy.description.placeholder}
          value={studentDescription}
        />
        <div className="mt-3 rounded-lg border border-[#efd6ad] bg-[#fff0d8] p-4">
          <p className="mb-3 text-sm font-extrabold text-[#d16f91]">프롬프트 예시</p>
          <div className="grid gap-2 text-sm font-semibold leading-6 text-[#7c5566] sm:grid-cols-3">
            {appCopy.description.exampleParts.map((part) => (
              <div className="rounded-md border border-[#efd6ad] bg-white p-3" key={part.label}>
                <p className="font-extrabold text-[#29323a]">{part.label}</p>
                <p className="mt-1 text-pretty">{part.text}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-extrabold text-[#9b6176]">
            {studentDescription.length}/500
          </p>
          <button
            className="text-sm font-extrabold text-[#d16f91] underline underline-offset-4"
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
    <div className="grid gap-4 pb-28 lg:grid-cols-[1fr_340px] lg:pb-32">
      <Panel
        className="order-1 lg:order-1"
        title="레퍼런스 디자인"
        subtitle="프롬프트에 어울리는 시각 방향을 선택해요."
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {styleCategories.map((category) => (
            <button
              className={cn(
                "h-9 rounded-md border px-3 text-sm font-extrabold transition-colors",
                selectedCategory === category
                  ? "border-[#d97896] bg-[#d97896] text-white"
                  : "border-[#efd6ad] bg-[#fff0d8] text-[#7c5566] hover:bg-[#f7e7d4]",
              )}
              key={category}
              onClick={() => setSelectedCategory(category)}
              type="button"
            >
              {category}
            </button>
          ))}
        </div>

        <div className="mb-3 text-sm font-extrabold text-[#7c5566]">
          {visibleStylePresets.length}개 레퍼런스
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {visibleStylePresets.map((style) => (
            <button
              aria-pressed={style.id === selectedStyleId}
              className={cn(
                "relative grid h-full min-h-[260px] grid-rows-[auto_1fr] overflow-hidden rounded-lg border bg-white text-left transition-colors",
                style.id === selectedStyleId
                  ? "border-[#f4bf5f] shadow-[0_0_0_3px_#f4bf5f]"
                  : "border-[#efd6ad] hover:border-[#6ebfc4]",
              )}
              key={style.id}
              onClick={() => onSelect(style.id)}
              type="button"
            >
              {style.id === selectedStyleId && (
                <span className="absolute right-2 top-2 z-10 flex size-8 items-center justify-center rounded-full bg-[#f4bf5f] text-[#2b2b22] shadow">
                  <CheckCircle2 className="size-5" />
                </span>
              )}
              {style.thumbnail ? (
                <Image
                  alt={`${style.name} 썸네일`}
                  className="aspect-[3/4] w-full object-cover"
                  height={320}
                  src={style.thumbnail}
                  width={240}
                />
              ) : (
                <div className="flex aspect-[3/4] w-full items-center justify-center bg-[#fff0d8] text-[#9b6176]">
                  <Palette className="size-12" />
                </div>
              )}
              <div className="flex min-h-24 flex-col p-3">
                <p className="text-pretty font-extrabold">{style.name}</p>
                <p className="mt-1 text-pretty text-sm font-semibold leading-5 text-[#7c5566]">
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
                className="aspect-[3/4] w-full rounded-lg border border-[#efd6ad] object-cover"
                height={520}
                src={selectedStyle.thumbnail}
                width={390}
              />
            ) : (
              <div className="flex aspect-[3/4] w-full items-center justify-center rounded-lg border border-[#efd6ad] bg-[#fff0d8] text-[#9b6176]">
                <Palette className="size-16" />
              </div>
            )}
            <h2 className="mt-4 text-2xl font-extrabold">{selectedStyle.name}</h2>
            <p className="mt-2 text-pretty text-base font-semibold leading-7 text-[#7c5566]">
              {selectedStyle.description}
            </p>
          </>
        )}
      </Panel>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#efd6ad] bg-white/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-4px_16px_rgba(41,50,58,0.12)] backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <SecondaryButton className="hidden shrink-0 sm:inline-flex" onClick={onBack}>
            <ArrowLeft className="size-5" />
            이전
          </SecondaryButton>

          <div className="flex min-w-0 flex-1 items-center gap-3 rounded-md border border-[#efd6ad] bg-[#fff0d8] p-2">
            {selectedStyle?.thumbnail ? (
              <Image
                alt=""
                aria-hidden="true"
                className="size-12 shrink-0 rounded-md object-cover"
                height={48}
                src={selectedStyle.thumbnail}
                width={48}
              />
            ) : (
              <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-white text-[#9b6176]">
                <Palette className="size-6" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-xs font-extrabold text-[#d16f91]">
                {selectedStyle?.category}
              </p>
              <p className="truncate text-sm font-extrabold text-[#29323a] sm:text-base">
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
  history,
  isGenerating,
  onBack,
  onGenerate,
  onSelectSaved,
  remainingCount,
  selectedStyle,
  statusMessage,
}: {
  errorMessage: string;
  generatedImageUrl: string;
  hasReachedLimit: boolean;
  history: GeneratedImageHistoryItem[];
  isGenerating: boolean;
  onBack: () => void;
  onGenerate: () => void;
  onSelectSaved: (imageUrl: string) => void;
  remainingCount: number;
  selectedStyle?: StylePreset;
  statusMessage: string;
  studentDescription: string;
  uploadedImage: UploadedImage | null;
}) {
  const savedHistory = history.filter((item) => item.imageUrl !== generatedImageUrl);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
      <Panel title="이미지 생성" subtitle="완성 이미지를 확인하고 저장해요.">
        <div className="grid gap-4 md:grid-cols-[1fr_260px]">
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-[#efd6ad] bg-[#fff0d8]">
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
              <div className="text-center text-[#9b6176]">
                <Palette className="mx-auto size-16" />
                <p className="mt-3 text-xl font-extrabold">완성 이미지가 여기에 표시됩니다</p>
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-lg border border-[#efd6ad] bg-[#fff0d8] p-4">
            <p className="text-sm font-extrabold text-[#d16f91]">선택한 레퍼런스</p>
            <p className="text-xl font-extrabold">{selectedStyle?.name}</p>
            <p className="text-sm font-semibold leading-6 text-[#7c5566]">
              완성되면 보관함에 저장됩니다. 이 기기에서 최근 2개까지 다시 볼 수 있어요.
            </p>
            <p className="rounded-md bg-white px-3 py-2 text-sm font-extrabold text-[#7c5566]">
              남은 생성 횟수 {remainingCount}/5
            </p>
            <PrimaryButton className="sm:w-full" disabled={isGenerating || hasReachedLimit} onClick={onGenerate}>
              {isGenerating ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Sparkles className="size-5" />
              )}
              AI 이미지 생성하기
            </PrimaryButton>
            <SecondaryButton className="sm:w-full" disabled={!generatedImageUrl} onClick={() => saveImage(generatedImageUrl)}>
              <Download className="size-5" />
              현재 이미지 다운로드
            </SecondaryButton>
          </div>
        </div>

        {statusMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-[#6ebfc4] bg-[#e8fbfb] p-3 text-sm font-extrabold text-[#277077]">
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

      <Panel title="완성 이미지 보관함" subtitle={appCopy.history.description}>
        {savedHistory.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {savedHistory.map((item) => (
              <div
                className="overflow-hidden rounded-lg border border-[#efd6ad] bg-white"
                key={item.id}
              >
                <button
                  className="block w-full"
                  onClick={() => onSelectSaved(item.imageUrl)}
                  type="button"
                >
                  <Image
                    alt="저장된 완성 이미지"
                    className="aspect-square w-full object-cover"
                    height={260}
                    src={item.imageUrl}
                    unoptimized
                    width={260}
                  />
                </button>
                <div className="p-2">
                  <button
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[#efd6ad] bg-[#fff0d8] text-sm font-extrabold text-[#7c5566]"
                    onClick={() => saveImage(item.imageUrl)}
                    type="button"
                  >
                    <Download className="size-4" />
                    다운로드
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex min-h-56 items-center justify-center rounded-lg border border-dashed border-[#d8b985] bg-[#fff0d8] p-6 text-center text-[#9b6176]">
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
    <section className={cn("rounded-lg border border-[#efd6ad] bg-white p-4 shadow-[0_4px_0_#f0d7ab]", className)}>
      <div className="mb-4">
        <h2 className="text-balance text-2xl font-extrabold">{title}</h2>
        <p className="mt-1 text-pretty text-sm font-semibold leading-6 text-[#d16f91]">{subtitle}</p>
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
        "inline-flex h-[52px] min-h-[52px] w-full items-center justify-center gap-2 rounded-md bg-[#f4bf5f] px-5 text-base font-extrabold text-[#2b2b22] shadow-[0_4px_0_#d97896] transition-opacity disabled:opacity-50 sm:w-auto",
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
        "inline-flex h-12 w-full items-center justify-center gap-2 rounded-md border border-[#efd6ad] bg-white px-5 text-sm font-extrabold text-[#7c5566] transition-opacity disabled:opacity-50 sm:w-auto",
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
    <div className="mt-4 rounded-lg border border-[#d97896] bg-[#fff0f4] p-3 text-sm font-extrabold text-[#b74770]">
      {children}
    </div>
  );
}

function GuideModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      aria-label={guideCopy.title}
      aria-modal="true"
      className="fixed inset-0 z-50 bg-[#fff7ea]/80 p-4 backdrop-blur"
      role="dialog"
    >
      <div className="mx-auto max-h-[calc(100vh-2rem)] max-w-2xl overflow-auto rounded-lg border border-[#efd6ad] bg-white p-5 shadow-[0_4px_0_#f0d7ab]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-extrabold text-[#d16f91]">프롬프트 가이드</p>
            <h2 className="text-2xl font-extrabold">{guideCopy.title}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#7c5566]">
              {guideCopy.description}
            </p>
          </div>
          <button
            className="flex size-10 items-center justify-center rounded-md border border-[#efd6ad] bg-white"
            onClick={onClose}
            type="button"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {guideCopy.sections.map((section) => (
            <div
              className="rounded-lg border border-[#efd6ad] bg-[#fff0d8] p-4"
              key={section.title}
            >
              <p className="text-2xl">{section.emoji}</p>
              <h3 className="mt-2 font-extrabold">{section.title}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#7c5566]">
                {section.example}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-dashed border-[#d8b985] bg-[#fffaf1] p-4 text-sm font-extrabold leading-7">
          {guideCopy.template}
        </div>
      </div>
    </div>
  );
}
