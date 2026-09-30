import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useRitual } from '../../state/ritual';
import { CharacterCard } from '../characters/TarotCard';
import { CHARACTERS } from '../characters/characters';
import { play, type Cue } from '../fx/sound';
import { duckAmbient, playTrack, stopTrack } from '../fx/tracks';
import { SceneFrame, useAfter, usePrimary, useNext } from '../stage';
import { RITE_NODES, useElapsed } from './shared';

// ── Rite VI — The Builders Appear ───────────────────────────────────────────────────────

const DIALOGUE: Array<{ who: 'arno' | 'moise'; line: string; ms: number; sound: Cue }> = [
  { who: 'arno', line: 'I think I know what happened.', ms: 1900, sound: 'babbleLow' },
  { who: 'moise', line: 'Don’t touch anything.', ms: 1700, sound: 'babbleHigh' },
  { who: 'arno', line: 'I already touched it.', ms: 1900, sound: 'babbleLow' },
  { who: 'moise', line: '…', ms: 2600, sound: 'crickets' },
];

export function Builders() {
  const next = useNext();
  const [step, setStep] = useState(-1);
  const done = step >= DIALOGUE.length;
  const moiseLeft = step >= DIALOGUE.length + 1;

  useAfter(step === -1 ? 900 : null, () => setStep(0));
  useEffect(() => {
    if (step < 0 || moiseLeft) return;
    const ms = done ? 2200 : DIALOGUE[step].ms;
    const t = setTimeout(() => setStep((s) => s + 1), ms);
    return () => clearTimeout(t);
  }, [step, done, moiseLeft]);
  // Foley: the cards slam down, each line gets a voice, "…" gets crickets, and Moïse gets yeeted.
  useEffect(() => {
    stopTrack('chant', 600); // coming back from the Priestess: silence her
    const a = setTimeout(() => play('slam'), 520);
    const b = setTimeout(() => play('slam'), 800);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, []);
  useEffect(() => {
    if (step >= 0 && step < DIALOGUE.length) play(DIALOGUE[step].sound);
    if (step === DIALOGUE.length) play('bell');
    if (step === DIALOGUE.length + 1) play('yeet');
  }, [step]);

  usePrimary(moiseLeft ? () => next() : () => setStep((s) => Math.min(s + 1, DIALOGUE.length + 1)), `builders:${step}`);
  const line = !done && step >= 0 ? DIALOGUE[step] : null;

  return (
    <SceneFrame className="r-builders">
      <div className="r-builders__cast">
        <motion.div
          className={`r-builders__slot ${step === 2 ? 'r-builders__slot--guilty' : ''}`}
          initial={{ y: '-120vh', rotate: -8 }}
          animate={{ y: 0, rotate: -3 }}
          transition={{ type: 'spring', stiffness: 90, damping: 11 }}
        >
          {step === 2 && <span className="r-sweat" aria-hidden="true">💦</span>}
          <CharacterCard character={CHARACTERS.arno} size="lg" />
          <AnimatePresence>{line?.who === 'arno' && <Bubble key={step} text={line.line} side="left" />}</AnimatePresence>
        </motion.div>
        <motion.div
          className="r-builders__slot"
          initial={{ y: '-120vh', rotate: 8 }}
          animate={moiseLeft ? { x: '130vw', y: '-40vh', rotate: 720, scale: 0.4 } : { y: 0, rotate: 3 }}
          transition={moiseLeft ? { duration: 1.2, ease: 'easeIn' } : { type: 'spring', stiffness: 90, damping: 11, delay: 0.25 }}
        >
          <CharacterCard character={CHARACTERS.moise} size="lg" />
          <AnimatePresence>{line?.who === 'moise' && <Bubble key={step} text={line.line} side="right" />}</AnimatePresence>
        </motion.div>
      </div>
      {done && (
        <motion.div className="r-center-stack" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="r-title r-title--md">THE BUILDERS MUST PERFORM THE EXORCISM.</h1>
          {moiseLeft && (
            <>
              <p className="r-whisper">The Forbidden Engineer has left the ritual.</p>
              <button className="r-btn r-btn--gold" onClick={() => next()}>CALL FOR HELP</button>
            </>
          )}
        </motion.div>
      )}
    </SceneFrame>
  );
}

function Bubble({ text, side }: { text: string; side: 'left' | 'right' }) {
  return (
    <motion.p
      className={`r-bubble r-bubble--${side}`}
      initial={{ opacity: 0, scale: 0.6, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 18 }}
    >
      {text}
    </motion.p>
  );
}

// ── Rite VII — The High Priestess of Telemetry ──────────────────────────────────────────

export function RiteDiagram({ lit = -1, counts }: { lit?: number; counts?: Record<string, string> }) {
  return (
    <ol className="r-rite" aria-label="The exorcism pipeline">
      <li className="r-rite__end r-rite__end--demon">😈<span>DEMON EVENTS</span></li>
      {RITE_NODES.map((n, i) => (
        <li key={n.id} className={`r-rite__node ${i <= lit ? 'r-rite__node--lit' : ''}`}>
          <span className="r-rite__glyph" aria-hidden="true">{n.glyph}</span>
          <span className="r-rite__label">{n.label}</span>
          <code className="r-rite__func">{n.func}</code>
          {counts?.[n.id] && <span className="r-rite__count">{counts[n.id]}</span>}
        </li>
      ))}
      <li className={`r-rite__end r-rite__end--clean ${lit >= RITE_NODES.length ? 'r-rite__end--lit' : ''}`}>😇<span>CLEAN TELEMETRY</span></li>
    </ol>
  );
}

export function Priestess() {
  const { state, actions } = useRitual();
  const next = useNext();
  useEffect(() => {
    // "In Nomine Patris" carries the healing through the exorcism; the background ducks under it.
    duckAmbient(true);
    playTrack('chant');
    // If the judge jumped here directly (← / hotkeys), make sure the rite has begun.
    actions.beginRite();
  }, [actions]);
  usePrimary(() => next(), 'priestess');
  const elapsed = useElapsed(state.riteStartedAt, !state.rite);

  return (
    <SceneFrame className="r-priestess">
      <div className="r-rays" aria-hidden="true" />
      <motion.div initial={{ y: 120, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1.4, ease: 'easeOut' }}>
        <CharacterCard character={CHARACTERS.priestess} size="lg" />
      </motion.div>
      <h1 className="r-title r-title--md">✨ THE HIGH PRIESTESS WILL PURIFY THE TELEMETRY.</h1>
      <RiteDiagram />
      <p className="r-engine-status" role="status">
        {state.rite
          ? state.rite.simulated
            ? state.demo ? 'The rite was prepared from memory.' : `The rite was prepared from memory: ${state.rite.reason}.`
            : `The Cribl engine has prepared the rite (${(state.rite.value.ms / 1000).toFixed(1)} s).`
          : `The Cribl engine is already working on your offerings… ${(elapsed / 1000).toFixed(1)} s`}
      </p>
      <button className="r-btn r-btn--gold" onClick={() => next()}>PREPARE THE RITE</button>
    </SceneFrame>
  );
}
