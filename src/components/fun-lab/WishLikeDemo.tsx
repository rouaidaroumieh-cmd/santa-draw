"use client";

import { useMemo } from "react";
import { useT } from "@/lib/language";
import { useFunLab } from "./FunLabContext";

const WISHES = [
  { id: "w1", author: "yann", message: "Que cette année se termine dans la lumière et les rires." },
  { id: "w2", author: "eliane", message: "Des chocolats, des guirlandes, et zéro réunion inutile." },
  { id: "w3", author: "maroun", message: "Santé, patience, et une playlist qui tape." },
  { id: "w4", author: "lara", message: "Que chacun trouve sa place sous le sapin de l’équipe." },
  { id: "w5", author: "rouaida", message: "Moins de stress, plus de paillettes." },
] as const;

/** Soft ranking of wishes by likes — one like set per PIN session. */
export default function WishLikeDemo() {
  const t = useT();
  const { state, vote } = useFunLab();
  const myLikes = state.mine.wishLikes ?? [];

  const likeCounts = useMemo(() => {
    const counts: Record<string, number> = Object.fromEntries(WISHES.map((w) => [w.id, 0]));
    for (const ids of Object.values(state.wishLikes)) {
      for (const id of ids) {
        if (id in counts) counts[id] += 1;
      }
    }
    return counts;
  }, [state.wishLikes]);

  const ranked = useMemo(() => {
    return [...WISHES]
      .map((w) => ({ ...w, count: likeCounts[w.id] ?? 0 }))
      .sort((a, b) => b.count - a.count);
  }, [likeCounts]);

  const toggle = (wishId: string) => {
    const next = myLikes.includes(wishId)
      ? myLikes.filter((id) => id !== wishId)
      : [...myLikes, wishId];
    void vote("wish-likes", next);
  };

  return (
    <div className="paper gold-frame flex flex-col gap-5 px-6 py-7" style={{ borderRadius: 2 }}>
      <div>
        <p className="label text-[#B08F4C]">{t("Wish likes")}</p>
        <h3 className="mt-2 text-[1.35rem] leading-snug text-[#173D32]">
          {t("Heart the wishes that warm the office.")}
        </h3>
      </div>

      <div className="flex flex-col gap-3">
        {ranked.map((w, i) => {
          const liked = myLikes.includes(w.id);
          return (
            <article
              key={w.id}
              className="flex items-start gap-3 border border-[rgba(23,61,50,0.15)] bg-[rgba(255,255,255,0.35)] px-4 py-3"
              style={{ borderRadius: 2 }}
            >
              <span className="label mt-1 w-7 shrink-0 text-[#B08F4C]">#{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-[1.05rem] italic leading-snug text-[#173D32]">
                  “{w.message}”
                </p>
                <p className="label mt-2 text-[#B08F4C]">— {w.author}</p>
              </div>
              <button
                type="button"
                onClick={() => toggle(w.id)}
                aria-pressed={liked}
                className={`shrink-0 border px-3 py-2 text-[0.85rem] transition-colors ${
                  liked
                    ? "border-[#7A1F2B] bg-[rgba(122,31,43,0.12)] text-[#7A1F2B]"
                    : "border-[rgba(23,61,50,0.25)] text-[#173D32] hover:border-[#B08F4C]"
                }`}
                style={{ borderRadius: 2 }}
              >
                ♥ {w.count}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
