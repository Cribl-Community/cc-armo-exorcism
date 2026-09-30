import { useEffect, useState, useSyncExternalStore } from 'react';
import { motion } from 'motion/react';
import { Button, Card, Text } from '@capra/core';
import { useRitual } from '../../state/ritual';
import { scripture, summarizeScripture } from '../../cribl/client';
import type { FinalChoice, Sourced } from '../../cribl/types';
import { Goat, type GoatState } from '../goat/Goat';
import { CHARACTERS } from '../characters/characters';
import { celebrate } from '../fx/fx';
import { play } from '../fx/sound';
import { LiveDot } from '../hud/Live';
import { SceneFrame, useAfter, usePrimary, useNext } from '../stage';
import { formatCount, incidentTicket, pipelineOffering } from './shared';

// ── Rite X — The Final Button ───────────────────────────────────────────────────────────

const FLEES = 5;

export function FinalButton() {
  const { actions } = useRitual();
  const next = useNext();
  const [runFlees, setRunFlees] = useState(0);
  const [runPos, setRunPos] = useState({ x: 0, y: 0 });
  const [calm, setCalm] = useState<'idle' | 'lulling' | 'refused'>('idle');
  const runGaveUp = runFlees >= FLEES;
  const [goat, setGoat] = useState<GoatState>('POSSESSED');

  const choose = (c: FinalChoice) => actions.recordFinalChoice(c);
  const summon = () => {
    choose('summon');
    play('rumble');
    next();
  };
  usePrimary(summon, 'final');

  const flee = () => {
    if (runGaveUp) return;
    choose('run');
    play('tick');
    setRunFlees((n) => n + 1);
    const angle = Math.random() * Math.PI * 2;
    setRunPos({ x: Math.cos(angle) * (18 + Math.random() * 14), y: Math.sin(angle) * (10 + Math.random() * 8) });
  };

  const lull = () => {
    if (calm !== 'idle') return;
    choose('calm');
    setCalm('lulling');
    setGoat('HOLY');
    play('lullaby');
  };
  useAfter(calm === 'lulling' ? 3900 : null, () => {
    setCalm('refused');
    setGoat('ANGRY');
    play('bleat');
  });

  return (
    <SceneFrame className="r-final">
      <Goat state={goat} className="r-final__goat" />
      <h1 className="r-title r-title--md">{calm === 'lulling' ? 'THE GOAT IS LISTENING…' : calm === 'refused' ? 'THE GOAT REFUSES TO BE CALMED.' : 'CHOOSE.'}</h1>
      <div className="r-final__choices">
        {calm === 'refused' ? (
          <button className="r-btn r-btn--gold" onClick={summon}>🐐 SUMMON THE GOAT</button>
        ) : (
          <button className="r-btn r-btn--ghost r-btn--small" onClick={lull} disabled={calm === 'lulling'}>🧘 CALM THE GOAT</button>
        )}
        <button className="r-btn r-btn--summon" onClick={summon}>
          <span className="r-btn__glow" aria-hidden="true" />
          🐐 SUMMON THE GOAT
        </button>
        {runGaveUp ? (
          <button className="r-btn r-btn--gold" onClick={summon}>🐐 SUMMON THE GOAT</button>
        ) : (
          <motion.button
            className="r-btn r-btn--ghost r-btn--small"
            animate={{ x: `${runPos.x}vw`, y: `${runPos.y}vh` }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            onPointerEnter={flee}
            onFocus={flee}
            onClick={flee}
          >
            🏃 RUN
          </motion.button>
        )}
      </div>
    </SceneFrame>
  );
}

// ── Rite XI — The Great Goat Awakening ──────────────────────────────────────────────────

export function Awakening() {
  const next = useNext();
  const [beat, setBeat] = useState(0);
  useEffect(() => {
    play('scream');
    const t = setTimeout(() => { celebrate(); play('choir'); setBeat(1); }, 1300);
    return () => clearTimeout(t);
  }, []);
  useAfter(beat === 1 ? 2200 : null, () => setBeat(2));
  usePrimary(beat === 2 ? () => next() : () => setBeat(2), `awakening:${beat}`);

  return (
    <SceneFrame className="r-awakening">
      <div className="r-rays r-rays--gold" aria-hidden="true" />
      <motion.div initial={{ scale: 3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.3, ease: 'easeOut' }} className="r-awakening__goat-wrap">
        <Goat state={beat === 0 ? 'SUPREME' : 'HOLY'} className="r-awakening__goat" label="The Goat, awakened" />
      </motion.div>
      {beat >= 1 && (
        <motion.h1 className="r-title r-title--gold" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
          🐐 THE GOAT HAS AWAKENED
        </motion.h1>
      )}
      {beat >= 2 && (
        <motion.div className="r-center-stack" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p className="r-kicker">EMOTIONAL OBSERVABILITY ACHIEVED™</p>
          <button className="r-btn r-btn--gold" onClick={() => next()}>READ THE INCIDENT REPORT</button>
        </motion.div>
      )}
    </SceneFrame>
  );
}

// ── Rite XII — Goat Incident Report ─────────────────────────────────────────────────────

function Row({ label, value, of, strong }: { label: string; value: string; of?: Sourced<unknown>; strong?: boolean }) {
  return (
    <tr className={strong ? 'r-report__strong' : undefined}>
      <th scope="row">{label}</th>
      <td>{value} <LiveDot of={of} /></td>
    </tr>
  );
}

export function Report() {
  const { state, actions } = useRitual();
  const next = useNext();
  const entries = useSyncExternalStore(scripture.subscribe, scripture.getSnapshot);
  const s = summarizeScripture(entries);
  const ex = state.rite?.value.exorcism;
  const book = state.book?.value;
  usePrimary(() => next(), 'report');
  useEffect(() => {
    play('thud');
  }, []);

  const sacrifice = state.sacrifice ?? 'ceo';
  const sacrificeText = sacrifice === 'pipeline' ? `The Pipeline “${pipelineOffering(state.census?.pipelines.value)}”` : sacrifice === 'ceo' ? `${CHARACTERS.ceo.name} (now on a spiritual retreat 🧘)` : '1 GB of logs';
  const ceoShare = book && book.believers > 0 ? Math.round((100 * book.sacrifices.ceo) / Math.max(1, book.sacrifices.ceo + book.sacrifices.pipeline + book.sacrifices.logs)) : null;
  const [ticket] = useState(() => incidentTicket(state.soulNumber));
  const offered = state.totals?.value.events ?? 0;

  return (
    <SceneFrame className="r-report">
      <motion.article className="r-parchment" initial={{ y: 60, opacity: 0, rotate: -1 }} animate={{ y: 0, opacity: 1, rotate: -0.6 }} transition={{ type: 'spring', stiffness: 80 }}>
        <header className="r-parchment__head">
          <h1>GOAT INCIDENT REPORT</h1>
          <span className="r-parchment__ticket">{ticket}</span>
        </header>
        <table className="r-report__table">
          <tbody>
            <Row label="Incident" value="Demonic Telemetry Possession" />
            <Row label="Witnessed by" value={state.judge?.value.name ?? 'MORTAL'} of={state.judge} />
            <Row label="Architect" value={CHARACTERS.arno.name} />
            <Row label="Forbidden Engineer" value={`${CHARACTERS.moise.name} (absent)`} />
            <Row label="High Priestess" value={CHARACTERS.priestess.name} />
            <Row label="Sacrifice" value={sacrificeText} />
            <Row label="Events Offered (24 h)" value={offered > 0 ? formatCount(offered) : '0 — the Goat is starving'} of={state.totals} />
            <Row label="Events Processed by the Cribl Engine" value={ex ? String(ex.eventsIn) : '—'} of={state.rite} />
            <Row label="Events Purified" value={ex ? String(ex.purified) : '—'} of={state.rite} />
            <Row label="Heresy Removed" value={ex ? `${ex.bytesReducedPct}% of bytes` : '—'} of={state.rite} />
            <Row label="Goats That Resisted" value={ex ? String(ex.resisted.length) : '—'} of={state.rite} />
            <Row label="Pipelines Possessed" value={String(state.census?.pipelines.value.length ?? 0)} of={state.census?.pipelines} />
            <Row label="Destinations Sanctified" value={String(state.census?.destinations.value.length ?? 0)} of={state.census?.destinations} />
            <Row label="Exorcisms" value="1" />
            <Row label="Goats Summoned" value="1" />
            <Row label="Production Systems Destroyed" value={String(s.configMutations)} strong />
            <Row label="Emotional Observability" value="100%" />
            {book && book.believers > 0 && (
              <Row label="Souls Converted to Date" value={`${book.believers}${ceoShare !== null ? ` · ${ceoShare}% sacrificed the CEO` : ''}`} of={state.book} />
            )}
          </tbody>
        </table>
        <p className="r-parchment__status">🐐 GOAT: SATISFIED</p>
        <div className="r-seal" aria-hidden="true">🐐</div>
        <p className="r-parchment__footer">NO PRODUCTION SYSTEMS WERE HARMED.</p>
      </motion.article>
      <div className="r-report__actions">
        <button className="r-btn r-btn--gold" onClick={() => next()}>📜 VIEW THE SCRIPTURE</button>
        <button className="r-btn r-btn--ghost" onClick={() => actions.restart()}>↺ BEGIN AGAIN</button>
      </div>
    </SceneFrame>
  );
}

// ── The Reveal — what the Goat actually did ─────────────────────────────────────────────

export function Reveal() {
  const { state, actions } = useRitual();
  const entries = useSyncExternalStore(scripture.subscribe, scripture.getSnapshot);
  const s = summarizeScripture(entries);
  const ex = state.rite?.value.exorcism;
  usePrimary(() => actions.restart(), 'reveal');

  const engineReal = Boolean(state.rite && !state.rite.simulated);
  const facts: Array<[string, string]> = [
    ['Cribl API calls', state.demo ? `${s.simulated} (simulated)` : String(s.calls)],
    ['Cribl engine runs (pipeline preview)', engineReal ? `${s.engineRuns} · ${((state.rite?.value.ms ?? 0) / 1000).toFixed(1)} s` : state.rite ? '1 (emulated)' : '0'],
    ['Events processed by the engine', ex ? String(ex.eventsIn + (state.rite?.value.goatified.length ?? 0)) : '—'],
    ['Heresy removed', ex ? `${ex.bytesReducedPct}% of bytes` : '—'],
    ['KV writes (Book of Offerings)', String(s.kvWrites)],
    ['Blocked attempts', String(s.blocked)],
    ['Config mutations', String(s.configMutations)],
  ];

  return (
    <SceneFrame className="r-reveal">
      <div className="r-reveal__card">
        <Card>
          <Card.Header>
            <Card.Title variant="heading-lg">What the Goat actually did.</Card.Title>
            <Card.Description>
              {state.demo ? 'Performed from memory: these are the calls live mode would make.' : `Live, on Cribl ${state.leader?.value.version ?? ''} · Worker Group ${state.group?.value.chosen ?? ''}`}
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <dl className="r-reveal__facts">
              {facts.map(([k, v]) => (
                <div key={k} className="r-reveal__fact">
                  <dt><Text variant="body-sm-normal" color="subtle">{k}</Text></dt>
                  <dd><Text variant="metric-md">{v}</Text></dd>
                </div>
              ))}
            </dl>
            <Text as="h3" variant="heading-xs">Pipeline functions executed</Text>
            <p className="r-reveal__functions">comment · drop · mask · eval · sampling · eval ×3 · rename</p>
            <Text as="h3" variant="heading-xs">Endpoints the Goat touched</Text>
            <ul className="r-reveal__endpoints">
              {s.endpoints.map((e) => <li key={e}><code>✓ {e}</code></li>)}
              {s.endpoints.length === 0 && <li><Text variant="body-sm-normal" color="subtle">None: performed from memory.</Text></li>}
            </ul>
            <Text as="p" variant="body-sm-normal" color="subtle">
              Built on the Cribl App Platform: a sandboxed iframe app, the platform fetch proxy, least-privilege
              policies.yml (read + preview only) and the app-scoped KV store.
            </Text>
          </Card.Content>
          <Card.Footer>
            <Button variant="secondary" onClick={() => actions.patch({ scriptureOpen: true })}>Open the Scripture</Button>
            <Button variant="primary" onClick={() => actions.restart()}>Begin again</Button>
          </Card.Footer>
        </Card>
      </div>
    </SceneFrame>
  );
}
