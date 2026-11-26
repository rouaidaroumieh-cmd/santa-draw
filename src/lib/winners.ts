import type { ReelWinner } from "@/components/ReelMachine";
import { ordinal } from "./dates";
import { SELECTIONS_PER_PARTICIPANT } from "./draw-engine";
import type { CampaignState } from "./types";

function appearancesUpTo(state: CampaignState, date: string, id: string): number {
  return Object.values(state.results).filter(
    (r) => r.date <= date && r.participantIds.includes(id),
  ).length;
}

/** The winners of `date` with their selection number and the chances they have left. */
export function buildReelWinners(
  state: CampaignState,
  ids: string[],
  date: string,
  simulation: boolean,
): ReelWinner[] {
  return ids.map((id) => {
    const person = state.participants.find((p) => p.id === id);
    const appearances = appearancesUpTo(state, date, id) + (state.results[date] ? 0 : 1);
    const remaining = Math.max(0, SELECTIONS_PER_PARTICIPANT - appearances);
    return {
      id,
      name: person?.name ?? id,
      photo: state.photos[id],
      selectionLabel: simulation
        ? "Simulation pick"
        : `${ordinal(Math.min(appearances, SELECTIONS_PER_PARTICIPANT))} selection`,
      remainingLabel: simulation
        ? "Not recorded"
        : `${remaining} chance${remaining === 1 ? "" : "s"} remaining`,
    };
  });
}
