import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { motion } from 'motion/react';
import { useRitual } from '../../state/ritual';
import { Goat, type GoatState } from '../goat/Goat';
import { CharacterCard } from '../characters/TarotCard';
import { CHARACTERS } from '../characters/characters';
import { SplitFlap } from '../fx/fx';
import { PanicLayer } from '../fx/Panic';
import { RitualCircle } from '../fx/RitualCircle';
import { play, startTension, type Tension } from '../fx/sound';
import { duckAmbient, playLayer, stopTrack } from '../fx/tracks';
import { LiveDot } from '../hud/Live';
import { SceneFrame, useAfter, usePrimary, useNext } from '../stage';
import { RiteDiagram } from './ActFour';
import { useElapsed } from './shared';

// ── Rite VIII — The Exorcism ────────────────────────────────────────────────────────────
// The High Priestess performs the rite around the Goat while the real engine run completes.
// Tension builds with every beat: faster circle, brighter beam, darker room, quicker heartbeat.

const BEATS = [13, 27, 42, 69, 97];
const TENSION = [0.15, 0.35, 0.55, 0.8, 1];
const BEAT_MS = 1150;
const CHANTS = ['IN NOMINE PATRIS', 'EXI, CAPER!', 'PURGATE TELEMETRIAM', 'DROP THE HERESY', 'MASK THE SECRETS', 'SAMPLE THE SINNERS', 'BAA-NISH!'];

function useChantWords(active: boolean): Array<{ id: number; text: string }> {
  const [words, setWords] = useState<Array<{ id: number; text: string }>>([]);
  const n = useRef(0);
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => {
      n.current += 1;
      const word = { id: n.current, text: CHANTS[n.current % CHANTS.length] };
      setWords((ws) => [...ws.slice(-3), word]);
    }, 900);
    return () => window.clearInterval(id);
  }, [active]);
  return active ? words : [];
}

export function Exorcism() {
  const { state, actions } = useRitual();
  const next = useNext();
  const [phase, setPhase] = useState<'ready' | 'running' | 'resisted'>('ready');
  const [beat, setBeat] = useState(-1);
  const rite = state.rite;
  const elapsed = useElapsed(state.riteStartedAt, !rite);
  const tension = useRef<Tension | null>(null);
  const words = useChantWords(phase !== 'resisted');

  useEffect(() => {
    actions.beginRite();
    return () => {
      tension.current?.stop();
      stopTrack('chant', 300);
      duckAmbient(false);
    };
  }, [actions]);

  // Walk the beats; each one tightens the screws. Hold at 97 % until the engine has answered.
  useEffect(() => {
    if (phase !== 'running') return;
    tension.current?.set(TENSION[Math.max(0, beat)]);
    if (beat === BEATS.length - 1) play('violin');
    if (beat < BEATS.length - 1) {
      const t = setTimeout(() => { setBeat((b) => b + 1); play('tick'); }, BEAT_MS);
      return () => clearTimeout(t);
    }
    if (rite) {
      const t = setTimeout(() => {
        // The Goat breaks the rite: silence, a scream, and the Priestess is thrown out of the circle.
        tension.current?.stop();
        stopTrack('chant', 80);
        playLayer('scream', 1);
        playLayer('scream', 0.72, 0.7);
        play('whoosh');
        duckAmbient(false);
        setPhase('resisted');
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [phase, beat, rite]);

  const perform = () => {
    if (phase !== 'ready') return;
    play('bell');
    tension.current = startTension();
    setPhase('running');
    setBeat(0);
  };
  usePrimary(phase === 'ready' ? perform : phase === 'resisted' ? () => next() : null, `exorcism:${phase}`);

  const ex = rite?.value.exorcism;
  const stage = (id: string) => ex?.stages.find((s) => s.id === id);
  const counts: Record<string, string> | undefined = ex && beat >= 0 ? {
    banish: `${stage('banish')?.eventsIn} → ${stage('banish')?.eventsOut} · ${stage('banish')?.touched} banished`,
    seal: `${stage('seal')?.touched} secrets sealed`,
    anoint: `${stage('anoint')?.touched} anointed`,
    tithe: `${stage('tithe')?.eventsIn} → ${stage('tithe')?.eventsOut} · ${stage('tithe')?.touched} tithed`,
  } : undefined;
  const pct = beat >= 0 ? BEATS[beat] : 0;
  const level = phase === 'running' ? TENSION[Math.max(0, beat)] : phase === 'resisted' ? 1 : 0;
  const goatState: GoatState = phase === 'resisted' ? 'POSSESSED' : phase === 'running' && beat >= 3 ? 'ANGRY' : phase === 'running' ? 'CURIOUS' : 'NORMAL';

  return (
    <SceneFrame className={`r-exorcism r-exorcism--${phase}`}>
      <div className="r-exorcism__stage" style={{ '--tension': level } as CSSProperties} data-tension={Math.round(level * 3)}>
        <div className="r-exorcism__dread" aria-hidden="true" />
        <div className="r-exorcism__altar">
          <motion.div
            className="r-caster"
            animate={phase === 'resisted' ? { x: '-60vw', y: '-30vh', rotate: -540, scale: 0.5, opacity: 0 } : { x: 0, rotate: 0 }}
            transition={phase === 'resisted' ? { duration: 1.1, ease: 'easeIn' } : { duration: 0.3 }}
          >
            <CharacterCard character={CHARACTERS.priestess} />
            {phase !== 'resisted' && <span className="r-beam" aria-hidden="true" />}
            {words.map((w) => <span key={w.id} className="r-caster__word" aria-hidden="true">{w.text}</span>)}
          </motion.div>
          <RitualCircle size={phase === 'resisted' ? 'min(24vh, 22vw)' : 'min(40vh, 32vw)'}>
            <Goat state={goatState} className="r-exorcism__goat" follow={phase === 'ready'} />
          </RitualCircle>
        </div>

        {phase === 'ready' && (
          <>
            <RiteDiagram />
            <button className="r-btn r-btn--gold r-btn--huge" onClick={perform}>PERFORM EXORCISM</button>
          </>
        )}

        {phase === 'running' && (
          <>
            <RiteDiagram lit={beat} counts={counts} />
            <div className="r-progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <div className="r-progress__bar" style={{ width: `${pct}%` }} />
              <span className="r-progress__label">EXORCISM {pct < 97 ? 'IN PROGRESS' : 'ALMOST…'} {pct}%</span>
            </div>
            {beat === BEATS.length - 1 && !rite && (
              <p className="r-engine-status" role="status">Waiting for the Cribl engine… {(elapsed / 1000).toFixed(1)} s</p>
            )}
          </>
        )}

        {phase === 'resisted' && ex && (
          <motion.div className="r-resisted" initial={{ opacity: 0, scale: 1.2 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }}>
            <div className="r-error" role="alert">
              <span className="r-error__code">ERROR</span>
              <span className="r-error__text">THE GOAT RESISTED.</span>
            </div>
            <p className="r-heresy-removed">
              HERESY REMOVED: {ex.bytesReducedPct}% OF BYTES · {ex.eventsIn} → {ex.eventsOut} EVENTS <LiveDot of={rite} />
            </p>
            <ul className="r-resisted__goats" aria-label="Events that came out of the engine unpurified">
              {ex.resisted.slice(0, 2).map((g, i) => (
                <li key={i}><code>🐐 {String(g._raw)}</code> <code className="r-resisted__field">curse={String(g.curse)}</code></li>
              ))}
            </ul>
            <p className="r-small">
              filter: <code>species !== 'goat'</code>: the Goat was never subject to your pipeline.
            </p>
            <button className="r-btn r-btn--blood" onClick={() => next()}>WHAT HAVE WE DONE</button>
          </motion.div>
        )}
      </div>
    </SceneFrame>
  );
}

// ── Rite IX — Goat Possession ───────────────────────────────────────────────────────────

const PROPHECY = 'YOU SHOULD NOT HAVE SUMMONED ME.';

export function Possession() {
  const { state } = useRitual();
  const next = useNext();
  const [letters, setLetters] = useState(0);
  const full = letters >= PROPHECY.length;

  useEffect(() => {
    stopTrack('chant', 200);
    play('rumble');
    playLayer('scream', 0.6, 0.8);
  }, []);
  useEffect(() => {
    if (full) return;
    const t = setTimeout(() => {
      setLetters((n) => n + 1);
      if (PROPHECY[letters] !== ' ') play('thud');
    }, 85);
    return () => clearTimeout(t);
  }, [letters, full]);
  useAfter(full ? 12_000 : null, () => next());
  usePrimary(full ? () => next() : () => setLetters(PROPHECY.length), `possession:${full}`);

  const pairs = state.rite?.value.goatified ?? [];

  return (
    <SceneFrame className="r-possession">
      <div className="r-possession__invert" aria-hidden="true" />
      {full && <PanicLayer />}
      <Goat state="SUPREME" className="r-possession__goat" label="The Supreme Goat" />
      <h1 className="r-title r-title--blood r-possession__prophecy" aria-label={PROPHECY}>
        {PROPHECY.slice(0, letters)}<span className="r-caret" aria-hidden="true">▌</span>
      </h1>
      {full && (
        <motion.div className="r-board" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
          <div className="r-board__head">
            <span>YOUR CRIBL, GOATIFIED</span>
            <LiveDot of={state.rite} />
          </div>
          <ul className="r-board__rows">
            {pairs.map((p, i) => (
              <li key={p.kind + p.mortal} className="r-board__row">
                <span className="r-board__kind">{p.kind}</span>
                {/* Every replaced name gets its own screaming goat, each at a different pitch. */}
                <SplitFlap from={p.mortal} to={p.goat} delayMs={500 + i * 650} onFlip={() => playLayer('scream', 0.8 + ((i * 0.23) % 0.8), 0.55)} />
              </li>
            ))}
          </ul>
          <div className="r-stamp">PREVIEW ONLY: NOTHING WAS SAVED</div>
          <button className="r-btn r-btn--ghost" onClick={() => next()}>FACE THE GOAT</button>
        </motion.div>
      )}
    </SceneFrame>
  );
}
