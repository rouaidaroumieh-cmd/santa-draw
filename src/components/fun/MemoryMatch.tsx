"use client";

import { useRef, useState } from "react";
import { useCampaign } from "@/lib/store";

const PAIRS = 8;
const BEST_KEY = "santa-memory-best";
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

/** Find the pairs of employee photos. Fewest moves is kept as the best score in this browser. */
export default function MemoryMatch() {
  const state = useCampaign();
  const [cards, setCards] = useState<Card[]>([]);
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [best, setBest] = useState<number | null>(null);
  const busy = useRef(false);

  const start = () => {
    if (!state) return;
    const withPhoto = state.participants.filter((p) => state.photos[p.id]);
    const chosen = shuffle(withPhoto).slice(0, PAIRS);
    if (chosen.length < 2) return;
    const deck = shuffle(chosen.flatMap((p) => [p, p])).map((p, i) => ({
      key: `${i}-${p.id}`,
      participantId: p.id,
      name: p.name,
      photo: state.photos[p.id],
    }));

    busy.current = false;
    setCards(deck);
    setOpen([]);
    setMatched([]);
    setMoves(0);
    setBest(Number(localStorage.getItem(BEST_KEY)) || null);
    setPhase("playing");
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
      if (nextMatched.length === cards.length / 2) {
        const previous = Number(localStorage.getItem(BEST_KEY)) || Infinity;
        if (movesNow < previous) localStorage.setItem(BEST_KEY, String(movesNow));
        setBest(Math.min(previous, movesNow));
        setPhase("won");
      }
      return;
    }

    setOpen([open[0], index]);
    busy.current = true;
    window.setTimeout(() => {
      setOpen([]);
      busy.current = false;
    }, FLIP_BACK_MS);
  };

  if (!state) {
    return (
      <div className="paper gold-frame mx-auto max-w-[720px] px-6 py-10 text-center" style={{ borderRadius: 2 }}>
        <p className="font-display text-[1.2rem] italic text-[#3D3A30]">Loading the photos…</p>
      </div>
    );
  }

  if (phase === "idle") {
    return (
      <div className="paper gold-frame mx-auto max-w-[720px] px-6 py-10 text-center" style={{ borderRadius: 2 }}>
        <p className="font-display text-[1.5rem] italic text-[#173D32]">Find every matching pair of photos.</p>
        <p className="mt-3 text-[0.92rem] text-[#3D3A30]">Flip two cards at a time. The fewer moves, the better.</p>
        <button type="button" className="btn btn-dark mt-7" onClick={start}>
          Start
        </button>
      </div>
    );
  }

  return (
    <div className="paper gold-frame mx-auto max-w-[720px] px-5 py-6 sm:px-8" style={{ borderRadius: 2 }}>
      <div className="flex justify-between">
        <span className="label text-[#B08F4C]">Moves {moves}</span>
        <span className="label text-[#6E6A5E]">
          Pairs {matched.length} / {cards.length / 2}
          {best !== null ? ` · Best ${best}` : ""}
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
              aria-label={isUp ? card.name : "Face-down card"}
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
                    style={{ objectPosition: "50% 32%" }}
                  />
                  <span className="absolute inset-x-0 bottom-0 truncate bg-[rgba(9,30,24,0.8)] px-2 py-1 text-center text-[0.68rem] text-ivory">
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
            All pairs found in {moves} moves!
          </p>
          <button type="button" className="btn btn-dark" onClick={start}>
            Play again
          </button>
        </div>
      ) : null}
    </div>
  );
}
