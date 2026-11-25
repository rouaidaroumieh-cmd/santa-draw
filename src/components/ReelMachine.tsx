"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Avatar from "./Avatar";

export interface ReelPerson {
  id: string;
  name: string;
  photo?: string | null;
}

export interface ReelWinner extends ReelPerson {
  selectionLabel: string;
  remainingLabel: string;
}

const ITEM_H = 172;
const REEL_COUNT = 4;

/** Deterministic decorative strip shown before the draw. */
function idleStrip(people: ReelPerson[], reel: number): string[] {
  if (people.length === 0) return [];
  const out: string[] = [];
  for (let i = 0; i < 6; i++) {
    out.push(people[(reel * 5 + i * 3) % people.length].id);
  }
  return out;
}

/** A long strip that always ends exactly on the winner. */
function spinStrip(people: ReelPerson[], winnerId: string, reel: number): string[] {
  const length = 20 + reel * 5;
  const out: string[] = [];
  for (let i = 0; i < length - 1; i++) {
    out.push(people[(reel * 7 + i * 5 + 3) % people.length].id);
  }
  out.push(winnerId);
  return out;
}

interface ReelState {
  strips: string[][];
  offsets: number[];
  durations: number[];
  run: boolean;
}

export default function ReelMachine({
  people,
  winners,
  spinning,
  onSpinComplete,
  onCta,
  ctaLabel,
  ctaDisabled,
  ctaReason,
  statusLine,
  statusTone,
  dateLabel,
  simulation = false,
}: {
  people: ReelPerson[];
  winners: ReelWinner[] | null;
  spinning: boolean;
  onSpinComplete: () => void;
  onCta: () => void;
  ctaLabel: string;
  ctaDisabled: boolean;
  ctaReason?: string;
  statusLine: string;
  statusTone: "ready" | "locked" | "paused";
  dateLabel: string;
  simulation?: boolean;
}) {
  const [state, setState] = useState<ReelState>({
    strips: [0, 1, 2, 3].map((r) => idleStrip(people, r)),
    offsets: [0, 0, 0, 0],
    durations: [0, 0, 0, 0],
    run: false,
  });
  const [landed, setLanded] = useState<boolean[]>([false, false, false, false]);
  const completeRef = useRef(onSpinComplete);
  completeRef.current = onSpinComplete;

  // The people list is read through a ref so a re-render never restarts a spin.
  const peopleRef = useRef(people);
  peopleRef.current = people;

  const byId = useMemo(() => {
    const map = new Map<string, ReelPerson>();
    people.forEach((p) => map.set(p.id, p));
    return map;
  }, [people]);

  // Static display of already-revealed winners (page load, or after the spin).
  useEffect(() => {
    if (spinning || !winners) return;
    setState({
      strips: winners.map((w) => [w.id]),
      offsets: [0, 0, 0, 0],
      durations: [0, 0, 0, 0],
      run: false,
    });
    setLanded([true, true, true, true]);
  }, [spinning, winners]);

  // The spin: purely cosmetic. Winners were decided and validated beforehand.
  useEffect(() => {
    if (!spinning || !winners) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const strips = winners.map((w, i) => (reduced ? [w.id] : spinStrip(peopleRef.current, w.id, i)));
    const offsets = strips.map(() => 0);
    const durations = strips.map((s, i) => (reduced ? 0 : 2200 + i * 620));
    setLanded([false, false, false, false]);
    setState({ strips, offsets, durations, run: false });

    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setState((prev) => ({
          ...prev,
          offsets: prev.strips.map((s) => -(s.length - 1) * ITEM_H),
          run: true,
        }));
      });
    });

    const total = reduced ? 420 : 4300;
    const timers: number[] = [];
    durations.forEach((d, i) => {
      timers.push(
        window.setTimeout(
          () => setLanded((prev) => prev.map((v, j) => (j === i ? true : v))),
          Math.max(0, d - 120),
        ),
      );
    });
    const done = window.setTimeout(() => completeRef.current?.(), total);

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      timers.forEach((t) => clearTimeout(t));
      clearTimeout(done);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning, winners]);

  return (
    <div className="relative">
      {/* ---- Machine body --------------------------------------------- */}
      <div
        className="gold-frame relative overflow-hidden px-4 pt-8 pb-6 sm:px-8 sm:pt-10 sm:pb-8"
        style={{
          background:
            "radial-gradient(120% 90% at 50% -10%, #2a6550 0%, #1b4638 38%, #123227 72%, #0d2620 100%)",
          borderRadius: 3,
        }}
      >
        {/* corner filigree */}
        <MachineOrnaments />

        {/* string of lights */}
        <div aria-hidden="true" className="absolute inset-x-0 top-0 flex items-start justify-between px-6 pt-3">
          {Array.from({ length: 13 }, (_, i) => (
            <span
              key={i}
              className={`bulb glow-soft ${i % 4 === 2 ? "bulb-red" : ""}`}
              style={{ animationDelay: `${(i * 0.37).toFixed(2)}s` }}
            />
          ))}
        </div>

        <div className="relative z-10">
          <div className="flex flex-col items-center text-center">
            <RibbonBow />
            <p className="label label-gold mt-3">The Christmas Drawing Machine</p>
            <h2 className="mt-2 text-[1.9rem] leading-[0.95] text-ivory sm:text-[2.6rem]">
              Four names, sealed
              <span className="block italic text-gold" style={{ fontWeight: 300 }}>
                until the moment arrives
              </span>
            </h2>
          </div>

          {/* ---- Reels ------------------------------------------------ */}
          <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {state.strips.map((strip, reel) => (
              <div
                key={reel}
                className={`machine-glass relative ${landed[reel] ? "shadow-[0_0_40px_-10px_rgba(214,181,109,0.55)]" : ""}`}
                style={{ height: ITEM_H, borderRadius: 2 }}
              >
                <div
                  className={`reel-strip ${state.run ? "" : "no-transition"}`}
                  style={{
                    transform: `translateY(${state.offsets[reel]}px)`,
                    transitionDuration: `${state.durations[reel]}ms`,
                  }}
                >
                  {(strip.length ? strip : ["empty"]).map((id, i) => {
                    const person = byId.get(id);
                    return (
                      <div
                        key={`${id}-${i}`}
                        className="flex flex-col items-center justify-center gap-2 px-2"
                        style={{ height: ITEM_H }}
                      >
                        {person ? (
                          <>
                            <Avatar id={person.id} name={person.name} photo={person.photo} size={72} />
                            <p className="line-clamp-2 w-full text-center font-display text-[0.92rem] leading-tight text-ivory">
                              {person.name}
                            </p>
                            <span className="label text-[0.52rem] text-gold/70">
                              {simulation ? "Simulation" : "Participant"}
                            </span>
                          </>
                        ) : (
                          <span className="label text-gold/50">Sealed</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* glass reflection + top/bottom vignette */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(9,30,24,0.85) 0%, rgba(9,30,24,0) 22%, rgba(9,30,24,0) 76%, rgba(9,30,24,0.9) 100%)",
                  }}
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[rgba(214,181,109,0.28)]"
                />
                <span className="label absolute bottom-2 left-0 right-0 text-center text-[0.52rem] text-gold/70">
                  {["First", "Second", "Third", "Fourth"][reel]}
                </span>
              </div>
            ))}
          </div>

          {/* ---- Control plaque --------------------------------------- */}
          <div className="mt-7 flex flex-col items-center gap-4">
            <div className="flex w-full flex-col items-center gap-2 rounded-sm border border-[rgba(214,181,109,0.3)] bg-[rgba(9,30,24,0.55)] px-5 py-3 text-center">
              <span
                className={`label ${
                  statusTone === "locked" ? "text-gold" : statusTone === "ready" ? "text-ivory" : "text-ivory/60"
                }`}
              >
                {statusLine}
              </span>
              <span className="text-[0.8rem] tracking-[0.12em] text-ivory/55 uppercase">{dateLabel}</span>
            </div>

            <button
              type="button"
              onClick={onCta}
              disabled={ctaDisabled}
              className="btn btn-gold w-full max-w-[440px] text-[0.82rem]"
            >
              {ctaLabel}
            </button>

            {ctaDisabled && ctaReason ? (
              <p className="max-w-[420px] text-center text-[0.85rem] leading-relaxed text-ivory/60">
                {ctaReason}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hand-drawn ornament SVGs                                            */
/* ------------------------------------------------------------------ */

function RibbonBow() {
  return (
    <svg width="92" height="42" viewBox="0 0 92 42" aria-hidden="true">
      <path
        d="M46 21 C38 6 20 2 14 10 C8 18 22 26 46 21 Z"
        fill="#7A1F2B"
        stroke="#D6B56D"
        strokeWidth="1.1"
      />
      <path
        d="M46 21 C54 6 72 2 78 10 C84 18 70 26 46 21 Z"
        fill="#7A1F2B"
        stroke="#D6B56D"
        strokeWidth="1.1"
      />
      <path
        d="M46 22 C42 30 38 36 32 41 M46 22 C50 30 54 36 60 41"
        stroke="#D6B56D"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx="46" cy="21" rx="7" ry="6" fill="#A33444" stroke="#D6B56D" strokeWidth="1.1" />
    </svg>
  );
}

function MachineOrnaments() {
  return (
    <>
      <svg
        className="pointer-events-none absolute left-2 top-2 h-16 w-16 opacity-70 sm:h-20 sm:w-20"
        viewBox="0 0 80 80"
        aria-hidden="true"
      >
        <g stroke="#D6B56D" strokeWidth="1.1" fill="none" strokeLinecap="round">
          <path d="M8 8 C26 12 40 26 44 44" />
          <path d="M14 20 C22 22 30 22 38 18" />
          <path d="M12 32 C22 34 32 32 40 26" />
          <path d="M16 44 C26 46 34 44 42 38" />
          <path d="M22 56 C30 58 38 55 44 49" />
          <circle cx="38" cy="14" r="2" fill="#D6B56D" />
          <circle cx="30" cy="52" r="2" fill="#D6B56D" />
        </g>
      </svg>
      <svg
        className="pointer-events-none absolute right-2 top-2 h-16 w-16 -scale-x-100 opacity-70 sm:h-20 sm:w-20"
        viewBox="0 0 80 80"
        aria-hidden="true"
      >
        <g stroke="#D6B56D" strokeWidth="1.1" fill="none" strokeLinecap="round">
          <path d="M8 8 C26 12 40 26 44 44" />
          <path d="M14 20 C22 22 30 22 38 18" />
          <path d="M12 32 C22 34 32 32 40 26" />
          <path d="M16 44 C26 46 34 44 42 38" />
          <path d="M22 56 C30 58 38 55 44 49" />
          <circle cx="38" cy="14" r="2" fill="#D6B56D" />
          <circle cx="30" cy="52" r="2" fill="#D6B56D" />
        </g>
      </svg>
    </>
  );
}
