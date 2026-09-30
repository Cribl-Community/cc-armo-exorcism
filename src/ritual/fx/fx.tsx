/* eslint-disable react/only-export-components */
import { useEffect, useState } from 'react';
import { useLatest } from '../useLatest';
import confetti from 'canvas-confetti';
import { play } from './sound';

/** Text with an RGB-split glitch. `data-text` feeds the two offset copies. */
export function Glitch({ text, className, as: As = 'h1' }: { text: string; className?: string; as?: 'h1' | 'h2' | 'p' | 'span' }) {
  return (
    <As className={`r-glitch ${className ?? ''}`} data-text={text}>
      {text}
    </As>
  );
}

/** Z̷a̵l̶g̸o̴ for corrupted telemetry. Deterministic per string so it doesn't flicker on re-render. */
export function corrupt(s: string, intensity = 2): string {
  const marks = ['̶', '̷', '̸', '̴', '̵', '̡', '̢', '̧', '̨', '́', '̀', '̃'];
  let h = 0;
  return [...s]
    .map((ch) => {
      if (ch === ' ') return ch;
      let out = ch;
      for (let i = 0; i < intensity; i++) {
        h = (h * 31 + ch.charCodeAt(0) + i) >>> 0;
        out += marks[h % marks.length];
      }
      return out;
    })
    .join('');
}

/** Count from 0 to `to` with an ease-out, ticking softly. */
export function CountUp({ to, durationMs = 3200, format = (n: number) => n.toLocaleString(), onDone }: { to: number; durationMs?: number; format?: (n: number) => string; onDone?: () => void }) {
  const [n, setN] = useState(0);
  const done = useLatest(onDone);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    let lastTick = 0;
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / durationMs);
      const eased = 1 - Math.pow(1 - k, 3);
      setN(Math.round(to * eased));
      if (now - lastTick > 90 && k < 1) {
        play('tick');
        lastTick = now;
      }
      if (k < 1) raf = requestAnimationFrame(step);
      else done.current?.();
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, durationMs, done]);
  return <>{format(n)}</>;
}

/** A glowing sparkline drawn in on mount. */
export function Sparkline({ points, className }: { points: number[]; className?: string }) {
  if (points.length < 2) return null;
  const max = Math.max(...points, 1);
  const min = Math.min(...points);
  const span = Math.max(max - min, 1);
  const d = points
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i / (points.length - 1)) * 100} ${28 - ((v - min) / span) * 26}`)
    .join(' ');
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className={`r-sparkline ${className ?? ''}`} aria-hidden="true">
      <path d={d} pathLength={1} />
    </svg>
  );
}

/** Split-flap tile that flips from the mortal name to the goat name. */
export function SplitFlap({ from, to, delayMs }: { from: string; to: string; delayMs: number }) {
  const [flipped, setFlipped] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => {
      setFlipped(true);
      play('glitch');
    }, delayMs);
    return () => clearTimeout(t);
  }, [delayMs]);
  return (
    <span className={`r-flap ${flipped ? 'r-flap--flipped' : ''}`}>
      <span className="r-flap__from">{from}</span>
      <span className="r-flap__to">{to}</span>
    </span>
  );
}

/** A crack that draws itself across the viewport. */
export function Crack({ className }: { className?: string }) {
  return (
    <svg className={`r-crack ${className ?? ''}`} viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true">
      <path pathLength={1} d="M-10 180 L 140 210 L 205 170 L 320 260 L 410 235 L 470 300 L 560 280 L 610 350 L 720 330 L 790 420 L 900 400 L 1010 470" />
      <path pathLength={1} className="r-crack__branch" d="M320 260 L 300 330 L 340 380 M610 350 L 650 250 L 700 220 M790 420 L 760 520 L 800 610" />
    </svg>
  );
}

export function celebrate(): void {
  const colors = ['#f5c542', '#ffc857', '#19e3c9', '#d7263d', '#ffffff'];
  const shoot = (x: number) => void confetti({ particleCount: 120, spread: 100, startVelocity: 55, origin: { x, y: 0.7 }, colors, scalar: 1.2, disableForReducedMotion: true });
  shoot(0.2);
  shoot(0.8);
  setTimeout(() => shoot(0.5), 350);
  // Goat emoji confetti, because of course.
  try {
    const goat = confetti.shapeFromText({ text: '🐐', scalar: 3 });
    void confetti({ shapes: [goat], scalar: 3, particleCount: 40, spread: 160, startVelocity: 45, origin: { x: 0.5, y: 0.5 }, disableForReducedMotion: true });
  } catch {
    /* shapeFromText unsupported — plain confetti is fine */
  }
}
