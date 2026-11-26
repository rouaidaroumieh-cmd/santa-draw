"use client";

import { campaignStats } from "@/lib/draw-engine";
import { useT } from "@/lib/language";
import type { CampaignState } from "@/lib/types";

export function StatCards({ state }: { state: CampaignState }) {
  const t = useT();
  const s = campaignStats(state);
  const cards = [
    { label: t("Total Participants"), value: String(s.totalParticipants), note: t("Employees in the draw") },
    { label: t("Total Draw Days"), value: String(s.totalDrawDays), note: t("Monday to Friday only") },
    { label: t("Total Selections"), value: String(s.totalSelections), note: t("20 × 3 = 9 × 4 + 8 × 3") },
    {
      label: t("Completed Selections"),
      value: `${s.completedSelections}/${s.totalSelections}`,
      note: t("{count} still to be revealed", { count: s.remainingEmployeeSelections }),
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
      {cards.map((card, i) => (
        <div
          key={card.label}
          className="gold-frame lift relative overflow-hidden bg-[rgba(9,30,24,0.55)] px-4 py-5 sm:px-6 sm:py-7"
          style={{ borderRadius: 2, animationDelay: `${i * 90}ms` }}
        >
          <p className="label text-[0.58rem] text-gold/85 sm:text-[0.62rem]">{card.label}</p>
          <p className="tabular mt-3 font-display text-[2.4rem] leading-none text-ivory sm:text-[3.1rem]">
            {card.value}
          </p>
          <p className="mt-2 text-[0.72rem] leading-snug text-ivory/55">{card.note}</p>
          <span
            aria-hidden="true"
            className="absolute right-0 top-0 h-full w-[3px]"
            style={{ background: "linear-gradient(180deg, rgba(214,181,109,0.55), transparent)" }}
          />
        </div>
      ))}
    </div>
  );
}

export function CampaignProgress({ state }: { state: CampaignState }) {
  const t = useT();
  const s = campaignStats(state);
  return (
    <div className="gold-frame bg-[rgba(9,30,24,0.5)] px-5 py-6 sm:px-8 sm:py-7" style={{ borderRadius: 2 }}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label label-gold">{t("Campaign completion")}</p>
          <p className="mt-2 font-display text-[1.65rem] leading-none text-ivory">
            {t("{done} of {total} working days revealed", { done: s.completedDays, total: s.totalDrawDays })}
          </p>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="tabular font-display text-[2.6rem] leading-none text-gold">{s.percent}</span>
          <span className="label text-ivory/60">{t("per cent")}</span>
        </div>
      </div>

      <div
        className="mt-5 h-[10px] w-full overflow-hidden rounded-full border border-[rgba(214,181,109,0.35)] bg-[rgba(0,0,0,0.28)]"
        role="progressbar"
        aria-valuenow={s.completedSelections}
        aria-valuemin={0}
        aria-valuemax={s.totalSelections}
        aria-label={t("Completed selections")}
      >
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{
            width: `${Math.max(2, s.percent)}%`,
            background: "linear-gradient(90deg, #B08F4C 0%, #D6B56D 55%, #F0DDB2 100%)",
          }}
        />
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
        {[
          [t("Working days done"), `${s.completedDays}`],
          [t("Working days left"), `${s.remainingDays}`],
          [t("Participants completed"), `${s.completedParticipants}/${s.totalParticipants}`],
          [t("Selections remaining"), `${s.remainingEmployeeSelections}`],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="label text-[0.55rem] text-ivory/55">{label}</dt>
            <dd className="tabular mt-1.5 font-display text-[1.5rem] leading-none text-ivory">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
