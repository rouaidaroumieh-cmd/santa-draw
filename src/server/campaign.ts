import { and, eq } from "drizzle-orm";
import type { NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import type { PgDatabase } from "drizzle-orm/pg-core";
import { getDb } from "@/db";
import { campaigns, drawResults, photos } from "@/db/schema";
import {
  buildBackup,
  isCampaignDate,
  isValidPhotoDataUrl,
  parseBackup,
  type BackupFile,
} from "@/lib/backup";
import { isEligibleDate } from "@/lib/dates";
import { DEV_MODE } from "@/lib/dev-mode";
import { generateSchedule, validateSchedule, validateSelection } from "@/lib/draw-engine";
import {
  CAMPAIGN_ID,
  DATA_VERSION,
  type CampaignConfig,
  type CampaignState,
  type DrawResult,
  type Participant,
  type Settings,
} from "@/lib/types";

type Executor = PgDatabase<NodePgQueryResultHKT>;

/** Dev mode works on its own campaign so it never touches the real one. */
const ROW_ID = DEV_MODE ? "dev" : "main";

export type Outcome<T extends object = object> = ({ ok: true } & T) | { ok: false; error: string; status: number };

function fail(error: string, status = 400): { ok: false; error: string; status: number } {
  return { ok: false, error, status };
}

/* ------------------------------------------------------------------ */
/* Loading                                                             */
/* ------------------------------------------------------------------ */

/** The twenty employees, in display order. Each id still appears exactly three times. */
const PARTICIPANT_NAMES = [
  "yann",
  "samer",
  "eliane",
  "maroun",
  "sarah",
  "marie-ange",
  "maria",
  "rida",
  "cynthia",
  "joseph",
  "yara mezher",
  "christina",
  "yara kh",
  "georges",
  "karen",
  "elia",
  "pia",
  "carole",
  "lara",
  "rouaida",
] as const;

function defaultParticipants(): Participant[] {
  return PARTICIPANT_NAMES.map((name, i) => {
    const n = String(i + 1).padStart(2, "0");
    return { id: `p${n}`, name, role: "Employee" };
  });
}

function createInitialConfig(): CampaignConfig {
  const participants = defaultParticipants();
  return {
    createdAt: new Date().toISOString(),
    status: "draft",
    participants,
    schedule: generateSchedule(participants.map((p) => p.id)),
    settings: { dateMode: "auto", manualDate: null },
  };
}

async function loadConfig(db: Executor): Promise<CampaignConfig> {
  const [row] = await db.select().from(campaigns).where(eq(campaigns.id, ROW_ID));
  const config = row?.config ?? (await insertInitialConfig(db));
  return fillPlaceholderNames(db, config);
}

async function insertInitialConfig(db: Executor): Promise<CampaignConfig> {
  await db.insert(campaigns).values({ id: ROW_ID, config: createInitialConfig() }).onConflictDoNothing();
  const [created] = await db.select().from(campaigns).where(eq(campaigns.id, ROW_ID));
  return created.config;
}

/** Replace the generated "Participant 01…" labels once, before any draw is locked. */
async function fillPlaceholderNames(db: Executor, config: CampaignConfig): Promise<CampaignConfig> {
  if (await isLocked(db)) return config;
  if (config.participants.length !== PARTICIPANT_NAMES.length) return config;
  if (!config.participants.every((p) => /^Participant \d{2}$/.test(p.name))) return config;
  const next: CampaignConfig = {
    ...config,
    participants: config.participants.map((p, i) => ({ ...p, name: PARTICIPANT_NAMES[i], role: "Employee" })),
  };
  await saveConfig(db, next);
  return next;
}

async function saveConfig(db: Executor, config: CampaignConfig): Promise<void> {
  await db.update(campaigns).set({ config, updatedAt: new Date() }).where(eq(campaigns.id, ROW_ID));
}

async function loadResults(db: Executor): Promise<Record<string, DrawResult>> {
  const rows = await db.select().from(drawResults).where(eq(drawResults.campaignId, ROW_ID));
  return Object.fromEntries(
    rows.map((r) => [
      r.date,
      { date: r.date, participantIds: r.participantIds, revealedAt: r.revealedAt.toISOString() },
    ]),
  );
}

async function loadPhotoUrls(db: Executor): Promise<Record<string, string>> {
  const rows = await db
    .select({ participantId: photos.participantId, updatedAt: photos.updatedAt })
    .from(photos)
    .where(eq(photos.campaignId, ROW_ID));
  return Object.fromEntries(
    rows.map((r) => [
      r.participantId,
      `/api/photos/${encodeURIComponent(r.participantId)}?v=${r.updatedAt.getTime()}`,
    ]),
  );
}

/** Today's date in the campaign time zone (CAMPAIGN_TIMEZONE, UTC by default). */
function serverToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: process.env.CAMPAIGN_TIMEZONE || "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function effectiveToday(settings: Settings): string {
  return settings.dateMode === "manual" && settings.manualDate ? settings.manualDate : serverToday();
}

function toPublicState(
  config: CampaignConfig,
  results: Record<string, DrawResult>,
  photoUrls: Record<string, string>,
): CampaignState {
  return {
    version: DATA_VERSION,
    campaignId: CAMPAIGN_ID,
    createdAt: config.createdAt,
    status: config.status,
    participants: config.participants,
    schedule: config.schedule.map((d) => ({ date: d.date, winnerCount: d.participantIds.length })),
    results,
    settings: config.settings,
    today: effectiveToday(config.settings),
    photos: photoUrls,
  };
}

export async function getPublicState(db: Executor = getDb()): Promise<CampaignState> {
  const config = await loadConfig(db);
  const results = await loadResults(db);
  const photoUrls = await loadPhotoUrls(db);
  return toPublicState(config, results, photoUrls);
}

async function stateOutcome(db: Executor): Promise<{ ok: true; state: CampaignState }> {
  return { ok: true, state: await getPublicState(db) };
}

/* ------------------------------------------------------------------ */
/* The daily draw                                                      */
/* ------------------------------------------------------------------ */

/**
 * Reveals and locks the winners of `date`. The campaign row is locked for the
 * transaction, and (campaign, date) is a primary key: two organisers clicking
 * at the same moment can never produce two draws for the same day.
 */
export async function performDraw(
  date: string,
): Promise<Outcome<{ winners: string[]; state: CampaignState }>> {
  const db = getDb();
  await loadConfig(db); // make sure the campaign row exists before locking it

  return db.transaction(async (tx): Promise<Outcome<{ winners: string[]; state: CampaignState }>> => {
    const [row] = await tx.select().from(campaigns).where(eq(campaigns.id, ROW_ID)).for("update");
    const config = row.config;

    if (!isEligibleDate(date)) return fail("Santa is taking a little Christmas break today!");
    if (date > effectiveToday(config.settings)) {
      return fail("This date has not arrived yet — future results stay sealed.");
    }

    const results = await loadResults(tx);
    if (results[date]) return fail("Today's Christmas surprises have already been revealed!", 409);

    const day = config.schedule.find((d) => d.date === date);
    if (!day) return fail("No schedule entry exists for this date.");

    const check = validateSelection(toPublicState(config, results, {}), date, day.participantIds);
    if (!check.ok) return fail(check.errors.join(" "), 409);

    const inserted = await tx
      .insert(drawResults)
      .values({ campaignId: ROW_ID, date, participantIds: day.participantIds })
      .onConflictDoNothing()
      .returning();
    if (inserted.length === 0) return fail("Today's Christmas surprises have already been revealed!", 409);

    if (config.status !== "active") await saveConfig(tx, { ...config, status: "active" });

    return { ok: true, winners: [...day.participantIds], state: await getPublicState(tx) };
  });
}

/* ------------------------------------------------------------------ */
/* Organiser actions                                                   */
/* ------------------------------------------------------------------ */

async function isLocked(db: Executor): Promise<boolean> {
  return Object.keys(await loadResults(db)).length > 0;
}

export async function renameParticipant(id: string, name: string): Promise<Outcome<{ state: CampaignState }>> {
  const db = getDb();
  const config = await loadConfig(db);
  if (await isLocked(db)) return fail("Names can no longer change: a draw has already been completed.", 409);
  if (!config.participants.some((p) => p.id === id)) return fail("Unknown participant.", 404);
  await saveConfig(db, {
    ...config,
    participants: config.participants.map((p) => (p.id === id ? { ...p, name: name.slice(0, 80) } : p)),
  });
  return stateOutcome(db);
}

export async function setParticipantPhoto(id: string, dataUrl: unknown): Promise<Outcome<{ state: CampaignState }>> {
  const db = getDb();
  const config = await loadConfig(db);
  if (await isLocked(db)) return fail("Photos can no longer change: a draw has already been completed.", 409);
  if (!config.participants.some((p) => p.id === id)) return fail("Unknown participant.", 404);
  if (!isValidPhotoDataUrl(dataUrl)) return fail("The photo must be a JPG, PNG or WebP image under 500 KB.");
  await db
    .insert(photos)
    .values({ campaignId: ROW_ID, participantId: id, dataUrl, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [photos.campaignId, photos.participantId],
      set: { dataUrl, updatedAt: new Date() },
    });
  return stateOutcome(db);
}

export async function getPhotoDataUrl(id: string): Promise<string | null> {
  const [row] = await getDb()
    .select({ dataUrl: photos.dataUrl })
    .from(photos)
    .where(and(eq(photos.campaignId, ROW_ID), eq(photos.participantId, id)));
  return row?.dataUrl ?? null;
}

export async function updateSettings(patch: {
  dateMode?: unknown;
  manualDate?: unknown;
}): Promise<Outcome<{ state: CampaignState }>> {
  const db = getDb();
  const config = await loadConfig(db);
  const settings: Settings = { ...config.settings };

  if (patch.dateMode !== undefined) {
    if (patch.dateMode !== "auto" && patch.dateMode !== "manual") return fail("Invalid date mode.");
    settings.dateMode = patch.dateMode;
  }
  if (patch.manualDate !== undefined) {
    if (patch.manualDate !== null && !isCampaignDate(patch.manualDate)) {
      return fail("The date must be between 30 November and 22 December 2026.");
    }
    settings.manualDate = patch.manualDate;
  }

  await saveConfig(db, { ...config, settings });
  return stateOutcome(db);
}

export async function regenerateSchedule(): Promise<Outcome<{ state: CampaignState }>> {
  const db = getDb();
  const config = await loadConfig(db);
  if (await isLocked(db)) {
    return fail("The schedule is locked — at least one draw has already been completed.", 409);
  }
  const participantIds = config.participants.map((p) => p.id);
  const schedule = generateSchedule(participantIds);
  const check = validateSchedule(schedule, participantIds);
  if (!check.ok) return fail(check.errors[0], 500);
  await saveConfig(db, { ...config, schedule, status: "draft" });
  return stateOutcome(db);
}

export async function checkSchedule(): Promise<{ ok: true; valid: boolean; errors: string[] }> {
  const config = await loadConfig(getDb());
  const check = validateSchedule(config.schedule, config.participants.map((p) => p.id));
  return { ok: true, valid: check.ok, errors: check.errors };
}

export async function startCampaign(): Promise<Outcome<{ state: CampaignState }>> {
  const db = getDb();
  const config = await loadConfig(db);
  await saveConfig(db, { ...config, status: "active" });
  return stateOutcome(db);
}

/** Replaces the whole campaign (also used by import). */
async function replaceCampaign(
  config: CampaignConfig,
  results: Record<string, DrawResult>,
  photoData: Record<string, string>,
): Promise<void> {
  await getDb().transaction(async (tx) => {
    await tx.delete(drawResults).where(eq(drawResults.campaignId, ROW_ID));
    await tx.delete(photos).where(eq(photos.campaignId, ROW_ID));
    await tx
      .insert(campaigns)
      .values({ id: ROW_ID, config })
      .onConflictDoUpdate({ target: campaigns.id, set: { config, updatedAt: new Date() } });

    const resultRows = Object.values(results).map((r) => ({
      campaignId: ROW_ID,
      date: r.date,
      participantIds: r.participantIds,
      revealedAt: new Date(r.revealedAt),
    }));
    if (resultRows.length > 0) await tx.insert(drawResults).values(resultRows);

    const photoRows = Object.entries(photoData).map(([participantId, dataUrl]) => ({
      campaignId: ROW_ID,
      participantId,
      dataUrl,
    }));
    if (photoRows.length > 0) await tx.insert(photos).values(photoRows);
  });
}

export async function resetCampaign(): Promise<Outcome<{ state: CampaignState }>> {
  await replaceCampaign(createInitialConfig(), {}, {});
  return stateOutcome(getDb());
}

export async function importBackup(raw: unknown): Promise<Outcome<{ state: CampaignState }>> {
  if (typeof raw !== "string") return fail("No backup file was received.");
  const parsed = parseBackup(raw);
  if (!parsed.ok) return fail(parsed.error);
  await replaceCampaign(parsed.backup.config, parsed.backup.results, parsed.backup.photos);
  return stateOutcome(getDb());
}

export async function exportBackup(): Promise<{ ok: true; backup: BackupFile }> {
  const db = getDb();
  const config = await loadConfig(db);
  const results = await loadResults(db);
  const rows = await db
    .select({ participantId: photos.participantId, dataUrl: photos.dataUrl })
    .from(photos)
    .where(eq(photos.campaignId, ROW_ID));
  const photoData = Object.fromEntries(rows.map((r) => [r.participantId, r.dataUrl]));
  return { ok: true, backup: buildBackup(config, results, photoData) };
}

/* ------------------------------------------------------------------ */
/* Dev mode only                                                       */
/* ------------------------------------------------------------------ */

/** Removes a day's result so it can be drawn again. */
export async function devUndoDraw(date: unknown): Promise<Outcome<{ state: CampaignState }>> {
  if (!DEV_MODE) return fail("Not available.", 404);
  if (!isCampaignDate(date)) return fail("Invalid date.");
  const db = getDb();
  await db.delete(drawResults).where(and(eq(drawResults.campaignId, ROW_ID), eq(drawResults.date, date)));
  return stateOutcome(db);
}

/** Records every scheduled day before `date`, to test later stages of the campaign. */
export async function devFillBefore(date: unknown): Promise<Outcome<{ state: CampaignState }>> {
  if (!DEV_MODE) return fail("Not available.", 404);
  if (!isCampaignDate(date)) return fail("Invalid date.");
  const db = getDb();
  const config = await loadConfig(db);
  const rows = config.schedule
    .filter((d) => d.date < date)
    .map((d) => ({ campaignId: ROW_ID, date: d.date, participantIds: d.participantIds }));
  if (rows.length > 0) await db.insert(drawResults).values(rows).onConflictDoNothing();
  await saveConfig(db, { ...config, status: "active" });
  return stateOutcome(db);
}
