"use client";

import { useMemo, useRef, useState } from "react";
import { useT } from "@/lib/language";
import { MEMORY_MATCH_PAIRS } from "@/lib/fun-lab-games";
import { FUN_LAB_ROSTER } from "@/lib/fun-lab-roster";
import { useFunLab } from "./FunLabContext";

const FLIP_BACK_MS = 900;

type Phase = "idle" | "playing" | "won";

interface Card {
  key: string;
  participantId: string;
  name: string;
  photo: string;
}

function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Memory match with elf photos — best (fewest) moves saved to the shared leaderboard. */
export default function MemoryMatchDemo() {
  const t = useT();
  const { state, vote } = useFunLab();
  const [cards, setCards] = useState<Card[]>([]);
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const busy = useRef(false);
  const savedRef = useRef(false);

  const myBest = state.mine.memoryMatch?.best ?? null;
  const leaders = useMemo(
    () =>
      Object.entries(state.memoryMatch)
        .map(([name, score]) => ({
          name,
          photo: FUN_LAB_ROSTER.find((p) => p.name === name)?.photo ?? "",
          value: score.best,
        }))
        .sort((a, b) => a.value - b.value)
        .slice(0, 5),
    [state.memoryMatch],
  );

  const start = () => {
    const chosen = shuffle(FUN_LAB_ROSTER).slice(0, MEMORY_MATCH_PAIRS);
    const deck = shuffle(chosen.flatMap((p) => [p, p])).map((p, i) => ({
      key: `${i}-${p.name}`,
      participantId: p.name,
      name: p.name,
      photo: p.photo,
    }));

    busy.current = false;
    savedRef.current = false;
    setCards(deck);
    setOpen([]);
    setMatched([]);
    setMoves(0);
    setPhase("playing");
  };

  const finish = (movesNow: number) => {
    setPhase("won");
    if (savedRef.current) return;
    savedRef.current = true;
    void vote("memory-match", { best: movesNow });
  };

  const flip = (index: number) => {
    if (phase !== "playing" || busy.current) return;
    if (open.includes(index) || matched.includes(cards[index].participantId)) return;

    if (open.length === 0) {
      setOpen([index]);
      return;
    }

    const first = cards[open[0]];
    const second = cards[index];
    const movesNow = moves + 1;
    setMoves(movesNow);

    if (first.participantId === second.participantId) {
      const nextMatched = [...matched, first.participantId];
      setMatched(nextMatched);
      setOpen([]);
      if (nextMatched.length === cards.length / 2) finish(movesNow);
      return;
    }

    setOpen([open[0], index]);
    busy.current = true;
    window.setTimeout(() => {
      setOpen([]);
      busy.current = false;
    }, FLIP_BACK_MS);
  };

  if (phase === "idle") {
    return (
      <div className="paper gold-frame px-6 py-10 text-center" style={{ borderRadius: 2 }}>
        <p className="label text-[#B08F4C]">{t("Memory match")}</p>
        <p className="mt-3 font-display text-[1.5rem] italic text-[#173D32]">
          {t("Find every matching pair of photos.")}
        </p>
        <p className="mt-3 text-[0.92rem] text-[#3D3A30]">
          {t("Flip two cards at a time. The fewer moves, the better. Your best score joins the leaderboard.")}
        </p>
        {myBest !== null ? (
          <p className="mt-3 label text-[#B08F4C]">{t("Your best: {count} moves", { count: myBest })}</p>
        ) : null}
        <button type="button" className="btn btn-dark mt-7" onClick={start}>
          {t("Start")}
        </button>
        {leaders.length > 0 ? (
          <div className="mt-8 border-t border-[rgba(23,61,50,0.15)] pt-5 text-left">
            <p className="label text-[#6E6A5E]">{t("Leaderboard")}</p>
            <ol className="mt-3 flex flex-col gap-2">
              {leaders.map((row, i) => (
                <li key={row.name} className="flex items-center gap-3 text-[#173D32]">
                  <span className="label w-7 text-[#B08F4C]">#{i + 1}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={row.photo} alt="" className="h-9 w-9 rounded-full object-cover" />
                  <span className="capitalize">{row.name}</span>
                  <span className="ml-auto text-[0.85rem] text-[#6E6A5E]">
                    {t("{count} moves", { count: row.value })}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="paper gold-frame px-5 py-6 sm:px-8" style={{ borderRadius: 2 }}>
      <div className="flex justify-between">
        <span className="label text-[#B08F4C]">{t("Moves {count}", { count: moves })}</span>
        <span className="label text-[#6E6A5E]">
          {t("Pairs {found} / {total}", { found: matched.length, total: cards.length / 2 })}
          {myBest !== null ? ` · ${t("Best {count}", { count: myBest })}` : ""}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-4 gap-3 sm:gap-4">
        {cards.map((card, i) => {
          const isMatched = matched.includes(card.participantId);
          const isUp = isMatched || open.includes(i);
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => flip(i)}
              disabled={phase !== "playing" || isUp}
              aria-label={isUp ? card.name : t("Face-down card")}
              className={`relative aspect-square overflow-hidden border ${
                isMatched ? "border-[#245C46]" : "border-[rgba(176,143,76,0.7)]"
              }`}
              style={{ borderRadius: 2 }}
            >
              {isUp ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={card.photo}
                    alt=""
                    className="h-full w-full object-cover"
                    style={{ objectPosition: "50% 46%" }}
                  />
                  <span className="absolute inset-x-0 bottom-0 truncate bg-[rgba(9,30,24,0.8)] px-2 py-1 text-center text-[0.68rem] capitalize text-ivory">
                    {card.name}
                  </span>
                </>
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-[#173D32] font-display text-[1.6rem] text-gold">
                  ✦
                </span>
              )}
            </button>
          );
        })}
      </div>

      {phase === "won" ? (
        <div className="mt-7 flex flex-col items-center gap-4 text-center">
          <p className="font-display text-[1.5rem] italic text-[#173D32]">
            {t("All pairs found in {count} moves!", { count: moves })}
          </p>
          <p className="text-[0.9rem] text-[#6E6A5E]">{t("Best score saved to the leaderboard.")}</p>
          <button type="button" className="btn btn-dark" onClick={start}>
            {t("Play again")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
