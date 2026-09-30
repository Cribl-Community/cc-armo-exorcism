import { useState } from 'react';
import { motion } from 'motion/react';
import { useRitual } from '../../state/ritual';
import { Goat, type GoatState } from '../goat/Goat';
import { TarotCard } from '../characters/TarotCard';
import { CHARACTERS } from '../characters/characters';
import { CountUp, Glitch, Sparkline, corrupt } from '../fx/fx';
import { Particles } from '../fx/Particles';
import { play } from '../fx/sound';
import { LiveDot } from '../hud/Live';
import { SceneFrame, useAfter, usePrimary, useNext } from '../stage';
import { SACRIFICE_NAME, formatBytes, pipelineOffering } from './shared';

// ── Rite III — The Sacrifice ────────────────────────────────────────────────────────────

export function Sacrifice() {
  const { state } = useRitual();
  const next = useNext();
  const [phase, setPhase] = useState<'altar' | 'offering' | 'pleased'>('altar');
  const totals = state.totals;
  const events = totals?.value.events ?? 0;
  const starving = Boolean(totals && !totals.simulated && events === 0);
  const series = state.series?.value ?? [];
  const peak = Math.max(...series, 1);
  const lastRate = series.length ? series[series.length - 1] / peak : 0.5;

  const sacrifice = () => {
    if (phase !== 'altar') return;
    play('rumble');
    setPhase('offering');
  };
  const finish = () => {
    setPhase('pleased');
    play(starving ? 'scream' : 'choir');
  };
  usePrimary(phase === 'altar' ? sacrifice : phase === 'pleased' ? () => next() : null, `sacrifice:${phase}`);
  useAfter(phase === 'offering' && starving ? 1800 : null, finish);

  const chosen = state.sacrifice ?? 'ceo';
  const ceo = CHARACTERS.ceo;
  const goatState: GoatState = phase === 'pleased' ? (starving ? 'ANGRY' : 'HOLY') : phase === 'offering' ? 'CURIOUS' : 'NORMAL';

  return (
    <SceneFrame className={`r-sacrifice r-sacrifice--${phase}`}>
      {phase === 'offering' && !starving && <Particles mode="river" rate={60 + 240 * lastRate} target={{ x: 0.5, y: 0.34 }} className="r-sacrifice__river" />}
      <Goat state={goatState} className="r-sacrifice__goat" />

      {phase === 'altar' && (
        <>
          <h1 className="r-title">THE GOAT DEMANDS AN OFFERING.</h1>
          <div className="r-altar">
            <div className="r-altar__card">
              {chosen === 'ceo'
                ? <TarotCard arcana="IV" title={ceo.name} subtitle={ceo.title} image={ceo.image} consent={ceo.consent} glyph={ceo.glyph} hue={ceo.hue} />
                : chosen === 'pipeline'
                  ? <TarotCard arcana="VII" title="THE PIPELINE" subtitle={pipelineOffering(state.census?.pipelines.value)} glyph="📡" hue="teal" />
                  : <TarotCard arcana="IX" title="1 GB OF LOGS" subtitle="lightly used" glyph="📦" hue="blood" />}
            </div>
            <div className="r-altar__stone" />
          </div>
          <button className="r-btn r-btn--blood r-btn--huge" onClick={sacrifice}>SACRIFICE</button>
        </>
      )}

      {phase !== 'altar' && (
        <div className="r-offering">
          <motion.div className="r-offering__burn" initial={{ opacity: 1, scale: 1 }} animate={{ opacity: 0, scale: 0.4, filter: 'blur(8px) brightness(3)' }} transition={{ duration: 1.4 }}>
            <span className="r-offering__ember">🔥</span>
          </motion.div>
          <p className="r-counter">
            {phase === 'offering' && !starving ? <CountUp to={events} onDone={finish} /> : events.toLocaleString('en-US')}
            <LiveDot of={totals} />
          </p>
          <p className="r-counter__label">OFFERINGS RECEIVED · LAST 24 HOURS</p>
          {!starving && totals && <p className="r-counter__sub">GOAT FUEL: {formatBytes(totals.value.bytes)}</p>}
          {!starving && series.length > 1 && (
            <div className="r-offering__spark">
              <Sparkline points={series} />
              <span className="r-small">the last hour, minute by minute <LiveDot of={state.series} /></span>
            </div>
          )}
          {phase === 'pleased' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="r-center-stack">
              {starving ? (
                <>
                  <h2 className="r-title r-title--md">YOUR TELEMETRY IS SUSPICIOUSLY QUIET.</h2>
                  <h2 className="r-title r-title--blood">THE GOAT IS STARVING.</h2>
                </>
              ) : (
                <h2 className="r-title r-title--gold">THE GOAT IS PLEASED.</h2>
              )}
              <button className="r-btn r-btn--ghost" onClick={() => next()}>CONTINUE</button>
            </motion.div>
          )}
        </div>
      )}
    </SceneFrame>
  );
}

// ── Rite IV — The Revelation ────────────────────────────────────────────────────────────

export function Revelation() {
  const { state } = useRitual();
  const next = useNext();
  const [beat, setBeat] = useState(0);
  useAfter(beat === 0 ? 1300 : null, () => setBeat(1));
  useAfter(beat === 1 ? 2300 : null, () => { setBeat(2); play('glitch'); });
  useAfter(beat === 2 ? 7000 : null, () => next());
  usePrimary(beat < 2 ? () => setBeat(2) : () => next(), `revelation:${beat}`);

  const sources = (state.census?.sources.value ?? []).slice(0, 4);
  const rows = (sources.length ? sources : [{ id: 'syslog:in_syslog', type: 'syslog' }]).map((s, i) => ({
    normal: `${s.id}  sourcetype=${s.type}  status=200  msg="all good"`,
    corrupted: corrupt(`${s.id}  sourcetype=${s.type}  status=200  msg="all good"`, 2),
    demonic: `${s.id}  sourcetype=hellfire:${s.type}  status=666  msg="${['IT HUNGERS', 'BAAAAA', 'SEND MORE LOGS', 'THE GOAT SEES'][i % 4]}"`,
  }));
  const sacrificed = SACRIFICE_NAME[state.sacrifice ?? 'ceo'];

  return (
    <SceneFrame className={`r-revelation r-revelation--${beat}`}>
      {beat === 0 && <h1 className="r-title r-title--huge">WAIT.</h1>}
      {beat === 1 && <h1 className="r-title">THE {sacrificed} WAS NOT THE DEMON.</h1>}
      {beat === 2 && (
        <>
          <Glitch text="THE DEMON IS INSIDE CRIBL." className="r-title r-title--blood" />
          <div className="r-corruption">
            {(['normal', 'corrupted', 'demonic'] as const).map((k, i) => (
              <motion.div key={k} className={`r-corruption__panel r-corruption__panel--${k}`} initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.7 }}>
                <span className="r-corruption__label">{k === 'normal' ? 'NORMAL TELEMETRY' : k === 'corrupted' ? 'CORRUPTED TELEMETRY' : 'DEMONIC TELEMETRY'}{k === 'normal' && <LiveDot of={state.census?.sources} />}</span>
                {rows.map((r, j) => <code key={j}>{r[k]}</code>)}
              </motion.div>
            ))}
          </div>
          <button className="r-btn r-btn--blood" onClick={() => next()}>INVESTIGATE</button>
        </>
      )}
    </SceneFrame>
  );
}
