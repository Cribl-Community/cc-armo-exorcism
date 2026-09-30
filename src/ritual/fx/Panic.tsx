import { useEffect, useId, useMemo, useState } from 'react';
import { CHARACTERS } from '../characters/characters';
import { play } from './sound';
import './panic.css';

// Pure panic for the possession: a herd of goats stampeding in every direction, and the ghost of
// the (sacrificed) CEO drifting around the screen, wailing about the quarter.

const GHOST_LINES = ['My OKRs…', 'Who approved this?', 'I was only in the Emperor card!', 'BOOOOO-dget', 'Is this billable?', 'Tell the board I said… BAA'];

export function PanicLayer({ ghost = true }: { ghost?: boolean }) {
  const goats = useMemo(
    () =>
      Array.from({ length: 11 }, (_, i) => ({
        top: 6 + ((i * 37) % 82),
        duration: 2.6 + (i % 4) * 0.9,
        delay: (i * 0.53) % 3.2,
        toRight: i % 2 === 0,
        size: 1.5 + (i % 3) * 0.9,
        jump: i % 3 === 0,
      })),
    [],
  );
  return (
    <div className="r-panic" aria-hidden="true">
      {goats.map((g, i) => (
        <span
          key={i}
          className={`r-panic__goat ${g.toRight ? 'r-panic__goat--right' : 'r-panic__goat--left'} ${g.jump ? 'r-panic__goat--jump' : ''}`}
          style={{ top: `${g.top}%`, animationDuration: `${g.duration}s`, animationDelay: `${g.delay}s`, fontSize: `${g.size}rem` }}
        >
          <span className="r-panic__body">🐐</span>
          <span className="r-panic__dust">💨</span>
        </span>
      ))}
      {ghost && <CeoGhost />}
    </div>
  );
}

function CeoGhost() {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [line, setLine] = useState(0);
  const ceo = CHARACTERS.ceo;
  useEffect(() => {
    const first = window.setTimeout(() => play('boo'), 900);
    const id = window.setInterval(() => {
      setLine((n) => (n + 1) % GHOST_LINES.length);
      play('boo');
    }, 3400);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, []);
  return (
    <div className="r-ghost">
      <svg viewBox="0 0 100 124" className="r-ghost__body">
        <defs>
          <clipPath id={`face-${uid}`}>
            <circle cx="50" cy="42" r="27" />
          </clipPath>
        </defs>
        <path d="M10 52 C 10 20, 30 4, 50 4 C 70 4, 90 20, 90 52 L 90 112 L 78 102 L 66 116 L 54 102 L 42 116 L 30 102 L 18 116 L 10 106 Z" className="r-ghost__sheet" />
        <path d="M10 70 C -2 62, -4 50, 4 44" className="r-ghost__arm" />
        <path d="M90 70 C 102 62, 104 50, 96 44" className="r-ghost__arm r-ghost__arm--right" />
        {ceo.consent && <image href={ceo.image} x="20" y="12" width="60" height="68" preserveAspectRatio="xMidYMid slice" clipPath={`url(#face-${uid})`} className="r-ghost__face" />}
        <circle cx="50" cy="42" r="27" className="r-ghost__halo" />
      </svg>
      <span className="r-ghost__bubble">{GHOST_LINES[line]}</span>
    </div>
  );
}
