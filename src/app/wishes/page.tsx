"use client";

import { Overline, PageShell } from "@/components/Chrome";
import WishWall from "@/components/fun/WishWall";
import { useT } from "@/lib/language";

/** Public Christmas wishes — leave and read office wishes. Games live in Fun Lab later. */
export default function WishesPage() {
  const t = useT();
  return (
    <PageShell current="wishes">
      <section className="relative isolate overflow-hidden border-b border-[rgba(214,181,109,0.22)]">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(90% 120% at 12% 0%, rgba(36,92,70,0.85) 0%, rgba(15,43,35,0.9) 55%, #0d2620 100%)",
          }}
        />
        <div className="relative mx-auto max-w-[1240px] px-5 py-16 sm:py-20">
          <p className="label label-gold">{t("From the office")}</p>
          <h1 className="mt-5 text-[clamp(2.6rem,7.6vw,5.4rem)] leading-[0.95] text-ivory">
            {t("Christmas")}
            <span className="block text-gold">{t("Wishes")}</span>
          </h1>
          <p className="mt-6 max-w-[560px] font-display text-[1.15rem] italic leading-relaxed text-ivory/80">
            {t("Leave a wish for the whole office — and read what everyone else wrote.")}
          </p>
        </div>
      </section>

      <section id="wish-wall" className="mx-auto max-w-[1240px] scroll-mt-24 px-5 py-16 sm:py-20">
        <Overline>{t("Wish wall")}</Overline>
        <div className="mt-7">
          <WishWall />
        </div>
      </section>
    </PageShell>
  );
}
