import { useEffect, useId, useRef, useState } from 'react';
import { useAnimate } from 'motion/react';
import './goat.css';

export type GoatState = 'NORMAL' | 'CURIOUS' | 'ANGRY' | 'POSSESSED' | 'HOLY' | 'SUPREME';

interface GoatProps {
  state: GoatState;
  /** Follow the pointer with head and pupils (always on for CURIOUS). */
  follow?: boolean;
  className?: string;
  /** Accessible description; defaults to the state. */
  label?: string;
}

const TILT_DEG = 11;

function usePointer(active: boolean): { x: number; y: number } {
  const [p, setP] = useState({ x: 0, y: 0 });
  useEffect(() => {
    if (!active) return;
    const onMove = (e: PointerEvent) => {
      setP({ x: (e.clientX / window.innerWidth) * 2 - 1, y: (e.clientY / window.innerHeight) * 2 - 1 });
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [active]);
  return active ? p : { x: 0, y: 0 };
}

function Eye({ cx, cy, rx, ry, look, fur, className }: { cx: number; cy: number; rx: number; ry: number; look: { x: number; y: number }; fur: string; className?: string }) {
  return (
    <g className={`goat__eye ${className ?? ''}`}>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} className="goat__iris" />
      <rect
        x={cx - rx * 0.55 + look.x * rx * 0.28}
        y={cy - ry * 0.2 + look.y * ry * 0.18}
        width={rx * 1.1}
        height={ry * 0.4}
        rx={ry * 0.2}
        className="goat__pupil"
      />
      <ellipse cx={cx - rx * 0.35} cy={cy - ry * 0.35} rx={rx * 0.14} ry={ry * 0.14} className="goat__glint" />
      <ellipse cx={cx} cy={cy} rx={rx + 1.5} ry={ry + 1.5} className="goat__lid" fill={fur} style={{ transformOrigin: `${cx}px ${cy - ry}px` }} />
    </g>
  );
}

export function Goat({ state, follow = false, className, label }: GoatProps) {
  const look = usePointer(follow || state === 'CURIOUS');
  const tilt = state === 'CURIOUS' ? look.x * TILT_DEG : 0;
  const pupils = state === 'HOLY' ? { x: 0, y: 0 } : look;
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const id = (name: string) => `${name}-${uid}`;
  const url = (name: string) => `url(#${id(name)})`;
  const fur = url('fur');

  // A little pop whenever the Goat's mood changes.
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const prev = useRef(state);
  useEffect(() => {
    if (prev.current !== state && scope.current) {
      void animate(scope.current, { scale: [0.9, 1.04, 1] }, { duration: 0.45, ease: 'easeOut' });
    }
    prev.current = state;
  }, [state, animate, scope]);

  return (
    <div
      ref={scope}
      className={`goat ${className ?? ''}`}
      data-state={state}
      role="img"
      aria-label={label ?? `The Goat (${state.toLowerCase()})`}
    >
      <svg viewBox="0 0 512 512" className="goat__svg">
        <defs>
          <radialGradient id={id('aura')} cx="50%" cy="52%" r="50%">
            <stop offset="0%" className="goat__aura-core" />
            <stop offset="100%" className="goat__aura-edge" />
          </radialGradient>
          <linearGradient id={id('fur')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" className="goat__fur-top" />
            <stop offset="100%" className="goat__fur-bottom" />
          </linearGradient>
          <linearGradient id={id('horn')} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" className="goat__horn-base" />
            <stop offset="100%" className="goat__horn-tip" />
          </linearGradient>
          <filter id={id('glow')} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <circle cx="256" cy="270" r="250" fill={url('aura')} className="goat__aura" />

        <g className="goat__rings">
          <ellipse cx="256" cy="280" rx="235" ry="60" />
          <ellipse cx="256" cy="280" rx="200" ry="48" />
        </g>

        <ellipse cx="256" cy="86" rx="112" ry="22" className="goat__halo" filter={url('glow')} />

        <g className="goat__head" style={{ transform: `rotate(${tilt}deg)`, transformOrigin: '256px 300px', transition: 'transform 350ms ease-out' }}>
          {/* Horns */}
          <path className="goat__horn" fill={url('horn')} d="M206 152 C 172 72, 98 36, 58 92 C 96 68, 150 90, 181 172 Z" />
          <path className="goat__horn" fill={url('horn')} d="M306 152 C 340 72, 414 36, 454 92 C 416 68, 362 90, 331 172 Z" />
          <g className="goat__ridges">
            <path d="M178 118 l 18 -12 M160 98 l 16 -14 M138 82 l 12 -14" />
            <path d="M334 118 l -18 -12 M352 98 l -16 -14 M374 82 l -12 -14" />
          </g>
          <g className="goat__flames" filter={url('glow')}>
            <path d="M58 92 C 40 70, 54 44, 44 20 C 70 40, 80 58, 72 84 C 84 70, 90 58, 88 44 C 102 66, 92 92, 58 92 Z" />
            <path d="M454 92 C 472 70, 458 44, 468 20 C 442 40, 432 58, 440 84 C 428 70, 422 58, 424 44 C 410 66, 420 92, 454 92 Z" />
          </g>

          {/* Crown (SUPREME) */}
          <path className="goat__crown" d="M190 156 L 198 104 L 226 136 L 256 88 L 286 136 L 314 104 L 322 156 Z" filter={url('glow')} />

          {/* Ears */}
          <path className="goat__ear" fill={fur} d="M176 214 C 120 188, 68 204, 48 232 C 90 244, 142 242, 182 238 Z" />
          <path className="goat__ear" fill={fur} d="M336 214 C 392 188, 444 204, 464 232 C 422 244, 370 242, 330 238 Z" />
          <path className="goat__ear-inner" d="M168 220 C 128 206, 92 214, 76 230 C 106 236, 140 234, 170 232 Z" />
          <path className="goat__ear-inner" d="M344 220 C 384 206, 420 214, 436 230 C 406 236, 372 234, 342 232 Z" />

          {/* Face */}
          <path className="goat__face" fill={fur} d="M256 136 C 324 136 354 188 347 250 C 342 306 318 362 292 400 C 280 418 232 418 220 400 C 194 362 170 306 165 250 C 158 188 188 136 256 136 Z" />
          <path className="goat__tuft" d="M226 150 C 236 128, 250 140, 256 124 C 262 140, 276 128, 286 150 C 272 146, 262 156, 256 150 C 250 156, 240 146, 226 150 Z" />
          <path className="goat__blaze" d="M256 170 C 270 220, 272 300, 262 346 L 250 346 C 240 300, 242 220, 256 170 Z" />

          {/* Brows (ANGRY / POSSESSED) */}
          <g className="goat__brows">
            <path d="M184 222 L 238 238" />
            <path d="M328 222 L 274 238" />
          </g>

          {/* Eyes */}
          <Eye cx={212} cy={254} rx={25} ry={17} look={pupils} fur={fur} />
          <Eye cx={300} cy={254} rx={25} ry={17} look={pupils} fur={fur} />
          <g className="goat__extra-eyes">
            <Eye cx={256} cy={176} rx={13} ry={9} look={pupils} fur={fur} className="goat__eye--x1" />
            <Eye cx={218} cy={206} rx={11} ry={8} look={pupils} fur={fur} className="goat__eye--x2" />
            <Eye cx={294} cy={206} rx={11} ry={8} look={pupils} fur={fur} className="goat__eye--x3" />
            <Eye cx={256} cy={216} rx={9} ry={6} look={pupils} fur={fur} className="goat__eye--x4" />
          </g>

          {/* Muzzle */}
          <ellipse className="goat__muzzle" cx="256" cy="372" rx="47" ry="35" />
          <ellipse className="goat__nostril" cx="239" cy="364" rx="7" ry="4.5" transform="rotate(-20 239 364)" />
          <ellipse className="goat__nostril" cx="273" cy="364" rx="7" ry="4.5" transform="rotate(20 273 364)" />
          <path className="goat__mouth" d="M234 390 Q 256 404 278 390" />
          <ellipse className="goat__mouth-open" cx="256" cy="396" rx="17" ry="13" />

          {/* Beard */}
          <path className="goat__beard" d="M236 408 C 238 450, 250 482, 258 494 C 266 480, 274 450, 276 408 C 264 414, 248 414, 236 408 Z" />
        </g>

        <g className="goat__sparkles">
          <path d="M96 150 l 6 16 l 16 6 l -16 6 l -6 16 l -6 -16 l -16 -6 l 16 -6 Z" />
          <path d="M420 330 l 5 12 l 12 5 l -12 5 l -5 12 l -5 -12 l -12 -5 l 12 -5 Z" />
          <path d="M404 120 l 4 10 l 10 4 l -10 4 l -4 10 l -4 -10 l -10 -4 l 10 -4 Z" />
        </g>
      </svg>
      <span className="goat__question" aria-hidden="true">?</span>
    </div>
  );
}
