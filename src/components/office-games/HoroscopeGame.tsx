"use client";

import { useEffect, useState } from "react";
import { fireConfetti } from "@/lib/confetti";
import {
  HOROSCOPE_QUESTIONS,
  PERSONALITIES,
  resolvePersonality,
  type PersonalityResult,
} from "@/lib/office-games/horoscope";
import { useFunLab } from "@/components/fun-lab/FunLabContext";
import { useT } from "@/lib/language";
import { GameIntro, GameProgress, GameResult, OptionButton } from "./GameChrome";

type Phase = "intro" | "play" | "result";

export default function HoroscopeGame() {
  const t = useT();
  const { vote, state } = useFunLab();
  const lockedPersonality = state.mine.officeHoroscope?.personality;
  const [phase, setPhase] = useState<Phase>(lockedPersonality ? "result" : "intro");
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<string[]>([]);
  const [result, setResult] = useState<PersonalityResult | null>(
    lockedPersonality ? PERSONALITIES[lockedPersonality] : null,
  );
  const [copied, setCopied] = useState(false);

  const total = HOROSCOPE_QUESTIONS.length;
  const q = HOROSCOPE_QUESTIONS[index]!;
  const locked = Boolean(lockedPersonality);

  useEffect(() => {
    if (!lockedPersonality) return;
    setResult(PERSONALITIES[lockedPersonality]);
    setPhase("result");
  }, [lockedPersonality]);

  const start = () => {
    if (locked) return;
    setPhase("play");
    setIndex(0);
    setPicks([]);
    setResult(null);
    setCopied(false);
  };

  const choose = (optionId: string) => {
    if (locked) return;
    const next = [...picks.slice(0, index), optionId];
    setPicks(next);
    if (index + 1 >= total) {
      const personality = resolvePersonality(next);
      setResult(personality);
      void vote("og-horoscope", { personality: personality.id });
      setPhase("result");
      fireConfetti(0.9);
      return;
    }
    setIndex((i) => i + 1);
  };

  const share = async () => {
    if (!result) return;
    const text = `${t(result.title)} — ${t(result.description)}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (phase === "result" && result) {
    return (
      <GameResult
        title={t(result.title)}
        message={t("Your Christmas character")}
        detail={t(result.description)}
        locked
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

  if (phase === "intro") {
    return (
      <GameIntro
        title={t("Christmas horoscope")}
        blurb={t("Answer five questions and meet your Christmas personality.")}
        meta={`${t("5 questions")} · ${t("~2 min")} · ${t("One reveal only")}`}
        onStart={start}
      />
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
