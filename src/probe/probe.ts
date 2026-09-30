// Step 0 tenant probe (throwaway). Runs every Cribl call the Church of Goat depends on and
// records what the tenant actually accepts, so the real request bodies can be locked in.
// Only read calls, engine previews and writes to this app's own KV keys.

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

interface CallOptions {
  timeoutMs?: number;
  /** Send `body` as-is with this content type instead of JSON-encoding it. */
  rawContentType?: string;
}

async function call(method: string, path: string, body?: unknown, opts: CallOptions = {}): Promise<CallOutcome> {
  const { timeoutMs = 10000, rawContentType } = opts;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const t0 = performance.now();
  try {
    const res = await fetch(apiBase() + path, {
      method,
      cache: 'no-store',
      signal: ctrl.signal,
      headers: body === undefined ? undefined : { 'content-type': rawContentType ?? 'application/json' },
      body: body === undefined ? undefined : rawContentType ? String(body) : JSON.stringify(body),
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

const previewBody = (pipelineId: string, events: Json[], pipelineConf: Json, timeout: number): Json => ({
  mode: 'pipe',
  pipelineId,
  sampleId: '',
  timeout,
  events,
  pipelineConf,
});

// Probe pass 1 (2026-09-30) showed: census, identity, version and Search all work; the group-scoped
// metrics query 404s; the Leader query returns 200 with no rows; /preview hit its own 5 s timeout
// before the forked process finished booting; KV stores the request body as text. Pass 2 narrows
// down each of those three.

const nowSec = (): number => Math.floor(Date.now() / 1000);

const metricsVariants = (): Array<{ id: string; label: string; body: Json }> => [
  {
    id: 'm1-spec-example',
    label: 'Spec example (health by input, no time range)',
    body: { aggs: { aggregations: ['max("health.inputs").as("health")'], cumulative: true, splitBys: ['input'] } },
  },
  {
    id: 'm2-sum-1h-relative',
    label: 'sum(total.in_events), -1h relative',
    body: { earliest: '-1h', latest: 'now', aggs: { aggregations: ['sum("total.in_events").as("events")'], cumulative: true } },
  },
  {
    id: 'm3-sum-1h-epoch-s',
    label: 'sum(total.in_events), epoch seconds',
    body: { earliest: nowSec() - 3600, latest: nowSec(), aggs: { aggregations: ['sum("total.in_events").as("events")'], cumulative: true } },
  },
  {
    id: 'm4-sum-1h-epoch-ms',
    label: 'sum(total.in_events), epoch milliseconds',
    body: { earliest: Date.now() - 3600_000, latest: Date.now(), aggs: { aggregations: ['sum("total.in_events").as("events")'], cumulative: true } },
  },
  {
    id: 'm5-has-no-dimensions-series',
    label: 'where has_no_dimensions, 1-min series, -1h',
    body: { where: 'has_no_dimensions', earliest: '-1h', latest: 'now', aggs: { aggregations: ['sum("total.in_events").as("events")'], timeWindowSeconds: 60 } },
  },
  {
    id: 'm6-where-group',
    label: "where __worker_group=='default', -1h",
    body: { where: "__worker_group=='default'", earliest: '-1h', latest: 'now', aggs: { aggregations: ['sum("total.in_events").as("events")'], cumulative: true } },
  },
  {
    id: 'm7-split-group',
    label: 'splitBy __worker_group, -1h',
    body: { earliest: '-1h', latest: 'now', aggs: { aggregations: ['sum("total.in_events").as("events")', 'sum("total.in_bytes").as("bytes")'], cumulative: true, splitBys: ['__worker_group'] } },
  },
  {
    id: 'm8-no-time-sum',
    label: 'sum(total.in_events), no time range',
    body: { aggs: { aggregations: ['sum("total.in_events").as("events")'], cumulative: true } },
  },
  {
    id: 'm9-24h-has-no-dimensions',
    label: 'where has_no_dimensions, 24h cumulative',
    body: { where: 'has_no_dimensions', earliest: '-24h', latest: 'now', aggs: { aggregations: ['sum("total.in_events").as("events")', 'sum("total.in_bytes").as("bytes")', 'sum("total.dropped_events").as("dropped")'], cumulative: true } },
  },
];

// ── Runner ───────────────────────────────────────────────────────────────────────────────

export async function runProbe(onProgress: (r: ProbeResult) => void): Promise<ProbeReport> {
  const report: ProbeReport = { startedAt: new Date().toISOString(), apiBase: apiBase(), findings: { probePass: 2 }, results: [] };
  const f = report.findings;

  const record = (id: string, label: string, method: string, path: string, out: CallOutcome, finding: string, request?: unknown): void => {
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

  // 1. Group + names for goatification (confirmed working in pass 1)
  let group: string | undefined;
  let pipelineIds: string[] = [];
  let destinationIds: string[] = [];
  {
    const out = await call('GET', '/products/stream/groups');
    const stream = itemsOf(out.body).filter((g) => g.isSearch !== true && g.id !== 'default_search');
    const pick = stream.find((g) => g.id === 'default') ?? stream[0];
    group = typeof pick?.id === 'string' ? pick.id : undefined;
    report.group = group;
    record('groups', 'Worker Groups', 'GET', '/products/stream/groups', out, group ? `Using "${group}"` : 'No Stream group found');
  }
  const gp = group ? `/m/${encodeURIComponent(group)}` : undefined;
  if (gp) {
    const pipes = await call('GET', `${gp}/pipelines`);
    pipelineIds = itemsOf(pipes.body).map((p) => String(p.id));
    record('pipelines', 'Pipeline names', 'GET', `${gp}/pipelines`, pipes, `${pipelineIds.length} pipeline(s)`);
    const outputs = await call('GET', `${gp}/system/status/outputs`);
    destinationIds = itemsOf(outputs.body).map((d) => String(d.id));
    record('outputs', 'Destination names', 'GET', `${gp}/system/status/outputs`, outputs, `${destinationIds.length} destination(s)`);
  }

  // 2. Metrics — which body shape returns rows?
  const metricsHits: Record<string, unknown> = {};
  for (const v of metricsVariants()) {
    const out = await call('POST', '/system/metrics/query', v.body);
    const rows = isObj(out.body) && Array.isArray(out.body.results) ? (out.body.results as Json[]) : [];
    metricsHits[v.id] = out.ok ? { rows: rows.length, first: rows[0] ?? null } : { status: out.status };
    record(`metrics:${v.id}`, `Metrics — ${v.label}`, 'POST', '/system/metrics/query', out, out.ok ? `${rows.length} row(s)${rows[0] ? ': ' + JSON.stringify(rows[0]).slice(0, 160) : ''}` : 'Failed', v.body);
  }
  {
    const path = '/system/metrics?metricNameFilter=total.in_events&earliest=-1h&numBuckets=6';
    const out = await call('GET', path);
    metricsHits['m10-get'] = out.ok ? { snippet: out.text.slice(0, 300) } : { status: out.status };
    record('metrics:m10-get', 'Metrics — GET /system/metrics raw', 'GET', path, out, out.ok ? out.text.slice(0, 160) : 'Failed');
  }
  f.metrics = metricsHits;

  // 3. Preview — give the forked process time to boot. The proxy gives up at 30 s.
  const previewPaths = [...(gp ? [`${gp}/preview`] : []), '/preview?product=stream'];
  let previewPath: string | undefined;
  const previewTimings: Record<string, unknown> = {};
  for (const path of previewPaths) {
    if (previewPath) break;
    const body = previewBody('goat_exorcism', DEMON_EVENTS, EXORCISM_PIPELINE, 20000);
    const out = await call('POST', path, body, { timeoutMs: 29000 });
    const items = itemsOf(out.body);
    const stats = isObj(out.body) && isObj(out.body.stats) ? out.body.stats : undefined;
    const fnStats = stats && Array.isArray(stats.functions) ? (stats.functions as Json[]) : [];
    const message = isObj(out.body) ? out.body.message : undefined;
    previewTimings[path] = { ms: out.ms, items: items.length, message: message ?? null };
    if (out.ok && items.length > 0) {
      previewPath = path;
      f.previewContext = path;
      const human = items.find((e) => e.species !== 'goat');
      f.exorcism = {
        ms: out.ms,
        eventsIn: DEMON_EVENTS.length,
        eventsOut: items.length,
        purified: items.filter((e) => e.purified === true || e.purified === 'true').length,
        resisted: items.filter((e) => e.species === 'goat').length,
        humanSample: human ?? null,
        goatSample: items.find((e) => e.species === 'goat') ?? null,
        statsKeys: stats ? Object.keys(stats) : null,
        functionStats: fnStats.map((s) => ({ func: s.func, eventsIn: s.eventsIn, eventsOut: s.eventsOut, bytesIn: s.bytesIn, bytesOut: s.bytesOut, duration: s.duration })),
      };
    }
    record(
      `preview-exorcism:${path}`, 'THE EXORCISM (20 s timeout)', 'POST', path, out,
      out.ok && items.length > 0
        ? `${items.length}/${DEMON_EVENTS.length} out in ${out.ms} ms · ${fnStats.length} function stat row(s)`
        : `No events after ${out.ms} ms${message ? ` — ${String(message)}` : ''}`,
      body,
    );
  }
  f.previewTimings = previewTimings;

  if (previewPath) {
    const events = goatifyEvents(pipelineIds.length ? pipelineIds : ['main', 'passthru'], destinationIds.length ? destinationIds : ['devnull']);
    const body = previewBody('goatify', events, GOATIFY_PIPELINE, 20000);
    const out = await call('POST', previewPath, body, { timeoutMs: 29000 });
    const items = itemsOf(out.body);
    f.goatified = { ms: out.ms, items: items.map((e) => ({ kind: e.kind, mortal: e.mortal_name ?? e.name ?? null, goat: e.goat_name ?? null })) };
    const renamed = items.some((e) => 'mortal_name' in e);
    record('preview-goatify', 'GOATIFICATION (20 s timeout)', 'POST', previewPath, out, out.ok ? `${items.length} name(s) in ${out.ms} ms · rename ${renamed ? 'worked' : 'did NOT apply'}` : 'Goatify preview failed', body);
  } else {
    skip('preview-goatify', 'GOATIFICATION', 'POST', '/preview', 'No working preview context');
  }

  // 4. KV — which encoding round-trips a JSON document?
  {
    const value = { probedAt: report.startedAt, soul: 1 };
    const expected = JSON.stringify(value);
    const kv: Record<string, unknown> = {};

    const a = '/kvstore/church/probe-text';
    const putA = await call('PUT', a, expected, { rawContentType: 'text/plain' });
    const getA = await call('GET', a);
    kv.textPlain = { put: putA.status, get: getA.status, contentType: null, roundTrip: getA.text === expected, got: getA.text.slice(0, 120) };
    record('kv-text', 'KV — PUT text/plain JSON string', 'PUT', a, putA, `PUT ${String(putA.status)} · read back ${getA.text === expected ? 'identical' : `"${getA.text.slice(0, 60)}"`}`, expected);

    const b = '/kvstore/church/probe-json-string';
    const putB = await call('PUT', b, expected);
    const getB = await call('GET', b);
    const bParsed = typeof getB.body === 'string' ? getB.body : null;
    kv.jsonString = { put: putB.status, get: getB.status, roundTrip: bParsed === expected || getB.text === expected, got: getB.text.slice(0, 120) };
    record('kv-json-string', 'KV — PUT application/json string literal', 'PUT', b, putB, `PUT ${String(putB.status)} · read back "${getB.text.slice(0, 60)}"`, expected);

    const list = await call('POST', '/kvstore/keys', { prefix: 'church/' });
    kv.keys = list.ok ? list.text.slice(0, 200) : list.status;
    record('kv-keys', 'KV — list keys', 'POST', '/kvstore/keys', list, list.ok ? list.text.slice(0, 120) : 'List failed', { prefix: 'church/' });
    f.kv = kv;
  }

  return report;
}
