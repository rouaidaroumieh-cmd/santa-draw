"use client";

/**
 * Application store.
 *
 * A tiny observable holding the public campaign state served by the API. Every
 * page subscribes via `useCampaign()`, so the drawing machine, the calendar and
 * the participant list can never disagree. The state is refreshed every few
 * seconds, which is how visitors see a draw as soon as the organiser makes it.
 *
 * The reveal is a single server transaction (POST /api/draw): the winners are
 * decided, validated and locked there. The browser then plays the animation and
 * only shows the new state once it ends (`commitDraw`).
 */
import { useEffect, useSyncExternalStore } from "react";
import type { BackupFile } from "./backup";
import { getEligibleDates, isEligibleDate } from "./dates";
import { shuffle } from "./random";
import type { CampaignState, Participant } from "./types";

const POLL_MS = 10_000;
const NAME_SAVE_DELAY_MS = 500;

let state: CampaignState | null = null;
let serialised = "";
let isAdmin = false;
let syncError: string | null = null;

/** Writes in flight or scheduled: refreshes are skipped meanwhile so they cannot overwrite them. */
let pendingWrites = 0;
let drawBusy = false;
let pendingDrawState: CampaignState | null = null;

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Replaces the state only when it really changed, so polling never causes needless renders. */
function setState(next: CampaignState) {
  const json = JSON.stringify(next);
  if (json === serialised) return;
  serialised = json;
  state = next;
  emit();
}

function setAdmin(value: boolean) {
  if (isAdmin === value) return;
  isAdmin = value;
  emit();
}

function setSyncError(message: string | null) {
  if (syncError === message) return;
  syncError = message;
  emit();
}

/* ------------------------------------------------------------------ */
/* Server calls                                                        */
/* ------------------------------------------------------------------ */

type ApiResult<T extends object = object> = ({ ok: true } & T) | { ok: false; error: string; status: number };

async function api<T extends object = object>(url: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, { cache: "no-store", ...init });
    const data = (await res.json().catch(() => null)) as ({ error?: string } & T) | null;
    if (res.ok && data) return { ok: true, ...data };
    if (res.status === 401) setAdmin(false);
    return {
      ok: false,
      error: data?.error ?? "The server could not complete the request.",
      status: res.status,
    };
  } catch {
    return { ok: false, error: "The server cannot be reached. Check your connection.", status: 0 };
  }
}

function post<T extends object = object>(url: string, body: unknown): Promise<ApiResult<T>> {
  return api<T>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function refresh(): Promise<void> {
  if (drawBusy || pendingWrites > 0) return;
  const res = await api<{ state: CampaignState; isAdmin: boolean }>("/api/campaign");
  if (drawBusy || pendingWrites > 0) return; // a write started while we were waiting
  if (!res.ok) {
    setSyncError(res.error);
    return;
  }
  setSyncError(null);
  setAdmin(res.isAdmin);
  setState(res.state);
}

/** An organiser action. `apply` replaces the local state with the server's answer. */
async function adminCall<T extends object = object>(
  body: Record<string, unknown>,
  apply = true,
): Promise<ApiResult<T & { state?: CampaignState }>> {
  pendingWrites++;
  try {
    const res = await post<T & { state?: CampaignState }>("/api/admin", body);
    if (res.ok && apply && res.state) setState(res.state);
    return res;
  } finally {
    pendingWrites--;
  }
}

/* ------------------------------------------------------------------ */
/* React hooks                                                         */
/* ------------------------------------------------------------------ */

let pollers = 0;
let timer: ReturnType<typeof setInterval> | null = null;

function onVisibilityChange() {
  if (document.visibilityState === "visible") void refresh();
}

function startPolling() {
  pollers++;
  if (pollers > 1) return;
  void refresh();
  timer = setInterval(onVisibilityChange, POLL_MS);
  document.addEventListener("visibilitychange", onVisibilityChange);
}

function stopPolling() {
  pollers--;
  if (pollers > 0) return;
  if (timer) clearInterval(timer);
  timer = null;
  document.removeEventListener("visibilitychange", onVisibilityChange);
}

/** React hook: the campaign state, or null while the first load runs. */
export function useCampaign(): CampaignState | null {
  const snapshot = useSyncExternalStore(subscribe, () => state, () => null);
  useEffect(() => {
    startPolling();
    return stopPolling;
  }, []);
  return snapshot;
}

/** True when the visitor is logged in as the organiser. */
export function useIsAdmin(): boolean {
  return useSyncExternalStore(subscribe, () => isAdmin, () => false);
}

/** The last error met while loading the campaign, if any. */
export function useSyncError(): string | null {
  return useSyncExternalStore(subscribe, () => syncError, () => null);
}

/* ------------------------------------------------------------------ */
/* Organiser session                                                   */
/* ------------------------------------------------------------------ */

export async function login(password: string): Promise<{ ok: boolean; error?: string }> {
  const res = await post("/api/session", { password });
  if (!res.ok) return { ok: false, error: res.error };
  await refresh();
  return { ok: true };
}

export async function logout(): Promise<void> {
  await api("/api/session", { method: "DELETE" });
  setAdmin(false);
}

/* ------------------------------------------------------------------ */
/* Campaign actions (organiser only)                                   */
/* ------------------------------------------------------------------ */

const nameTimers = new Map<string, ReturnType<typeof setTimeout>>();

/** Updates the screen at once and saves to the server once typing pauses. */
export function updateParticipant(id: string, patch: Pick<Participant, "name">) {
  if (!state || Object.keys(state.results).length > 0) return; // configuration locked
  setState({
    ...state,
    participants: state.participants.map((p) => (p.id === id ? { ...p, ...patch } : p)),
  });

  const scheduled = nameTimers.get(id);
  if (scheduled) clearTimeout(scheduled);
  else pendingWrites++;

  nameTimers.set(
    id,
    setTimeout(async () => {
      nameTimers.delete(id);
      try {
        const res = await post("/api/admin", { action: "updateParticipant", id, name: patch.name });
        if (!res.ok) setSyncError(res.error);
      } finally {
        pendingWrites--;
        if (pendingWrites === 0) void refresh();
      }
    }, NAME_SAVE_DELAY_MS),
  );
}

export async function setParticipantPhoto(id: string, dataUrl: string): Promise<true> {
  const res = await adminCall({ action: "setPhoto", id, dataUrl });
  if (!res.ok) throw new Error(res.error);
  return true;
}

export async function setSettings(patch: Partial<CampaignState["settings"]>): Promise<void> {
  await adminCall({ action: "setSettings", ...patch });
}

export async function startCampaign(): Promise<void> {
  await adminCall({ action: "startCampaign" });
}

export async function regenerateSchedule(): Promise<{ ok: boolean; error?: string }> {
  const res = await adminCall({ action: "regenerateSchedule" });
  return res.ok ? { ok: true } : { ok: false, error: res.error };
}

export async function validateCurrentSchedule(): Promise<{ ok: boolean; errors: string[] }> {
  const res = await adminCall<{ valid: boolean; errors: string[] }>({ action: "validateSchedule" });
  return res.ok ? { ok: res.valid, errors: res.errors } : { ok: false, errors: [res.error] };
}

export async function resetCampaign(): Promise<void> {
  await adminCall({ action: "reset" });
}

export async function applyBackup(raw: string): Promise<{ ok: boolean; error?: string }> {
  const res = await adminCall({ action: "importBackup", raw });
  return res.ok ? { ok: true } : { ok: false, error: res.error };
}

export async function moderateWish(id: string, action: "approveWish" | "deleteWish"): Promise<{ ok: boolean; error?: string }> {
  const res = await adminCall({ action, id }, false);
  return res.ok ? { ok: true } : { ok: false, error: res.error };
}

export async function getBackup(): Promise<BackupFile | null> {
  const res = await adminCall<{ backup: BackupFile }>({ action: "exportBackup" });
  return res.ok ? res.backup : null;
}

/* ------------------------------------------------------------------ */
/* Draw status                                                         */
/* ------------------------------------------------------------------ */

export type DrawStatus =
  | { kind: "ready"; date: string }
  | { kind: "completed"; date: string }
  | { kind: "weekend"; date: string }
  | { kind: "future"; date: string }
  | { kind: "invalid"; date: string; reason: string };

export function drawStatusFor(date: string): DrawStatus {
  if (!state) return { kind: "invalid", date, reason: "Loading campaign…" };
  if (!isEligibleDate(date)) return { kind: "weekend", date };
  if (state.results[date]) return { kind: "completed", date };
  if (date > state.today) return { kind: "future", date };
  return { kind: "ready", date };
}

export function todayStatus(): {
  today: string;
  mode: "auto" | "manual";
  status: DrawStatus;
  nextDate: string | null;
} {
  const today = state?.today ?? "";
  const revealed = state?.results ?? {};
  let next: string | null = null;
  for (const d of getEligibleDates()) {
    if (d >= today && !revealed[d]) {
      next = d;
      break;
    }
  }
  return { today, mode: state?.settings.dateMode ?? "auto", status: drawStatusFor(today), nextDate: next };
}

/* ------------------------------------------------------------------ */
/* Draw transaction                                                    */
/* ------------------------------------------------------------------ */

export type BeginDrawResult =
  | { ok: true; winners: string[]; date: string }
  | { ok: false; error: string };

/**
 * Asks the server to reveal and lock the day's winners. The new state is held
 * back until `commitDraw`, so the animation is not spoiled on this screen.
 */
export async function beginDraw(date: string): Promise<BeginDrawResult> {
  if (!state) return { ok: false, error: "The campaign is not loaded yet." };
  if (drawBusy) return { ok: false, error: "A draw is already in progress." };

  const status = drawStatusFor(date);
  if (status.kind === "completed") {
    return { ok: false, error: "Today's Christmas surprises have already been revealed!" };
  }
  if (status.kind === "weekend") {
    return { ok: false, error: "Santa is taking a little Christmas break today!" };
  }
  if (status.kind === "future") {
    return { ok: false, error: "This date has not arrived yet — future results stay sealed." };
  }

  drawBusy = true;
  const res = await post<{ winners: string[]; state: CampaignState }>("/api/draw", { date });
  if (!res.ok) {
    drawBusy = false;
    if (res.status === 409) void refresh(); // someone else already drew this day
    return { ok: false, error: res.error };
  }
  pendingDrawState = res.state;
  return { ok: true, winners: res.winners, date };
}

/** Shows the result of the draw once the animation has finished. */
export function commitDraw() {
  const next = pendingDrawState;
  pendingDrawState = null;
  drawBusy = false;
  if (next) setState(next);
}

/** Rehearsal mode: random names, nothing stored, never part of the real history. */
export function simulateDraw(count: number): { ok: true; winners: string[] } | { ok: false; error: string } {
  if (!state) return { ok: false, error: "The campaign is not loaded yet." };
  const ids = shuffle(state.participants.map((p) => p.id)).slice(0, count);
  return { ok: true, winners: ids };
}

/* ------------------------------------------------------------------ */
/* Dev mode only (the server refuses these outside dev mode)           */
/* ------------------------------------------------------------------ */

/** Removes a day's result so it can be drawn again. */
export async function devUndoDraw(date: string): Promise<void> {
  await adminCall({ action: "devUndo", date });
}

/** Records every scheduled day before `date`, to test later stages of the campaign. */
export async function devRevealBefore(date: string): Promise<void> {
  await adminCall({ action: "devFill", date });
}

export type { CampaignState, Participant };
