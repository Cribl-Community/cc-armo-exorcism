// Step 0 tenant probe (throwaway). Runs every Cribl call the Church of Goat depends on and
// records what the tenant actually accepts, so the real request bodies can be locked in.
// Only read calls, engine previews, a search job and one write to this app's own KV key.

export type ProbeStatus = number | 'ERR' | 'TIMEOUT' | 'SKIPPED';

export interface ProbeResult {
  id: string;
  label: string;
  method: string;
  path: string;
  status: ProbeStatus;
  ok: boolean;
  ms: number;
  finding: string;
  request?: unknown;
  response?: string;
}

export interface ProbeReport {
  startedAt: string;
  apiBase: string;
  group?: string;
  findings: Record<string, unknown>;
  results: ProbeResult[];
}

type Json = Record<string, unknown>;

const RESPONSE_SNIPPET_CHARS = 1500;

const apiBase = (): string => window.CRIBL_API_URL ?? '/api/v1';

const isObj = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v);
const itemsOf = (v: unknown): Json[] => (isObj(v) && Array.isArray(v.items) ? (v.items as Json[]) : []);

interface CallOutcome {
  status: ProbeStatus;
  ok: boolean;
  ms: number;
  body: unknown;
  text: string;
}

async function call(method: string, path: string, body?: unknown, timeoutMs = 10000): Promise<CallOutcome> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const t0 = performance.now();
  try {
    const res = await fetch(apiBase() + path, {
      method,
      cache: 'no-store',
      signal: ctrl.signal,
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let parsed: unknown = text;
    try {
      parsed = JSON.parse(text);
    } catch {
      /* not JSON (e.g. NDJSON or an HTML error page) — keep the raw text */
    }
    // An HTML page means we hit a web server fallback (e.g. running outside Cribl), not the API.
    const isHtml = (res.headers.get('content-type') ?? '').includes('text/html');
    return { status: res.status, ok: res.ok && !isHtml, ms: Math.round(performance.now() - t0), body: parsed, text };
  } catch (err) {
    const aborted = err instanceof DOMException && err.name === 'AbortError';
    return {
      status: aborted ? 'TIMEOUT' : 'ERR',
      ok: false,
      ms: Math.round(performance.now() - t0),
      body: undefined,
      text: err instanceof Error ? err.message : String(err),
    };
  } finally {
    clearTimeout(timer);
  }
}

// ── Request bodies under test (mirrors docs/CHURCH_OF_GOAT_DESIGN.md §5) ─────────────────

export const DEMON_EVENTS: Json[] = [
  { _raw: 'host=altar-01 user=ceo action=login status=FAILED password=hunter2 curse=666', species: 'human', heresy_level: 42, level: 'info', curse: '666', demonic_payload: "Ph'nglui mglw'nafh Cribl", sourcetype: 'syslog' },
  { _raw: 'host=altar-02 user=arno action=deploy status=OK token=abc123 curse=666', species: 'human', heresy_level: 7, level: 'info', curse: '666', demonic_payload: 'the pipeline hungers', sourcetype: 'syslog' },
  { _raw: 'host=altar-03 user=moise action=touch status=FORBIDDEN curse=666', species: 'human', heresy_level: 9001, level: 'warn', curse: '666', demonic_payload: 'do not touch anything', sourcetype: 'syslog' },
  { _raw: 'host=altar-04 debug=true msg="counting goats" curse=666', species: 'human', heresy_level: 1, level: 'debug', curse: '666', demonic_payload: 'baa', sourcetype: 'apache' },
  { _raw: 'host=altar-05 debug=true msg="counting more goats" curse=666', species: 'human', heresy_level: 1, level: 'debug', curse: '666', demonic_payload: 'baa baa', sourcetype: 'apache' },
  { _raw: 'host=altar-06 debug=true msg="still counting goats" curse=666', species: 'human', heresy_level: 1, level: 'debug', curse: '666', demonic_payload: 'baa baa baa', sourcetype: 'apache' },
  { _raw: 'host=pasture-01 msg="I AM THE GOAT" curse=666', species: 'goat', heresy_level: 666, level: 'info', curse: '666', demonic_payload: 'BAAAAAAA', sourcetype: 'goat' },
  { _raw: 'host=pasture-02 msg="YOU CANNOT PURIFY ME" curse=666', species: 'goat', heresy_level: 666, level: 'info', curse: '666', demonic_payload: 'BAAAAAAAAAA', sourcetype: 'goat' },
];

export const EXORCISM_PIPELINE: Json = {
  asyncFuncTimeout: 1000,
  functions: [
    { id: 'comment', conf: { comment: 'RITE OF PURIFICATION — performed by the High Priestess of Telemetry' } },
    { id: 'drop', filter: 'heresy_level >= 9000', description: 'BANISH', conf: {} },
    {
      id: 'mask',
      filter: "species !== 'goat'",
      description: 'SEAL THE SECRETS',
      conf: {
        fields: ['_raw'],
        rules: [
          { matchRegex: '/666/g', replaceExpr: "'🐐🐐🐐'" },
          { matchRegex: '/(password|token)=\\S+/gi', replaceExpr: '`${g1}=[BLESSED]`' },
        ],
      },
    },
    {
      id: 'eval',
      filter: "species !== 'goat'",
      description: 'ANOINT',
      conf: {
        add: [
          { name: 'purified', value: 'true' },
          { name: 'purified_by', value: "'High Priestess of Telemetry'" },
          { name: 'blessing', value: 'C.Mask.md5(String(curse))' },
        ],
        remove: ['curse', 'demonic_payload'],
      },
    },
    { id: 'sampling', description: 'TITHE', conf: { rules: [{ filter: "level === 'debug'", rate: 3 }] } },
  ],
};

const goatifyEvents = (pipelines: string[], destinations: string[]): Json[] => [
  ...pipelines.slice(0, 3).map((name) => ({ kind: 'pipeline', name })),
  ...destinations.slice(0, 3).map((name) => ({ kind: 'destination', name })),
  { kind: 'event', name: 'authentication failure' },
];

export const GOATIFY_PIPELINE: Json = {
  functions: [
    { id: 'eval', filter: "kind === 'pipeline'", conf: { add: [{ name: 'goat_name', value: "'GOAT_' + name.toUpperCase().replace(/[^A-Z0-9]+/g,'_') + '_RITUAL'" }] } },
    { id: 'eval', filter: "kind === 'destination'", conf: { add: [{ name: 'goat_name', value: "'THE_HOLY_' + name.toUpperCase().replace(/[^A-Z0-9]+/g,'_')" }] } },
    { id: 'eval', filter: "kind === 'event'", conf: { add: [{ name: 'goat_name', value: "'GOATIFICATION COMPLETE'" }] } },
    { id: 'rename', conf: { rename: [{ currentName: 'name', newName: 'mortal_name' }] } },
  ],
};

const previewBody = (pipelineId: string, events: Json[], pipelineConf: Json): Json => ({
  mode: 'pipe',
  pipelineId,
  sampleId: '',
  timeout: 5000,
  memory: 256,
  events,
  pipelineConf,
});

const metricsTotalsBody: Json = {
  earliest: '-24h',
  latest: 'now',
  aggs: {
    aggregations: ['sum("total.in_events").as(events)', 'sum("total.in_bytes").as(bytes)', 'sum("total.dropped_events").as(dropped)'],
    cumulative: true,
  },
};

const metricsSeriesBody: Json = {
  earliest: '-60m',
  latest: 'now',
  aggs: { aggregations: ['sum("total.in_events").as(events)'], timeWindowSeconds: 60 },
};

// ── Runner ───────────────────────────────────────────────────────────────────────────────

export async function runProbe(onProgress: (r: ProbeResult) => void): Promise<ProbeReport> {
  const report: ProbeReport = { startedAt: new Date().toISOString(), apiBase: apiBase(), findings: {}, results: [] };
  const f = report.findings;

  const record = (
    id: string,
    label: string,
    method: string,
    path: string,
    out: CallOutcome,
    finding: string,
    request?: unknown,
  ): void => {
    const r: ProbeResult = {
      id, label, method, path, request, finding,
      status: out.status, ok: out.ok, ms: out.ms,
      response: out.text.slice(0, RESPONSE_SNIPPET_CHARS),
    };
    report.results.push(r);
    onProgress(r);
  };

  const skip = (id: string, label: string, method: string, path: string, why: string): void => {
    const r: ProbeResult = { id, label, method, path, status: 'SKIPPED', ok: false, ms: 0, finding: why };
    report.results.push(r);
    onProgress(r);
  };

  // 1. Identity
  {
    const t0 = performance.now();
    let out: CallOutcome;
    try {
      const user = await window.getCriblUser();
      f.user = { hasFirstName: Boolean(user.firstName), hasUsername: Boolean(user.username) };
      out = { status: 200, ok: true, ms: Math.round(performance.now() - t0), body: user, text: JSON.stringify({ firstName: user.firstName, username: user.username }) };
    } catch (err) {
      out = { status: 'ERR', ok: false, ms: Math.round(performance.now() - t0), body: undefined, text: String(err) };
    }
    record('user', 'Judge identity', 'JS', 'window.getCriblUser()', out, out.ok ? 'The Goat can greet the judge by name' : 'Fall back to "MORTAL"');
  }

  // 2. Version
  {
    const out = await call('GET', '/system/info');
    const info = itemsOf(out.body)[0];
    const build = isObj(info) && isObj(info.BUILD) ? info.BUILD : undefined;
    f.criblVersion = build?.VERSION ?? null;
    record('info', 'Cribl version', 'GET', '/system/info', out, out.ok && f.criblVersion ? `Cribl ${String(f.criblVersion)}` : 'Version unknown');
  }

  // 3. Groups
  let group: string | undefined;
  {
    const out = await call('GET', '/products/stream/groups');
    const groups = itemsOf(out.body);
    const stream = groups.filter((g) => g.isSearch !== true && g.id !== 'default_search');
    f.groups = stream.map((g) => ({ id: g.id, workerCount: g.workerCount ?? null, cloud: isObj(g.cloud) || g.cloud === true, onPrem: g.onPrem ?? null }));
    const withWorkers = [...stream].sort((a, b) => Number(b.workerCount ?? 0) - Number(a.workerCount ?? 0));
    const pick = stream.find((g) => g.id === 'default' && Number(g.workerCount ?? 1) > 0) ?? withWorkers[0];
    group = typeof pick?.id === 'string' ? pick.id : undefined;
    report.group = group;
    record('groups', 'Worker Groups', 'GET', '/products/stream/groups', out, group ? `${stream.length} Stream group(s); using "${group}"` : 'No Stream group found');
  }

  const gp = group ? `/m/${encodeURIComponent(group)}` : undefined;
  let pipelineIds: string[] = [];
  let destinationIds: string[] = [];

  // 4. Census
  if (gp) {
    const pipes = await call('GET', `${gp}/pipelines`);
    pipelineIds = itemsOf(pipes.body).map((p) => String(p.id));
    f.pipelineCount = pipes.ok ? pipelineIds.length : null;
    record('pipelines', 'Sacred Pipelines', 'GET', `${gp}/pipelines`, pipes, pipes.ok ? `${pipelineIds.length} pipeline(s): ${pipelineIds.slice(0, 6).join(', ')}` : 'Cannot list pipelines');

    const routes = await call('GET', `${gp}/routes`);
    const routeTables = itemsOf(routes.body);
    const routeCount = routeTables.reduce((n, t) => n + (Array.isArray(t.routes) ? t.routes.length : 0), 0);
    f.routeCount = routes.ok ? routeCount : null;
    record('routes', 'Sacred Routing', 'GET', `${gp}/routes`, routes, routes.ok ? `${routeTables.length} route table(s), ${routeCount} route(s)` : 'Cannot list routes');

    const inputs = await call('GET', `${gp}/system/status/inputs?type=true`);
    const sources = itemsOf(inputs.body);
    const health = (s: Json): string => (isObj(s.status) ? String(s.status.health ?? 'Unknown') : 'Unknown');
    f.sources = inputs.ok ? { count: sources.length, unhealthy: sources.filter((s) => health(s) !== 'Green').length } : null;
    record('inputs', 'Altars (source status)', 'GET', `${gp}/system/status/inputs?type=true`, inputs, inputs.ok ? `${sources.length} source(s), ${sources.filter((s) => health(s) !== 'Green').length} not Green` : 'Cannot read source status');

    const outputs = await call('GET', `${gp}/system/status/outputs`);
    const dests = itemsOf(outputs.body);
    destinationIds = dests.map((d) => String(d.id));
    f.destinations = outputs.ok ? { count: dests.length, unhealthy: dests.filter((d) => health(d) !== 'Green').length, ids: destinationIds.slice(0, 6) } : null;
    record('outputs', 'Holy Destinations (status)', 'GET', `${gp}/system/status/outputs`, outputs, outputs.ok ? `${dests.length} destination(s): ${destinationIds.slice(0, 6).join(', ')}` : 'Cannot read destination status');
  } else {
    for (const [id, label] of [['pipelines', 'Sacred Pipelines'], ['routes', 'Sacred Routing'], ['inputs', 'Altars'], ['outputs', 'Holy Destinations']]) {
      skip(id, label, 'GET', '/m/{group}/…', 'No Stream group to query');
    }
  }

  // 5. Metrics — discover names, then try group and Leader contexts
  {
    const body = { metricNameFilter: '^total\\.' };
    const out = await call('POST', '/system/metrics/enum', body);
    const names = itemsOf(out.body).map((m) => String(m.name));
    f.totalMetricNames = out.ok ? names : null;
    record('metrics-enum', 'Metric discovery', 'POST', '/system/metrics/enum', out, out.ok ? `${names.length} total.* metric(s): ${names.slice(0, 8).join(', ')}` : 'Enum not available', body);
  }

  const metricsPaths = [...(gp ? [`${gp}/system/metrics/query`] : []), '/system/metrics/query'];
  let metricsPath: string | undefined;
  for (const path of metricsPaths) {
    const out = await call('POST', path, metricsTotalsBody);
    const row = isObj(out.body) && Array.isArray(out.body.results) ? (out.body.results[0] as Json | undefined) : undefined;
    const events = row ? Number(row.events ?? 0) : 0;
    if (out.ok && !metricsPath) {
      metricsPath = path;
      f.metricsContext = path;
      f.totals24h = row ? { events: row.events ?? null, bytes: row.bytes ?? null, dropped: row.dropped ?? null } : null;
    }
    record(`metrics-totals:${path}`, 'Offerings — 24h totals', 'POST', path, out, out.ok ? (events > 0 ? `${events.toLocaleString()} events in 24h` : 'Query works but 0 events (STARVING GOAT path)') : 'Query failed in this context', metricsTotalsBody);
  }
  if (metricsPath) {
    const out = await call('POST', metricsPath, metricsSeriesBody);
    const rows = isObj(out.body) && Array.isArray(out.body.results) ? out.body.results : [];
    f.seriesPoints = out.ok ? rows.length : null;
    record('metrics-series', 'Offerings — 60 min series', 'POST', metricsPath, out, out.ok ? `${rows.length} one-minute point(s)` : 'Series query failed', metricsSeriesBody);
  } else {
    skip('metrics-series', 'Offerings — 60 min series', 'POST', '/system/metrics/query', 'No working metrics context');
  }

  // 6. The exorcism — real engine, inline pipeline, nothing saved. Try group and Leader contexts.
  const previewPaths = [...(gp ? [`${gp}/preview`] : []), '/preview?product=stream'];
  let previewPath: string | undefined;
  for (const path of previewPaths) {
    const body = previewBody('goat_exorcism', DEMON_EVENTS, EXORCISM_PIPELINE);
    const out = await call('POST', path, body, 15000);
    const items = itemsOf(out.body);
    const stats = isObj(out.body) && isObj(out.body.stats) ? out.body.stats : undefined;
    const fnStats = stats && Array.isArray(stats.functions) ? (stats.functions as Json[]) : [];
    const resisted = items.filter((e) => e.species === 'goat').length;
    const purified = items.filter((e) => e.purified === true || e.purified === 'true').length;
    const works = out.ok && items.length > 0;
    if (works && !previewPath) {
      previewPath = path;
      f.previewContext = path;
      f.exorcism = {
        eventsIn: DEMON_EVENTS.length,
        eventsOut: items.length,
        purified,
        resisted,
        maskedRaw: items.find((e) => e.species !== 'goat')?._raw ?? null,
        blessingType: typeof items.find((e) => e.species !== 'goat')?.blessing,
        functionStats: fnStats.map((s) => ({ func: s.func, eventsIn: s.eventsIn, eventsOut: s.eventsOut, bytesIn: s.bytesIn, bytesOut: s.bytesOut })),
      };
    }
    record(
      `preview-exorcism:${path}`, 'THE EXORCISM (engine preview)', 'POST', path, out,
      works
        ? `${DEMON_EVENTS.length} in → ${items.length} out · ${purified} purified · ${resisted} goat(s) resisted · ${fnStats.length} function stat row(s)`
        : 'Preview did not return events in this context',
      body,
    );
  }

  // 7. Goatification — real resource names through a real Eval + Rename
  if (previewPath) {
    const events = goatifyEvents(pipelineIds.length ? pipelineIds : ['main', 'passthru'], destinationIds.length ? destinationIds : ['devnull']);
    const body = previewBody('goatify', events, GOATIFY_PIPELINE);
    const out = await call('POST', previewPath, body, 15000);
    const items = itemsOf(out.body);
    f.goatified = items.slice(0, 7).map((e) => ({ kind: e.kind, mortal: e.mortal_name ?? e.name ?? null, goat: e.goat_name ?? null }));
    const renamed = items.some((e) => 'mortal_name' in e);
    record('preview-goatify', 'GOATIFICATION (engine preview)', 'POST', previewPath, out, out.ok ? `${items.length} name(s) goatified · rename ${renamed ? 'worked' : 'did NOT apply'}` : 'Goatify preview failed', body);
  } else {
    skip('preview-goatify', 'GOATIFICATION (engine preview)', 'POST', '/preview', 'No working preview context');
  }

  // 8. Book of Offerings — this app's own KV (app-scoped, not Cribl config)
  {
    const key = '/kvstore/church/probe';
    const before = await call('GET', key);
    record('kv-get', 'Book of Offerings — read', 'GET', key, before, before.ok ? 'KV readable' : before.status === 404 ? 'KV reachable (key not written yet)' : 'KV read failed');
    const value = { probedAt: report.startedAt };
    const put = await call('PUT', key, value);
    record('kv-put', 'Book of Offerings — write', 'PUT', key, put, put.ok ? 'KV writable' : 'KV write failed', value);
    const after = await call('GET', key);
    f.kv = { read: before.ok || before.status === 404, write: put.ok, roundTrip: after.ok && after.text.includes(report.startedAt) };
    record('kv-get-after', 'Book of Offerings — read back', 'GET', key, after, after.ok ? `Round-trip ${after.text.includes(report.startedAt) ? 'OK' : 'returned different content'}` : 'Read-back failed');
  }

  // 9. Heresy Scrolls — Cribl Search (Cribl.Cloud only)
  {
    const ds = await call('GET', '/m/default_search/search/datasets');
    const dsIds = itemsOf(ds.body).map((d) => String(d.id));
    f.searchDatasets = ds.ok ? dsIds.slice(0, 30) : null;
    record('search-datasets', 'Search datasets', 'GET', '/m/default_search/search/datasets', ds, ds.ok ? `${dsIds.length} dataset(s): ${dsIds.slice(0, 8).join(', ')}` : 'Cribl Search not available');

    if (ds.ok) {
      const dataset = dsIds.includes('cribl_internal_logs') ? 'cribl_internal_logs' : dsIds[0];
      const body = { query: `dataset="${dataset}" | limit 5`, earliest: '-24h', latest: 'now' };
      const job = await call('POST', '/m/default_search/search/jobs', body);
      const jobId = itemsOf(job.body)[0]?.id;
      record('search-job', 'Search job — create', 'POST', '/m/default_search/search/jobs', job, job.ok && jobId ? `Job ${String(jobId)} on ${dataset}` : 'Could not create a search job', body);

      if (job.ok && typeof jobId === 'string') {
        let state = 'unknown';
        let statusOut: CallOutcome | undefined;
        for (let i = 0; i < 10; i++) {
          statusOut = await call('GET', `/m/default_search/search/jobs/${jobId}/status`);
          const st = itemsOf(statusOut.body)[0];
          state = String(st?.status ?? (isObj(statusOut.body) ? statusOut.body.status : 'unknown'));
          if (['completed', 'failed', 'canceled'].includes(state)) break;
          await new Promise((r) => setTimeout(r, 1000));
        }
        if (statusOut) record('search-status', 'Search job — status', 'GET', `/m/default_search/search/jobs/${jobId}/status`, statusOut, `Final state: ${state}`);
        const results = await call('GET', `/m/default_search/search/jobs/${jobId}/results`);
        const rows = results.text.split('\n').filter(Boolean).length;
        f.search = { dataset, state, resultLines: rows };
        record('search-results', 'Search job — results', 'GET', `/m/default_search/search/jobs/${jobId}/results`, results, results.ok ? `${rows} line(s) returned` : 'Could not read results');
      }
    }
  }

  return report;
}
