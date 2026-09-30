import type { ComponentType } from 'react';

// The costume layer drawn over each portrait, so the cast reads as ritual characters rather than
// profile pictures. Coordinates are in the card-face box (100 × 114.3, the 0.875 face aspect) and
// were placed against the processed images in public/assets/characters/.

export type CostumeKind = 'architect' | 'engineer' | 'emperor' | 'priestess';

const FACE_H = 114.3;

function Architect() {
  // Glowing blueprint grid in the sky, a telemetry orbit around the head, a floating set square.
  return (
    <>
      <g className="costume__blueprint">
        {[8, 16, 24].map((y) => <line key={`h${y}`} x1="0" y1={y} x2="100" y2={y} />)}
        {[10, 30, 50, 70, 90].map((x) => <line key={`v${x}`} x1={x} y1="0" x2={x} y2="28" />)}
        <path d="M8 22 h16 v-10 h14" className="costume__trace" />
        <rect x="70" y="6" width="18" height="10" rx="1.5" className="costume__node" />
        <text x="79" y="13" className="costume__label" textAnchor="middle">PIPE</text>
      </g>
      <g className="costume__orbit">
        <ellipse cx="44" cy="37" rx="34" ry="6" transform="rotate(-12 44 37)" />
        <circle cx="11" cy="45" r="1.8" className="costume__mote" />
        <circle cx="77" cy="29" r="1.5" className="costume__mote" />
      </g>
      <text x="86" y="34" className="costume__glyph">📐</text>
    </>
  );
}

function Engineer() {
  // Forbidden cables from the corners, terminal rain at the edges, and a very official seal.
  return (
    <>
      <g className="costume__rain">
        {['F', '0', 'R', '1', 'B', '0', 'I', 'D'].map((c, i) => <text key={`l${i}`} x="3" y={14 + i * 10}>{c}</text>)}
        {['D', '3', 'N', '1', 'E', 'D', '0', '1'].map((c, i) => <text key={`r${i}`} x="93" y={18 + i * 10}>{c}</text>)}
      </g>
      <g className="costume__cables">
        <path d="M-2 114 C 10 90, 2 70, 14 58 S 20 34, 8 22" />
        <path d="M102 114 C 88 96, 98 76, 86 62 S 80 40, 94 28" />
        <rect x="4" y="16" width="8" height="6" rx="1" className="costume__plug" />
        <rect x="90" y="22" width="8" height="6" rx="1" className="costume__plug" />
      </g>
      <g className="costume__seal" transform="rotate(-14 80 98)">
        <rect x="62" y="92" width="36" height="11" rx="1.5" />
        <text x="80" y="100" textAnchor="middle">FORBIDDEN</text>
      </g>
    </>
  );
}

function Emperor() {
  // A golden crown whose points are a bar chart. Up and to the right, obviously.
  return (
    <g className="costume__crown" transform="translate(46 23) scale(1.35) translate(-46 -23)">
      <path d="M31 21 L 31 12 L 37 12 L 37 16 L 43 16 L 43 8 L 49 8 L 49 13 L 55 13 L 55 4 L 61 4 L 61 21 Z" />
      <path d="M29 21 H 64 V 24 H 29 Z" className="costume__crown-band" />
      <circle cx="40" cy="22.5" r="1.1" className="costume__jewel" />
      <circle cx="47" cy="22.5" r="1.1" className="costume__jewel costume__jewel--teal" />
      <circle cx="54" cy="22.5" r="1.1" className="costume__jewel" />
      <path d="M58 2 l 6 -1 l -1 6" className="costume__arrow" />
    </g>
  );
}

function Priestess() {
  // A halo, a soft pillar of purifying light, and a few sparks.
  return (
    <>
      <g className="costume__rays">
        {[-30, -15, 0, 15, 30].map((a) => <path key={a} d="M50 26 L 44 -4 L 56 -4 Z" transform={`rotate(${a} 50 26)`} />)}
      </g>
      <ellipse cx="50" cy="27" rx="24" ry="5" className="costume__halo" />
      <g className="costume__sparks">
        <path d="M12 40 l 1.5 4 l 4 1.5 l -4 1.5 l -1.5 4 l -1.5 -4 l -4 -1.5 l 4 -1.5 Z" />
        <path d="M88 52 l 1.2 3.2 l 3.2 1.2 l -3.2 1.2 l -1.2 3.2 l -1.2 -3.2 l -3.2 -1.2 l 3.2 -1.2 Z" />
        <path d="M80 16 l 1 2.6 l 2.6 1 l -2.6 1 l -1 2.6 l -1 -2.6 l -2.6 -1 l 2.6 -1 Z" />
      </g>
    </>
  );
}

const PARTS: Record<CostumeKind, ComponentType> = {
  architect: Architect,
  engineer: Engineer,
  emperor: Emperor,
  priestess: Priestess,
};

export function Costume({ kind }: { kind: CostumeKind }) {
  const Part = PARTS[kind];
  return (
    <svg className={`costume costume--${kind}`} viewBox={`0 0 100 ${FACE_H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <Part />
    </svg>
  );
}
