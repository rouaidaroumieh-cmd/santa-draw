"use client";

import { useMemo } from "react";
import { useT } from "@/lib/language";
import { useFunLab } from "./FunLabContext";

const OPTIONS = [
  { id: "chocolat", labelKey: "Hot chocolate" },
  { id: "vin", labelKey: "Mulled wine" },
  { id: "cookie", labelKey: "Christmas cookies" },
  { id: "orange", labelKey: "Clémentines" },
] as const;

/** One-question office poll — server-backed, one vote per PIN session. */
export default function PollDemo() {
  const t = useT();
  const { state, vote } = useFunLab();

  const counts = useMemo(() => {
    const map: Record<string, number> = Object.fromEntries(OPTIONS.map((o) => [o.id, 0]));
    for (const optionId of Object.values(state.poll)) {
      if (optionId in map) map[optionId] += 1;
    }
    return map;
  }, [state.poll]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const myVote = state.mine.poll;

  return (
    <div className="paper gold-frame flex flex-col gap-5 px-6 py-7" style={{ borderRadius: 2 }}>
      <div>
        <p className="label text-[#B08F4C]">{t("Poll of the day")}</p>
        <h3 className="mt-2 text-[1.35rem] leading-snug text-[#173D32]">
          {t("What should we bring to the office Christmas break?")}
        </h3>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {OPTIONS.map((opt) => {
          const selected = myVote === opt.id;
          const count = counts[opt.id];
          const pct = total === 0 ? 0 : Math.round((count / total) * 100);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => void vote("poll", opt.id)}
              className={`relative overflow-hidden border px-4 py-3 text-left transition-colors ${
                selected
                  ? "border-[#173D32] bg-[rgba(23,61,50,0.1)]"
                  : "border-[rgba(23,61,50,0.25)] hover:border-[#B08F4C]"
              }`}
              style={{ borderRadius: 2 }}
            >
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 bg-[rgba(176,143,76,0.22)]"
                style={{ width: `${pct}%` }}
              />
              <span className="relative flex items-center justify-between gap-3">
                <span className="font-medium text-[#173D32]">{t(opt.labelKey)}</span>
                <span className="label text-[#B08F4C]">
                  {count} · {pct}%
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {myVote ? (
        <p
          role="status"
          className="border border-[rgba(36,92,70,0.35)] bg-[rgba(36,92,70,0.12)] px-4 py-3 text-[0.9rem] text-[#173D32]"
          style={{ borderRadius: 2 }}
        >
          {t("Vote recorded — results update live below. You can still change your mind.")}
        </p>
      ) : null}

      <p className="text-[0.8rem] text-[#6E6A5E]">
        {t("{count} votes so far", { count: total })}
        {myVote ? ` — ${t("You voted.")}` : ""}
      </p>
    </div>
  );
}
