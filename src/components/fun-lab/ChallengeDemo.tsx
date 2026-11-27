"use client";

import { useT } from "@/lib/language";
import { useFunLab } from "./FunLabContext";

/** Daily mission card — join / done stored on the server. */
export default function ChallengeDemo() {
  const t = useT();
  const { state, vote } = useFunLab();

  const hasJoined = Boolean(state.mine.challenge?.joined);
  const hasDone = Boolean(state.mine.challenge?.done);

  const join = () => {
    if (hasJoined) return;
    void vote("challenge", { joined: true, done: false });
  };

  const markDone = () => {
    if (!hasJoined || hasDone) return;
    void vote("challenge", { joined: true, done: true });
  };

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

      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn btn-dark" disabled={hasJoined} onClick={join}>
          {hasJoined ? t("Joined") : t("I’m in")}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={!hasJoined || hasDone}
          onClick={markDone}
        >
          {hasDone ? t("Done ✓") : t("Mark as done")}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="border border-[rgba(23,61,50,0.15)] px-4 py-3" style={{ borderRadius: 2 }}>
          <p className="label text-[#6E6A5E]">{t("Joined")}</p>
          <p className="mt-1 text-[1.6rem] text-[#173D32]">{state.challenge.joined.length}</p>
          <p className="mt-1 text-[0.8rem] capitalize text-[#6E6A5E]">
            {state.challenge.joined.length === 0
              ? t("Nobody yet")
              : state.challenge.joined.join(", ")}
          </p>
        </div>
        <div className="border border-[rgba(23,61,50,0.15)] px-4 py-3" style={{ borderRadius: 2 }}>
          <p className="label text-[#6E6A5E]">{t("Completed by")}</p>
          <p className="mt-1 text-[1.6rem] text-[#173D32]">{state.challenge.done.length}</p>
          <p className="mt-1 text-[0.8rem] capitalize text-[#6E6A5E]">
            {state.challenge.done.length === 0 ? t("Nobody yet") : state.challenge.done.join(", ")}
          </p>
        </div>
      </div>
    </div>
  );
}
