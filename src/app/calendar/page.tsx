"use client";

import { useMemo, useState } from "react";
import Avatar from "@/components/Avatar";
import Dialog from "@/components/Dialog";
import { Overline, PageShell } from "@/components/Chrome";
import { SELECTIONS_PER_PARTICIPANT, campaignStats } from "@/lib/draw-engine";
import {
  formatDateLong,
  formatDateShort,
  getCalendarDays,
  ordinal,
  weekdayName,
  type CalendarDay,
} from "@/lib/dates";
import { useLang, useT } from "@/lib/language";
import { useCampaign, type CampaignState } from "@/lib/store";
import type { Lang } from "@/lib/i18n";

function appearancesUpTo(state: CampaignState, date: string, id: string): number {
  return Object.values(state.results).filter(
    (r) => r.date <= date && r.participantIds.includes(id),
  ).length;
}

const WEEKDAY_HEADER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAY_HEADER_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

/** Column index for a Monday-first advent grid. */
function columnOf(day: CalendarDay): number {
  return (day.weekdayIndex + 6) % 7;
}

export default function CalendarPage() {
  const state = useCampaign();
  const lang = useLang();
  const t = useT();
  const [openDay, setOpenDay] = useState<string | null>(null);
  const days = useMemo(() => getCalendarDays(), []);
  const leadOffset = columnOf(days[0]);

  if (!state) {
    return (
      <PageShell current="calendar">
        <div className="mx-auto flex min-h-[70vh] max-w-[1240px] items-center justify-center px-5">
          <p className="label label-gold animate-pulse">{t("Opening the calendar…")}</p>
        </div>
      </PageShell>
    );
  }

  const stats = campaignStats(state);
  const detail = openDay ? days.find((d) => d.date === openDay) ?? null : null;
  const detailResult = openDay ? state.results[openDay] : undefined;
  const weekdayHeaders = lang === "fr" ? WEEKDAY_HEADER_FR : WEEKDAY_HEADER;

  return (
    <PageShell current="calendar">
      {/* ---- Banner ------------------------------------------------- */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/gold-star.jpg" alt="" aria-hidden="true" className="h-full w-full object-cover" />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(92deg, rgba(13,38,32,0.97) 0%, rgba(13,38,32,0.86) 40%, rgba(13,38,32,0.3) 100%)",
            }}
          />
        </div>
        <div className="relative mx-auto max-w-[1240px] px-5 py-16 sm:py-20">
          <p className="label label-gold">{t("30 November – 22 December 2026")}</p>
          <h1
            className="mt-5 text-ivory"
            style={{ fontSize: "clamp(2.7rem, 8vw, 6.2rem)", lineHeight: 0.88, letterSpacing: "-0.035em", fontWeight: 300 }}
          >
            {t("The Christmas")}
            <span className="block text-gold" style={{ fontWeight: 500 }}>
              {t("Calendar")}
            </span>
          </h1>
          <p className="mt-6 max-w-[540px] font-display text-[1.15rem] italic leading-relaxed text-ivory/80" style={{ fontWeight: 300 }}>
            {t(
              "Every working day holds three or four names. Weekends rest. Future days stay sealed until their morning arrives.",
            )}
          </p>
          <p className="label mt-8 text-ivory/60">
            {t("{done} of {total} working days revealed · {remaining} still to come", {
              done: stats.completedDays,
              total: stats.totalDrawDays,
              remaining: stats.remainingDays,
            })}
          </p>
        </div>
      </section>

      {/* ---- Advent grid -------------------------------------------- */}
      <section className="px-5 py-14 sm:py-18">
        <div className="mx-auto max-w-[1240px]">
          <Overline>{t("The advent grid")}</Overline>

          <div className="mt-6 hidden grid-cols-7 gap-2 md:grid">
            {weekdayHeaders.map((d, i) => (
              <div
                key={d}
                className={`label pb-2 text-center ${i > 4 ? "text-ivory/35" : "text-gold/75"}`}
              >
                {d}
              </div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-7 md:gap-2">
            {Array.from({ length: leadOffset }, (_, i) => (
              <div key={`spacer-${i}`} aria-hidden="true" className="hidden md:block" />
            ))}

            {days.map((day) => {
              const result = state.results[day.date];
              if (day.isWeekend) return <WeekendCard key={day.date} day={day} />;
              if (result) {
                return (
                  <CompletedCard
                    key={day.date}
                    day={day}
                    state={state}
                    onOpen={() => setOpenDay(day.date)}
                  />
                );
              }
              return <UpcomingCard key={day.date} day={day} />;
            })}
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              [t("Working day"), t("Three or four names are revealed and locked permanently.")],
              [t("Weekend"), t("No draw — Santa is taking a little Christmas break.")],
              [t("Upcoming"), t("Names stay sealed until the day itself.")],
            ].map(([title, body]) => (
              <div key={title} className="border-l border-[rgba(214,181,109,0.35)] pl-4">
                <p className="label text-gold">{title}</p>
                <p className="mt-2 text-[0.88rem] leading-relaxed text-ivory/65">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Historical detail -------------------------------------- */}
      <Dialog
        open={!!detail && !!detailResult}
        onClose={() => setOpenDay(null)}
        eyebrow={detail ? formatDateLong(detail.date, lang) : ""}
        title={detailResult ? t("The Christmas picks of {date}", { date: formatDateShort(detailResult.date, lang) }) : ""}
        actions={
          <button type="button" className="btn btn-dark" onClick={() => setOpenDay(null)}>
            {t("Close")}
          </button>
        }
      >
        {detailResult ? (
          <ul className="flex flex-col gap-4">
            {detailResult.participantIds.map((id, i) => {
              const p = state.participants.find((x) => x.id === id);
              const app = appearancesUpTo(state, detailResult.date, id);
              const left = SELECTIONS_PER_PARTICIPANT - app;
              return (
                <li key={id} className="flex items-center gap-4">
                  <Avatar id={id} name={p?.name ?? id} photo={state.photos[id]} size={58} />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-[1.15rem] leading-tight text-[#173D32]">
                      {p?.name ?? id}
                    </p>
                    <p className="label mt-1 text-[0.55rem] text-[#B08F4C]">
                      {t("{ordinal} selection", { ordinal: ordinal(app, lang) })} ·{" "}
                      {left === 1
                        ? t("1 chance remaining at the time")
                        : t("{count} chances remaining at the time", { count: left })}
                    </p>
                  </div>
                  <span className="label text-[0.55rem] text-[#6E6A5E]">
                    {t("No.")} {i + 1}
                  </span>
                </li>
              );
            })}
            <li className="rule-solid pt-4">
              <p className="label text-[#6E6A5E]">{t("Status")}</p>
              <p className="mt-2 text-[0.88rem] leading-relaxed text-[#4A463C]">
                {t("DRAW COMPLETED – RESULTS LOCKED. Revealed on {date}. These results can never be changed or redrawn.", {
                  date: new Date(detailResult.revealedAt).toLocaleString(lang === "fr" ? "fr-FR" : "en-GB", {
                    dateStyle: "long",
                    timeStyle: "short",
                  }),
                })}
              </p>
            </li>
          </ul>
        ) : null}
      </Dialog>
    </PageShell>
  );
}

/* ------------------------------------------------------------------ */

function UpcomingCard({ day }: { day: CalendarDay }) {
  const lang = useLang();
  const t = useT();
  return (
    <article
      className="gold-frame lift flex flex-col justify-between bg-[rgba(9,30,24,0.5)] px-3.5 py-4"
      style={{ borderRadius: 2, minHeight: 210 }}
    >
      <div>
        <div className="flex items-start justify-between">
          <span className="tabular font-display text-[2.15rem] leading-none text-ivory">
            {day.dayOfMonth}
          </span>
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" className="opacity-80">
            <path
              d="M12 2.6 L14.2 8.6 L20.6 8.8 L15.6 12.6 L17.4 18.8 L12 15.1 L6.6 18.8 L8.4 12.6 L3.4 8.8 L9.8 8.6 Z"
              fill="none"
              stroke="#D6B56D"
              strokeWidth="1.1"
            />
          </svg>
        </div>
        <p className="label mt-2 text-[0.52rem] text-gold/80">{weekdayName(day.date, lang)}</p>
      </div>
      <div>
        <span className="label inline-block border border-[rgba(214,181,109,0.45)] px-2 py-1 text-[0.5rem] text-gold">
          {t("Upcoming")}
        </span>
        <p className="mt-3 text-[0.72rem] leading-relaxed text-ivory/55">
          {t("A Christmas surprise is waiting…")}
        </p>
      </div>
    </article>
  );
}

function CompletedCard({
  day,
  state,
  onOpen,
}: {
  day: CalendarDay;
  state: CampaignState;
  onOpen: () => void;
}) {
  const lang: Lang = useLang();
  const t = useT();
  const result = state.results[day.date];
  return (
    <button
      type="button"
      onClick={onOpen}
      className="paper gold-frame lift flex flex-col justify-between px-3.5 py-4 text-left"
      style={{ borderRadius: 2, minHeight: 210 }}
      aria-label={t("Open the results of {date}", { date: formatDateLong(day.date, lang) })}
    >
      <div>
        <div className="flex items-start justify-between">
          <span className="tabular font-display text-[2.15rem] leading-none text-[#173D32]">
            {day.dayOfMonth}
          </span>
          <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="5" y="10.5" width="14" height="9.5" rx="1.6" fill="#B08F4C" />
            <path d="M8.2 10.5 V8 a3.8 3.8 0 0 1 7.6 0 v2.5" stroke="#B08F4C" strokeWidth="1.6" fill="none" />
            <circle cx="12" cy="15" r="1.5" fill="#F8F3E9" />
          </svg>
        </div>
        <p className="label mt-2 text-[0.52rem] text-[#B08F4C]">{weekdayName(day.date, lang)}</p>
      </div>

      <div>
        <div className="mt-3 flex -space-x-2">
          {result?.participantIds.map((id) => {
            const p = state.participants.find((x) => x.id === id);
            return (
              <span key={id} className="ring-2 ring-[#F8F3E9] rounded-full">
                <Avatar id={id} name={p?.name ?? id} photo={state.photos[id]} size={30} ring={false} />
              </span>
            );
          })}
        </div>
        <ul className="mt-2.5 space-y-0.5">
          {result?.participantIds.map((id) => {
            const p = state.participants.find((x) => x.id === id);
            return (
              <li key={id} className="truncate text-[0.72rem] leading-snug text-[#4A463C]">
                {p?.name ?? id}
              </li>
            );
          })}
        </ul>
        <p className="label mt-2.5 text-[0.5rem] text-[#B08F4C]">{t("Completed · Locked")}</p>
      </div>
    </button>
  );
}

function WeekendCard({ day }: { day: CalendarDay }) {
  const lang = useLang();
  const t = useT();
  return (
    <article
      className="relative overflow-hidden border border-[rgba(214,181,109,0.22)]"
      style={{ borderRadius: 2, minHeight: 210 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/weekend-rest.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover opacity-70"
        style={{ objectPosition: "50% 40%" }}
      />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgba(13,38,32,0.55) 0%, rgba(13,38,32,0.9) 78%)" }}
      />
      <div className="relative flex h-full flex-col justify-between px-3.5 py-4" style={{ minHeight: 210 }}>
        <div>
          <div className="flex items-start justify-between">
            <span className="tabular font-display text-[2.15rem] leading-none text-ivory/80">
              {day.dayOfMonth}
            </span>
            <span className="label text-[0.5rem] text-gold/80">{t("Rest")}</span>
          </div>
          <p className="label mt-2 text-[0.52rem] text-ivory/55">{weekdayName(day.date, lang)}</p>
        </div>
        <div>
          <p className="label text-[0.5rem] text-gold">{t("Weekend – no draw")}</p>
          <p className="mt-2 text-[0.7rem] leading-relaxed text-ivory/55">
            {t("Santa is taking a little Christmas break.")}
          </p>
        </div>
      </div>
    </article>
  );
}
