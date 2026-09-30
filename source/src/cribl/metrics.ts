// Stream internal metrics via the Leader. Verified on a live tenant (docs §16): only the Leader
// context works, and earliest/latest must be epoch seconds — relative strings return no rows.
import { criblJson, failureReason, isDemoMode, isObj, recordSimulated, str, type Json } from './client';
import { FIXTURE_HERESY, FIXTURE_TOTALS, fixtureSeries } from './fixtures';
import type { HeresyItem, Sourced, Totals } from './types';

const PATH = '/system/metrics/query';
const nowSec = (): number => Math.floor(Date.now() / 1000);

async function query(body: Json, purpose: string): Promise<Json[]> {
  const data = await criblJson('POST', PATH, { body, purpose });
  return isObj(data) && Array.isArray(data.results) ? (data.results as Json[]) : [];
}

export async function loadTotals(): Promise<Sourced<Totals>> {
  const purpose = 'Weigh the offerings of the last 24 hours';
  if (isDemoMode()) {
    recordSimulated('POST', PATH, purpose);
    return { value: FIXTURE_TOTALS, simulated: true, reason: 'Performing the rite from memory', source: PATH };
  }
  try {
    const rows = await query({
      earliest: nowSec() - 86_400,
      latest: nowSec(),
      aggs: {
        aggregations: ['sum("total.in_events").as("events")', 'sum("total.in_bytes").as("bytes")', 'sum("total.dropped_events").as("dropped")'],
        cumulative: true,
      },
    }, purpose);
    const r = rows[0] ?? {};
    // An empty result is a real answer: no traffic. The Goat starves; the value stays 🟢.
    return { value: { events: Number(r.events ?? 0), bytes: Number(r.bytes ?? 0), dropped: Number(r.dropped ?? 0) }, simulated: false, source: PATH };
  } catch (err) {
    return { value: FIXTURE_TOTALS, simulated: true, reason: failureReason(err), source: PATH };
  }
}

export async function loadSeries(): Promise<Sourced<number[]>> {
  const purpose = 'Listen to the last hour of offerings, minute by minute';
  if (isDemoMode()) {
    recordSimulated('POST', PATH, purpose);
    return { value: fixtureSeries(), simulated: true, reason: 'Performing the rite from memory', source: PATH };
  }
  try {
    const rows = await query({
      earliest: nowSec() - 3600,
      latest: nowSec(),
      aggs: { aggregations: ['sum("total.in_events").as("events")'], timeWindowSeconds: 60 },
    }, purpose);
    const points = rows
      .map((r) => ({ t: Number(r._time ?? r.starttime ?? 0), v: Number(r.events ?? 0) }))
      .sort((a, b) => a.t - b.t)
      .map((p) => p.v);
    return { value: points, simulated: false, source: PATH };
  } catch (err) {
    return { value: fixtureSeries(), simulated: true, reason: failureReason(err), source: PATH };
  }
}

/** Sources whose health metric is not Green over the last 15 minutes (0 = Green, 1 = Yellow, 2 = Red). */
export async function loadInputHeresy(): Promise<Sourced<HeresyItem[]>> {
  const purpose = 'Search the Altars for heresy (source health metric)';
  if (isDemoMode()) {
    recordSimulated('POST', PATH, purpose);
    return { value: FIXTURE_HERESY.filter((h) => h.kind === 'source'), simulated: true, reason: 'Performing the rite from memory', source: PATH };
  }
  try {
    const rows = await query({
      earliest: nowSec() - 900,
      latest: nowSec(),
      aggs: { aggregations: ['max("health.inputs").as("health")'], cumulative: true, splitBys: ['input'] },
    }, purpose);
    const items: HeresyItem[] = rows
      .filter((r) => Number(r.health ?? 0) > 0)
      .map((r) => ({ kind: 'source', title: str(r.input), severity: Number(r.health) >= 2 ? 'Red' : 'Yellow' }));
    return { value: items, simulated: false, source: PATH };
  } catch (err) {
    return { value: [], simulated: true, reason: failureReason(err), source: PATH };
  }
}
