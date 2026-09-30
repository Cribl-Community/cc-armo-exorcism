import { useId, type CSSProperties, type ReactNode } from 'react';
import './panic.css';

const RUNES = 'IN NOMINE PATRIS · EXI, CAPER! · PURGATE TELEMETRIAM · DROP · MASK · EVAL · SAMPLING · ';
const CANDLE_ANGLES = [0, 60, 120, 180, 240, 300];

/** A rotating summoning circle — runes, a hexagram, orbiting candles — with the Goat inside. */
export function RitualCircle({ children, size = 'min(42vh, 34vw)' }: { children: ReactNode; size?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <div className="r-circle" style={{ '--circle-size': size } as CSSProperties}>
      <svg className="r-circle__runes" viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <path id={`runes-${uid}`} d="M50 50 m -44 0 a 44 44 0 1 1 88 0 a 44 44 0 1 1 -88 0" />
        </defs>
        <circle cx="50" cy="50" r="48" className="r-circle__ring" />
        <circle cx="50" cy="50" r="40" className="r-circle__ring" />
        <text><textPath href={`#runes-${uid}`}>{RUNES}</textPath></text>
      </svg>
      <svg className="r-circle__runes" viewBox="0 0 100 100" aria-hidden="true" style={{ animation: 'none' }}>
        <path className="r-circle__star" d="M50 12 L 83 69 L 17 69 Z M50 88 L 17 31 L 83 31 Z" />
      </svg>
      <div className="r-circle__candles" aria-hidden="true">
        {CANDLE_ANGLES.map((a) => (
          <span key={a} className="r-circle__candle" style={{ '--a': `${a}deg` } as CSSProperties}>🕯️</span>
        ))}
      </div>
      <div className="r-circle__goat">{children}</div>
    </div>
  );
}
