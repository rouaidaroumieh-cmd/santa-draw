"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/language";
import NamePicker from "./NamePicker";
import { readJson, writeJson } from "./demoData";

const STORAGE_KEY = "fun-lab-challenge-v1";

type ChallengeState = {
  joined: string[];
  done: string[];
};

/** Daily mission card with join / done counters. */
export default function ChallengeDemo() {
  const t = useT();
  const [voter, setVoter] = useState("");
  const [state, setState] = useState<ChallengeState>({ joined: [], done: [] });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(readJson<ChallengeState>(STORAGE_KEY, { joined: [], done: [] }));
    setReady(true);
  }, []);

  const persist = (next: ChallengeState) => {
    setState(next);
    writeJson(STORAGE_KEY, next);
  };

  const hasJoined = voter ? state.joined.includes(voter) : false;
  const hasDone = voter ? state.done.includes(voter) : false;

  const join = () => {
    if (!voter || hasJoined) return;
    persist({ ...state, joined: [...state.joined, voter] });
  };

  const markDone = () => {
    if (!voter || !hasJoined || hasDone) return;
    persist({
      joined: state.joined.includes(voter) ? state.joined : [...state.joined, voter],
      done: [...state.done, voter],
    });
  };

  if (!ready) return null;

  return (
    <div className="paper gold-frame flex flex-col gap-5 px-6 py-7" style={{ borderRadius: 2 }}>
      <div>
        <p className="label text-[#B08F4C]">{t("Challenge of the day")}</p>
        <h3 className="mt-2 text-[1.35rem] leading-snug text-[#173D32]">
          {t("Bring a Christmas playlist track to share with the team.")}
        </h3>
        <p className="mt-2 text-[0.9rem] text-[#6E6A5E]">
          {t("Join the mission, then mark it done when you have shared your track.")}
        </p>
      </div>

      <NamePicker value={voter} onChange={setVoter} />

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="btn btn-dark"
          disabled={!voter || hasJoined}
          onClick={join}
        >
          {hasJoined ? t("Joined") : t("I’m in")}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={!voter || !hasJoined || hasDone}
          onClick={markDone}
        >
          {hasDone ? t("Done ✓") : t("Mark as done")}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="border border-[rgba(23,61,50,0.15)] px-4 py-3" style={{ borderRadius: 2 }}>
          <p className="label text-[#6E6A5E]">{t("Joined")}</p>
          <p className="mt-1 text-[1.6rem] text-[#173D32]">{state.joined.length}</p>
          <p className="mt-1 text-[0.8rem] capitalize text-[#6E6A5E]">
            {state.joined.length === 0 ? t("Nobody yet") : state.joined.join(", ")}
          </p>
        </div>
        <div className="border border-[rgba(23,61,50,0.15)] px-4 py-3" style={{ borderRadius: 2 }}>
          <p className="label text-[#6E6A5E]">{t("Completed by")}</p>
          <p className="mt-1 text-[1.6rem] text-[#173D32]">{state.done.length}</p>
          <p className="mt-1 text-[0.8rem] capitalize text-[#6E6A5E]">
            {state.done.length === 0 ? t("Nobody yet") : state.done.join(", ")}
          </p>
        </div>
      </div>
    </div>
  );
}
