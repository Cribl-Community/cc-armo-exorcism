import { useEffect, useRef } from 'react';
import { useLatest } from '../useLatest';

type Mode = 'embers' | 'river';

interface ParticlesProps {
  mode: Mode;
  /** Particles spawned per second. */
  rate: number;
  /** River target, as fractions of the canvas (0–1). */
  target?: { x: number; y: number };
  colors?: string[];
  className?: string;
}

interface P {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
}

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/** Canvas particles: rising candle embers, or a river of telemetry flowing into a target (the Goat's mouth). */
export function Particles({ mode, rate, target = { x: 0.5, y: 0.5 }, colors = ['#ffc857', '#ff6b35', '#19e3c9'], className }: ParticlesProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const cfg = useLatest({ mode, rate, target, colors });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || reducedMotion()) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    let last = performance.now();
    let carry = 0;
    const ps: P[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const spawn = (w: number, h: number) => {
      const { mode: m, target: t, colors: cs } = cfg.current;
      const color = cs[Math.floor(Math.random() * cs.length)];
      if (m === 'embers') {
        ps.push({ x: Math.random() * w, y: h + 10, vx: (Math.random() - 0.5) * 20, vy: -(30 + Math.random() * 60), life: 0, max: 3 + Math.random() * 4, size: 1 + Math.random() * 2.5, color });
      } else {
        // Spawn on a random edge, fly toward the target with a little curl.
        const edge = Math.floor(Math.random() * 4);
        const x = edge === 0 ? 0 : edge === 1 ? w : Math.random() * w;
        const y = edge === 2 ? 0 : edge === 3 ? h : Math.random() * h;
        const tx = t.x * w;
        const ty = t.y * h;
        const dist = Math.hypot(tx - x, ty - y);
        const speed = 240 + Math.random() * 260;
        ps.push({ x, y, vx: ((tx - x) / dist) * speed, vy: ((ty - y) / dist) * speed, life: 0, max: dist / speed, size: 1.5 + Math.random() * 2.5, color });
      }
    };

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      carry += cfg.current.rate * dt;
      while (carry >= 1) {
        spawn(w, h);
        carry -= 1;
      }
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        p.life += dt;
        if (p.life >= p.max) {
          ps.splice(i, 1);
          continue;
        }
        if (cfg.current.mode === 'embers') p.vx += (Math.random() - 0.5) * 30 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const k = 1 - p.life / p.max;
        ctx.globalAlpha = cfg.current.mode === 'embers' ? k * 0.9 : Math.min(1, (1 - k) * 4) * 0.9;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [cfg]);

  return <canvas ref={ref} className={`r-particles ${className ?? ''}`} aria-hidden="true" />;
}
