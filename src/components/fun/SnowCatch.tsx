"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";

const WIDTH = 720;
const HEIGHT = 380;
const GAME_MS = 30000;
const BEST_KEY = "santa-snow-best";

type Flake = { x: number; y: number; r: number; speed: number };
type Phase = "idle" | "playing" | "over";

/** Thirty seconds to tap as many falling snowflakes as possible. Best score kept in this browser. */
export default function SnowCatch() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const game = useRef({ flakes: [] as Flake[], score: 0, start: 0, raf: 0 });
  const [phase, setPhase] = useState<Phase>("idle");
  const [score, setScore] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(GAME_MS / 1000);
  const [best, setBest] = useState<number | null>(null);

  useEffect(() => {
    const g = game.current;
    return () => cancelAnimationFrame(g.raf);
  }, []);

  const start = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const g = game.current;
    cancelAnimationFrame(g.raf);
    g.flakes = [];
    g.score = 0;
    g.start = performance.now();
    setScore(0);
    setSecondsLeft(GAME_MS / 1000);
    setBest(Number(localStorage.getItem(BEST_KEY) ?? 0) || null);
    setPhase("playing");

    const finish = () => {
      cancelAnimationFrame(g.raf);
      const previous = Number(localStorage.getItem(BEST_KEY) ?? 0);
      if (g.score > previous) localStorage.setItem(BEST_KEY, String(g.score));
      setBest(Math.max(previous, g.score));
      setPhase("over");
    };

    const frame = (now: number) => {
      const elapsed = now - g.start;
      if (elapsed >= GAME_MS) {
        finish();
        return;
      }
      setSecondsLeft(Math.ceil((GAME_MS - elapsed) / 1000));

      const spawnChance = 0.04 + elapsed / 60000;
      if (Math.random() < spawnChance) {
        g.flakes.push({
          x: 20 + Math.random() * (WIDTH - 40),
          y: -12,
          r: 8 + Math.random() * 10,
          speed: 1.6 + Math.random() * 1.8 + elapsed / 30000,
        });
      }
      g.flakes = g.flakes
        .map((f) => ({ ...f, y: f.y + f.speed }))
        .filter((f) => f.y - f.r < HEIGHT);

      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      for (const f of g.flakes) {
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
      g.raf = requestAnimationFrame(frame);
    };
    g.raf = requestAnimationFrame(frame);
  };

  const onPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (WIDTH / rect.width);
    const y = (event.clientY - rect.top) * (HEIGHT / rect.height);

    const g = game.current;
    const hit = g.flakes.findIndex((f) => Math.hypot(f.x - x, f.y - y) <= f.r + 6);
    if (hit === -1) return;
    g.flakes.splice(hit, 1);
    g.score += 1;
    setScore(g.score);
  };

  return (
    <div className="relative mx-auto w-full max-w-[720px]">
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        onPointerDown={onPointerDown}
        className="block w-full touch-none select-none border border-[rgba(214,181,109,0.4)] bg-[rgba(9,30,24,0.6)]"
        style={{ aspectRatio: `${WIDTH} / ${HEIGHT}`, borderRadius: 2 }}
        aria-label="Snowflake catching game"
        role="img"
      />

      <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-between px-5">
        <span className="label text-gold">Score {score}</span>
        {phase === "playing" ? <span className="label text-gold">{secondsLeft}s</span> : null}
      </div>

      {phase !== "playing" ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[rgba(9,30,24,0.82)] px-6 text-center">
          {phase === "over" ? (
            <>
              <p className="font-display text-[1.5rem] italic text-ivory">You caught {score} snowflakes!</p>
              <p className="label text-gold">Best score: {best ?? score}</p>
            </>
          ) : (
            <p className="font-display text-[1.35rem] italic text-ivory/85">
              Tap the falling snowflakes for 30 seconds.
            </p>
          )}
          <button type="button" className="btn btn-gold" onClick={start}>
            {phase === "over" ? "Play again" : "Start"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
