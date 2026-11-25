/**
 * Core data model for SANTA'S CHRISTMAS DRAW 2026.
 *
 * The campaign lives in PostgreSQL. Browsers only ever receive `CampaignState`,
 * a public view of it: the winners of upcoming days never leave the server.
 */

export const DATA_VERSION = 1;
export const CAMPAIGN_ID = "santas-christmas-draw-2026";

export interface Participant {
  id: string;
  /** Full name. Placeholder until the real participant list arrives. */
  name: string;
  /** Short role / department caption shown under the name. */
  role: string;
}

export interface DaySchedule {
  /** ISO date, e.g. "2026-12-01" */
  date: string;
  /** Exactly 4 distinct participant ids, in reveal order. */
  participantIds: string[];
}

export interface DrawResult {
  date: string;
  participantIds: string[];
  /** ISO timestamp of the moment the draw was permanently locked. */
  revealedAt: string;
}

export interface Settings {
  /** "auto" uses the server date, "manual" uses `manualDate` (rehearsals). */
  dateMode: "auto" | "manual";
  manualDate: string | null;
}

/** Everything stored in the `campaigns` table, besides results and photos. */
export interface CampaignConfig {
  createdAt: string;
  /** "draft" until the first reveal (or an explicit admin start). */
  status: "draft" | "active";
  participants: Participant[];
  schedule: DaySchedule[];
  settings: Settings;
}

/** A schedule entry as seen by browsers: only how many winners, never who. */
export interface ScheduleSummary {
  date: string;
  winnerCount: number;
}

/** The public view of the campaign, served by `GET /api/campaign`. */
export interface CampaignState {
  version: number;
  campaignId: string;
  createdAt: string;
  status: "draft" | "active";
  participants: Participant[];
  schedule: ScheduleSummary[];
  results: Record<string, DrawResult>;
  settings: Settings;
  /** The date the campaign clock points at (server date, or the manual date). */
  today: string;
  /** Photo URLs keyed by participant id. */
  photos: Record<string, string>;
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
