"use client";

import Link from "next/link";
import { Overline, PageShell } from "@/components/Chrome";
import { OFFICE_GAMES } from "@/lib/office-games/catalog";
import { useT } from "@/lib/language";

/** Public Christmas Office Games arcade hub. */
export default function GamesHubPage() {
  const t = useT();

  return (
    <PageShell current="games">
      <section className="relative isolate overflow-hidden border-b border-[rgba(214,181,109,0.22)]">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(90% 120% at 12% 0%, rgba(122,31,43,0.55) 0%, rgba(15,43,35,0.92) 50%, #0d2620 100%)",
          }}
        />
        <div className="relative mx-auto max-w-[1240px] px-5 py-16 sm:py-20">
          <p className="label label-gold">{t("Christmas Office Games")}</p>
          <h1 className="mt-5 text-[clamp(2.4rem,7vw,5rem)] leading-[0.95] text-ivory">
            {t("Welcome to")}
            <span className="block text-gold">{t("Christmas Office Games")}</span>
          </h1>
          <p className="mt-6 max-w-[640px] font-display text-[1.15rem] italic leading-relaxed text-ivory/85">
            {t(
              "Ready for some festive fun? Take a break, challenge your colleagues and discover who’s the real Christmas star of the office!",
            )}
          </p>
          <p className="mt-5 inline-block border border-[rgba(214,181,109,0.45)] bg-[rgba(214,181,109,0.12)] px-4 py-2 label text-gold">
            {t("5 Mini Games • Quick rounds • Endless Christmas Fun!")}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-14 sm:py-16">
        <Overline>{t("Pick a game")}</Overline>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {OFFICE_GAMES.map((game) => (
            <article
              key={game.slug}
              className="paper gold-frame flex flex-col gap-4 px-5 py-6"
              style={{ borderRadius: 2 }}
            >
              <div
                className="h-1.5 w-16"
                style={{ background: game.accent }}
                aria-hidden
              />
              <h2 className="text-[1.35rem] leading-snug text-[#173D32]" style={{ fontWeight: 600 }}>
                {t(game.titleKey)}
              </h2>
              <p className="flex-1 text-[0.95rem] leading-relaxed text-[#3D3A30]">{t(game.blurbKey)}</p>
              <p className="text-[0.85rem] text-[#6E6A5E]">
                {t(game.questionsLabelKey)} · {t(game.durationKey)}
              </p>
              <Link href={`/games/${game.slug}`} className="btn btn-dark self-start">
                {t("Play now")}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 pb-16 sm:pb-20">
        <Overline>{t("Also in Fun Lab")}</Overline>
        <p className="mt-4 max-w-[640px] text-[0.95rem] leading-relaxed text-ivory/70">
          {t(
            "Memory Match and Who is this elf? stay in Fun Lab (PIN). They are unchanged — open Fun Lab to play them.",
          )}
        </p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div className="paper gold-frame flex flex-col gap-3 px-5 py-6" style={{ borderRadius: 2 }}>
            <h3 className="text-[1.25rem] text-[#173D32]" style={{ fontWeight: 600 }}>
              {t("Memory match")}
            </h3>
            <p className="text-[0.95rem] text-[#3D3A30]">
              {t("Find matching elf photo pairs. Best scores stay on the Fun Lab leaderboard.")}
            </p>
            <Link href="/fun-lab" className="btn btn-dark self-start">
              {t("Open Fun Lab")}
            </Link>
          </div>
          <div className="paper gold-frame flex flex-col gap-3 px-5 py-6" style={{ borderRadius: 2 }}>
            <h3 className="text-[1.25rem] text-[#173D32]" style={{ fontWeight: 600 }}>
              {t("Who is this elf?")}
            </h3>
            <p className="text-[0.95rem] text-[#3D3A30]">
              {t("Guess blurred elf photos. Perfect scores celebrate with confetti.")}
            </p>
            <Link href="/fun-lab" className="btn btn-dark self-start">
              {t("Open Fun Lab")}
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
