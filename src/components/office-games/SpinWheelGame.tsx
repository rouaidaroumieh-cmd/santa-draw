"use client";

import { useMemo, useRef, useState } from "react";
import Dialog from "@/components/Dialog";
import { fireConfetti } from "@/lib/confetti";
import { WHEEL_CHALLENGES, type WheelChallenge } from "@/lib/office-games/spin-wheel";
import { useT } from "@/lib/language";
import { GameIntro, GameResult } from "./GameChrome";

type Phase = "intro" | "play" | "done";

export default function SpinWheelGame() {
  const t = useT();
  const [phase, setPhase] = useState<Phase>("intro");
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [current, setCurrent] = useState<WheelChallenge | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [completed, setCompleted] = useState<string[]>([]);
  const pendingIndex = useRef<number | null>(null);

  const n = WHEEL_CHALLENGES.length;
  const slice = 360 / n;

  const gradient = useMemo(() => {
    const parts = WHEEL_CHALLENGES.map((c, i) => {
      const start = i * slice;
      const end = (i + 1) * slice;
      return `${c.color} ${start}deg ${end}deg`;
    });
    return `conic-gradient(from -${slice / 2}deg, ${parts.join(", ")})`;
  }, [slice]);

  const start = () => {
    setPhase("play");
    setRotation(0);
    setCurrent(null);
    setCompleted([]);
    setModalOpen(false);
  };

  const spin = () => {
    if (spinning) return;
    const index = Math.floor(Math.random() * n);
    pendingIndex.current = index;
    // Pointer at top; segment i is centered at i * slice (conic starts at -slice/2).
    const segmentCenter = index * slice;
    const desired = (360 - segmentCenter) % 360;
    setSpinning(true);
    setRotation((prev) => {
      const current = ((prev % 360) + 360) % 360;
      const delta = (desired - current + 360) % 360;
      const extraTurns = 4 + Math.floor(Math.random() * 3);
      return prev + extraTurns * 360 + delta;
    });
  };

  const onTransitionEnd = () => {
    if (!spinning || pendingIndex.current === null) return;
    const challenge = WHEEL_CHALLENGES[pendingIndex.current]!;
    setCurrent(challenge);
    setSpinning(false);
    setModalOpen(true);
    pendingIndex.current = null;
    if (challenge.category === "lucky") fireConfetti(0.7);
  };

  const markDone = () => {
    if (!current) return;
    setCompleted((list) => (list.includes(current.id) ? list : [...list, current.id]));
    setModalOpen(false);
  };

  const finishSession = () => {
    setPhase("done");
    fireConfetti(0.6);
  };

  if (phase === "intro") {
    return (
      <GameIntro
        title={t("Spin the Christmas wheel")}
        blurb={t("Land on a random office Christmas challenge.")}
        meta={`${t("Endless spins")} · ${t("~1 min")}`}
        onStart={start}
      />
    );
  }

  if (phase === "done") {
    return (
      <GameResult
        title={t("Wheel session complete")}
        message={t("You completed {count} challenges!", { count: completed.length })}
        detail={t("Spin again anytime for a new office Christmas dare.")}
        onAgain={start}
      />
    );
  }

  return (
    <div className="paper gold-frame flex flex-col gap-6 px-6 py-7" style={{ borderRadius: 2 }}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label text-[#B08F4C]">{t("Spin the Christmas wheel")}</p>
          <p className="mt-2 text-[0.95rem] text-[#3D3A30]">
            {t("Challenges cleared")}: {completed.length}/{n}
          </p>
        </div>
        <button type="button" className="btn btn-ghost !text-[#173D32] !border-[rgba(23,61,50,0.35)]" onClick={finishSession}>
          {t("End session")}
        </button>
      </div>

      <div className="relative mx-auto w-full max-w-[340px]">
        <div
          className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1"
          aria-hidden
        >
          <div
            className="h-0 w-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-[#B08F4C]"
          />
        </div>
        <div
          role="img"
          aria-label={t("Christmas challenge wheel")}
          className="aspect-square w-full rounded-full border-[6px] border-[#B08F4C] shadow-[0_18px_40px_-20px_rgba(0,0,0,0.55)]"
          style={{
            background: gradient,
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? "transform 4.2s cubic-bezier(0.12, 0.75, 0.12, 1)" : "none",
          }}
          onTransitionEnd={onTransitionEnd}
        />
        <div
          className="pointer-events-none absolute inset-[28%] flex items-center justify-center rounded-full border border-[rgba(248,243,233,0.35)] bg-[rgba(15,43,35,0.88)] text-center"
        >
          <span className="label text-gold">{t("SPIN")}</span>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" className="btn btn-dark" disabled={spinning} onClick={spin}>
          {spinning ? t("Spinning…") : t("Spin")}
        </button>
        {current && !spinning ? (
          <button type="button" className="btn btn-gold" disabled={spinning} onClick={spin}>
            {t("Spin again")}
          </button>
        ) : null}
      </div>

      {completed.length > 0 ? (
        <ul className="border-t border-[rgba(23,61,50,0.12)] pt-4 text-left">
          <p className="label mb-2 text-[#6E6A5E]">{t("Completed challenges")}</p>
          {completed.map((id) => {
            const c = WHEEL_CHALLENGES.find((x) => x.id === id);
            if (!c) return null;
            return (
              <li key={id} className="py-1.5 text-[0.9rem] text-[#173D32]">
                <span className="text-[#B08F4C]">{c.categoryLabel}</span> — {c.text}
              </li>
            );
          })}
        </ul>
      ) : null}

      <Dialog
        open={modalOpen && Boolean(current)}
        title={current?.categoryLabel ?? ""}
        eyebrow={t("Your challenge")}
        onClose={() => setModalOpen(false)}
        actions={
          <>
            <button type="button" className="btn btn-dark" onClick={markDone}>
              {t("Mark as done")}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>
              {t("Close")}
            </button>
          </>
        }
      >
        <p className="text-[1.1rem] leading-relaxed text-[#173D32]">{current?.text}</p>
      </Dialog>
    </div>
  );
}
