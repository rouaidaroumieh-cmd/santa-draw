"use client";

import { useMemo, useState } from "react";
import { fireConfetti } from "@/lib/confetti";
import { CAMPAIGN_END, CAMPAIGN_START, countWord, formatDateLong, winnersOn } from "@/lib/dates";
import { campaignStats } from "@/lib/draw-engine";
import { useLang, useT } from "@/lib/language";
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
  const lang = useLang();
  const t = useT();
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
    if (todayResult) return buildReelWinners(state, todayResult.participantIds, today, false, lang);
    return liveWinners;
  }, [state, todayResult, liveWinners, today, lang]);

  if (!state || !status) {
    return <p className="label label-gold animate-pulse">{t("Preparing the Christmas machine…")}</p>;
  }

  const drawStatus = drawStatusFor(today);
  const stats = campaignStats(state);
  const canDraw = drawStatus.kind === "ready" && !spinning;

  const runSimulation = () => {
    const res = simulateDraw(slotCount);
    if (!res.ok) {
      setNotice({ tone: "error", text: t(res.error) });
      return;
    }
    setNotice({
      tone: "info",
      text: t("Simulation running — these names are for rehearsal only and will not be recorded."),
    });
    setSimulation(true);
    setLiveWinners(buildReelWinners(state, res.winners, today, true, lang));
    setSpinning(true);
  };

  const confirmDraw = async () => {
    setConfirmOpen(false);
    const res = await beginDraw(today);
    if (!res.ok) {
      setNotice({ tone: "error", text: t(res.error) });
      return;
    }
    setSimulation(false);
    setLiveWinners(buildReelWinners(state, res.winners, today, false, lang));
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
    setNotice({ tone: "info", text: t("DRAW COMPLETED – RESULTS LOCKED") });
  };

  const noDrawToday = drawStatus.kind === "weekend";
  let statusLine = t("Today's Christmas draw is ready.");
  let statusTone: "ready" | "locked" | "paused" = "ready";
  if (noDrawToday) {
    statusLine =
      today < CAMPAIGN_START
        ? t("The Christmas draw has not started yet.")
        : today > CAMPAIGN_END
          ? t("The Christmas draw is over.")
          : t("Santa is taking a little Christmas break today!");
    statusTone = "paused";
  } else if (drawStatus.kind === "completed") {
    statusLine = t("Today's Christmas surprises have already been revealed!");
    statusTone = "locked";
  } else if (drawStatus.kind === "future") {
    statusLine = t("Today's draw is still ahead of us.");
    statusTone = "paused";
  }

  const ctaLabel = canDraw
    ? t("🎄 Reveal today's {count} names", { count: slotCount })
    : drawStatus.kind === "completed"
      ? t("Today's results are locked")
      : spinning
        ? t("The reels are turning…")
        : t("Run a rehearsal of the machine");

  const ctaReason = spinning
    ? t("The names were decided and validated before the animation began.")
    : drawStatus.kind === "completed"
      ? t("Today's Christmas surprises have already been revealed. This draw can never be repeated or changed.")
      : noDrawToday
        ? t("No draw today. The rehearsal is only a preview and is never recorded.")
        : drawStatus.kind === "future"
          ? t(
              "This date has not arrived yet, so today's names stay sealed. You can rehearse the machine at any time — rehearsals are never recorded.",
            )
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
        dateLabel={formatDateLong(today, lang)}
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
        eyebrow={t("Confirm the daily draw")}
        title={t("Are you ready to reveal today's {count} Christmas names?", { count: countWord(slotCount, lang) })}
        actions={
          <>
            <button type="button" className="btn btn-dark" onClick={() => setConfirmOpen(false)}>
              {t("Cancel")}
            </button>
            <button type="button" className="btn btn-gold" onClick={() => void confirmDraw()}>
              {t("Confirm draw")}
            </button>
          </>
        }
      >
        <p>
          {t(
            "The names are chosen by the validated draw schedule and locked permanently as soon as they are revealed.",
          )}{" "}
          <strong>{t("This cannot be undone")}</strong> — {t("no repeat, no edit, no redraw.")}
        </p>
        <p className="mt-4">
          {t("{date} · {count} names · {remaining} selections still available.", {
            date: formatDateLong(today, lang),
            count: slotCount,
            remaining: stats.remainingEmployeeSelections,
          })}
        </p>
      </Dialog>
    </>
  );
}
