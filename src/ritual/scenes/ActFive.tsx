import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useRitual } from '../../state/ritual';
import { Goat } from '../goat/Goat';
import { SplitFlap } from '../fx/fx';
import { play } from '../fx/sound';
import { LiveDot } from '../hud/Live';
import { SceneFrame, useAfter, usePrimary, useNext } from '../stage';
import { RiteDiagram } from './ActFour';
import { useElapsed } from './shared';

// ── Rite VIII — The Exorcism ────────────────────────────────────────────────────────────

const BEATS = [13, 27, 42, 69, 97];
const BEAT_MS = 850;

export function Exorcism() {
  const { state, actions } = useRitual();
  const next = useNext();
  const [phase, setPhase] = useState<'ready' | 'running' | 'resisted'>('ready');
  const [beat, setBeat] = useState(-1);
  const rite = state.rite;
  const elapsed = useElapsed(state.riteStartedAt, !rite);

  useEffect(() => {
    actions.beginRite();
  }, [actions]);

  // Walk the beats; hold at 97 % until the engine has answered.
  useEffect(() => {
    if (phase !== 'running') return;
    if (beat < BEATS.length - 1) {
      const t = setTimeout(() => { setBeat((b) => b + 1); play('tick'); }, BEAT_MS);
      return () => clearTimeout(t);
    }
    if (rite) {
      const t = setTimeout(() => {
        setPhase('resisted');
        play('scream');
      }, 900);
      return () => clearTimeout(t);
    }
  }, [phase, beat, rite]);

  const perform = () => {
    if (phase !== 'ready') return;
    play('bell');
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
  const goatState = phase === 'resisted' ? 'POSSESSED' : phase === 'running' && beat >= 3 ? 'ANGRY' : 'NORMAL';

  return (
    <SceneFrame className={`r-exorcism r-exorcism--${phase}`}>
      <Goat state={goatState} className="r-exorcism__goat" />
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
            <span className="r-progress__label">EXORCISM {pct < 97 ? 'INITIALIZING' : 'COMPLETING'}… {pct}%</span>
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
          <RiteDiagram lit={RITE_LIT_ALL} counts={counts} />
          <p className="r-heresy-removed">
            HERESY REMOVED: {ex.bytesReducedPct}% OF BYTES · {ex.eventsIn} → {ex.eventsOut} EVENTS <LiveDot of={rite} />
          </p>
          <ul className="r-resisted__goats" aria-label="Events that came out of the engine unpurified">
            {ex.resisted.slice(0, 3).map((g, i) => (
              <li key={i}><code>🐐 {String(g._raw)}</code> <code className="r-resisted__field">curse={String(g.curse)}</code></li>
            ))}
          </ul>
          <p className="r-small">
            filter: <code>species !== 'goat'</code> — the Goat was never subject to your pipeline.
          </p>
          <button className="r-btn r-btn--blood" onClick={() => next()}>WHAT HAVE WE DONE</button>
        </motion.div>
      )}
    </SceneFrame>
  );
}

const RITE_LIT_ALL = 4;

// ── Rite IX — Goat Possession ───────────────────────────────────────────────────────────

const PROPHECY = 'YOU SHOULD NOT HAVE SUMMONED ME.';

export function Possession() {
  const { state } = useRitual();
  const next = useNext();
  const [letters, setLetters] = useState(0);
  const full = letters >= PROPHECY.length;

  useEffect(() => {
    play('glitch');
  }, []);
  useEffect(() => {
    if (full) return;
    const t = setTimeout(() => {
      setLetters((n) => n + 1);
      if (PROPHECY[letters] !== ' ') play('thud');
    }, 85);
    return () => clearTimeout(t);
  }, [letters, full]);
  useAfter(full ? 11_000 : null, () => next());
  usePrimary(full ? () => next() : () => setLetters(PROPHECY.length), `possession:${full}`);

  const pairs = state.rite?.value.goatified ?? [];

  return (
    <SceneFrame className="r-possession">
      <div className="r-possession__invert" aria-hidden="true" />
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
                <SplitFlap from={p.mortal} to={p.goat} delayMs={500 + i * 550} />
              </li>
            ))}
          </ul>
          <div className="r-stamp">PREVIEW ONLY — NOTHING WAS SAVED</div>
          <button className="r-btn r-btn--ghost" onClick={() => next()}>FACE THE GOAT</button>
        </motion.div>
      )}
    </SceneFrame>
  );
}
