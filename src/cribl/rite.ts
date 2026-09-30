// The exorcism and the goatification, performed by the real Cribl engine.
//
// POST /m/{group}/preview runs inline events through an inline pipeline in a throwaway engine
// process — nothing is saved. Verified on a live tenant (docs §16): ~8–10 s per call and no
// per-function stats, so both rites share ONE call (every function filters on `rite`) and the
// per-stage counts are derived exactly from the output, matched to the input by `__id`.
import { criblFetch, describeFailure, isDemoMode, isObj, itemsOf, recordSimulated, str, type Json } from './client';
import type { ExorcismResult, GoatPair, RiteResult, Sourced, StageCount, StatusItem } from './types';

export const DEMON_COUNT = 40;
const GOATS = 3;
const HERETICS = 6; // heresy_level >= 9000 → banished
const DEBUG = 9; // level debug → tithed at 1:3
export const TITHE_RATE = 3;
/** md5("666"), as computed by C.Mask.md5 on the engine — used by the offline emulator only. */
const MD5_666 = 'fae0b27c451c728867a567e8c1bb4e53';

const CAST = ['ceo', 'arno', 'moise', 'priestess', 'intern', 'auditor', 'sre_on_call', 'the_goat_whisperer'];
const ACTIONS = ['login', 'deploy', 'touch', 'rollback', 'summon', 'approve_budget', 'restart_leader', 'grep'];
const STATUSES = ['FAILED', 'OK', 'FORBIDDEN', 'DENIED', 'CURSED'];
const CHANTS = ["Ph'nglui mglw'nafh Cribl", 'the pipeline hungers', 'do not touch anything', 'baa', 'route all things to the goat', 'it was never the CEO'];
const GOAT_LINES = ['I AM THE GOAT', 'YOU CANNOT PURIFY ME', 'YOUR PIPELINES ARE MINE'];
const ECTOPLASM = 'ᛗᚨᛚᛖᚠᛁᚲ '.repeat(12) + '(debug context: 0xDEADBEEF 0x666 stack=[goat,goat,goat])';
const FALLBACK_SOURCES: StatusItem[] = [
  { id: 'syslog:in_syslog', type: 'syslog', health: 'Green' },
  { id: 'http:in_http', type: 'http', health: 'Green' },
];

/** Tiny deterministic PRNG so every performance of the rite summons the same demons. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 40 possessed events, seeded with the tenant's real source ids so they look like theirs. */
export function summonDemons(sources: StatusItem[]): Json[] {
  const rnd = mulberry32(666);
  const pick = <T>(xs: T[]): T => xs[Math.floor(rnd() * xs.length)];
  const altars = sources.length ? sources : FALLBACK_SOURCES;
  const events: Json[] = [];
  for (let i = 0; i < DEMON_COUNT; i++) {
    const altar = altars[i % altars.length];
    const species = i >= DEMON_COUNT - GOATS ? 'goat' : 'human';
    const heretic = species === 'human' && i % 7 === 3 && events.filter((e) => Number(e.heresy_level) >= 9000).length < HERETICS;
    const debug = species === 'human' && !heretic && i % 4 === 1 && events.filter((e) => e.level === 'debug').length < DEBUG;
    const user = pick(CAST);
    const secret = rnd() < 0.5 ? `password=${pick(['hunter2', 'goat123', 'baaaa', 'letmein'])}` : `token=${Math.floor(rnd() * 1e9).toString(36)}`;
    const _raw = species === 'goat'
      ? `host=pasture-0${i - (DEMON_COUNT - GOATS) + 1} msg="${GOAT_LINES[i - (DEMON_COUNT - GOATS)]}" curse=666`
      : `host=altar-${String(i + 1).padStart(2, '0')} src=${altar.id} user=${user} action=${pick(ACTIONS)} status=${pick(STATUSES)} ${secret} curse=666`;
    events.push({
      rite: 'exorcism',
      _raw,
      species,
      heresy_level: heretic ? 9000 + Math.floor(rnd() * 999) : species === 'goat' ? 666 : Math.floor(rnd() * 100),
      level: debug ? 'debug' : pick(['info', 'info', 'warn', 'error']),
      curse: '666',
      demonic_payload: species === 'goat' ? 'BAAAAAAA' : pick(CHANTS),
      // Noisy junk a real pipeline would strip. ANOINT removes it, which is most of the byte reduction.
      ectoplasm: ECTOPLASM,
      sourcetype: species === 'goat' ? 'goat' : altar.type,
      __inputId: altar.id,
    });
  }
  // Guarantee the promised counts even if the modulo pattern under-fills.
  let h = events.filter((e) => Number(e.heresy_level) >= 9000).length;
  let d = events.filter((e) => e.level === 'debug').length;
  for (const e of events) {
    if (e.species !== 'human') continue;
    if (h < HERETICS && Number(e.heresy_level) < 9000 && e.level !== 'debug') { e.heresy_level = 9001; h++; continue; }
    if (d < DEBUG && Number(e.heresy_level) < 9000 && e.level !== 'debug') { e.level = 'debug'; d++; }
  }
  return events;
}

export function goatifyEvents(pipelines: string[], destinations: string[]): Json[] {
  const p = pipelines.length ? pipelines : ['main', 'passthru'];
  const d = destinations.length ? destinations : ['devnull'];
  return [
    ...p.slice(0, 3).map((name) => ({ rite: 'goatify', kind: 'pipeline', name })),
    ...d.slice(0, 3).map((name) => ({ rite: 'goatify', kind: 'destination', name })),
    { rite: 'goatify', kind: 'event', name: 'authentication failure' },
  ];
}

const EX = "rite === 'exorcism'";
const GO = "rite === 'goatify'";

/** The pipeline the High Priestess performs. Shown verbatim in the Scripture. */
export const RITE_PIPELINE: Json = {
  asyncFuncTimeout: 1000,
  functions: [
    { id: 'comment', conf: { comment: 'RITE OF PURIFICATION — performed by the High Priestess of Telemetry' } },
    { id: 'drop', filter: `${EX} && heresy_level >= 9000`, description: 'BANISH', conf: {} },
    {
      id: 'mask',
      filter: `${EX} && species !== 'goat'`,
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
      filter: `${EX} && species !== 'goat'`,
      description: 'ANOINT',
      conf: {
        add: [
          { name: 'purified', value: 'true' },
          { name: 'purified_by', value: "'High Priestess of Telemetry'" },
          { name: 'blessing', value: 'C.Mask.md5(String(curse))' },
        ],
        remove: ['curse', 'demonic_payload', 'ectoplasm'],
      },
    },
    { id: 'sampling', description: 'TITHE', conf: { rules: [{ filter: `${EX} && level === 'debug'`, rate: TITHE_RATE }] } },
    { id: 'comment', conf: { comment: 'RITE OF GOATIFICATION — performed by the Supreme Goat. Preview only: nothing is renamed.' } },
    { id: 'eval', filter: `${GO} && kind === 'pipeline'`, conf: { add: [{ name: 'goat_name', value: "'GOAT_' + name.toUpperCase().replace(/[^A-Z0-9]+/g,'_') + '_RITUAL'" }] } },
    { id: 'eval', filter: `${GO} && kind === 'destination'`, conf: { add: [{ name: 'goat_name', value: "'THE_HOLY_' + name.toUpperCase().replace(/[^A-Z0-9]+/g,'_')" }] } },
    { id: 'eval', filter: `${GO} && kind === 'event'`, conf: { add: [{ name: 'goat_name', value: "'GOATIFICATION COMPLETE'" }] } },
    { id: 'rename', filter: GO, conf: { rename: [{ currentName: 'name', newName: 'mortal_name' }] } },
  ],
};

// ── Offline emulator (demo mode / engine unreachable). Mirrors RITE_PIPELINE. ─────────────

export function emulateRite(input: Json[]): Json[] {
  const out: Json[] = [];
  let debugSeen = 0;
  input.forEach((src, id) => {
    const e: Json = { ...src, __id: id };
    if (e.rite === 'exorcism') {
      if (Number(e.heresy_level) >= 9000) return;
      if (e.species !== 'goat') {
        e._raw = str(e._raw).replace(/666/g, '🐐🐐🐐').replace(/(password|token)=\S+/gi, '$1=[BLESSED]');
        e.purified = true;
        e.purified_by = 'High Priestess of Telemetry';
        e.blessing = MD5_666;
        delete e.curse;
        delete e.demonic_payload;
        delete e.ectoplasm;
      }
      if (e.level === 'debug') {
        debugSeen++;
        if (debugSeen % TITHE_RATE !== 2) return;
        e.sampled = TITHE_RATE;
      }
    } else if (e.rite === 'goatify') {
      const name = str(e.name);
      const shout = name.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
      e.goat_name = e.kind === 'pipeline' ? `GOAT_${shout}_RITUAL` : e.kind === 'destination' ? `THE_HOLY_${shout}` : 'GOATIFICATION COMPLETE';
      e.mortal_name = name;
      delete e.name;
    }
    out.push(e);
  });
  return out;
}

// ── Deriving what each stage did, from input + output ─────────────────────────────────────

const bytesOf = (e: Json): number =>
  new TextEncoder().encode(JSON.stringify(Object.fromEntries(Object.entries(e).filter(([k]) => !k.startsWith('__') && k !== 'rite')))).length;

export function deriveRite(input: Json[], output: Json[]): { exorcism: ExorcismResult; goatified: GoatPair[] } {
  const byId = new Map<number, Json>();
  output.forEach((e) => byId.set(Number(e.__id), e));

  const exIn = input.map((e, id) => ({ e, id })).filter(({ e }) => e.rite === 'exorcism');
  const survived = exIn.filter(({ id }) => byId.has(id));
  const missing = exIn.filter(({ id }) => !byId.has(id));
  const banished = missing.filter(({ e }) => Number(e.heresy_level) >= 9000).length;
  const tithed = missing.length - banished;
  const afterBanish = exIn.length - banished;
  const outOf = (id: number): Json => byId.get(id) ?? {};
  // Mask and Eval run before Sampling, so tithed events were also sealed and anointed. Survivors
  // prove the functions fired; tithed events are added back when they did.
  const sealedSurvivors = survived.filter(({ e, id }) => str(outOf(id)._raw) !== str(e._raw)).length;
  const purifiedOut = survived.map(({ id }) => outOf(id)).filter((o) => o.purified === true || o.purified === 'true');
  const resisted = survived.map(({ id }) => outOf(id)).filter((o) => o.species === 'goat');

  const stages: StageCount[] = [
    { id: 'banish', func: 'drop', label: 'BANISH', eventsIn: exIn.length, eventsOut: afterBanish, touched: banished },
    { id: 'seal', func: 'mask', label: 'SEAL THE SECRETS', eventsIn: afterBanish, eventsOut: afterBanish, touched: sealedSurvivors ? sealedSurvivors + tithed : 0 },
    { id: 'anoint', func: 'eval', label: 'ANOINT', eventsIn: afterBanish, eventsOut: afterBanish, touched: purifiedOut.length ? purifiedOut.length + tithed : 0 },
    { id: 'tithe', func: 'sampling', label: 'TITHE', eventsIn: afterBanish, eventsOut: survived.length, touched: tithed },
  ];

  const bytesIn = exIn.reduce((n, { e }) => n + bytesOf(e), 0);
  const bytesOut = survived.reduce((n, { id }) => n + bytesOf(outOf(id)), 0);

  const goatified: GoatPair[] = output
    .filter((e) => e.rite === 'goatify')
    .map((e) => ({ kind: (str(e.kind) as GoatPair['kind']) || 'event', mortal: str(e.mortal_name ?? e.name), goat: str(e.goat_name) }))
    .filter((p) => p.goat);

  return {
    exorcism: {
      eventsIn: exIn.length,
      eventsOut: survived.length,
      purified: purifiedOut.length,
      resisted: resisted.map((r) => stripInternal(r)),
      purifiedSample: purifiedOut[0] ? stripInternal(purifiedOut[0]) : undefined,
      stages,
      bytesIn,
      bytesOut,
      bytesReducedPct: bytesIn ? Math.round(100 * (1 - bytesOut / bytesIn)) : 0,
    },
    goatified,
  };
}

const stripInternal = (e: Json): Json => Object.fromEntries(Object.entries(e).filter(([k]) => !k.startsWith('__') && k !== 'rite'));

// ── Perform ───────────────────────────────────────────────────────────────────────────────

export async function performRite(group: string, input: Json[]): Promise<Sourced<RiteResult>> {
  const purpose = 'The builders began the rite: exorcism + goatification in the Cribl engine (preview — nothing is saved)';
  const t0 = performance.now();
  const body = { mode: 'pipe', pipelineId: 'goat_exorcism', sampleId: '', timeout: 20_000, events: input, pipelineConf: RITE_PIPELINE };

  const offline = (reason: string, path: string): Sourced<RiteResult> => {
    const derived = deriveRite(input, emulateRite(input));
    return { value: { ...derived, ms: Math.round(performance.now() - t0), path }, simulated: true, reason, source: path };
  };

  const groupPath = `/m/${encodeURIComponent(group)}/preview`;
  if (isDemoMode()) {
    recordSimulated('POST', groupPath, purpose);
    return offline('Performing the rite from memory', groupPath);
  }

  let lastReason = 'The engine did not answer';
  for (const path of [groupPath, '/preview?product=stream']) {
    const r = await criblFetch('POST', path, { purpose, body, timeoutMs: 28_000 });
    const items = itemsOf(r.data);
    if (r.ok && items.length > 0) {
      const derived = deriveRite(input, items);
      return { value: { ...derived, ms: r.ms, path }, simulated: false, source: path };
    }
    const msg = isObj(r.data) ? str(r.data.message) : '';
    lastReason = r.ok ? (msg || 'The engine returned no events') : describeFailure(r.status);
  }
  return offline(`${lastReason} — performed by the offline emulator`, groupPath);
}
