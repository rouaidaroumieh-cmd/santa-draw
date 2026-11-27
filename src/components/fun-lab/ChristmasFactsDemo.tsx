"use client";

import { useMemo, useState } from "react";
import { fireConfetti } from "@/lib/confetti";
import {
  CHRISTMAS_FACTS,
  colleagueName,
  colleaguePhoto,
  isFactsBallotComplete,
} from "@/lib/office-games/christmas-facts";
import { isFunLabName } from "@/lib/fun-lab-roster";
import { useT } from "@/lib/language";
import { useFunLab } from "./FunLabContext";

/** “Who’s behind the Christmas fact?” — one ballot; Finish locks forever. */
export default function ChristmasFactsDemo() {
  const t = useT();
  const { name, state, vote } = useFunLab();
  const [index, setIndex] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [lockedLocal, setLockedLocal] = useState(false);

  const ballot = state.mine.officeFacts ?? { picks: {}, finished: false };
  const myPicks = ballot.picks;
  const locked = lockedLocal || Boolean(ballot.finished);
  const allAnswered = isFactsBallotComplete(myPicks);
  const total = CHRISTMAS_FACTS.length;
  const q = CHRISTMAS_FACTS[index]!;
  const myPick = myPicks[q.id];
  const isLast = index >= total - 1;
  const canFinish = !locked && allAnswered;

  const tallies = useMemo(() => {
    const counts = Object.fromEntries(q.options.map((n) => [n, 0])) as Record<string, number>;
    for (const entry of Object.values(state.officeFacts)) {
      if (!entry.finished) continue;
      const chosen = entry.picks[q.id];
      if (chosen && chosen in counts) counts[chosen] += 1;
    }
    return q.options
      .map((n) => ({ name: n, photo: colleaguePhoto(n), count: counts[n] ?? 0 }))
      .sort((a, b) => b.count - a.count);
  }, [state.officeFacts, q]);

  const voteTotal = tallies.reduce((sum, row) => sum + row.count, 0);

  const pick = (nominee: string) => {
    if (!name || locked || finishing || !isFunLabName(nominee)) return;
    if (!q.options.includes(nominee)) return;
    void vote("og-facts", {
      picks: { ...myPicks, [q.id]: nominee },
      finished: false,
    });
  };

  const finish = async () => {
    if (!name || locked || !allAnswered || finishing) return;
    setFinishing(true);
    try {
      const ok = await vote("og-facts", { picks: myPicks, finished: true });
      if (ok) {
        setLockedLocal(true);
        fireConfetti(0.7);
      }
    } finally {
      setFinishing(false);
    }
  };

  return (
    <div className="paper gold-frame flex flex-col gap-5 px-6 py-7" style={{ borderRadius: 2 }}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label text-[#B08F4C]">{t("Anonymous fact")}</p>
          <h3 className="mt-2 text-[1.35rem] leading-snug text-[#173D32]" style={{ fontWeight: 600 }}>
            “{q.fact}”
          </h3>
          <p className="mt-2 text-[0.85rem] text-[#6E6A5E]">
            {locked
              ? t("Your answers are locked.")
              : canFinish
                ? t("All answered — tap Finish to lock your one vote.")
                : isLast
                  ? t("Last fact — vote on everyone, then tap Finish to lock.")
                  : t("Vote on all facts, then Finish to lock. One ballot only.")}
          </p>
        </div>
        <p className="label text-[#6E6A5E]">
          {t("Fact {number} of {total}", { number: index + 1, total })}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {q.options.map((optionName) => {
          const selected = myPick === optionName;
          const count = tallies.find((row) => row.name === optionName)?.count ?? 0;
          const className = selected
            ? "overflow-hidden border border-[#173D32] text-left ring-2 ring-[#B08F4C] transition-colors"
            : locked
              ? "overflow-hidden border border-[rgba(23,61,50,0.15)] text-left opacity-55"
              : "overflow-hidden border border-[rgba(23,61,50,0.25)] text-left transition-colors hover:border-[#B08F4C]";
          return (
            <button
              key={optionName}
              type="button"
              disabled={locked || finishing}
              onClick={() => pick(optionName)}
              className={className}
              style={{ borderRadius: 2 }}
            >
              <span className="flex items-center gap-3 px-3.5 py-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={colleaguePhoto(optionName)}
                  alt=""
                  className="h-11 w-11 shrink-0 rounded-full object-cover"
                />
                <span className="min-w-0 flex-1 text-left">
                  <span className="block capitalize text-[#173D32]" style={{ fontWeight: 600 }}>
                    {colleagueName(optionName)}
                  </span>
                  {locked || voteTotal > 0 ? (
                    <span className="block text-[0.8rem] text-[#6E6A5E]">
                      {t("{count} votes", { count })}
                    </span>
                  ) : null}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          className="btn btn-ghost !text-[#173D32] !border-[rgba(23,61,50,0.35)]"
          disabled={index <= 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          {t("Previous")}
        </button>
        {!isLast ? (
          <button type="button" className="btn btn-dark" onClick={() => setIndex((i) => i + 1)}>
            {t("Next fact")}
          </button>
        ) : locked ? (
          <p className="text-[0.9rem] text-[#245C46]" style={{ fontWeight: 600 }}>
            {t("Finished ✓")}
          </p>
        ) : (
          <button
            type="button"
            className="btn btn-dark"
            disabled={!canFinish || finishing}
            onClick={() => void finish()}
          >
            {finishing ? t("Saving…") : t("Finish")}
          </button>
        )}
      </div>
    </div>
  );
}
