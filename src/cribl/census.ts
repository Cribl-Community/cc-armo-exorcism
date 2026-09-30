import { criblJson, failureReason, isDemoMode, isObj, itemsOf, recordSimulated, str, type Json } from './client';
import { FIXTURE_DESTINATIONS, FIXTURE_LEADER, FIXTURE_PIPELINES, FIXTURE_ROUTES, FIXTURE_SOURCES } from './fixtures';
import type { Census, Health, Judge, LeaderInfo, RouteInfo, Sourced, StatusItem } from './types';

const real = <T>(value: T, source: string): Sourced<T> => ({ value, simulated: false, source });
const sim = <T>(value: T, reason: string, source?: string): Sourced<T> => ({ value, simulated: true, reason, source });
const DEMO_REASON = 'Performing the rite from memory';

// ── Judge ─────────────────────────────────────────────────────────────────────────────────

export async function loadJudge(): Promise<Sourced<Judge>> {
  try {
    const u = await window.getCriblUser();
    const name = (u.firstName ?? u.username ?? '').trim();
    return name ? real({ name, greeted: true }, 'window.getCriblUser()') : sim({ name: 'MORTAL', greeted: false }, 'No name on this account');
  } catch {
    return sim({ name: 'MORTAL', greeted: false }, 'Identity unavailable');
  }
}

// ── Worker Group ──────────────────────────────────────────────────────────────────────────

export interface GroupChoice {
  ids: string[];
  chosen: string;
}

/** Pick the Stream group to possess: the preferred one, else `default`, else the one with the most Workers. */
export async function loadGroup(preferred?: string): Promise<Sourced<GroupChoice>> {
  const path = '/products/stream/groups';
  if (isDemoMode()) {
    recordSimulated('GET', path, 'Find the Worker Group to possess');
    return sim({ ids: ['default'], chosen: 'default' }, DEMO_REASON, path);
  }
  try {
    const groups = itemsOf(await criblJson('GET', path, { purpose: 'Find the Worker Group to possess' }))
      .filter((g) => g.isSearch !== true && g.id !== 'default_search');
    if (groups.length === 0) return sim({ ids: [], chosen: 'default' }, 'No Stream Worker Group found', path);
    const ids = groups.map((g) => str(g.id));
    const byWorkers = [...groups].sort((a, b) => Number(b.workerCount ?? 0) - Number(a.workerCount ?? 0));
    const chosen = preferred && ids.includes(preferred) ? preferred : ids.includes('default') ? 'default' : str(byWorkers[0].id);
    return real({ ids, chosen }, path);
  } catch (err) {
    return sim({ ids: [], chosen: 'default' }, failureReason(err), path);
  }
}

// ── Census ────────────────────────────────────────────────────────────────────────────────

const healthOf = (item: Json): Health => {
  const s = isObj(item.status) ? item.status : {};
  const counts = isObj(s.healthCounts) ? s.healthCounts : {};
  if (s.health === 'Red' || Number(counts.Red ?? 0) > 0) return 'Red';
  if (s.health === 'Yellow' || Number(counts.Yellow ?? 0) > 0 || s.error) return 'Yellow';
  if (s.health === 'Green') return 'Green';
  return 'Unknown';
};

const toStatus = (items: Json[]): StatusItem[] => items.map((i) => ({ id: str(i.id), type: str(i.type, '?'), health: healthOf(i) }));

const toRoutes = (tables: Json[]): RouteInfo[] =>
  tables.flatMap((t) => (Array.isArray(t.routes) ? (t.routes as Json[]) : [])).map((r) => ({
    name: str(r.name ?? r.id),
    filter: str(r.filter, 'true'),
    pipeline: str(r.pipeline),
    output: str(r.output, 'default'),
    disabled: r.disabled === true,
    final: r.final === true,
  }));

async function part<T>(path: string, purpose: string, parse: (data: unknown) => T, fixture: T): Promise<Sourced<T>> {
  if (isDemoMode()) {
    recordSimulated('GET', path, purpose);
    return sim(fixture, DEMO_REASON, path);
  }
  try {
    return real(parse(await criblJson('GET', path, { purpose })), path);
  } catch (err) {
    return sim(fixture, failureReason(err), path);
  }
}

export async function loadCensus(group: string): Promise<Census> {
  const g = `/m/${encodeURIComponent(group)}`;
  const [pipelines, routes, sources, destinations] = await Promise.all([
    part(`${g}/pipelines`, 'Count the Sacred Pipelines', (d) => itemsOf(d).map((p) => str(p.id)), FIXTURE_PIPELINES),
    part(`${g}/routes`, 'Map the Sacred Routing', (d) => toRoutes(itemsOf(d)), FIXTURE_ROUTES),
    part(`${g}/system/status/inputs?type=true`, 'Inspect the Altars (source health)', (d) => toStatus(itemsOf(d)), FIXTURE_SOURCES),
    part(`${g}/system/status/outputs`, 'Inspect the Holy Destinations', (d) => toStatus(itemsOf(d)), FIXTURE_DESTINATIONS),
  ]);
  return { pipelines, routes, sources, destinations };
}

// ── Leader info (version + system messages, which double as Heresy) ───────────────────────

export async function loadLeader(): Promise<Sourced<LeaderInfo>> {
  return part('/system/info', 'Read the Leader’s version and messages', (d) => {
    const info = itemsOf(d)[0] ?? {};
    const build = isObj(info.BUILD) ? info.BUILD : {};
    const raw = Array.isArray(info.messages) ? (info.messages as Json[]) : [];
    const seen = new Set<string>();
    const messages = raw
      .map((m) => ({ title: str(m.title), severity: str(m.severity) }))
      .filter((m) => m.title && !seen.has(m.title) && seen.add(m.title));
    return { version: str(build.VERSION, 'unknown').split('-')[0], messages };
  }, FIXTURE_LEADER);
}
