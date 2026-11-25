/**
 * Gold confetti + sparkle burst.
 * Hand-written canvas particles (no dependency), decorative only and fully
 * disabled when the visitor prefers reduced motion.
 */
type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  vr: number;
  color: string;
  shape: "rect" | "spark";
  life: number;
};

const COLORS = ["#D6B56D", "#F8F3E9", "#E8CD92", "#A33444", "#FFFFFF"];

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let running = false;

function ensureCanvas(): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  if (canvas && ctx) return canvas;
  canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText =
    "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:80;";
  document.body.appendChild(canvas);
  ctx = canvas.getContext("2d");
  resize();
  window.addEventListener("resize", resize);
  return canvas;
}

function resize() {
  if (!canvas) return;
  canvas.width = window.innerWidth * Math.min(window.devicePixelRatio || 1, 2);
  canvas.height = window.innerHeight * Math.min(window.devicePixelRatio || 1, 2);
}

export function fireConfetti(power = 1) {
  if (typeof window === "undefined") return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;
  const c = ensureCanvas();
  if (!c || !ctx) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = c.width / dpr;
  const h = c.height / dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const particles: Particle[] = [];
  const count = Math.round(110 * power);

  for (let i = 0; i < count; i++) {
    const fromTop = i % 3 !== 0;
    const spark = i % 7 === 0;
    particles.push({
      x: w * (0.12 + Math.random() * 0.76),
      y: fromTop ? -20 - Math.random() * h * 0.35 : h * (0.35 + Math.random() * 0.3),
      vx: (Math.random() - 0.5) * 3.2,
      vy: fromTop ? 1.4 + Math.random() * 2.6 : -(2.2 + Math.random() * 4.2),
      size: spark ? 2 + Math.random() * 3 : 6 + Math.random() * 9,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.22,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: spark ? "spark" : "rect",
      life: 1,
    });
  }

  if (running) return;
  running = true;
  const start = performance.now();

  const frame = (now: number) => {
    if (!ctx || !canvas) {
      running = false;
      return;
    }
    const elapsed = now - start;
    ctx.clearRect(0, 0, w, h);

    for (const p of particles) {
      p.vy += p.shape === "spark" ? 0.045 : 0.085;
      p.vx *= 0.992;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life = Math.max(0, 1 - elapsed / 5200);

      ctx.save();
      ctx.globalAlpha = Math.min(1, p.life * 1.4);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.shape === "spark") {
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      }
      ctx.restore();
    }

    if (elapsed < 5200) {
      requestAnimationFrame(frame);
    } else {
      ctx.clearRect(0, 0, w, h);
      running = false;
    }
  };

  requestAnimationFrame(frame);
}
