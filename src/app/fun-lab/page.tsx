"use client";

import { Overline, PageShell } from "@/components/Chrome";
import ChallengeDemo from "@/components/fun-lab/ChallengeDemo";
import ElfVoteDemo from "@/components/fun-lab/ElfVoteDemo";
import GuessElfDemo from "@/components/fun-lab/GuessElfDemo";
import PollDemo from "@/components/fun-lab/PollDemo";
import WishLikeDemo from "@/components/fun-lab/WishLikeDemo";
import { useT } from "@/lib/language";

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
        </div>
      </section>

      <div className="mx-auto flex max-w-[860px] flex-col gap-14 px-5 py-14 sm:py-16">
        <section>
          <Overline>{t("1 · Poll of the day")}</Overline>
          <div className="mt-6">
            <PollDemo />
          </div>
        </section>

        <section>
          <Overline>{t("2 · Elf costume vote")}</Overline>
          <div className="mt-6">
            <ElfVoteDemo />
          </div>
        </section>

        <section>
          <Overline>{t("3 · Who is this elf?")}</Overline>
          <div className="mt-6">
            <GuessElfDemo />
          </div>
        </section>

        <section>
          <Overline>{t("4 · Challenge of the day")}</Overline>
          <div className="mt-6">
            <ChallengeDemo />
          </div>
        </section>

        <section>
          <Overline>{t("5 · Wish likes")}</Overline>
          <div className="mt-6">
            <WishLikeDemo />
          </div>
        </section>
      </div>
    </PageShell>
  );
}
