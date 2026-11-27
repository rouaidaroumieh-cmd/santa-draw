"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useT } from "@/lib/language";

export function GameProgress({
  current,
  total,
  score,
  showScore = true,
}: {
  current: number;
  total: number;
  score?: number;
  showScore?: boolean;
}) {
  const t = useT();
  const pct = total <= 0 ? 0 : Math.round((current / total) * 100);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="label text-[#6E6A5E]">
          {t("Question {number} of {total}", { number: current, total })}
        </p>
        {showScore && typeof score === "number" ? (
          <p className="text-[0.9rem] font-medium text-[#173D32]">
            {t("Score {score}/{played}", { score, played: Math.max(0, current - 1) })}
          </p>
        ) : null}
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-[rgba(23,61,50,0.12)]"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t("Progress")}
      >
        <div className="h-full rounded-full bg-[#B08F4C] transition-[width] duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function GameIntro({
  title,
  blurb,
  meta,
  onStart,
}: {
  title: string;
  blurb: string;
  meta: string;
  onStart: () => void;
}) {
  const t = useT();
  return (
    <div className="paper gold-frame flex flex-col gap-6 px-6 py-10 text-center" style={{ borderRadius: 2 }}>
      <p className="label text-[#B08F4C]">{t("Christmas Office Games")}</p>
      <h1 className="text-[clamp(1.8rem,4vw,2.6rem)] leading-tight text-[#173D32]" style={{ fontWeight: 600 }}>
        {title}
      </h1>
      <p className="mx-auto max-w-[520px] font-display text-[1.15rem] italic leading-relaxed text-[#3D3A30]">
        {blurb}
      </p>
      <p className="text-[0.9rem] text-[#6E6A5E]">{meta}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button type="button" className="btn btn-dark" onClick={onStart}>
          {t("Start game")}
        </button>
        <Link href="/games" className="btn btn-ghost !text-[#173D32] !border-[rgba(23,61,50,0.35)]">
          {t("Back to games")}
        </Link>
      </div>
    </div>
  );
}

export function GameResult({
  title,
  message,
  detail,
  children,
  onAgain,
}: {
  title: string;
  message: string;
  detail?: string;
  children?: ReactNode;
  onAgain: () => void;
}) {
  const t = useT();
  return (
    <div className="paper gold-frame flex flex-col items-center gap-5 px-6 py-10 text-center" style={{ borderRadius: 2 }}>
      <p className="label text-[#B08F4C]">{t("Results")}</p>
      <h2 className="text-[clamp(1.6rem,3.5vw,2.2rem)] leading-tight text-[#173D32]" style={{ fontWeight: 600 }}>
        {title}
      </h2>
      <p className="font-display text-[1.35rem] italic text-[#245C46]">{message}</p>
      {detail ? <p className="max-w-[480px] text-[1rem] leading-relaxed text-[#3D3A30]">{detail}</p> : null}
      {children}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <button type="button" className="btn btn-dark" onClick={onAgain}>
          {t("Play again")}
        </button>
        <Link href="/games" className="btn btn-ghost !text-[#173D32] !border-[rgba(23,61,50,0.35)]">
          {t("Back to games")}
        </Link>
      </div>
    </div>
  );
}

export function OptionButton({
  children,
  onClick,
  disabled,
  state = "idle",
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  state?: "idle" | "correct" | "wrong" | "selected";
}) {
  const tone =
    state === "correct"
      ? "border-[#245C46] bg-[rgba(36,92,70,0.18)] text-[#173D32]"
      : state === "wrong"
        ? "border-[#7A1F2B] bg-[rgba(122,31,43,0.12)] text-[#7A1F2B]"
        : state === "selected"
          ? "border-[#173D32] ring-2 ring-[#B08F4C] text-[#173D32]"
          : "border-[rgba(23,61,50,0.25)] text-[#173D32] hover:border-[#B08F4C]";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`border px-4 py-3.5 text-left text-[1rem] transition-colors ${tone}`}
      style={{ borderRadius: 2, fontWeight: 500 }}
    >
      {children}
    </button>
  );
}
