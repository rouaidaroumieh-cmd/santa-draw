/**
 * Campaign calendar: 30 November – 22 December 2026 (23 calendar days).
 * The draw takes place on the working days listed in DRAW_PLAN, with the number
 * of winners planned for each day (60 selections in total).
 */
import type { Lang } from "./i18n";
import { MONTH_NAMES, WEEKDAY_NAMES } from "./types";

export const CAMPAIGN_YEAR = 2026;
export const CAMPAIGN_START = "2026-11-30";
export const CAMPAIGN_END = "2026-12-22";

/** Planned winners for each working day (Monday–Friday only). */
export const DRAW_PLAN: ReadonlyArray<{ date: string; winners: number }> = [
  { date: "2026-11-30", winners: 4 },
  { date: "2026-12-01", winners: 4 },
  { date: "2026-12-02", winners: 4 },
  { date: "2026-12-03", winners: 3 },
  { date: "2026-12-04", winners: 3 },
  { date: "2026-12-07", winners: 4 },
  { date: "2026-12-08", winners: 4 },
  { date: "2026-12-09", winners: 4 },
  { date: "2026-12-10", winners: 3 },
  { date: "2026-12-11", winners: 4 },
  { date: "2026-12-14", winners: 4 },
  { date: "2026-12-15", winners: 3 },
  { date: "2026-12-16", winners: 3 },
  { date: "2026-12-17", winners: 3 },
  { date: "2026-12-18", winners: 3 },
  { date: "2026-12-21", winners: 3 },
  { date: "2026-12-22", winners: 4 },
];

export interface CalendarDay {
  date: string;
  dayOfMonth: number;
  weekdayIndex: number;
  weekday: string;
  weekdayShort: string;
  monthName: string;
  year: number;
  isWeekend: boolean;
  eligible: boolean;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function isoDate(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

const DAY_MS = 86400000;

const CALENDAR: CalendarDay[] = (() => {
  const planned = new Set(DRAW_PLAN.map((d) => d.date));
  const days: CalendarDay[] = [];
  const end = Date.parse(`${CAMPAIGN_END}T00:00:00Z`);
  for (let t = Date.parse(`${CAMPAIGN_START}T00:00:00Z`); t <= end; t += DAY_MS) {
    const dt = new Date(t);
    const weekdayIndex = dt.getUTCDay();
    const date = dt.toISOString().slice(0, 10);
    days.push({
      date,
      dayOfMonth: dt.getUTCDate(),
      weekdayIndex,
      weekday: WEEKDAY_NAMES[weekdayIndex],
      weekdayShort: WEEKDAY_NAMES[weekdayIndex].slice(0, 3),
      monthName: MONTH_NAMES[dt.getUTCMonth()],
      year: dt.getUTCFullYear(),
      isWeekend: weekdayIndex === 0 || weekdayIndex === 6,
      eligible: planned.has(date),
    });
  }
  return days;
})();

export function getCalendarDays(): CalendarDay[] {
  return CALENDAR;
}

export function getEligibleDates(): string[] {
  return CALENDAR.filter((d) => d.eligible).map((d) => d.date);
}

export function getWeekendDates(): string[] {
  return CALENDAR.filter((d) => d.isWeekend).map((d) => d.date);
}

/** Number of winners planned for a draw day, or 0 if it is not a draw day. */
export function winnersOn(date: string): number {
  return DRAW_PLAN.find((d) => d.date === date)?.winners ?? 0;
}

const COUNT_WORDS: Record<Lang, string[]> = {
  en: ["no", "one", "two", "three", "four", "five"],
  fr: ["aucun", "un", "deux", "trois", "quatre", "cinq"],
};

/** "three" for 3, used in the copy. */
export function countWord(n: number, lang: Lang = "en"): string {
  return COUNT_WORDS[lang][n] ?? String(n);
}

export function getDay(date: string): CalendarDay | undefined {
  return CALENDAR.find((d) => d.date === date);
}

export function isEligibleDate(date: string): boolean {
  const d = getDay(date);
  return !!d && d.eligible;
}

export function isWeekendDate(date: string): boolean {
  const d = getDay(date);
  return !!d && d.isWeekend;
}

const LOCALE: Record<Lang, string> = { en: "en-GB", fr: "fr-FR" };

/** "Tuesday, 1 December 2026" (or "Mardi 1 décembre 2026") */
export function formatDateLong(date: string, lang: Lang = "en"): string {
  const parsed = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  const weekday = parsed.toLocaleDateString(LOCALE[lang], { weekday: "long", timeZone: "UTC" });
  const rest = parsed.toLocaleDateString(LOCALE[lang], {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  if (lang === "fr") return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${rest}`;
  return `${weekday}, ${rest}`;
}

/** "Tue 1 Dec" (or "mar. 1 déc.") */
export function formatDateShort(date: string, lang: Lang = "en"): string {
  const parsed = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString(LOCALE[lang], {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/** "Tuesday" (or "mardi") for a campaign day, used in the calendar. */
export function weekdayName(date: string, lang: Lang = "en", style: "long" | "short" = "long"): string {
  const parsed = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString(LOCALE[lang], { weekday: style, timeZone: "UTC" });
}

/** "1st", "2nd" (or "1re", "2e") */
export function ordinal(n: number, lang: Lang = "en"): string {
  if (lang === "fr") return n === 1 ? "1re" : `${n}e`;
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** Number of days between two ISO dates (b - a). */
export function daysBetween(a: string, b: string): number {
  const ta = Date.parse(`${a}T00:00:00`);
  const tb = Date.parse(`${b}T00:00:00`);
  return Math.round((tb - ta) / DAY_MS);
}

/** The next eligible draw date that has not been revealed yet, from `from` onwards. */
export function nextOpenDate(from: string, revealed: Record<string, unknown>): string | null {
  for (const d of CALENDAR) {
    if (!d.eligible) continue;
    if (d.date < from) continue;
    if (revealed[d.date]) continue;
    return d.date;
  }
  return null;
}
