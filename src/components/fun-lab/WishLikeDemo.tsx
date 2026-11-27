"use client";

import { useEffect, useMemo, useState } from "react";
import { useT } from "@/lib/language";
import NamePicker from "./NamePicker";
import { readJson, writeJson } from "./demoData";

const STORAGE_KEY = "fun-lab-wish-likes-v1";

const WISHES = [
  { id: "w1", author: "yann", message: "Que cette année se termine dans la lumière et les rires." },
  { id: "w2", author: "eliane", message: "Des chocolats, des guirlandes, et zéro réunion inutile." },
  { id: "w3", author: "maroun", message: "Santé, patience, et une playlist qui tape." },
  { id: "w4", author: "lara", message: "Que chacun trouve sa place sous le sapin de l’équipe." },
  { id: "w5", author: "rouaida", message: "Moins de stress, plus de paillettes." },
] as const;

type LikeState = {
  /** wishId -> voter names */
  likes: Record<string, string[]>;
};

/** Soft ranking of mock wishes by likes. */
export default function WishLikeDemo() {
  const t = useT();
  const [voter, setVoter] = useState("");
  const [state, setState] = useState<LikeState>({ likes: {} });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(readJson<LikeState>(STORAGE_KEY, { likes: {} }));
    setReady(true);
  }, []);

  const ranked = useMemo(() => {
    return [...WISHES]
      .map((w) => ({ ...w, count: state.likes[w.id]?.length ?? 0 }))
      .sort((a, b) => b.count - a.count);
  }, [state.likes]);

  const toggle = (wishId: string) => {
    if (!voter) return;
    const current = state.likes[wishId] ?? [];
    const nextList = current.includes(voter)
      ? current.filter((n) => n !== voter)
      : [...current, voter];
    const next = { likes: { ...state.likes, [wishId]: nextList } };
    setState(next);
    writeJson(STORAGE_KEY, next);
  };

  if (!ready) return null;

  return (
    <div className="paper gold-frame flex flex-col gap-5 px-6 py-7" style={{ borderRadius: 2 }}>
      <div>
        <p className="label text-[#B08F4C]">{t("Wish likes")}</p>
        <h3 className="mt-2 text-[1.35rem] leading-snug text-[#173D32]">
          {t("Heart the wishes that warm the office.")}
        </h3>
      </div>

      <NamePicker value={voter} onChange={setVoter} />

      {!voter ? (
        <p className="text-[0.85rem] text-[#6E6A5E]">{t("Pick your name to like a wish.")}</p>
      ) : null}

      <div className="flex flex-col gap-3">
        {ranked.map((w, i) => {
          const liked = voter ? (state.likes[w.id] ?? []).includes(voter) : false;
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
                disabled={!voter}
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
