"use client";

import type { ReactNode } from "react";
import FunLabLogin from "@/components/fun-lab/FunLabLogin";
import { FunLabProvider, useFunLab } from "@/components/fun-lab/FunLabContext";
import { useT } from "@/lib/language";

function GateBody({ children }: { children: ReactNode }) {
  const t = useT();
  const { ready, name, logout, error } = useFunLab();

  if (!ready) {
    return (
      <p className="px-5 py-16 text-center font-display text-[1.2rem] italic text-ivory/70">
        {t("Loading…")}
      </p>
    );
  }

  if (!name) {
    return (
      <div className="mx-auto max-w-[860px] px-5 py-14 sm:py-16">
        <p className="mb-6 text-center font-display text-[1.15rem] italic text-ivory/80">
          {t("Unlock with your PIN to play — scores join the shared leaderboards.")}
        </p>
        <FunLabLogin />
      </div>
    );
  }

  return (
    <>
      <div className="border-b border-[rgba(214,181,109,0.22)] bg-[rgba(9,30,24,0.55)] px-5 py-3">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-3">
          <p className="text-[0.9rem] text-ivory/85">
            {t("Signed in as")}{" "}
            <span className="capitalize text-gold">{name}</span>
          </p>
          <button type="button" className="btn btn-ghost" onClick={() => void logout()}>
            {t("Sign out")}
          </button>
        </div>
      </div>
      {error ? (
        <p role="alert" className="px-5 py-3 text-center text-[0.9rem] text-[#ffb4bc]">
          {t(error)}
        </p>
      ) : null}
      {children}
    </>
  );
}

/** Same PIN session as Fun Lab — required so office-game scores feed home leaderboards. */
export default function GamesAuthGate({ children }: { children: ReactNode }) {
  return (
    <FunLabProvider>
      <GateBody>{children}</GateBody>
    </FunLabProvider>
  );
}
