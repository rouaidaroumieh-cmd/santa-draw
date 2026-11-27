import {
  checkSchedule,
  devFillBefore,
  devUndoDraw,
  exportBackup,
  importBackup,
  regenerateSchedule,
  renameParticipant,
  resetCampaign,
  setParticipantPhoto,
  startCampaign,
  updateSettings,
} from "@/server/campaign";
import { clearAllFunLabEntries, clearFunLabVoter } from "@/server/fun-lab";
import { isFunLabGame, isFunLabName } from "@/lib/fun-lab-roster";
import { deleteWish } from "@/server/wishes";
import { errorResponse, handle, json, readJsonBody, requireAdmin } from "@/server/http";

export const dynamic = "force-dynamic";

type ActionResult =
  | { ok: true; deleted?: number }
  | { ok: false; error: string; status: number };

async function resetFunLabAndGames(): Promise<ActionResult> {
  const result = await clearAllFunLabEntries();
  return { ok: true, deleted: result.deleted };
}

async function resetFunLabPerson(name: unknown, game: unknown): Promise<ActionResult> {
  if (typeof name !== "string" || !isFunLabName(name)) {
    return { ok: false, error: "Please choose a Fun Lab participant.", status: 400 };
  }
  // Omit or "all" → every game for that person; otherwise one game only.
  if (game === undefined || game === null || game === "" || game === "all") {
    const result = await clearFunLabVoter(name);
    return { ok: true, deleted: result.deleted };
  }
  if (typeof game !== "string" || !isFunLabGame(game)) {
    return { ok: false, error: "Please choose a valid game.", status: 400 };
  }
  const result = await clearFunLabVoter(name, game);
  return { ok: true, deleted: result.deleted };
}

function run(action: string, body: Record<string, unknown>): Promise<ActionResult> | null {
  const id = typeof body.id === "string" ? body.id : "";
  switch (action) {
    case "updateParticipant":
      return renameParticipant(id, typeof body.name === "string" ? body.name : "");
    case "setPhoto":
      return setParticipantPhoto(id, body.dataUrl);
    case "setSettings":
      return updateSettings({ dateMode: body.dateMode, manualDate: body.manualDate });
    case "regenerateSchedule":
      return regenerateSchedule();
    case "validateSchedule":
      return checkSchedule();
    case "startCampaign":
      return startCampaign();
    case "reset":
      return resetCampaign();
    case "resetFunLab":
      return resetFunLabAndGames();
    case "resetFunLabVoter":
      return resetFunLabPerson(body.name, body.game);
    case "importBackup":
      return importBackup(body.raw);
    case "exportBackup":
      return exportBackup();
    case "devUndo":
      return devUndoDraw(body.date);
    case "devFill":
      return devFillBefore(body.date);
    case "deleteWish":
      return deleteWish(body.id);
    default:
      return null;
  }
}

/** Every organiser action, selected by `action`. Organiser only. */
export const POST = handle(async (request: Request) => {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await readJsonBody(request);
  if (!body || typeof body.action !== "string") return errorResponse("An action is required.", 400);

  const pending = run(body.action, body);
  if (!pending) return errorResponse("Unknown action.", 400);

  const result = await pending;
  return result.ok ? json(result) : errorResponse(result.error, result.status);
});
