/**
 * Campaign calendar: 1–21 December 2026.
 * Only Monday–Friday are eligible draw days (15 days in total).
 */
import { MONTH_NAMES, WEEKDAY_NAMES } from "./types";

export const CAMPAIGN_YEAR = 2026;
export const CAMPAIGN_MONTH = 12; // December (1-based for readability)
export const CAMPAIGN_FIRST_DAY = 1;
export const CAMPAIGN_LAST_DAY = 21;

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

const CALENDAR: CalendarDay[] = (() => {
  const days: CalendarDay[] = [];
  for (let d = CAMPAIGN_FIRST_DAY; d <= CAMPAIGN_LAST_DAY; d++) {
    const dt = new Date(CAMPAIGN_YEAR, CAMPAIGN_MONTH - 1, d);
    const weekdayIndex = dt.getDay();
    const isWeekend = weekdayIndex === 0 || weekdayIndex === 6;
    days.push({
      date: isoDate(CAMPAIGN_YEAR, CAMPAIGN_MONTH, d),
      dayOfMonth: d,
      weekdayIndex,
      weekday: WEEKDAY_NAMES[weekdayIndex],
      weekdayShort: WEEKDAY_NAMES[weekdayIndex].slice(0, 3),
      monthName: MONTH_NAMES[CAMPAIGN_MONTH - 1],
      year: CAMPAIGN_YEAR,
      isWeekend,
      eligible: !isWeekend,
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

/** "Tuesday, 1 December 2026" */
export function formatDateLong(date: string): string {
  const d = getDay(date);
  if (!d) return date;
  return `${d.weekday}, ${d.dayOfMonth} ${d.monthName} ${d.year}`;
}

/** "Tue 1 Dec" */
export function formatDateShort(date: string): string {
  const d = getDay(date);
  if (!d) return date;
  return `${d.weekdayShort} ${d.dayOfMonth} ${d.monthName.slice(0, 3)}`;
}

export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** Number of days between two ISO dates (b - a). */
export function daysBetween(a: string, b: string): number {
  const ta = Date.parse(`${a}T00:00:00`);
  const tb = Date.parse(`${b}T00:00:00`);
  return Math.round((tb - ta) / 86400000);
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
