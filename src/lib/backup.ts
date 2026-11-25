/**
 * Backup format and validation. Pure code: it runs on the server, which is the
 * only place where an imported file is accepted.
 */
import { getDay, isEligibleDate } from "./dates";
import { SELECTIONS_PER_PARTICIPANT, validateSchedule, WINNERS_PER_DAY } from "./draw-engine";
import {
  CAMPAIGN_ID,
  DATA_VERSION,
  type CampaignConfig,
  type DaySchedule,
  type DrawResult,
  type Participant,
  type Settings,
} from "./types";

export const MAX_PHOTO_CHARS = 700_000;
const PHOTO_PATTERN = /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

export function isValidPhotoDataUrl(value: unknown): value is string {
  return typeof value === "string" && value.length <= MAX_PHOTO_CHARS && PHOTO_PATTERN.test(value);
}

/** True for a date inside the 1–21 December campaign calendar. */
export function isCampaignDate(value: unknown): value is string {
  return typeof value === "string" && getDay(value) !== undefined;
}

export interface BackupFile {
  kind: "santas-christmas-draw-backup";
  version: number;
  campaignId: string;
  exportedAt: string;
  participants: Participant[];
  schedule: DaySchedule[];
  results: Record<string, DrawResult>;
  settings: Settings;
  status: CampaignConfig["status"];
  createdAt: string;
  photos?: Record<string, string>;
}

export function buildBackup(
  config: CampaignConfig,
  results: Record<string, DrawResult>,
  photos: Record<string, string>,
): BackupFile {
  return {
    kind: "santas-christmas-draw-backup",
    version: DATA_VERSION,
    campaignId: CAMPAIGN_ID,
    exportedAt: new Date().toISOString(),
    participants: config.participants,
    schedule: config.schedule,
    results,
    settings: config.settings,
    status: config.status,
    createdAt: config.createdAt,
    photos,
  };
}

export interface ParsedBackup {
  config: CampaignConfig;
  results: Record<string, DrawResult>;
  photos: Record<string, string>;
}

export function parseBackup(raw: string): { ok: true; backup: ParsedBackup } | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "This file is not valid JSON." };
  }

  try {
    return readBackup(parsed as Partial<BackupFile> | null);
  } catch {
    return { ok: false, error: "Unexpected backup structure." };
  }
}

function readBackup(data: Partial<BackupFile> | null): ReturnType<typeof parseBackup> {
  if (!data || typeof data !== "object") return { ok: false, error: "Unexpected backup structure." };
  if (data.kind !== "santas-christmas-draw-backup") {
    return { ok: false, error: "This file is not a Santa's Christmas Draw backup." };
  }
  if (!Array.isArray(data.participants) || data.participants.length === 0) {
    return { ok: false, error: "The backup contains no participants." };
  }
  if (!Array.isArray(data.schedule) || data.schedule.length === 0) {
    return { ok: false, error: "The backup contains no draw schedule." };
  }

  const participants: Participant[] = data.participants.map((p, i) => ({
    id: String(p.id ?? `p${i}`),
    name: String(p.name ?? `Participant ${i + 1}`).slice(0, 80),
    role: String(p.role ?? "").slice(0, 120),
  }));
  const participantIds = participants.map((p) => p.id);
  const schedule: DaySchedule[] = data.schedule.map((d) => ({
    date: String(d.date),
    participantIds: Array.isArray(d.participantIds) ? d.participantIds.map(String) : [],
  }));

  const scheduleCheck = validateSchedule(schedule, participantIds);
  if (!scheduleCheck.ok) {
    return { ok: false, error: `Invalid schedule: ${scheduleCheck.errors[0]}` };
  }

  const results: Record<string, DrawResult> = {};
  for (const [date, r] of Object.entries(data.results ?? {})) {
    if (!isEligibleDate(date)) {
      return { ok: false, error: `Result for ${date} is not on an eligible working day.` };
    }
    const ids = Array.isArray(r.participantIds) ? r.participantIds.map(String) : [];
    if (ids.length !== WINNERS_PER_DAY) {
      return { ok: false, error: `Result for ${date} does not contain ${WINNERS_PER_DAY} winners.` };
    }
    if (new Set(ids).size !== ids.length) {
      return { ok: false, error: `Result for ${date} contains duplicate winners.` };
    }
    if (ids.some((id) => !participantIds.includes(id))) {
      return { ok: false, error: `Result for ${date} references an unknown participant.` };
    }
    const revealedAt = new Date(String(r.revealedAt));
    results[date] = {
      date,
      participantIds: ids,
      revealedAt: (Number.isNaN(revealedAt.getTime()) ? new Date() : revealedAt).toISOString(),
    };
  }

  // Per-participant budget must hold for the restored results too.
  const counts = new Map<string, number>();
  for (const r of Object.values(results)) {
    for (const id of r.participantIds) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  for (const [id, count] of counts) {
    if (count > SELECTIONS_PER_PARTICIPANT) {
      return { ok: false, error: `Participant "${id}" exceeds ${SELECTIONS_PER_PARTICIPANT} selections in this backup.` };
    }
  }

  const photos: Record<string, string> = {};
  for (const [id, dataUrl] of Object.entries(data.photos ?? {})) {
    if (!participantIds.includes(id) || !isValidPhotoDataUrl(dataUrl)) {
      return { ok: false, error: `The photo of "${id}" in this backup is not a valid image.` };
    }
    photos[id] = dataUrl;
  }

  const createdAt = new Date(String(data.createdAt));
  return {
    ok: true,
    backup: {
      config: {
        createdAt: (Number.isNaN(createdAt.getTime()) ? new Date() : createdAt).toISOString(),
        status: data.status === "active" ? "active" : "draft",
        participants,
        schedule,
        settings: {
          dateMode: data.settings?.dateMode === "manual" ? "manual" : "auto",
          manualDate: isCampaignDate(data.settings?.manualDate) ? data.settings.manualDate : null,
        },
      },
      results,
      photos,
    },
  };
}
