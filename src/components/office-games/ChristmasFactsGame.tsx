"use client";

import { useState } from "react";
import { fireConfetti } from "@/lib/confetti";
import { rankingMessage } from "@/lib/office-games/catalog";
import {
  CHRISTMAS_FACTS,
  colleagueName,
} from "@/lib/office-games/christmas-facts";
import { useT } from "@/lib/language";
import { GameIntro, GameProgress, GameResult, OptionButton } from "./GameChrome";

type Phase = "intro" | "play" | "result";

export default function ChristmasFactsGame() {
  const t = useT();
  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  const total = CHRISTMAS_FACTS.length;
  const q = CHRISTMAS_FACTS[index]!;
  const revealed = picked !== null;

  const start = () => {
    setPhase("play");
    setIndex(0);
    setPicked(null);
    setScore(0);
  };

  const choose = (id: string) => {
    if (revealed) return;
    setPicked(id);
    if (id === q.answerId) {
      setScore((s) => s + 1);
      fireConfetti(0.55);
    }
  };

  const next = () => {
    if (index + 1 >= total) {
      setPhase("result");
      if (score + (picked === q.answerId ? 0 : 0) >= total) fireConfetti(1.1);
      else if (score / total >= 0.8) fireConfetti(0.8);
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
  };

  if (phase === "intro") {
    return (
      <GameIntro
        title={t("Who’s behind the Christmas fact?")}
        blurb={t("Guess which colleague matches a fun festive fact.")}
        meta={`${t("8 facts")} · ${t("~2 min")} · ${t("Sample placeholders — edit the data file later.")}`}
        onStart={start}
      />
    );
  }

  if (phase === "result") {
    return (
      <GameResult
        title={t("You scored {score} out of {total}!", { score, total })}
        message={rankingMessage(score, total)}
        detail={t("Tip: replace SAMPLE colleagues and facts in the data file when ready.")}
        onAgain={start}
      />
    );
  }

  return (
    <div className="paper gold-frame flex flex-col gap-5 px-6 py-7" style={{ borderRadius: 2 }}>
      <GameProgress current={index + 1} total={total} showScore={false} />
      <p className="-mt-1 text-right text-[0.85rem] text-[#6E6A5E]">
        {t("Live score")}: {score}
      </p>

      <div>
        <p className="label text-[#B08F4C]">{t("Anonymous fact")}</p>
        <h2 className="mt-2 text-[1.35rem] leading-snug text-[#173D32]" style={{ fontWeight: 600 }}>
          “{q.fact}”
        </h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {q.optionIds.map((id) => {
          let state: "idle" | "correct" | "wrong" | "selected" = "idle";
          if (revealed) {
            if (id === q.answerId) state = "correct";
            else if (id === picked) state = "wrong";
          }
          return (
            <OptionButton key={id} disabled={revealed} state={state} onClick={() => choose(id)}>
              {colleagueName(id)}
            </OptionButton>
          );
        })}
      </div>

      {revealed ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[0.95rem] text-[#3D3A30]" style={{ fontWeight: 500 }}>
            {picked === q.answerId
              ? t("Correct!")
              : t("Not quite — it was {name}.", { name: colleagueName(q.answerId) })}
          </p>
          <button type="button" className="btn btn-dark" onClick={next}>
            {index + 1 >= total ? t("See my score") : t("Next question")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
