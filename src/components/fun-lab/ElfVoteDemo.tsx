"use client";

import { useEffect, useMemo, useState } from "react";
import { useT } from "@/lib/language";
import NamePicker from "./NamePicker";
import { DEMO_PARTICIPANTS, readJson, writeJson } from "./demoData";

const STORAGE_KEY = "fun-lab-elf-vote-v1";
const CANDIDATES = DEMO_PARTICIPANTS;

type VoteState = {
  votes: Record<string, string>;
};

/** Vote for the best elf costume; live podium top 3. */
export default function ElfVoteDemo() {
  const t = useT();
  const [voter, setVoter] = useState("");
  const [state, setState] = useState<VoteState>({ votes: {} });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(readJson<VoteState>(STORAGE_KEY, { votes: {} }));
    setReady(true);
  }, []);

  const ranking = useMemo(() => {
    const counts: Record<string, number> = Object.fromEntries(CANDIDATES.map((c) => [c.name, 0]));
    for (const name of Object.values(state.votes)) {
      if (name in counts) counts[name] += 1;
    }
    return [...CANDIDATES]
      .map((c) => ({ ...c, count: counts[c.name] }))
      .sort((a, b) => b.count - a.count);
  }, [state.votes]);

  const total = Object.keys(state.votes).length;
  const myVote = voter ? state.votes[voter] : undefined;
  const podium = ranking.slice(0, 3);

  const vote = (candidate: string) => {
    if (!voter) return;
    const next = { votes: { ...state.votes, [voter]: candidate } };
    setState(next);
    writeJson(STORAGE_KEY, next);
  };

  if (!ready) return null;

  return (
    <div className="paper gold-frame flex flex-col gap-5 px-6 py-7" style={{ borderRadius: 2 }}>
      <div>
        <p className="label text-[#B08F4C]">{t("Elf costume vote")}</p>
        <h3 className="mt-2 text-[1.35rem] leading-snug text-[#173D32]">
          {t("Who has the best elf look?")}
        </h3>
      </div>

      <NamePicker value={voter} onChange={setVoter} />

      {!voter ? (
        <p className="text-[0.85rem] text-[#6E6A5E]">{t("Pick your name to vote.")}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {CANDIDATES.map((c) => {
            const selected = myVote === c.name;
            const count = ranking.find((r) => r.name === c.name)?.count ?? 0;
            const className = selected
              ? "overflow-hidden border border-[#173D32] text-left ring-2 ring-[#B08F4C] transition-colors"
              : "overflow-hidden border border-[rgba(23,61,50,0.25)] text-left transition-colors hover:border-[#B08F4C]";
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => vote(c.name)}
                className={className}
                style={{ borderRadius: 2 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.photo} alt={c.name} className="aspect-square w-full object-cover" />
                <div className="flex items-center justify-between gap-2 px-2.5 py-2">
                  <span className="truncate text-[0.85rem] capitalize text-[#173D32]">{c.name}</span>
                  <span className="label text-[#B08F4C]">{count}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {myVote ? (
        <p
          role="status"
          className="border border-[rgba(36,92,70,0.35)] bg-[rgba(36,92,70,0.12)] px-4 py-3 text-[0.9rem] text-[#173D32]"
          style={{ borderRadius: 2 }}
        >
          {t("Vote recorded for {name}. See the podium below — scroll when you want the next game.", {
            name: myVote,
          })}
        </p>
      ) : null}

      {total > 0 ? (
        <div className="border-t border-[rgba(23,61,50,0.15)] pt-4">
          <p className="label text-[#6E6A5E]">{t("Podium")}</p>
          <ol className="mt-3 flex flex-col gap-2">
            {podium.map((p, i) => (
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
    </div>
  );
}
