"use client";

import { Overline, PageShell } from "@/components/Chrome";
import ChallengeDemo from "@/components/fun-lab/ChallengeDemo";
import ElfVoteDemo from "@/components/fun-lab/ElfVoteDemo";
import GuessElfDemo from "@/components/fun-lab/GuessElfDemo";
import PollDemo from "@/components/fun-lab/PollDemo";
import WishLikeDemo from "@/components/fun-lab/WishLikeDemo";
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

/**
 * Internal demo lab for validating interactive games with the team.
 * Not linked from the main navigation — open `/fun-lab` directly.
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
              "Playable prototypes: polls, elf votes, guess-who, daily challenges and wish likes. Local demo only — nothing is saved on the server.",
            )}
          </p>
          <p className="mt-4 max-w-[640px] text-[0.9rem] leading-relaxed text-ivory/55">
            {t(
              "How to test: pick your name, play once, then look at the live result. Nothing jumps to the next game — scroll when you are ready.",
            )}
          </p>
        </div>
      </section>

      <div className="mx-auto flex max-w-[860px] flex-col gap-14 px-5 py-14 sm:py-16">
        <LabSection
          title={t("1 · Poll of the day")}
          how={t(
            "One office question. Each person votes once with their first name. After voting, the bars update live — you stay on this block and can still change your vote.",
          )}
        >
          <PollDemo />
        </LabSection>

        <LabSection
          title={t("2 · Elf costume vote")}
          how={t(
            "Vote for your favourite elf look among the 20 colleagues. After you vote, the podium (top 3) appears below. One vote per name; you can change it.",
          )}
        >
          <ElfVoteDemo />
        </LabSection>

        <LabSection
          title={t("3 · Who is this elf?")}
          how={t(
            "A blurred elf photo. Guess who it is among 4 names. You get instant feedback, then “Next elf”. Score is for this session only.",
          )}
        >
          <GuessElfDemo />
        </LabSection>

        <LabSection
          title={t("4 · Challenge of the day")}
          how={t(
            "A daily mission for the team. Tap “I’m in”, then “Mark as done” when finished. Counters show who joined and who completed.",
          )}
        >
          <ChallengeDemo />
        </LabSection>

        <LabSection
          title={t("5 · Wish likes")}
          how={t(
            "Heart the wishes you like. The list reorders by likes. One like per wish per name — tap again to remove it.",
          )}
        >
          <WishLikeDemo />
        </LabSection>
      </div>
    </PageShell>
  );
}
