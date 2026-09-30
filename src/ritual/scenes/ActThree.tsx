import { useState } from 'react';
import { Card, Pill, Text } from '@capra/core';
import { useRitual } from '../../state/ritual';
import type { HeresyItem, RouteInfo, Sourced } from '../../cribl/types';
import { play } from '../fx/sound';
import { LiveDot } from '../hud/Live';
import { usePrimary, useNext } from '../stage';
import { formatBytes, formatCount, incidentTicket } from './shared';

// ── Rite V — Incident Response ──────────────────────────────────────────────────────────
// The tone snaps to a sober SOC screen: genuine Capra components over the real census.

function Kpi({ label, sacred, value, of }: { label: string; sacred: string; value: string; of?: Sourced<unknown> }) {
  return (
    <div className="r-incident__kpi">
      <Card>
        <Card.Header>
          <Card.Title variant="heading-xs">{sacred}</Card.Title>
          <Card.Description>{label}</Card.Description>
        </Card.Header>
        <Card.Content>
          <span className="r-incident__value"><Text variant="metric-xl">{value}</Text> <LiveDot of={of} /></span>
        </Card.Content>
      </Card>
    </div>
  );
}

function RoutingGraph({ routes }: { routes: RouteInfo[] }) {
  const shown = routes.filter((r) => !r.disabled).slice(0, 5);
  const pipelines = [...new Set(shown.map((r) => r.pipeline))];
  const outputs = [...new Set(shown.map((r) => r.output))];
  const rowY = (i: number, n: number) => 30 + (i * 240) / Math.max(n - 1, 1);
  const y = (list: string[], v: string) => rowY(list.indexOf(v), list.length);
  return (
    <svg className="r-routing" viewBox="0 0 720 300" role="img" aria-label="Routes to pipelines to destinations">
      {shown.map((r, i) => (
        <g key={r.name + i}>
          <path className="r-routing__edge" d={`M 200 ${rowY(i, shown.length)} C 260 ${rowY(i, shown.length)}, 250 ${y(pipelines, r.pipeline)}, 300 ${y(pipelines, r.pipeline)}`} />
          <path className="r-routing__edge" d={`M 460 ${y(pipelines, r.pipeline)} C 510 ${y(pipelines, r.pipeline)}, 500 ${y(outputs, r.output)}, 560 ${y(outputs, r.output)}`} />
        </g>
      ))}
      {shown.map((r, i) => <Node key={`r${i}`} x={10} y={rowY(i, shown.length)} label={r.name} caption="rite of routing" />)}
      {pipelines.map((p, i) => <Node key={`p${i}`} x={300} y={rowY(i, pipelines.length)} label={p} caption="sacred pipeline" accent />)}
      {outputs.map((o, i) => <Node key={`o${i}`} x={560} y={rowY(i, outputs.length)} label={o} caption="holy destination" />)}
    </svg>
  );
}

function Node({ x, y, label, caption, accent }: { x: number; y: number; label: string; caption: string; accent?: boolean }) {
  const w = accent ? 160 : 150;
  return (
    <g transform={`translate(${x} ${y - 20})`} className={`r-routing__node ${accent ? 'r-routing__node--accent' : ''}`}>
      <rect width={w} height="40" rx="8" />
      <text x={w / 2} y="18" textAnchor="middle" className="r-routing__label">{label.length > 20 ? `${label.slice(0, 19)}…` : label}</text>
      <text x={w / 2} y="33" textAnchor="middle" className="r-routing__caption">{caption}</text>
    </g>
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
    .slice(0, 6);

  const summon = () => {
    play('bell');
    actions.beginRite();
    next();
  };
  usePrimary(summon, 'incident');

  const sources = (c?.sources.value ?? []).slice(0, 8);
  const [incidentId] = useState(() => incidentTicket(state.soulNumber));

  return (
    <section className="r-scene r-incident">
      <div className="r-siren" role="alert">
        <span>🚨 DEMONIC TELEMETRY INCIDENT — SEV-0 (GOAT)</span>
        <span className="r-siren__id">{incidentId}</span>
      </div>
      <div className="r-incident__grid">
        <Kpi sacred="OFFERINGS" label="Events, last 24 h" value={totals ? formatCount(totals.value.events) : '…'} of={totals} />
        <Kpi sacred="GOAT FUEL" label="Bytes, last 24 h" value={totals ? formatBytes(totals.value.bytes) : '…'} of={totals} />
        <Kpi sacred="SACRED PIPELINES" label="Pipelines" value={c ? String(c.pipelines.value.length) : '…'} of={c?.pipelines} />
        <Kpi sacred="HOLY DESTINATIONS" label="Destinations" value={c ? String(c.destinations.value.length) : '…'} of={c?.destinations} />

        <div className="r-incident__heresy">
          <Card>
            <Card.Header>
              <Card.Title variant="heading-xs">HERESY</Card.Title>
              <Card.Description>Unhealthy sources, destinations and Leader errors</Card.Description>
            </Card.Header>
            <Card.Content>
              {heresy.length === 0 ? (
                <Text as="p" variant="body-md-semibold">No heresy detected. Suspicious.</Text>
              ) : (
                <ul className="r-heresy-list">
                  {heresy.map((h) => (
                    <li key={h.kind + h.title}>
                      <Pill appearance={h.severity === 'Red' ? 'danger' : 'warning'} variant="muted">{h.kind}</Pill>
                      <Text variant="body-sm-normal">{h.title}</Text>
                    </li>
                  ))}
                </ul>
              )}
              {totals && totals.value.dropped > 0 && (
                <Text as="p" variant="body-sm-normal" color="subtle">{formatCount(totals.value.dropped)} offerings dropped in 24 h</Text>
              )}
              <span className="r-incident__sigils"><LiveDot of={state.inputHeresy} /><LiveDot of={state.leader} /></span>
            </Card.Content>
          </Card>
        </div>

        <div className="r-incident__routing">
          <Card>
            <Card.Header>
              <Card.Title variant="heading-xs">SACRED ROUTING</Card.Title>
              <Card.Description>Routes → pipelines → destinations</Card.Description>
            </Card.Header>
            <Card.Content>
              <RoutingGraph routes={c?.routes.value ?? []} />
              <LiveDot of={c?.routes} />
            </Card.Content>
          </Card>
        </div>

        <div className="r-incident__sources">
          <Card>
            <Card.Header>
              <Card.Title variant="heading-xs">ALTARS</Card.Title>
              <Card.Description>Sources <LiveDot of={c?.sources} /></Card.Description>
            </Card.Header>
            <Card.Content>
              <table className="r-table">
                <thead><tr><th>Source</th><th>Type</th><th>Health</th></tr></thead>
                <tbody>
                  {sources.map((s) => (
                    <tr key={s.id}>
                      <td><code>{s.id}</code></td>
                      <td>{s.type}</td>
                      <td><Pill appearance={s.health === 'Green' ? 'success' : s.health === 'Red' ? 'danger' : s.health === 'Yellow' ? 'warning' : 'default'} variant="muted">{s.health}</Pill></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card.Content>
          </Card>
        </div>

        <div className="r-incident__scrolls">
          <Card>
            <Card.Header>
              <Card.Title variant="heading-xs">HERESY SCROLLS</Card.Title>
              <Card.Description>Recent errors in Cribl’s own logs (Cribl Search) <LiveDot of={state.scrolls} /></Card.Description>
            </Card.Header>
            <Card.Content>
              {!state.scrolls ? (
                <Text variant="body-sm-normal" color="subtle">The scrolls are still unrolling…</Text>
              ) : state.scrolls.value.length === 0 ? (
                <Text variant="body-sm-normal" color="subtle">{state.scrolls.simulated ? state.scrolls.reason : 'The scrolls are blank. The logs are clean. Too clean.'}</Text>
              ) : (
                <ul className="r-scroll-list">
                  {state.scrolls.value.map((s, i) => <li key={i}><code>{s.channel}</code> {s.message}</li>)}
                </ul>
              )}
            </Card.Content>
          </Card>
        </div>
      </div>
      <div className="r-incident__action">
        <button className="r-btn r-btn--blood" onClick={summon}>SUMMON THE BUILDERS</button>
      </div>
    </section>
  );
}
