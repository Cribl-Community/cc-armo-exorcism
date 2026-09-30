import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Card, CustomTooltipTrigger, Skeleton, Text, Tooltip } from '@capra/core';
import { useRitual } from '../../state/ritual';
import type { Sacrifice, Sourced } from '../../cribl/types';
import { Goat } from '../goat/Goat';
import { TarotCard } from '../characters/TarotCard';
import { CHARACTERS } from '../characters/characters';
import { Crack } from '../fx/fx';
import { play, unlockAudio } from '../fx/sound';
import { LiveDot } from '../hud/Live';
import { SceneFrame, useAfter, usePrimary, useNext } from '../stage';
import { formatBytes, formatCount, pipelineOffering } from './shared';

// ── Rite 0 — The Façade ──────────────────────────────────────────────────────────────────
// A sober, legitimate Capra overview with real KPIs… for about three seconds.

function Kpi({ label, value, of }: { label: string; value?: string; of?: Sourced<unknown> }) {
  return (
    <div className="r-facade__kpi">
    <Card>
      <Card.Header>
        <Card.Title variant="body-sm-semibold">{label}</Card.Title>
      </Card.Header>
      <Card.Content>
        {value === undefined ? <Skeleton /> : (
          <span className="r-facade__value">
            <Text variant="metric-lg">{value}</Text> <LiveDot of={of} />
          </span>
        )}
      </Card.Content>
    </Card>
    </div>
  );
}

export function Facade() {
  const { state } = useRitual();
  const next = useNext();
  const [phase, setPhase] = useState<'calm' | 'eye' | 'crack' | 'fall'>('calm');
  const c = state.census;

  // Wait for data (max ~3.5 s), then the eye opens, the page cracks and falls into darkness.
  useAfter(state.environmentReady ? 2600 : 3800, () => setPhase((p) => (p === 'calm' ? 'eye' : p)));
  useEffect(() => {
    if (phase === 'eye') {
      const t = setTimeout(() => { setPhase('crack'); play('rumble'); }, 900);
      return () => clearTimeout(t);
    }
    if (phase === 'crack') {
      const t = setTimeout(() => setPhase('fall'), 900);
      return () => clearTimeout(t);
    }
    if (phase === 'fall') {
      const t = setTimeout(() => next(), 900);
      return () => clearTimeout(t);
    }
  }, [phase, next]);

  const skip = () => {
    unlockAudio();
    setPhase((p) => (p === 'calm' || p === 'eye' ? 'crack' : p));
  };
  usePrimary(skip, 'facade');

  return (
    <div className={`r-facade r-facade--${phase}`} onClick={skip} role="presentation">
      <div className="r-facade__page">
        <header className="r-facade__header">
          <Text as="h1" variant="heading-lg">Telemetry Health Overview</Text>
          <Text as="p" variant="body" color="subtle">
            Worker Group {state.group?.value.chosen ?? '…'} · last 24 hours
          </Text>
        </header>
        <div className="r-facade__grid">
          <Kpi label="Events (24h)" value={state.totals && formatCount(state.totals.value.events)} of={state.totals} />
          <Kpi label="Bytes (24h)" value={state.totals && formatBytes(state.totals.value.bytes)} of={state.totals} />
          <div className="r-facade__eye-host">
            <Kpi label="Pipelines" value={c && String(c.pipelines.value.length)} of={c?.pipelines} />
            <svg className="r-facade__eye" viewBox="0 0 120 60" aria-hidden="true">
              <path d="M5 30 Q 60 -8 115 30 Q 60 68 5 30 Z" className="r-facade__eye-white" />
              <ellipse cx="60" cy="30" rx="17" ry="17" className="r-facade__eye-iris" />
              <rect x="44" y="26" width="32" height="8" rx="4" className="r-facade__eye-pupil" />
            </svg>
          </div>
          <Kpi label="Destinations" value={c && String(c.destinations.value.length)} of={c?.destinations} />
        </div>
        <Text as="p" variant="body-sm-normal" color="subtle">All systems nominal.</Text>
      </div>
      {(phase === 'crack' || phase === 'fall') && <Crack />}
      <span className="r-facade__hint">click anywhere</span>
    </div>
  );
}

// ── Rite I — The Invitation ─────────────────────────────────────────────────────────────

export function Invitation() {
  const { state, actions } = useRitual();
  const next = useNext();
  const [soul, setSoul] = useState(false);
  const judge = state.judge?.value;

  const believe = () => {
    if (soul) return;
    unlockAudio();
    play('bleat');
    actions.recordBelief();
    setSoul(true);
  };
  usePrimary(soul ? null : believe, `invitation:${soul}`);
  useAfter(soul ? 1900 : null, () => next());

  return (
    <SceneFrame className="r-invitation">
      <Goat state="CURIOUS" className="r-invitation__goat" />
      <div className="r-invitation__copy">
        <h1 className="r-title">DO YOU BELIEVE IN THE GOAT?</h1>
        <motion.p className="r-whisper" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 1.2 }}>
          WE HAVE BEEN EXPECTING YOU, {(judge?.name ?? 'MORTAL').toUpperCase()}. <LiveDot of={state.judge} />
        </motion.p>
        <div className="r-invitation__choices">
          <button className="r-btn r-btn--gold" onClick={believe}>YES</button>
          <Tooltip title="NO was sacrificed in v0.0.1.">
            <CustomTooltipTrigger>
              <span className="r-invitation__no-gap" tabIndex={0} role="note" aria-label="NO was sacrificed in v0.0.1." />
            </CustomTooltipTrigger>
          </Tooltip>
          <button className="r-btn r-btn--gold" onClick={believe}>YES</button>
        </div>
        <p className="r-small">There is no other option.</p>
      </div>
      {soul && (
        <motion.div className="r-overlay-line" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
          {state.soulNumber ? `YOU ARE SOUL #${state.soulNumber}.` : 'YOUR SOUL HAS BEEN RECORDED.'}
        </motion.div>
      )}
    </SceneFrame>
  );
}

// ── Rite II — The Prophecy ──────────────────────────────────────────────────────────────

const OFFERINGS: Array<{ id: Sacrifice; arcana: string; glyph: string; hue: 'gold' | 'teal' | 'blood'; title: string }> = [
  { id: 'ceo', arcana: 'IV', glyph: '👔', hue: 'gold', title: 'THE CEO' },
  { id: 'pipeline', arcana: 'VII', glyph: '📡', hue: 'teal', title: 'THE PIPELINE' },
  { id: 'logs', arcana: 'IX', glyph: '📦', hue: 'blood', title: '1 GB OF LOGS' },
];

export function Prophecy() {
  const { state, actions } = useRitual();
  const next = useNext();
  const [beat, setBeat] = useState(0);
  const [chosen, setChosen] = useState<Sacrifice | null>(null);
  useAfter(beat === 0 ? 2200 : null, () => setBeat(1));
  useAfter(beat === 1 ? 2400 : null, () => { setBeat(2); play('thud'); });
  useAfter(chosen ? 900 : null, () => next());

  const choose = (s: Sacrifice) => {
    if (chosen) return;
    play('bell');
    setChosen(s);
    actions.recordSacrifice(s);
  };
  usePrimary(beat < 2 ? () => setBeat(2) : chosen ? null : () => choose('ceo'), `prophecy:${beat}:${chosen}`);

  const ceo = CHARACTERS.ceo;
  const pipe = pipelineOffering(state.census?.pipelines.value);

  return (
    <SceneFrame className="r-prophecy">
      {beat < 2 ? (
        <motion.div key={beat} className="r-center-stack" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="r-kicker">🐐 THE GOAT HAS SPOKEN</p>
          {beat === 1 && <h1 className="r-title r-title--blood">A DEMON HAS INFECTED YOUR TELEMETRY.</h1>}
        </motion.div>
      ) : (
        <>
          <h1 className="r-title">AN OFFERING IS REQUIRED.</h1>
          <div className="r-prophecy__cards">
            {OFFERINGS.map((o, i) => (
              <motion.button
                key={o.id}
                className={`r-card-btn ${chosen === o.id ? 'r-card-btn--chosen' : ''} ${chosen && chosen !== o.id ? 'r-card-btn--rejected' : ''}`}
                onClick={() => choose(o.id)}
                initial={{ opacity: 0, y: 80, rotate: (i - 1) * 8 }}
                animate={{ opacity: 1, y: 0, rotate: (i - 1) * 4 }}
                transition={{ delay: i * 0.15, type: 'spring', stiffness: 120 }}
                whileHover={{ y: -18, rotate: 0, scale: 1.04 }}
                aria-label={`Sacrifice ${o.title}`}
              >
                {o.id === 'ceo' ? (
                  <TarotCard arcana={o.arcana} title={ceo.name} subtitle={ceo.title} image={ceo.image} consent={ceo.consent} glyph={ceo.glyph} hue={ceo.hue} costume={ceo.costume} />
                ) : o.id === 'pipeline' ? (
                  <TarotCard arcana={o.arcana} title="THE PIPELINE" subtitle={pipe} glyph={o.glyph} hue={o.hue} />
                ) : (
                  <TarotCard arcana={o.arcana} title="1 GB OF LOGS" subtitle="lightly used" glyph={o.glyph} hue={o.hue}>
                    <span className="r-leak" aria-hidden="true">{'ERROR WARN INFO DEBUG '.repeat(6)}</span>
                  </TarotCard>
                )}
              </motion.button>
            ))}
          </div>
        </>
      )}
    </SceneFrame>
  );
}
