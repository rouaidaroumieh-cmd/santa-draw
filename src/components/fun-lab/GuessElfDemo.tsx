"use client";

import { useEffect, useState } from "react";
import { fireConfetti } from "@/lib/confetti";
import { useT } from "@/lib/language";
import { DEMO_PARTICIPANTS } from "./demoData";

const ROUND_LIMIT = 10;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

type Round = {
  answer: (typeof DEMO_PARTICIPANTS)[number];
  options: string[];
};

function makeRound(excludeNames: string[] = []): Round {
  const pool = DEMO_PARTICIPANTS.filter((p) => !excludeNames.includes(p.name));
  const source = pool.length >= 4 ? pool : [...DEMO_PARTICIPANTS];
  const answer = source[Math.floor(Math.random() * source.length)];
  const distractors = shuffle(DEMO_PARTICIPANTS.filter((p) => p.name !== answer.name))
    .slice(0, 3)
    .map((p) => p.name);
  return {
    answer,
    options: shuffle([answer.name, ...distractors]),
  };
}

/** Guess who the blurred elf is — 10 rounds, tada + confetti on a perfect score. */
export default function GuessElfDemo() {
  const t = useT();
  const [round, setRound] = useState<Round | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [played, setPlayed] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    setRound(makeRound());
  }, []);

  useEffect(() => {
    if (!finished || score !== ROUND_LIMIT) return;
    fireConfetti(1.35);
  }, [finished, score]);

  const revealed = picked !== null;
  const correct = round !== null && picked === round.answer.name;
  const isLastRound = played >= ROUND_LIMIT;
  const perfect = finished && score === ROUND_LIMIT;

  const choose = (name: string) => {
    if (!round || picked !== null || finished || played >= ROUND_LIMIT) return;
    setPicked(name);
    setPlayed((n) => n + 1);
    if (name === round.answer.name) setScore((s) => s + 1);
  };

  const next = () => {
    if (!round) return;
    if (played >= ROUND_LIMIT) {
      setFinished(true);
      return;
    }
    const nextHistory = [...history, round.answer.name].slice(-8);
    setHistory(nextHistory);
    setPicked(null);
    setRound(makeRound(nextHistory));
  };

  const restart = () => {
    setScore(0);
    setPlayed(0);
    setHistory([]);
    setPicked(null);
    setFinished(false);
    setRound(makeRound());
  };

  if (!round) {
    return (
      <div className="paper gold-frame px-6 py-10 text-center text-[#6E6A5E]" style={{ borderRadius: 2 }}>
        {t("Loading…")}
      </div>
    );
  }

  if (finished) {
    return (
      <div
        className={`paper gold-frame relative overflow-hidden px-6 py-10 text-center ${perfect ? "fun-lab-tada" : ""}`}
        style={{ borderRadius: 2 }}
      >
        {perfect ? (
          <>
            <p className="label text-[#B08F4C]">{t("Perfect score!")}</p>
            <p className="fun-lab-tada-pop mt-4 font-display text-[2.4rem] italic leading-none text-[#173D32]">
              {t("Tada!")}
            </p>
            <p className="mt-4 text-[1.15rem] text-[#245C46]">
              {t("You scored {score} out of {total}!", { score, total: ROUND_LIMIT })}
            </p>
            <p className="mt-2 text-[0.9rem] text-[#6E6A5E]">
              {t("Elf master — every face unmasked.")}
            </p>
          </>
        ) : (
          <>
            <p className="font-display text-[1.6rem] italic text-[#173D32]">
              {t("You scored {score} out of {total}!", { score, total: ROUND_LIMIT })}
            </p>
            <p className="label mt-3 text-[#6E6A5E]">
              {score >= 7
                ? t("Strong elf vision.")
                : t("Try again — the hats are tricky.")}
            </p>
          </>
        )}
        <button type="button" className="btn btn-dark mt-8" onClick={restart}>
          {t("Play again")}
        </button>
      </div>
    );
  }

  return (
    <div className="paper gold-frame flex flex-col gap-5 px-6 py-7" style={{ borderRadius: 2 }}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label text-[#B08F4C]">{t("Who is this elf?")}</p>
          <h3 className="mt-2 text-[1.35rem] leading-snug text-[#173D32]">
            {t("Name the colleague behind the costume.")}
          </h3>
        </div>
        <div className="text-right">
          <p className="label text-[#6E6A5E]">
            {t("Round {number} of {total}", {
              number: Math.min(revealed ? played : played + 1, ROUND_LIMIT),
              total: ROUND_LIMIT,
            })}
          </p>
          <p className="mt-1 text-[0.85rem] text-[#173D32]">
            {t("Score {score}/{played}", { score, played })}
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[280px] overflow-hidden border border-[rgba(23,61,50,0.2)]" style={{ borderRadius: 2 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={round.answer.name + String(played)}
          src={round.answer.photo}
          alt={revealed ? round.answer.name : t("Mystery elf")}
          className="aspect-square w-full object-cover"
          style={{
            filter: revealed ? "blur(0)" : "blur(22px)",
            transform: revealed ? "scale(1)" : "scale(1.15)",
            transition: revealed ? "filter 400ms ease, transform 400ms ease" : "none",
          }}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {round.options.map((optionName) => {
          const isAnswer = revealed && optionName === round.answer.name;
          const isWrong = revealed && optionName === picked && optionName !== round.answer.name;
          return (
            <button
              key={optionName}
              type="button"
              disabled={revealed}
              onClick={() => choose(optionName)}
              className={`border px-4 py-3 text-left capitalize transition-colors ${
                isAnswer
                  ? "border-[#245C46] bg-[rgba(36,92,70,0.18)] text-[#173D32]"
                  : isWrong
                    ? "border-[#7A1F2B] bg-[rgba(122,31,43,0.12)] text-[#7A1F2B]"
                    : "border-[rgba(23,61,50,0.25)] text-[#173D32] hover:border-[#B08F4C]"
              }`}
              style={{ borderRadius: 2 }}
            >
              {optionName}
            </button>
          );
        })}
      </div>

      {revealed ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[0.9rem] text-[#3D3A30]">
            {correct
              ? t("Correct!")
              : t("Not quite — it was {name}.", { name: round.answer.name })}
          </p>
          <button type="button" className="btn btn-dark" onClick={next}>
            {isLastRound ? t("See my score") : t("Next elf")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
