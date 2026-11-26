"use client";

import { useMemo, useState } from "react";
import { fireConfetti } from "@/lib/confetti";
import { CAMPAIGN_END, CAMPAIGN_START, countWord, formatDateLong, winnersOn } from "@/lib/dates";
import { campaignStats } from "@/lib/draw-engine";
import {
  beginDraw,
  commitDraw,
  drawStatusFor,
  simulateDraw,
  todayStatus,
  useCampaign,
} from "@/lib/store";
import { buildReelWinners } from "@/lib/winners";
import Dialog from "./Dialog";
import ReelMachine, { type ReelWinner } from "./ReelMachine";

/** The drawing machine with its controls. Only rendered in the organiser's Admin section. */
export default function DailyDraw() {
  const state = useCampaign();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [liveWinners, setLiveWinners] = useState<ReelWinner[] | null>(null);
  const [simulation, setSimulation] = useState(false);
  const [notice, setNotice] = useState<{ tone: "error" | "info"; text: string } | null>(null);

  const status = useMemo(() => (state ? todayStatus() : null), [state]);
  const today = status?.today ?? "";
  const todayResult = state?.results[today];
  // The planned count for the day, or 4 on non-draw days (rehearsal only).
  const slotCount = winnersOn(today) || 4;

  const people = useMemo(
    () =>
      state
        ? state.participants.map((p) => ({ id: p.id, name: p.name, photo: state.photos[p.id] ?? null }))
        : [],
    [state],
  );

  const winners = useMemo<ReelWinner[] | null>(() => {
    if (!state) return null;
    if (todayResult) return buildReelWinners(state, todayResult.participantIds, today, false);
    return liveWinners;
  }, [state, todayResult, liveWinners, today]);

  if (!state || !status) {
    return <p className="label label-gold animate-pulse">Preparing the Christmas machine…</p>;
  }

  const drawStatus = drawStatusFor(today);
  const stats = campaignStats(state);
  const canDraw = drawStatus.kind === "ready" && !spinning;

  const runSimulation = () => {
    const res = simulateDraw(slotCount);
    if (!res.ok) {
      setNotice({ tone: "error", text: res.error });
      return;
    }
    setNotice({
      tone: "info",
      text: "Simulation running — these names are for rehearsal only and will not be recorded.",
    });
    setSimulation(true);
    setLiveWinners(buildReelWinners(state, res.winners, today, true));
    setSpinning(true);
  };

  const confirmDraw = async () => {
    setConfirmOpen(false);
    const res = await beginDraw(today);
    if (!res.ok) {
      setNotice({ tone: "error", text: res.error });
      return;
    }
    setSimulation(false);
    setLiveWinners(buildReelWinners(state, res.winners, today, false));
    setSpinning(true);
  };

  const onSpinComplete = () => {
    setSpinning(false);
    if (simulation) {
      fireConfetti(0.55);
      return;
    }
    commitDraw();
    fireConfetti(1);
    setNotice({ tone: "info", text: "DRAW COMPLETED – RESULTS LOCKED" });
  };

  const noDrawToday = drawStatus.kind === "weekend";
  let statusLine = "Today's Christmas draw is ready.";
  let statusTone: "ready" | "locked" | "paused" = "ready";
  if (noDrawToday) {
    statusLine =
      today < CAMPAIGN_START
        ? "The Christmas draw has not started yet."
        : today > CAMPAIGN_END
          ? "The Christmas draw is over."
          : "Santa is taking a little Christmas break today!";
    statusTone = "paused";
  } else if (drawStatus.kind === "completed") {
    statusLine = "Today's Christmas surprises have already been revealed!";
    statusTone = "locked";
  } else if (drawStatus.kind === "future") {
    statusLine = "Today's draw is still ahead of us.";
    statusTone = "paused";
  }

  const ctaLabel = canDraw
    ? `🎄 Reveal today's ${slotCount} names`
    : drawStatus.kind === "completed"
      ? "Today's results are locked"
      : spinning
        ? "The reels are turning…"
        : "Run a rehearsal of the machine";

  const ctaReason = spinning
    ? "The names were decided and validated before the animation began."
    : drawStatus.kind === "completed"
      ? "Today's Christmas surprises have already been revealed. This draw can never be repeated or changed."
      : noDrawToday
        ? "No draw today. The rehearsal is only a preview and is never recorded."
        : drawStatus.kind === "future"
          ? "This date has not arrived yet, so today's names stay sealed. You can rehearse the machine at any time — rehearsals are never recorded."
          : undefined;

  return (
    <>
      <ReelMachine
        key={slotCount}
        people={people}
        winners={winners}
        reelCount={slotCount}
        spinning={spinning}
        onSpinComplete={onSpinComplete}
        onCta={
          canDraw
            ? () => {
                setNotice(null);
                setConfirmOpen(true);
              }
            : runSimulation
        }
        ctaLabel={ctaLabel}
        ctaDisabled={spinning || drawStatus.kind === "completed"}
        ctaReason={ctaReason}
        statusLine={statusLine}
        statusTone={statusTone}
        dateLabel={formatDateLong(today)}
        simulation={simulation && !todayResult}
      />

      {notice ? (
        <p
          role="status"
          className={`mt-4 border-l-2 px-4 py-3 text-[0.85rem] leading-relaxed ${
            notice.tone === "error"
              ? "border-[#A33444] bg-[rgba(163,52,68,0.14)] text-ivory"
              : "border-gold bg-[rgba(214,181,109,0.12)] text-ivory/85"
          }`}
        >
          {notice.text}
        </p>
      ) : null}

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        eyebrow="Confirm the daily draw"
        title={`Are you ready to reveal today's ${countWord(slotCount)} Christmas names?`}
        actions={
          <>
            <button type="button" className="btn btn-dark" onClick={() => setConfirmOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-gold" onClick={() => void confirmDraw()}>
              Confirm draw
            </button>
          </>
        }
      >
        <p>
          The names are chosen by the validated draw schedule and locked permanently as soon as
          they are revealed. <strong>This cannot be undone</strong> — no repeat, no edit, no redraw.
        </p>
        <p className="mt-4">
          {formatDateLong(today)} · {slotCount} names · {stats.remainingEmployeeSelections} selections
          still available.
        </p>
      </Dialog>
    </>
  );
}
