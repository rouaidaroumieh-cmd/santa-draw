"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/language";
import { DEMO_PARTICIPANTS } from "./demoData";

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

/** Guess who the blurred elf is — session score only. */
export default function GuessElfDemo() {
  const t = useT();
  const [round, setRound] = useState<Round | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [played, setPlayed] = useState(0);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    setRound(makeRound());
  }, []);

  const revealed = picked !== null;
  const correct = round !== null && picked === round.answer.name;

  const choose = (name: string) => {
    if (!round || picked !== null) return;
    setPicked(name);
    setPlayed((n) => n + 1);
    if (name === round.answer.name) setScore((s) => s + 1);
  };

  const next = () => {
    if (!round) return;
    const nextHistory = [...history, round.answer.name].slice(-8);
    setHistory(nextHistory);
    setPicked(null);
    setRound(makeRound(nextHistory));
  };

  if (!round) {
    return (
      <div className="paper gold-frame px-6 py-10 text-center text-[#6E6A5E]" style={{ borderRadius: 2 }}>
        {t("Loading…")}
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
        <p className="label text-[#6E6A5E]">
          {t("Score {score}/{played}", { score, played })}
        </p>
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
        {round.options.map((name) => {
          const isAnswer = revealed && name === round.answer.name;
          const isWrong = revealed && name === picked && name !== round.answer.name;
          return (
            <button
              key={name}
              type="button"
              disabled={revealed}
              onClick={() => choose(name)}
              className={`border px-4 py-3 text-left capitalize transition-colors ${
                isAnswer
                  ? "border-[#245C46] bg-[rgba(36,92,70,0.18)] text-[#173D32]"
                  : isWrong
                    ? "border-[#7A1F2B] bg-[rgba(122,31,43,0.12)] text-[#7A1F2B]"
                    : "border-[rgba(23,61,50,0.25)] text-[#173D32] hover:border-[#B08F4C]"
              }`}
              style={{ borderRadius: 2 }}
            >
              {name}
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
            {t("Next elf")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
