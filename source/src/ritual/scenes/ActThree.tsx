import { useEffect, useState } from 'react';
import { Card, Text } from '@capra/core';
import { useRitual } from '../../state/ritual';
import type { HeresyItem, RouteInfo, Sourced } from '../../cribl/types';
import { play } from '../fx/sound';
import { LiveDot } from '../hud/Live';
import { usePrimary, useNext } from '../stage';
import { formatBytes, formatCount, incidentTicket } from './shared';

// ── Rite V — Incident Response ──────────────────────────────────────────────────────────
// A SOC screen that makes sense in five seconds: one sentence, four pieces of evidence, the
// heresy, where the Goat travels, and one button. Real Capra components over the real census.

/** Every few seconds a number is briefly possessed and reads 666. */
function usePossessedNumber(value: string, seed: number): string {
  const [possessed, setPossessed] = useState(false);
  useEffect(() => {
    let off = 0;
    const id = window.setInterval(() => {
      setPossessed(true);
      off = window.setTimeout(() => setPossessed(false), 280);
    }, 3200 + seed * 900);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(off);
    };
  }, [seed]);
  return possessed ? value.replace(/\d/g, '6') : value;
}

function Evidence({ emoji, sacred, meaning, value, of, seed }: { emoji: string; sacred: string; meaning: string; value: string; of?: Sourced<unknown>; seed: number }) {
  const shown = usePossessedNumber(value, seed);
  return (
    <div className="r-incident__kpi">
      <Card>
        <Card.Content>
          <div className="r-evidence">
            <span className="r-evidence__emoji" aria-hidden="true">{emoji}</span>
            <span className="r-evidence__body">
              <Text variant="body-sm-semibold" color="subtle">{sacred}</Text>
              <span className="r-evidence__value"><Text variant="metric-lg">{shown}</Text> <LiveDot of={of} /></span>
              <Text variant="body-sm-normal" color="subtle">{meaning}</Text>
            </span>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}

function RouteChains({ routes }: { routes: RouteInfo[] }) {
  const shown = routes.filter((r) => !r.disabled && r.pipeline).slice(0, 3);
  if (shown.length === 0) return <Text variant="body-sm-normal" color="subtle">The Goat has no routes. It walks where it wants.</Text>;
  return (
    <ol className="r-chains">
      {shown.map((r, i) => (
        <li key={r.name + i} className="r-chain">
          <code>{r.name}</code>
          <span className="r-chain__arrow" aria-hidden="true">🐾</span>
          <code className="r-chain__pipe">{r.pipeline}</code>
          <span className="r-chain__arrow" aria-hidden="true">🐾</span>
          <code>{r.output}</code>
        </li>
      ))}
    </ol>
  );
}

export function Incident() {
  const { state, actions } = useRitual();
  const next = useNext();
  const c = state.census;
  const totals = state.totals;

  const statusHeresy: HeresyItem[] = [
    ...(c?.sources.value ?? []).filter((s) => s.health === 'Red' || s.health === 'Yellow').map((s): HeresyItem => ({ kind: 'source', title: s.id, severity: s.health === 'Red' ? 'Red' : 'Yellow' })),
    ...(c?.destinations.value ?? []).filter((s) => s.health === 'Red' || s.health === 'Yellow').map((s): HeresyItem => ({ kind: 'destination', title: s.id, severity: s.health === 'Red' ? 'Red' : 'Yellow' })),
  ];
  const leaderHeresy: HeresyItem[] = (state.leader?.value.messages ?? [])
    .filter((m) => m.severity === 'error')
    .map((m) => ({ kind: 'leader', title: m.title, severity: 'Red' }));
  const seen = new Set<string>();
  const heresy = [...statusHeresy, ...(state.inputHeresy?.value ?? []), ...leaderHeresy]
    .filter((h) => !seen.has(h.title) && seen.add(h.title))
    .slice(0, 4);

  const summon = () => {
    play('bell');
    actions.beginRite();
    next();
  };
  usePrimary(summon, 'incident');

  const [incidentId] = useState(() => incidentTicket(state.soulNumber));
  const scroll = state.scrolls?.value[0];
  const kindLabel = { source: 'source', destination: 'destination', leader: 'the Leader' } as const;

  return (
    <section className="r-scene r-incident">
      <div className="r-siren" role="alert">
        <span className="r-siren__title">🚨 DEMONIC TELEMETRY INCIDENT · SEV-GOAT</span>
        <span className="r-siren__meta">Commander: 🐐 The Goat (self-appointed) · Status: getting worse · {incidentId}</span>
      </div>

      <h1 className="r-incident__headline">
        Your Cribl is possessed. <span className="r-incident__sub">Here is the evidence.</span>
      </h1>

      <div className="r-incident__grid">
        <Evidence seed={0} emoji="🐐" sacred="OFFERINGS" value={totals ? formatCount(totals.value.events) : '…'} meaning="events the Goat ate in 24 h" of={totals} />
        <Evidence seed={1} emoji="⛽" sacred="GOAT FUEL" value={totals ? formatBytes(totals.value.bytes) : '…'} meaning="of data it digested" of={totals} />
        <Evidence seed={2} emoji="🕯️" sacred="SACRED PIPELINES" value={c ? String(c.pipelines.value.length) : '…'} meaning="pipelines now chanting" of={c?.pipelines} />
        <Evidence seed={3} emoji="⛪" sacred="HOLY DESTINATIONS" value={c ? String(c.destinations.value.length) : '…'} meaning="places it can reach" of={c?.destinations} />

        <div className="r-incident__heresy">
          <Card>
            <Card.Header>
              <Card.Title variant="heading-xs">😈 HERESY DETECTED</Card.Title>
              <Card.Description>Things that are not OK, rated in goats <LiveDot of={state.inputHeresy} /></Card.Description>
            </Card.Header>
            <Card.Content>
              {heresy.length === 0 ? (
                <Text as="p" variant="body-md-semibold">No heresy detected. Suspicious.</Text>
              ) : (
                <ul className="r-heresy-list">
                  {heresy.map((h) => (
                    <li key={h.kind + h.title}>
                      <span className="r-heresy-list__goats" aria-label={h.severity === 'Red' ? 'critical' : 'warning'}>{h.severity === 'Red' ? '🐐🐐🐐' : '🐐'}</span>
                      <Text variant="body-sm-normal">{h.title}</Text>
                      <Text variant="body-xs-normal" color="subtle">{kindLabel[h.kind]}</Text>
                    </li>
                  ))}
                </ul>
              )}
            </Card.Content>
          </Card>
        </div>

        <div className="r-incident__routing">
          <Card>
            <Card.Header>
              <Card.Title variant="heading-xs">🗺️ WHERE THE GOAT TRAVELS</Card.Title>
              <Card.Description>Route → Sacred Pipeline → Holy Destination <LiveDot of={c?.routes} /></Card.Description>
            </Card.Header>
            <Card.Content>
              <RouteChains routes={c?.routes.value ?? []} />
            </Card.Content>
          </Card>
        </div>
      </div>

      <div className="r-ticker" aria-live="polite">
        <span className="r-ticker__label">📜 OVERHEARD IN CRIBL'S LOGS <LiveDot of={state.scrolls} /></span>
        <span className="r-ticker__text">
          {scroll ? `“${scroll.message}”` : state.scrolls ? 'Silence. The logs refuse to speak.' : 'Listening at the door…'}
        </span>
      </div>

      <div className="r-incident__action">
        <button className="r-btn r-btn--blood" onClick={summon}>🛠️ SUMMON THE BUILDERS</button>
      </div>
    </section>
  );
}
