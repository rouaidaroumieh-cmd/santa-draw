/**
 * Browser-side file helpers: photo preparation and downloads.
 * Campaign data itself lives on the server (see store.ts and /api).
 */
import { campaignStats, participantStats, SELECTIONS_PER_PARTICIPANT } from "./draw-engine";
import { getEligibleDates, formatDateLong, ordinal } from "./dates";
import type { BackupFile } from "./backup";
import type { CampaignState } from "./types";

/** Downscales an uploaded image to a square-ish 512px JPEG data URL. */
export function fileToPhotoDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!/image\/(jpeg|jpg|png|webp)/i.test(file.type)) {
      reject(new Error("Please choose a JPG, PNG or WebP image."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The file could not be read."));
    reader.onload = () => {
      const src = String(reader.result || "");
      const img = new Image();
      img.onerror = () => reject(new Error("The image could not be decoded."));
      img.onload = () => {
        const size = 512;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(src);
          return;
        }
        // Cover-crop to a square so every profile photo lines up.
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        ctx.fillStyle = "#173D32";
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

/* ------------------------------------------------------------------ */
/* File downloads                                                      */
/* ------------------------------------------------------------------ */

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportJSON(backup: BackupFile) {
  download(
    `santas-christmas-draw-backup-${new Date().toISOString().slice(0, 10)}.json`,
    JSON.stringify(backup, null, 2),
    "application/json",
  );
}

export function exportCSV(state: CampaignState) {
  const rows: string[] = [];
  rows.push(["Date", "Weekday", "Order", "Participant", "Selection number", "Remaining chances", "Locked at"].join(","));
  const stats = new Map(participantStats(state).map((s) => [s.id, s]));
  const runningCount = new Map<string, number>();
  for (const day of getEligibleDates()) {
    const result = state.results[day];
    if (!result) {
      rows.push([csvDate(day), csvWeekday(day), "", "NOT YET REVEALED", "", "", ""].join(","));
      continue;
    }
    result.participantIds.forEach((id, index) => {
      const stat = stats.get(id);
      const appearance = (runningCount.get(id) ?? 0) + 1;
      runningCount.set(id, appearance);
      rows.push(
        [
          csvDate(day),
          csvWeekday(day),
          String(index + 1),
          csvCell(stat?.name ?? id),
          `${ordinal(appearance)} selection`,
          String(SELECTIONS_PER_PARTICIPANT - appearance),
          result.revealedAt,
        ].join(","),
      );
    });
  }
  rows.push("");
  rows.push("Campaign summary");
  const s = campaignStats(state);
  rows.push(["Total participants", String(s.totalParticipants)].join(","));
  rows.push(["Total draw days", String(s.totalDrawDays)].join(","));
  rows.push(["Total selections", String(s.totalSelections)].join(","));
  rows.push(["Completed selections", String(s.completedSelections)].join(","));
  download(
    `santas-christmas-draw-results-${new Date().toISOString().slice(0, 10)}.csv`,
    rows.join("\n"),
    "text/csv;charset=utf-8",
  );
}

function csvCell(value: string): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}
function csvDate(date: string): string {
  return csvCell(formatDateLong(date));
}
function csvWeekday(date: string): string {
  return csvCell(formatDateLong(date).split(",")[0] ?? "");
}
