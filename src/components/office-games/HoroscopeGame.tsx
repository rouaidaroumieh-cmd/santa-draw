"use client";

import { useState } from "react";
import { fireConfetti } from "@/lib/confetti";
import {
  HOROSCOPE_QUESTIONS,
  resolvePersonality,
  type PersonalityResult,
} from "@/lib/office-games/horoscope";
import { useT } from "@/lib/language";
import { GameIntro, GameProgress, GameResult, OptionButton } from "./GameChrome";

type Phase = "intro" | "play" | "result";

export default function HoroscopeGame() {
  const t = useT();
  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<string[]>([]);
  const [result, setResult] = useState<PersonalityResult | null>(null);
  const [copied, setCopied] = useState(false);

  const total = HOROSCOPE_QUESTIONS.length;
  const q = HOROSCOPE_QUESTIONS[index]!;

  const start = () => {
    setPhase("play");
    setIndex(0);
    setPicks([]);
    setResult(null);
    setCopied(false);
  };

  const choose = (optionId: string) => {
    const next = [...picks.slice(0, index), optionId];
    setPicks(next);
    if (index + 1 >= total) {
      const personality = resolvePersonality(next);
      setResult(personality);
      setPhase("result");
      fireConfetti(0.9);
      return;
    }
    setIndex((i) => i + 1);
  };

  const share = async () => {
    if (!result) return;
    const text = `${result.title} — ${result.description}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (phase === "intro") {
    return (
      <GameIntro
        title={t("Christmas horoscope")}
        blurb={t("Answer five questions and meet your Christmas personality.")}
        meta={`${t("5 questions")} · ${t("~2 min")}`}
        onStart={start}
      />
    );
  }

  if (phase === "result" && result) {
    return (
      <GameResult
        title={result.title}
        message={t("Your Christmas character")}
        detail={result.description}
        onAgain={start}
      >
        <div
          className="flex h-28 w-28 items-center justify-center border border-[rgba(176,143,76,0.45)] bg-[rgba(176,143,76,0.15)] text-[2.8rem] text-[#173D32]"
          style={{ borderRadius: 2 }}
          aria-hidden
        >
          {result.glyph}
        </div>
        <button type="button" className="btn btn-gold" onClick={() => void share()}>
          {copied ? t("Copied!") : t("Share result")}
        </button>
      </GameResult>
    );
  }

  return (
    <div className="paper gold-frame flex flex-col gap-5 px-6 py-7" style={{ borderRadius: 2 }}>
      <GameProgress current={index + 1} total={total} showScore={false} />
      <h2 className="text-[1.35rem] leading-snug text-[#173D32]" style={{ fontWeight: 600 }}>
        {q.prompt}
      </h2>
      <div className="grid gap-3">
        {q.options.map((opt) => (
          <OptionButton key={opt.id} onClick={() => choose(opt.id)}>
            {opt.label}
          </OptionButton>
        ))}
      </div>
    </div>
  );
}
