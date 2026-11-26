"use client";

import Link from "next/link";
import { useMemo } from "react";
import Avatar from "@/components/Avatar";
import { Overline } from "@/components/Chrome";
import { participantStats, SELECTIONS_PER_PARTICIPANT } from "@/lib/draw-engine";
import { useT } from "@/lib/language";
import type { CampaignState } from "@/lib/types";

/** Home-page block: every participant's portrait, with the selections they have already used. */
export default function ParticipantGallery({ state }: { state: CampaignState }) {
  const t = useT();
  const people = useMemo(() => participantStats(state), [state]);

  return (
    <section className="px-5 pt-20 sm:pt-24">
      <div className="mx-auto max-w-[1240px]">
        <Overline>{t("Meet the participants")}</Overline>

        <div className="mt-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <h2 className="max-w-[640px] text-[2.1rem] leading-[1.05] text-ivory sm:text-[2.6rem]" style={{ fontWeight: 300 }}>
            {t("Twenty colleagues,")}
            <span className="block text-gold" style={{ fontWeight: 500 }}>
              {t("three chances each")}
            </span>
          </h2>
          <Link href="/participants" className="btn btn-ghost self-start sm:self-auto">
            {t("See the full list")}
          </Link>
        </div>

        <ul className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-5">
          {people.map((p, i) => {
            const photo = state.photos[p.id];
            return (
              <li
                key={p.id}
                className="gold-frame lift rise group relative aspect-[4/5] overflow-hidden bg-[#123227]"
                style={{ borderRadius: 2, animationDelay: `${Math.min(i, 10) * 50}ms` }}
              >
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo}
                    alt={p.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    style={{ objectPosition: "50% 40%" }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Avatar id={p.id} name={p.name} size={96} />
                  </div>
                )}

                <div
                  className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-1.5 px-3 pb-3 pt-14"
                  style={{ background: "linear-gradient(180deg, transparent, rgba(9,30,24,0.94))" }}
                >
                  <span className="font-display text-[1.1rem] capitalize leading-tight text-ivory">{p.name}</span>
                  <span
                    role="img"
                    aria-label={t("{done}/{total} selections", { done: p.selected, total: SELECTIONS_PER_PARTICIPANT })}
                    className="flex shrink-0 gap-0.5 text-[0.85rem] leading-none"
                  >
                    {Array.from({ length: SELECTIONS_PER_PARTICIPANT }, (_, n) => (
                      <span key={n} aria-hidden="true" className={n < p.selected ? "text-gold" : "text-ivory/35"}>
                        {n < p.selected ? "★" : "☆"}
                      </span>
                    ))}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
