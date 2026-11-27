"use client";

import { useState } from "react";
import { fireConfetti } from "@/lib/confetti";
import { rankingMessage } from "@/lib/office-games/catalog";
import { GUESS_MOVIE_QUESTIONS } from "@/lib/office-games/guess-movie";
import { useT } from "@/lib/language";
import { GameIntro, GameProgress, GameResult, OptionButton } from "./GameChrome";

type Phase = "intro" | "play" | "result";

export default function GuessMovieGame() {
  const t = useT();
  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [pop, setPop] = useState(false);

  const total = GUESS_MOVIE_QUESTIONS.length;
  const q = GUESS_MOVIE_QUESTIONS[index]!;
  const revealed = picked !== null;

  const start = () => {
    setPhase("play");
    setIndex(0);
    setPicked(null);
    setScore(0);
    setPop(false);
  };

  const choose = (i: number) => {
    if (revealed) return;
    setPicked(i);
    if (i === q.answer) {
      setScore((s) => s + 1);
      setPop(true);
      fireConfetti(0.5);
      setTimeout(() => setPop(false), 600);
    }
  };

  const next = () => {
    if (index + 1 >= total) {
      setPhase("result");
      if (score >= total - 1) fireConfetti(1);
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
  };

  if (phase === "intro") {
    return (
      <GameIntro
        title={t("Guess the Christmas movie")}
        blurb={t("Decode emoji clues into classic Christmas films.")}
        meta={`${t("7 movies")} · ${t("~2 min")}`}
        onStart={start}
      />
    );
  }

  if (phase === "result") {
    return (
      <GameResult
        title={t("You scored {score} out of {total}!", { score, total })}
        message={rankingMessage(score, total)}
        onAgain={start}
      />
    );
  }

  return (
    <div className="paper gold-frame flex flex-col gap-5 px-6 py-7" style={{ borderRadius: 2 }}>
      <GameProgress current={index + 1} total={total} showScore={false} />
      <p className="text-right text-[0.85rem] text-[#6E6A5E]">
        {t("Live score")}: {score}
      </p>

      <div
        className={`mx-auto flex min-h-[120px] w-full max-w-[420px] items-center justify-center border border-[rgba(23,61,50,0.15)] bg-[rgba(23,61,50,0.04)] px-4 py-8 text-center text-[2.8rem] leading-none sm:text-[3.4rem] ${
          pop ? "fun-lab-tada-pop" : ""
        }`}
        style={{ borderRadius: 2 }}
        aria-label={t("Emoji clue")}
      >
        {q.emojis}
      </div>

      <div className="grid gap-3">
        {q.options.map((label, i) => {
          let state: "idle" | "correct" | "wrong" = "idle";
          if (revealed) {
            if (i === q.answer) state = "correct";
            else if (i === picked) state = "wrong";
          }
          return (
            <OptionButton key={label} disabled={revealed} state={state} onClick={() => choose(i)}>
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
              : t("Not quite — it was {name}.", { name: q.options[q.answer]! })}
          </p>
          <button type="button" className="btn btn-dark" onClick={next}>
            {index + 1 >= total ? t("See my score") : t("Next question")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
