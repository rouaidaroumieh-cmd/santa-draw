"use client";

import { useMemo, useState } from "react";
import { fireConfetti } from "@/lib/confetti";
import { CHRISTMAS_FACTS, isFactsBallotComplete } from "@/lib/office-games/christmas-facts";
import { FUN_LAB_ROSTER, isFunLabName } from "@/lib/fun-lab-roster";
import { useT } from "@/lib/language";
import { useFunLab } from "./FunLabContext";

/** “Who’s behind the Christmas fact?” — same ballot UX as Most Likely. */
export default function ChristmasFactsDemo() {
  const t = useT();
  const { name, state, vote } = useFunLab();
  const [index, setIndex] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [lockedLocal, setLockedLocal] = useState(false);

  const fact = CHRISTMAS_FACTS[index]!;
  const ballot = state.mine.officeFacts ?? { picks: {}, finished: false };
  const myPicks = ballot.picks;
  const myPick = myPicks[fact.id];
  const locked = lockedLocal || Boolean(ballot.finished);
  const allAnswered = isFactsBallotComplete(myPicks);
  const isLast = index >= CHRISTMAS_FACTS.length - 1;
  const canFinish = !locked && allAnswered;

  /** Tallies for the current fact only (finished ballots) — same as Most Likely. */
  const tallies = useMemo(() => {
    const counts: Record<string, number> = Object.fromEntries(
      FUN_LAB_ROSTER.map((p) => [p.name, 0]),
    );
    for (const entry of Object.values(state.officeFacts)) {
      if (!entry.finished) continue;
      const chosen = entry.picks[fact.id];
      if (chosen && chosen in counts) counts[chosen] += 1;
    }
    return [...FUN_LAB_ROSTER]
      .map((p) => ({ ...p, count: counts[p.name] }))
      .sort((a, b) => b.count - a.count);
  }, [state.officeFacts, fact.id]);

  const voteTotal = tallies.reduce((sum, row) => sum + row.count, 0);
  const leaders = tallies.filter((row) => row.count > 0).slice(0, 3);

  const pick = (nominee: string) => {
    if (!name || locked || finishing || !isFunLabName(nominee)) return;
    void vote("og-facts", {
      picks: { ...myPicks, [fact.id]: nominee },
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
            “{fact.fact}”
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
          {t("Fact {number} of {total}", {
            number: index + 1,
            total: CHRISTMAS_FACTS.length,
          })}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
        {FUN_LAB_ROSTER.map((p) => {
          const selected = myPick === p.name;
          const count = tallies.find((row) => row.name === p.name)?.count ?? 0;
          const className = selected
            ? "overflow-hidden border border-[#173D32] text-left ring-2 ring-[#B08F4C] transition-colors"
            : locked
              ? "overflow-hidden border border-[rgba(23,61,50,0.15)] text-left opacity-55"
              : "overflow-hidden border border-[rgba(23,61,50,0.25)] text-left transition-colors hover:border-[#B08F4C]";
          return (
            <button
              key={p.name}
              type="button"
              disabled={locked || finishing}
              onClick={() => pick(p.name)}
              className={className}
              style={{ borderRadius: 2 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.photo} alt={p.name} className="aspect-square w-full object-cover" />
              <div className="flex items-center justify-between gap-1 px-2 py-1.5">
                <span className="truncate text-[0.78rem] capitalize text-[#173D32]">{p.name}</span>
                <span className="label shrink-0 text-[0.65rem] text-[#B08F4C]">{count}</span>
              </div>
            </button>
          );
        })}
      </div>

      {locked ? (
        <p
          role="status"
          className="border border-[rgba(36,92,70,0.35)] bg-[rgba(36,92,70,0.12)] px-4 py-3 text-[0.9rem] text-[#173D32]"
          style={{ borderRadius: 2 }}
        >
          {t("Vote locked — one ballot only. Browse facts to see each tally — full results on the home page.")}
        </p>
      ) : myPick ? (
        <p
          role="status"
          className="border border-[rgba(36,92,70,0.35)] bg-[rgba(36,92,70,0.12)] px-4 py-3 text-[0.9rem] text-[#173D32]"
          style={{ borderRadius: 2 }}
        >
          {t("You picked {name}. You can still change answers until you Finish.", {
            name: myPick,
          })}
        </p>
      ) : (
        <p className="text-[0.85rem] text-[#6E6A5E]">{t("Tap a colleague to vote on this question.")}</p>
      )}

      {voteTotal > 0 ? (
        <div className="border-t border-[rgba(23,61,50,0.15)] pt-4">
          <p className="label text-[#6E6A5E]">{t("Top picks for this fact")}</p>
          <ol className="mt-3 flex flex-col gap-2">
            {leaders.map((p, i) => (
              <li key={p.name} className="flex items-center gap-3 text-[#173D32]">
                <span className="label w-8 text-[#B08F4C]">#{i + 1}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.photo} alt="" className="h-9 w-9 rounded-full object-cover" />
                <span className="capitalize">{p.name}</span>
                <span className="ml-auto text-[0.85rem] text-[#6E6A5E]">
                  {t("{count} votes", { count: p.count })}
                </span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          className="btn btn-ghost"
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          {t("Previous")}
        </button>
        <div className="flex flex-wrap gap-3">
          {!isLast ? (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setIndex((i) => Math.min(CHRISTMAS_FACTS.length - 1, i + 1))}
            >
              {t("Next fact")}
            </button>
          ) : null}
          {locked ? (
            <button type="button" className="btn btn-dark" disabled>
              {t("Finished ✓")}
            </button>
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

      {!locked && isLast && !allAnswered ? (
        <p className="text-[0.8rem] text-[#6E6A5E]">
          {t("Answer every question before tapping Finish.")}
        </p>
      ) : null}
    </div>
  );
}
