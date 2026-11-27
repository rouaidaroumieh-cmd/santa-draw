"use client";

import { useState } from "react";
import { fireConfetti } from "@/lib/confetti";
import { rankingMessage } from "@/lib/office-games/catalog";
import { pickSackRound, roundMaxScore, type SackQuestion } from "@/lib/office-games/santa-sack";
import { useFunLab } from "@/components/fun-lab/FunLabContext";
import { useT } from "@/lib/language";
import { GameIntro, GameProgress, GameResult, OptionButton } from "./GameChrome";

type Phase = "intro" | "play" | "result";

export default function SantaSackGame() {
  const t = useT();
  const { vote } = useFunLab();
  const [phase, setPhase] = useState<Phase>("intro");
  const [deck, setDeck] = useState<SackQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const [score, setScore] = useState(0);
  const [reveal, setReveal] = useState(false);

  const total = deck.length;
  const q = deck[index];
  const revealed = picked !== null;
  const roundMax = roundMaxScore(deck);

  const start = () => {
    setDeck(pickSackRound());
    setPhase("play");
    setIndex(0);
    setPicked(null);
    setHintUsed(false);
    setScore(0);
    setReveal(false);
  };

  const choose = (i: number) => {
    if (!q || revealed) return;
    setPicked(i);
    setReveal(true);
    if (i === q.answer) {
      const pts = hintUsed ? q.pointsHint : q.pointsFull;
      setScore((s) => s + pts);
      fireConfetti(0.45);
    }
  };

  const next = () => {
    if (index + 1 >= total) {
      void vote("og-sack", { best: score });
      setPhase("result");
      if (score >= roundMax * 0.7) fireConfetti(0.95);
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
    setHintUsed(false);
    setReveal(false);
  };

  if (phase === "intro") {
    return (
      <GameIntro
        title={t("Guess what's in Santa's sack")}
        blurb={t("Identify the hidden festive object — hints cost points.")}
        meta={`${t("7 random objects")} · ${t("~2 min")} · ${t("Play as often as you like")}`}
        onStart={start}
      />
    );
  }

  if (phase === "result") {
    return (
      <GameResult
        title={t("You scored {score} out of {total}!", { score, total: roundMax })}
        message={rankingMessage(score, roundMax)}
        onAgain={start}
      />
    );
  }

  if (!q) {
    return null;
  }

  const blur = revealed ? 0 : q.difficulty === "easy" ? 6 : q.difficulty === "medium" ? 12 : 18;
  const scale = revealed ? 1 : 1.08;

  return (
    <div className="paper gold-frame flex flex-col gap-5 px-6 py-7" style={{ borderRadius: 2 }}>
      <GameProgress current={index + 1} total={total} showScore={false} />
      <p className="text-right text-[0.85rem] text-[#6E6A5E]">
        {t("Live score")}: {score}/{roundMax}
      </p>

      <div className="relative mx-auto w-full max-w-[320px]">
        <div
          className="flex aspect-square flex-col items-center justify-center overflow-hidden border border-[rgba(122,31,43,0.35)] bg-[radial-gradient(circle_at_50%_30%,#A33444_0%,#7A1F2B_55%,#4a1219_100%)]"
          style={{ borderRadius: "50% 50% 42% 42%" }}
          aria-hidden
        >
          <p className="label mb-2 text-[#F8F3E9]">{t("Santa's sack")}</p>
          {/* key remounts each object already blurred — no filter transition from 0 */}
          <span
            key={q.id}
            className={
              reveal
                ? "fun-lab-tada-pop text-[4.5rem] leading-none"
                : "text-[4.5rem] leading-none"
            }
            style={{
              filter: `blur(${blur}px)`,
              transform: `scale(${scale})`,
              transition: reveal ? "filter 500ms ease, transform 500ms ease" : "none",
            }}
          >
            {q.emoji}
          </span>
        </div>
        {revealed ? (
          <p className="mt-3 text-center text-[1.05rem] text-[#173D32]" style={{ fontWeight: 600 }}>
            {q.objectLabel}
          </p>
        ) : null}
      </div>

      {!revealed ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[0.85rem] text-[#6E6A5E]">
            {t("Difficulty")}: {t(q.difficulty)}
            {hintUsed ? ` · ${t("Hint used (-points)")}` : ""}
          </p>
          <button
            type="button"
            className="btn btn-ghost !text-[#173D32] !border-[rgba(23,61,50,0.35)]"
            disabled={hintUsed}
            onClick={() => setHintUsed(true)}
          >
            {t("Show hint")}
          </button>
        </div>
      ) : null}

      {hintUsed && !revealed ? (
        <p
          className="border border-[rgba(176,143,76,0.35)] bg-[rgba(176,143,76,0.12)] px-4 py-3 text-[0.95rem] text-[#173D32]"
          style={{ borderRadius: 2 }}
        >
          {q.hint}
        </p>
      ) : null}

      <div className="grid gap-3">
        {q.options.map((label, i) => {
          let state: "idle" | "correct" | "wrong" = "idle";
          if (revealed) {
            if (i === q.answer) state = "correct";
            else if (i === picked) state = "wrong";
          }
          return (
            <OptionButton key={`${q.id}-${label}`} disabled={revealed} state={state} onClick={() => choose(i)}>
              {label}
            </OptionButton>
          );
        })}
      </div>

      {revealed ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[0.95rem] text-[#3D3A30]" style={{ fontWeight: 500 }}>
            {picked === q.answer
              ? t("Correct!")
              : t("Not quite — it was {name}.", { name: q.objectLabel })}
          </p>
          <button type="button" className="btn btn-dark" onClick={next}>
            {index + 1 >= total ? t("See my score") : t("Next question")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
