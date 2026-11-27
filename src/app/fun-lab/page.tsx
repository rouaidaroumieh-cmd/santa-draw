"use client";

import { Overline, PageShell } from "@/components/Chrome";
import ElfVoteDemo from "@/components/fun-lab/ElfVoteDemo";
import { FunLabProvider, useFunLab } from "@/components/fun-lab/FunLabContext";
import FunLabLogin from "@/components/fun-lab/FunLabLogin";
import GuessElfDemo from "@/components/fun-lab/GuessElfDemo";
import MemoryMatchDemo from "@/components/fun-lab/MemoryMatchDemo";
import MostLikelyDemo from "@/components/fun-lab/MostLikelyDemo";
import PollDemo from "@/components/fun-lab/PollDemo";
import { useT } from "@/lib/language";
import type { ReactNode } from "react";

function LabSection({
  title,
  how,
  children,
}: {
  title: string;
  how: string;
  children: ReactNode;
}) {
  return (
    <section>
      <Overline>{title}</Overline>
      <p className="mt-3 max-w-[720px] text-[0.95rem] leading-relaxed text-ivory/70">{how}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function FunLabBody() {
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
        <FunLabLogin />
      </div>
    );
  }

  return (
    <>
      <div className="border-b border-[rgba(214,181,109,0.22)] bg-[rgba(9,30,24,0.55)] px-5 py-3">
        <div className="mx-auto flex max-w-[860px] flex-wrap items-center justify-between gap-3">
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

      <div className="mx-auto flex max-w-[860px] flex-col gap-14 px-5 py-14 sm:py-16">
        <LabSection
          title={t("1 · Poll of the day")}
          how={t(
            "One office question. Each person votes once. After voting, the bars update live — your choice is locked.",
          )}
        >
          <PollDemo />
        </LabSection>

        <LabSection
          title={t("2 · Elf costume vote")}
          how={t(
            "Vote for your favourite elf look among the 20 colleagues. One vote only — once cast, it is locked. The podium (top 3) updates live below.",
          )}
        >
          <ElfVoteDemo />
        </LabSection>

        <LabSection
          title={t("3 · Memory match")}
          how={t(
            "Find matching elf photo pairs. Fewer moves is better — your personal best is saved on the shared leaderboard.",
          )}
        >
          <MemoryMatchDemo />
        </LabSection>

        <LabSection
          title={t("4 · Who is this elf?")}
          how={t(
            "Ten blurred elves. Guess each colleague among 4 names. Your best score is saved on the shared leaderboard — a perfect 10/10 gets a tada celebration.",
          )}
        >
          <GuessElfDemo />
        </LabSection>

        <LabSection
          title={t("5 · Most likely to…")}
          how={t(
            "Ten fun questions. Vote for the colleague who fits best on each one. On the last question, tap Finish to lock your answers — leaders appear on the home page.",
          )}
        >
          <MostLikelyDemo />
        </LabSection>
      </div>
    </>
  );
}

/**
 * Internal demo lab for validating interactive games with the team.
 * Not linked from the main navigation — open `/fun-lab` directly.
 * Protected by a stable per-person PIN; votes are shared on the server.
 */
export default function FunLabPage() {
  const t = useT();

  return (
    <PageShell current="fun-lab">
      <div className="relative z-20 border-b border-[rgba(214,181,109,0.35)] bg-[rgba(122,31,43,0.85)] px-5 py-3 text-center">
        <p className="label text-ivory">
          {t("LAB DEMO — not official")} · {t("For team validation only")} · /fun-lab
        </p>
      </div>

      <section className="relative isolate overflow-hidden border-b border-[rgba(214,181,109,0.22)]">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(90% 120% at 12% 0%, rgba(36,92,70,0.85) 0%, rgba(15,43,35,0.9) 55%, #0d2620 100%)",
          }}
        />
        <div className="relative mx-auto max-w-[1240px] px-5 py-14 sm:py-16">
          <p className="label label-gold">{t("Fun Lab")}</p>
          <h1 className="mt-4 text-[clamp(2.2rem,6.5vw,4.4rem)] leading-[0.95] text-ivory">
            {t("Try the ideas")}
            <span className="block text-gold">{t("Pick what we keep")}</span>
          </h1>
          <p className="mt-5 max-w-[640px] font-display text-[1.1rem] italic leading-relaxed text-ivory/80">
            {t(
              "Playable prototypes: polls, elf votes, memory match, guess-who and “most likely to…”. Scores and votes are shared — unlock with your personal PIN.",
            )}
          </p>
          <p className="mt-4 max-w-[640px] text-[0.9rem] leading-relaxed text-ivory/55">
            {t(
              "How to test: unlock with your name + PIN, play once, then look at the live result. Nothing jumps to the next game — scroll when you are ready.",
            )}
          </p>
        </div>
      </section>

      <FunLabProvider>
        <FunLabBody />
      </FunLabProvider>
    </PageShell>
  );
}
