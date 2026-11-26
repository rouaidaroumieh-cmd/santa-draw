"use client";

import { Overline, PageShell } from "@/components/Chrome";
import MemoryMatch from "@/components/fun/MemoryMatch";
import Quiz from "@/components/fun/Quiz";
import WishWall from "@/components/fun/WishWall";
import { useT } from "@/lib/language";

/** Public, playful corner. Nothing here touches the draw. */
export default function FunPage() {
  const t = useT();
  return (
    <PageShell current="fun">
      <section className="relative isolate overflow-hidden border-b border-[rgba(214,181,109,0.22)]">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(90% 120% at 12% 0%, rgba(36,92,70,0.85) 0%, rgba(15,43,35,0.9) 55%, #0d2620 100%)",
          }}
        />
        <div className="relative mx-auto max-w-[1240px] px-5 py-16 sm:py-20">
          <p className="label label-gold">{t("Just for fun")}</p>
          <h1 className="mt-5 text-[clamp(2.6rem,7.6vw,5.4rem)] leading-[0.95] text-ivory">
            {t("Christmas")}
            <span className="block text-gold">{t("Fun Corner")}</span>
          </h1>
          <p className="mt-6 max-w-[560px] font-display text-[1.15rem] italic leading-relaxed text-ivory/80">
            {t("Match the office photos, test your Christmas knowledge, or leave a wish for the whole office.")}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 pt-16 sm:pt-20">
        <Overline>{t("Memory match")}</Overline>
        <div className="mt-7">
          <MemoryMatch />
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 pt-16 sm:pt-20">
        <Overline>{t("Christmas quiz")}</Overline>
        <div className="mt-7">
          <Quiz />
        </div>
      </section>

      <section id="wish-wall" className="mx-auto max-w-[1240px] scroll-mt-24 px-5 pt-16 pb-4 sm:pt-20">
        <Overline>{t("Wish wall")}</Overline>
        <div className="mt-7">
          <WishWall />
        </div>
      </section>
    </PageShell>
  );
}
