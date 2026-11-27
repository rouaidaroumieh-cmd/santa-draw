"use client";

import { useMemo, useState } from "react";
import { useT } from "@/lib/language";
import { MOST_LIKELY_QUESTIONS } from "@/lib/fun-lab-games";
import { FUN_LAB_ROSTER, isFunLabName } from "@/lib/fun-lab-roster";
import { useFunLab } from "./FunLabContext";

/** “Who is most likely to…” — pick a colleague per question; live tallies. */
export default function MostLikelyDemo() {
  const t = useT();
  const { name, state, vote } = useFunLab();
  const [index, setIndex] = useState(0);

  const question = MOST_LIKELY_QUESTIONS[index];
  const myPick = state.mine.mostLikely?.[question.id];

  const tallies = useMemo(() => {
    const counts: Record<string, number> = Object.fromEntries(
      FUN_LAB_ROSTER.map((p) => [p.name, 0]),
    );
    for (const picks of Object.values(state.mostLikely)) {
      const chosen = picks[question.id];
      if (chosen && chosen in counts) counts[chosen] += 1;
    }
    return [...FUN_LAB_ROSTER]
      .map((p) => ({ ...p, count: counts[p.name] }))
      .sort((a, b) => b.count - a.count);
  }, [state.mostLikely, question.id]);

  const total = tallies.reduce((sum, row) => sum + row.count, 0);
  const leaders = tallies.filter((row) => row.count > 0).slice(0, 3);

  const pick = (nominee: string) => {
    if (!name || !isFunLabName(nominee)) return;
    const next = { ...(state.mine.mostLikely ?? {}), [question.id]: nominee };
    void vote("most-likely", next);
  };

  return (
    <div className="paper gold-frame flex flex-col gap-5 px-6 py-7" style={{ borderRadius: 2 }}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label text-[#B08F4C]">{t("Most likely to…")}</p>
          <h3 className="mt-2 text-[1.35rem] leading-snug text-[#173D32]">
            {t(question.labelKey)}
          </h3>
        </div>
        <p className="label text-[#6E6A5E]">
          {t("Question {number} of {total}", {
            number: index + 1,
            total: MOST_LIKELY_QUESTIONS.length,
          })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
        {FUN_LAB_ROSTER.map((p) => {
          const selected = myPick === p.name;
          const count = tallies.find((row) => row.name === p.name)?.count ?? 0;
          const className = selected
            ? "overflow-hidden border border-[#173D32] text-left ring-2 ring-[#B08F4C] transition-colors"
            : "overflow-hidden border border-[rgba(23,61,50,0.25)] text-left transition-colors hover:border-[#B08F4C]";
          return (
            <button
              key={p.name}
              type="button"
              onClick={() => pick(p.name)}
              className={className}
              style={{ borderRadius: 2 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.photo} alt={p.name} className="aspect-square w-full object-cover" />
              <div className="flex items-center justify-between gap-1 px-2 py-1.5">
                <span className="truncate text-[0.75rem] capitalize text-[#173D32]">{p.name}</span>
                <span className="label text-[0.65rem] text-[#B08F4C]">{count}</span>
              </div>
            </button>
          );
        })}
      </div>

      {myPick ? (
        <p
          role="status"
          className="border border-[rgba(36,92,70,0.35)] bg-[rgba(36,92,70,0.12)] px-4 py-3 text-[0.9rem] text-[#173D32]"
          style={{ borderRadius: 2 }}
        >
          {t("You picked {name}. Results update for everyone.", { name: myPick })}
        </p>
      ) : (
        <p className="text-[0.85rem] text-[#6E6A5E]">{t("Tap a colleague to vote on this question.")}</p>
      )}

      {total > 0 ? (
        <div className="border-t border-[rgba(23,61,50,0.15)] pt-4">
          <p className="label text-[#6E6A5E]">{t("Top picks")}</p>
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

      <div className="flex flex-wrap justify-between gap-3">
        <button
          type="button"
          className="btn btn-ghost"
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          {t("Previous")}
        </button>
        <button
          type="button"
          className="btn btn-dark"
          disabled={index >= MOST_LIKELY_QUESTIONS.length - 1}
          onClick={() => setIndex((i) => Math.min(MOST_LIKELY_QUESTIONS.length - 1, i + 1))}
        >
          {t("Next question")}
        </button>
      </div>
    </div>
  );
}
