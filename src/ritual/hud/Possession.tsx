/* eslint-disable react/only-export-components */
import { useEffect, useState, type RefObject } from 'react';
import { HOVER_VARIANTS, playHover, type HoverVariant } from '../fx/sound';

// ── Possessed hover: every ritual button misbehaves in a random way, with a matching sound ──

const TARGETS = '.r-btn, .r-card-btn';
const SOUND_GAP_MS = 140;

export function useHoverPossession(rootRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let lastSound = 0;
    let previous: HoverVariant | null = null;

    const onOver = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>(TARGETS);
      if (!el || el.dataset.possessed || (e.relatedTarget instanceof Node && el.contains(e.relatedTarget))) return;
      // Never the same trick twice in a row.
      const choices = HOVER_VARIANTS.filter((v) => v !== previous);
      const variant = choices[Math.floor(Math.random() * choices.length)];
      previous = variant;
      el.dataset.possessed = variant;
      const now = performance.now();
      if (now - lastSound > SOUND_GAP_MS) {
        playHover(variant);
        lastSound = now;
      }
    };
    const onOut = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>(TARGETS);
      if (!el || (e.relatedTarget instanceof Node && el.contains(e.relatedTarget))) return;
      delete el.dataset.possessed;
    };

    root.addEventListener('pointerover', onOver);
    root.addEventListener('pointerout', onOut);
    return () => {
      root.removeEventListener('pointerover', onOver);
      root.removeEventListener('pointerout', onOut);
    };
  }, [rootRef]);
}

// ── Scroll guide: if the next button is below the fold, point at it (and take you there) ──

export function ScrollGuide({ rootRef, sceneKey }: { rootRef: RefObject<HTMLElement | null>; sceneKey: string }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const check = () => {
      const stages = rootRef.current?.querySelectorAll<HTMLElement>('.r-stage');
      const stage = stages?.[stages.length - 1];
      if (!stage || stage.scrollHeight <= stage.clientHeight + 8) {
        setTarget(null);
        return;
      }
      const limit = stage.getBoundingClientRect().bottom - 70; // leave room for the candle rail
      const buttons = [...stage.querySelectorAll<HTMLElement>('.r-btn')].filter((b) => b.offsetParent !== null);
      const hidden = buttons.find((b) => b.getBoundingClientRect().top > limit);
      const anyVisible = buttons.some((b) => {
        const r = b.getBoundingClientRect();
        return r.bottom > 0 && r.top < limit;
      });
      setTarget(hidden && !anyVisible ? hidden : null);
    };
    const first = window.setTimeout(check, 60);
    const id = window.setInterval(check, 400);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [rootRef, sceneKey]);

  if (!target) return null;
  return (
    <button className="r-scroll-guide" onClick={() => target.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
      <span aria-hidden="true">⬇</span> THE GOAT AWAITS BELOW <span aria-hidden="true">⬇</span>
    </button>
  );
}
