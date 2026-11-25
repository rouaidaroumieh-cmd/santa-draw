"use client";

import { useCallback, useMemo, useState } from "react";
import Avatar from "@/components/Avatar";
import Dialog from "@/components/Dialog";
import { Overline, PageShell } from "@/components/Chrome";
import ReelMachine, { type ReelWinner } from "@/components/ReelMachine";
import { CampaignProgress, StatCards } from "@/components/Stats";
import { fireConfetti } from "@/lib/confetti";
import {
  SELECTIONS_PER_PARTICIPANT,
  WINNERS_PER_DAY,
  campaignStats,
} from "@/lib/draw-engine";
import { formatDateLong, isWeekendDate, ordinal } from "@/lib/dates";
import {
  beginDraw,
  commitDraw,
  drawStatusFor,
  simulateDraw,
  todayStatus,
  useCampaign,
  useIsAdmin,
  type CampaignState,
} from "@/lib/store";

function appearancesUpTo(state: CampaignState, date: string, id: string): number {
  return Object.values(state.results).filter(
    (r) => r.date <= date && r.participantIds.includes(id),
  ).length;
}

export default function HomePage() {
  const state = useCampaign();
  const isAdmin = useIsAdmin();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [liveWinners, setLiveWinners] = useState<ReelWinner[] | null>(null);
  const [simulation, setSimulation] = useState(false);
  const [notice, setNotice] = useState<{ tone: "error" | "info"; text: string } | null>(null);

  const status = useMemo(() => (state ? todayStatus() : null), [state]);

  const buildReelWinners = useCallback(
    (ids: string[], date: string, sim: boolean): ReelWinner[] => {
      if (!state) return [];
      return ids.map((id) => {
        const p = state.participants.find((x) => x.id === id);
        const app = appearancesUpTo(state, date, id) + (state.results[date] ? 0 : 1);
        return {
          id,
          name: p?.name ?? id,
          photo: state.photos[id],
          selectionLabel: sim ? "Simulation pick" : `${ordinal(Math.min(app, 3))} selection`,
          remainingLabel: sim
            ? "Not recorded"
            : `${Math.max(0, SELECTIONS_PER_PARTICIPANT - app)} chance${
                Math.max(0, SELECTIONS_PER_PARTICIPANT - app) === 1 ? "" : "s"
              } remaining`,
        };
      });
    },
    [state],
  );

  const today = status?.today ?? "";
  const todayResult = state?.results[today];
  const isWeekendToday = isWeekendDate(today);
  const drawStatus = state ? drawStatusFor(today) : null;

  const people = useMemo(
    () =>
      state
        ? state.participants.map((p) => ({
            id: p.id,
            name: p.name,
            photo: state.photos[p.id] ?? null,
          }))
        : [],
    [state],
  );

  const winners: ReelWinner[] | null = useMemo(() => {
    if (todayResult) return buildReelWinners(todayResult.participantIds, today, false);
    return liveWinners;
  }, [todayResult, liveWinners, buildReelWinners, today]);

  if (!state || !status || !drawStatus) {
    return (
      <PageShell current="home">
        <div className="mx-auto flex min-h-[70vh] max-w-[1240px] items-center justify-center px-5">
          <p className="label label-gold animate-pulse">Preparing the Christmas machine…</p>
        </div>
      </PageShell>
    );
  }

  const stats = campaignStats(state);

  const openConfirm = () => {
    setNotice(null);
    setConfirmOpen(true);
  };

  const runSimulation = () => {
    const res = simulateDraw();
    if (!res.ok) {
      setNotice({ tone: "error", text: res.error });
      return;
    }
    setNotice({
      tone: "info",
      text: "Simulation running — these names are for rehearsal only and will not be recorded.",
    });
    setSimulation(true);
    setLiveWinners(buildReelWinners(res.winners, today, true));
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
    setLiveWinners(buildReelWinners(res.winners, today, false));
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

  /* ---- status banner copy ---------------------------------------- */
  let bannerTitle = "";
  let bannerBody = "";
  let bannerTone: "ready" | "locked" | "paused" = "ready";

  if (isWeekendToday) {
    bannerTitle = "Santa is taking a little Christmas break today!";
    bannerBody = status.nextDate
      ? `The next Christmas surprise arrives on ${formatDateLong(status.nextDate)}.`
      : "The campaign is complete — thank you for a wonderful Christmas run.";
    bannerTone = "paused";
  } else if (drawStatus.kind === "completed") {
    bannerTitle = "Today's Christmas surprises have already been revealed!";
    bannerBody = "DRAW COMPLETED – RESULTS LOCKED. The results can never be changed or redrawn.";
    bannerTone = "locked";
  } else if (drawStatus.kind === "future") {
    bannerTitle =
      status.nextDate && status.nextDate === addDays(today)
        ? "See you tomorrow for another Christmas surprise!"
        : "Today's draw is still ahead of us.";
    bannerBody = status.nextDate
      ? `Next reveal: ${formatDateLong(status.nextDate)}. Future names stay sealed until their day.`
      : "All working days have been revealed.";
    bannerTone = "paused";
  } else {
    bannerTitle = "Today's Christmas draw is ready.";
    bannerBody = `Confirm the draw to reveal today's four Christmas names and lock them permanently.`;
    bannerTone = "ready";
  }

  const canDraw = isAdmin && drawStatus.kind === "ready" && !spinning;
  const waitingForOrganiser = !isAdmin && drawStatus.kind === "ready";
  const machineCtaLabel = canDraw
    ? "🎄 Reveal today's 4 names"
    : drawStatus.kind === "completed"
      ? "Today's results are locked"
      : waitingForOrganiser
        ? "Waiting for the organiser's reveal"
        : spinning
          ? "The reels are turning…"
          : "Run a rehearsal of the machine";

  const machineCtaReason = spinning
    ? "The four names were decided and validated before the animation began."
    : drawStatus.kind === "completed"
      ? "Today's Christmas surprises have already been revealed. This draw can never be repeated or changed."
      : waitingForOrganiser
        ? "The organiser runs the daily draw. The four names appear here as soon as they are revealed — this page updates by itself."
        : isWeekendToday
          ? "Weekend — no draw today. The rehearsal below is only a preview and is never recorded."
          : drawStatus.kind === "future"
            ? "This date has not arrived yet, so today's names stay sealed. You can rehearse the machine at any time — rehearsals are never recorded."
            : undefined;

  return (
    <PageShell current="home">
      {/* ================= HERO ================= */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/hero-night.jpg"
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover"
            style={{ objectPosition: "70% 50%" }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(96deg, rgba(13,38,32,0.96) 0%, rgba(13,38,32,0.86) 34%, rgba(13,38,32,0.35) 68%, rgba(13,38,32,0.12) 100%)",
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-40"
            style={{ background: "linear-gradient(180deg, transparent, #0d2620)" }}
          />
        </div>

        <div className="relative mx-auto max-w-[1240px] px-5 pb-28 pt-16 sm:pt-24 lg:pb-36 lg:pt-28">
          <div className="max-w-[820px]">
            <p className="label label-gold rise">Office Christmas Campaign · 1–21 December 2026</p>
            <h1
              className="rise mt-6 text-ivory"
              style={{
                fontSize: "clamp(3.1rem, 10.5vw, 8.4rem)",
                lineHeight: 0.86,
                letterSpacing: "-0.035em",
                marginLeft: "-0.05em",
                fontWeight: 300,
                animationDelay: "90ms",
              }}
            >
              Santa&apos;s
              <span className="block text-gold" style={{ fontWeight: 500 }}>
                Christmas Draw
              </span>
            </h1>
            <p
              className="rise mt-7 max-w-[560px] font-display text-[1.35rem] italic leading-snug text-ivory/85 sm:text-[1.65rem]"
              style={{ animationDelay: "180ms", fontWeight: 300 }}
            >
              21 days of Christmas magic — four names revealed on every working day, and sealed
              forever the moment they appear.
            </p>

            <div className="rise mt-9 flex flex-wrap items-center gap-x-8 gap-y-3" style={{ animationDelay: "260ms" }}>
              {[
                ["20", "participants"],
                ["15", "draw days"],
                ["60", "selections"],
                ["3", "chances each"],
              ].map(([n, label]) => (
                <div key={label} className="flex items-baseline gap-2">
                  <span className="tabular font-display text-[1.9rem] leading-none text-gold">{n}</span>
                  <span className="label text-ivory/60">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= STATISTICS ================= */}
      <section className="relative z-10 -mt-16 px-5 sm:-mt-20">
        <div className="mx-auto max-w-[1240px]">
          <StatCards state={state} />
          <div className="mt-5">
            <CampaignProgress state={state} />
          </div>
        </div>
      </section>

      {/* ================= THE MACHINE ================= */}
      <section className="px-5 pt-20 sm:pt-24">
        <div className="mx-auto max-w-[1240px]">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-14">
            <div className="order-2 lg:order-1">
              <ReelMachine
                people={people}
                winners={winners}
                spinning={spinning}
                onSpinComplete={onSpinComplete}
                onCta={canDraw ? openConfirm : runSimulation}
                ctaLabel={machineCtaLabel}
                ctaDisabled={spinning || drawStatus.kind === "completed" || waitingForOrganiser}
                ctaReason={machineCtaReason}
                statusLine={bannerTitle}
                statusTone={bannerTone}
                dateLabel={formatDateLong(today)}
                simulation={simulation && !todayResult}
              />
            </div>

            <aside className="order-1 lg:order-2">
              <Overline>Today at a glance</Overline>
              <div className="paper gold-frame mt-5 px-6 py-7" style={{ borderRadius: 2 }}>
                <p className="label text-[#B08F4C]">{formatDateLong(today)}</p>
                <h3
                  className="mt-3 text-[1.55rem] leading-[1.08] text-[#173D32]"
                  style={{ fontWeight: 400 }}
                >
                  {bannerTitle}
                </h3>
                <p className="mt-4 text-[0.92rem] leading-relaxed text-[#4A463C]">{bannerBody}</p>
                <div className="rule-solid mt-5 pt-5">
                  <p className="label text-[#6E6A5E]">Campaign status</p>
                  <p className="tabular mt-2 font-display text-[1.35rem] leading-tight text-[#173D32]">
                    {stats.completedSelections}/{stats.totalSelections} selections revealed
                  </p>
                  <p className="mt-1 text-[0.82rem] text-[#6E6A5E]">
                    {stats.remainingDays} working days remaining ·{" "}
                    {stats.completedParticipants} participants complete
                  </p>
                </div>
              </div>

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
            </aside>
          </div>
        </div>
      </section>

      {/* ================= WINNER PRESENTATION ================= */}
      <section className="px-5 pt-20 sm:pt-24">
        <div className="mx-auto max-w-[1240px]">
          <Overline>{todayResult ? "Today's Christmas picks" : "Awaiting today's picks"}</Overline>

          {winners && winners.length === WINNERS_PER_DAY ? (
            <>
              <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {winners.map((w, i) => (
                  <article
                    key={w.id}
                    className="paper gold-frame lift rise flex flex-col items-center px-5 py-7 text-center"
                    style={{ borderRadius: 2, animationDelay: `${i * 110}ms` }}
                  >
                    <FestiveAccent />
                    <Avatar id={w.id} name={w.name} photo={state.photos[w.id]} size={112} />
                    <h3 className="mt-5 font-display text-[1.35rem] leading-tight text-[#173D32]">
                      {w.name}
                    </h3>
                    <div className="rule-solid mt-4 w-full pt-4">
                      <p className="label text-[#B08F4C]">{w.selectionLabel}</p>
                      <p className="mt-2 text-[0.86rem] text-[#4A463C]">{w.remainingLabel}</p>
                    </div>
                    <p className="label mt-4 text-[0.52rem] text-[#6E6A5E]">
                      {todayResult ? `Locked ${formatDateLong(today)}` : "Simulation · not recorded"}
                    </p>
                  </article>
                ))}
              </div>

              <div
                className={`mt-8 flex flex-col items-center gap-3 border px-6 py-6 text-center ${
                  todayResult
                    ? "border-[rgba(214,181,109,0.5)] bg-[rgba(214,181,109,0.1)]"
                    : "border-dashed border-[rgba(214,181,109,0.4)] bg-[rgba(255,255,255,0.03)]"
                }`}
              >
                <p className="font-display text-[1.55rem] italic text-ivory" style={{ fontWeight: 300 }}>
                  {todayResult
                    ? "Congratulations to today's Christmas picks!"
                    : "This was a rehearsal — nothing has been recorded."}
                </p>
                <p className="label text-gold">
                  {todayResult ? "Draw completed – results locked" : "Simulation mode"}
                </p>
              </div>
            </>
          ) : (
            <div className="paper-dim gold-frame mt-7 px-6 py-14 text-center" style={{ borderRadius: 2 }}>
              <p className="font-display text-[1.6rem] italic leading-snug text-ivory/85" style={{ fontWeight: 300 }}>
                Four names are waiting behind the glass.
              </p>
              <p className="mx-auto mt-4 max-w-[440px] text-[0.92rem] leading-relaxed text-ivory/65">
                When today&apos;s draw is confirmed, the four Christmas picks appear here — with their
                photos, their selection number and the chances they have left.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ================= CONFIRMATION DIALOG ================= */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        eyebrow="Confirm the daily draw"
        title="Are you ready to reveal today's four Christmas names?"
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
          The four names are chosen by the validated draw schedule and locked permanently as soon as
          they are revealed. <strong>This cannot be undone</strong> — no repeat, no edit, no redraw.
        </p>
        <p className="mt-4">
          {formatDateLong(today)} · {WINNERS_PER_DAY} names ·{" "}
          {stats.remainingEmployeeSelections} selections still available.
        </p>
      </Dialog>
    </PageShell>
  );
}

/** Small hand-drawn festive accent used on the winner cards. */
function FestiveAccent() {
  return (
    <svg width="34" height="18" viewBox="0 0 34 18" aria-hidden="true" className="mb-3">
      <path d="M17 2 L18.9 7.4 L24.6 7.6 L20 11 L21.7 16.4 L17 13 L12.3 16.4 L14 11 L9.4 7.6 L15.1 7.4 Z" fill="#D6B56D" />
      <path d="M2 9 H8 M26 9 H32" stroke="#D6B56D" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

function addDays(date: string): string {
  const t = Date.parse(`${date}T00:00:00`) + 86400000;
  const d = new Date(t);
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
