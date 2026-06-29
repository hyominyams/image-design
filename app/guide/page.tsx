import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Brush,
  Lightbulb,
  MapPin,
  Palette,
  PencilLine,
  Shapes,
  Sparkles,
  XCircle,
} from "lucide-react";

import { guideCopy } from "@/lib/guideContent";

export const metadata = {
  title: guideCopy.title,
  description: guideCopy.description,
};

const sectionIcons = [Lightbulb, Shapes, Palette, MapPin];

const shell = "studio-panel rounded-xl";
const softPanel = "rounded-lg border border-[var(--studio-line)] bg-[var(--studio-paper)]";
const summaryIcons = [Lightbulb, Shapes, Palette, MapPin];

export default function GuidePage() {
  return (
    <main className="studio-shell min-h-screen">
      <div className="studio-page flex flex-col gap-4">
        <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="studio-frame overflow-hidden rounded-xl">
            <div className="grid gap-6 p-5 sm:p-6 md:grid-cols-[1fr_250px] md:items-center">
              <div className="space-y-5">
                <Link
                  className="studio-button-secondary inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-bold transition-colors"
                  href="/"
                >
                  <ArrowLeft className="size-4" />
                  {guideCopy.back}
                </Link>

                <div className="space-y-3">
                  <p className="inline-flex rounded-md bg-[var(--studio-ink)] px-3 py-1 text-sm font-bold text-[#fffaf3]">
                    {guideCopy.eyebrow}
                  </p>
                  <h1 className="text-balance max-w-3xl text-3xl font-extrabold leading-tight sm:text-4xl">
                    {guideCopy.title}
                  </h1>
                  <p className="text-pretty max-w-2xl text-base font-semibold leading-7 text-[var(--studio-subtle)] sm:text-lg">
                    {guideCopy.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {guideCopy.summaryCards.map((card, index) => {
                    const Icon = summaryIcons[index] ?? Lightbulb;

                    return (
                    <div className={`${softPanel} p-3`} key={card.label}>
                      <span className="flex size-9 items-center justify-center rounded-md bg-[var(--studio-panel)] text-[var(--studio-sage)] shadow-[var(--studio-shadow-xs)]">
                        <Icon className="size-4" />
                      </span>
                      <p className="mt-2 text-sm font-extrabold">{card.label}</p>
                      <p className="mt-1 text-pretty text-xs font-semibold leading-5 text-[var(--studio-subtle)]">
                        {card.value}
                      </p>
                    </div>
                    );
                  })}
                </div>
              </div>

              <div className={`${softPanel} hidden p-3 md:block`}>
                <Image
                  alt="이미지 프롬프트 예시"
                  className="aspect-square w-full rounded-md border border-[var(--studio-line)] bg-[var(--studio-panel)] object-cover"
                  height={320}
                  priority
                  src="/studio/studio-material-board.png"
                  width={320}
                />
                <p className="mt-4 text-pretty text-lg font-extrabold leading-7">
                  프롬프트 + 참고 이미지
                </p>
                <p className="mt-2 text-pretty text-sm font-semibold leading-6 text-[var(--studio-subtle)]">
                  원하는 대상과 분위기를 함께 적으면 결과가 선명해집니다.
                </p>
              </div>
            </div>
          </div>

          <div className={`${shell} p-5`}>
            <div className="mb-4 flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-[var(--studio-ink)] text-[#fffaf3] shadow-[var(--studio-shadow-xs)]">
                <Brush className="size-5" />
              </span>
              <div>
                <h2 className="text-balance text-xl font-extrabold">
                  {guideCopy.paletteTitle}
                </h2>
                <p className="mt-1 text-pretty text-sm font-semibold leading-6 text-[var(--studio-subtle)]">
                  색과 질감을 함께 쓰면 이미지의 분위기가 또렷해집니다.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {guideCopy.palette.map((color) => (
                <div
                  className={`${softPanel} flex items-center gap-3 p-3`}
                  key={color.name}
                >
                  <span
                    aria-hidden="true"
                  className="size-10 shrink-0 rounded-md border border-[var(--studio-line)]"
                    style={{ backgroundColor: color.hex }}
                  />
                  <div>
                    <p className="text-sm font-extrabold">{color.name}</p>
                    <p className="text-pretty text-xs font-semibold leading-5 text-[var(--studio-subtle)]">
                      {color.hint}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {guideCopy.sections.map((section, index) => {
            const Icon = sectionIcons[index] ?? Sparkles;

            return (
              <article className={`${shell} p-5`} key={section.title}>
                <div className="flex items-start gap-3">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-[var(--studio-ink)] text-[#fffaf3] shadow-[var(--studio-shadow-xs)]">
                    <Icon className="size-6" />
                  </span>
                  <div>
                    <h2 className="text-balance text-xl font-extrabold">
                      {section.title}
                    </h2>
                    <p className="mt-1 text-pretty text-sm font-semibold leading-6 text-[var(--studio-clay)]">
                      {section.short}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-pretty text-sm font-semibold leading-6 text-[var(--studio-subtle)]">
                  {section.body}
                </p>
                <div className={`${softPanel} mt-4 p-4`}>
                  <p className="text-pretty text-sm font-extrabold leading-6">
                    {section.example}
                  </p>
                </div>
              </article>
            );
          })}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <ExampleCard
            icon={<XCircle className="size-5" />}
            tone="bad"
            title={guideCopy.examples.weak.label}
            reason={guideCopy.examples.weak.reason}
            text={guideCopy.examples.weak.text}
          />
          <ExampleCard
            icon={<BadgeCheck className="size-5" />}
            tone="good"
            title={guideCopy.examples.strong.label}
            reason={guideCopy.examples.strong.reason}
            text={guideCopy.examples.strong.text}
          />
        </section>

        <section className={`${shell} p-5`}>
          <div className="mb-4 flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-[var(--studio-teal)] text-[var(--accent-foreground)] shadow-[var(--studio-shadow-xs)]">
              <PencilLine className="size-5" />
            </span>
            <div>
              <h2 className="text-balance text-xl font-extrabold">
                {guideCopy.templateTitle}
              </h2>
              <p className="mt-1 text-pretty text-sm font-semibold leading-6 text-[var(--studio-subtle)]">
                빈칸을 채우면 바로 생성할 수 있는 프롬프트가 됩니다.
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-dashed border-[var(--studio-line)] bg-[var(--studio-paper)] p-5 text-pretty text-base font-extrabold leading-8">
            {guideCopy.template}
          </div>
        </section>
      </div>
    </main>
  );
}

function ExampleCard({
  icon,
  reason,
  text,
  title,
  tone,
}: {
  icon: ReactNode;
  reason: string;
  text: string;
  title: string;
  tone: "bad" | "good";
}) {
  const isGood = tone === "good";

  return (
    <article className={`${shell} p-5`}>
      <div className="mb-4 flex items-start gap-3">
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-md ${
            isGood
              ? "bg-[rgb(93_154_160_/_0.12)] text-[var(--studio-teal)] shadow-[0_10px_22px_rgba(36,43,45,0.10)]"
              : "bg-[rgb(180_92_106_/_0.10)] text-[var(--destructive)] shadow-[0_10px_22px_rgba(36,43,45,0.10)]"
          }`}
        >
          {icon}
        </span>
        <div>
          <h2 className="text-balance text-xl font-extrabold">{title}</h2>
          <p className="mt-1 text-pretty text-sm font-semibold leading-6 text-[var(--studio-subtle)]">
            {reason}
          </p>
        </div>
      </div>
      <div
        className={`rounded-lg border p-5 text-pretty text-base font-extrabold leading-8 ${
          isGood
            ? "border-[rgb(93_154_160_/_0.36)] bg-[rgb(93_154_160_/_0.12)] text-[var(--studio-ink)]"
            : "border-[rgb(180_92_106_/_0.38)] bg-[rgb(180_92_106_/_0.10)] text-[var(--destructive)]"
        }`}
      >
        {text}
      </div>
    </article>
  );
}
