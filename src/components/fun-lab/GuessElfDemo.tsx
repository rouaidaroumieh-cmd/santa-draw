"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fireConfetti } from "@/lib/confetti";
import { useT } from "@/lib/language";
import { GUESS_ELF_ROUNDS } from "@/lib/fun-lab-games";
import { FUN_LAB_ROSTER } from "@/lib/fun-lab-roster";
import { useFunLab } from "./FunLabContext";

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

type Round = {
  answer: (typeof FUN_LAB_ROSTER)[number];
  options: string[];
};

type LeaderRow = { name: string; photo: string; value: number };

function makeRound(excludeNames: string[] = []): Round {
  const pool = FUN_LAB_ROSTER.filter((p) => !excludeNames.includes(p.name));
  const source = pool.length >= 4 ? pool : [...FUN_LAB_ROSTER];
  const answer = source[Math.floor(Math.random() * source.length)];
  const distractors = shuffle(FUN_LAB_ROSTER.filter((p) => p.name !== answer.name))
    .slice(0, 3)
    .map((p) => p.name);
  return {
    answer,
    options: shuffle([answer.name, ...distractors]),
  };
}

function ScoreLeaderboard({
  leaders,
  me,
  title,
}: {
  leaders: LeaderRow[];
  me: string | null;
  title: string;
}) {
  const t = useT();
  if (leaders.length === 0) {
    return (
      <div className="border-t border-[rgba(23,61,50,0.15)] pt-5">
        <p className="label text-[#6E6A5E]">{title}</p>
        <p className="mt-3 text-[0.85rem] text-[#6E6A5E]">{t("No scores yet — finish a run to appear here.")}</p>
      </div>
    );
  }

  return (
    <div className="border-t border-[rgba(23,61,50,0.15)] pt-5">
      <p className="label text-[#6E6A5E]">{title}</p>
      <ol className="mt-3 flex flex-col gap-2">
        {leaders.map((row, i) => {
          const isMe = me === row.name;
          return (
            <li
              key={row.name}
              className={`flex items-center gap-3 px-2 py-1.5 text-[#173D32] ${
                isMe ? "bg-[rgba(176,143,76,0.18)]" : ""
              }`}
              style={{ borderRadius: 2 }}
            >
              <span className="label w-7 text-[#B08F4C]">#{i + 1}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={row.photo} alt="" className="h-9 w-9 rounded-full object-cover" />
              <span className={`capitalize ${isMe ? "font-medium" : ""}`}>
                {row.name}
                {isMe ? ` · ${t("you")}` : ""}
              </span>
              <span className="ml-auto text-[0.85rem] text-[#6E6A5E]">
                {row.value}/{GUESS_ELF_ROUNDS}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Guess who the blurred elf is — keeps each player’s best score on a shared leaderboard. */
export default function GuessElfDemo() {
  const t = useT();
  const { name, state, vote } = useFunLab();
  const [round, setRound] = useState<Round | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [played, setPlayed] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const savedRef = useRef(false);

  const myBest = state.mine.guessElf?.best ?? null;
  const displayBest =
    myBest === null ? (finished ? score : null) : finished ? Math.max(myBest, score) : myBest;

  const leaders = useMemo(() => {
    const rows = Object.entries(state.guessElf).map(([player, s]) => ({
      name: player,
      photo: FUN_LAB_ROSTER.find((p) => p.name === player)?.photo ?? "",
      value: s.best,
    }));
    // Optimistic: if this run beats the stored best, show it on the board immediately.
    if (finished && name) {
      const idx = rows.findIndex((r) => r.name === name);
      const optimistic = Math.max(score, myBest ?? 0);
      if (idx >= 0) rows[idx] = { ...rows[idx], value: Math.max(rows[idx].value, optimistic) };
      else if (optimistic > 0 || finished) {
        rows.push({
          name,
          photo: FUN_LAB_ROSTER.find((p) => p.name === name)?.photo ?? "",
          value: optimistic,
        });
      }
    }
    return rows.sort((a, b) => b.value - a.value || a.name.localeCompare(b.name)).slice(0, 10);
  }, [state.guessElf, finished, name, score, myBest]);

  useEffect(() => {
    setRound(makeRound());
  }, []);

  useEffect(() => {
    if (!finished || score !== GUESS_ELF_ROUNDS) return;
    fireConfetti(1.35);
  }, [finished, score]);

  useEffect(() => {
    if (!finished || savedRef.current) return;
    savedRef.current = true;
    void vote("guess-elf", { best: score });
  }, [finished, score, vote]);

  const revealed = picked !== null;
  const correct = round !== null && picked === round.answer.name;
  const isLastRound = played >= GUESS_ELF_ROUNDS;
  const perfect = finished && score === GUESS_ELF_ROUNDS;

  const choose = (optionName: string) => {
    if (!round || picked !== null || finished || played >= GUESS_ELF_ROUNDS) return;
    setPicked(optionName);
    setPlayed((n) => n + 1);
    if (optionName === round.answer.name) setScore((s) => s + 1);
  };

  const next = () => {
    if (!round) return;
    if (played >= GUESS_ELF_ROUNDS) {
      setFinished(true);
      return;
    }
    const nextHistory = [...history, round.answer.name].slice(-8);
    setHistory(nextHistory);
    setPicked(null);
    setRound(makeRound(nextHistory));
  };

  const restart = () => {
    savedRef.current = false;
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
        className={`paper gold-frame relative overflow-hidden px-6 py-10 ${perfect ? "fun-lab-tada" : ""}`}
        style={{ borderRadius: 2 }}
      >
        <div className="text-center">
          {perfect ? (
            <>
              <p className="label text-[#B08F4C]">{t("Perfect score!")}</p>
              <p className="fun-lab-tada-pop mt-4 font-display text-[2.4rem] italic leading-none text-[#173D32]">
                {t("Tada!")}
              </p>
              <p className="mt-4 text-[1.15rem] text-[#245C46]">
                {t("You scored {score} out of {total}!", { score, total: GUESS_ELF_ROUNDS })}
              </p>
              <p className="mt-2 text-[0.9rem] text-[#6E6A5E]">
                {t("Elf master — every face unmasked.")}
              </p>
            </>
          ) : (
            <>
              <p className="font-display text-[1.6rem] italic text-[#173D32]">
                {t("You scored {score} out of {total}!", { score, total: GUESS_ELF_ROUNDS })}
              </p>
              <p className="label mt-3 text-[#6E6A5E]">
                {score >= 7
                  ? t("Strong elf vision.")
                  : t("Try again — the hats are tricky.")}
              </p>
            </>
          )}
          <p className="mt-4 text-[0.9rem] text-[#6E6A5E]">
            {t("Only your best score is kept on the leaderboard.")}
          </p>
          {displayBest !== null ? (
            <p className="mt-2 label text-[#B08F4C]">
              {t("Your best: {score}/{total}", { score: displayBest, total: GUESS_ELF_ROUNDS })}
            </p>
          ) : null}
        </div>

        <div className="mx-auto mt-6 max-w-[440px]">
          <ScoreLeaderboard leaders={leaders} me={name} title={t("Leaderboard — best scores")} />
        </div>

        <div className="mt-8 text-center">
          <button type="button" className="btn btn-dark" onClick={restart}>
            {t("Play again")}
          </button>
        </div>
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
          <p className="mt-2 text-[0.85rem] text-[#6E6A5E]">
            {t("Only your best score is kept on the leaderboard.")}
          </p>
        </div>
        <div className="text-right">
          <p className="label text-[#6E6A5E]">
            {t("Round {number} of {total}", {
              number: Math.min(revealed ? played : played + 1, GUESS_ELF_ROUNDS),
              total: GUESS_ELF_ROUNDS,
            })}
          </p>
          <p className="mt-1 text-[0.85rem] text-[#173D32]">
            {t("Score {score}/{played}", { score, played })}
          </p>
          {displayBest !== null ? (
            <p className="mt-1 text-[0.75rem] text-[#6E6A5E]">
              {t("Your best: {score}/{total}", { score: displayBest, total: GUESS_ELF_ROUNDS })}
            </p>
          ) : null}
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

      <ScoreLeaderboard leaders={leaders} me={name} title={t("Leaderboard — best scores")} />
    </div>
  );
}
