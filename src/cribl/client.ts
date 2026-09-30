// Every Cribl call goes through criblFetch(). It enforces the Church's one hard rule — the app
// can never change Cribl configuration — and records each call in the Scripture, the audit log
// judges can open at any time.

export type CallStatus = number | 'ERR' | 'TIMEOUT' | 'BLOCKED' | 'SIM';
export type CallKind = 'read' | 'engine' | 'metrics' | 'kv' | 'search' | 'blocked';

export interface ScriptureEntry {
  id: number;
  at: number;
  method: string;
  path: string;
  status: CallStatus;
  ms: number;
  kind: CallKind;
  purpose: string;
  request?: string;
  response?: string;
}

export interface CallResult {
  status: CallStatus;
  ok: boolean;
  data: unknown;
  text: string;
  ms: number;
}

export interface CallOptions {
  /** One line shown in the Scripture ("Count the sacred pipelines"). */
  purpose: string;
  body?: unknown;
  /** Send the body as text/plain (the KV store keeps the raw body). */
  textBody?: boolean;
  timeoutMs?: number;
  /** Required for DELETE: set only by code paths behind an explicit confirmation modal. */
  confirmed?: boolean;
}

const SNIPPET = 2000;
const DEFAULT_TIMEOUT_MS = 8000;

// Non-GET calls the Church is allowed to make. None of them change Cribl configuration:
// previews run in a throwaway engine process, metrics and search are queries, KV is app-scoped.
const ALLOWED_NON_GET: Array<{ method: string; pattern: RegExp; kind: CallKind }> = [
  { method: 'POST', pattern: /^\/m\/[^/]+\/preview$/, kind: 'engine' },
  { method: 'POST', pattern: /^\/preview$/, kind: 'engine' },
  { method: 'POST', pattern: /^\/system\/metrics\/query$/, kind: 'metrics' },
  { method: 'POST', pattern: /^\/m\/default_search\/search\/jobs$/, kind: 'search' },
  { method: 'PUT', pattern: /^\/kvstore\/church\/[\w-]+$/, kind: 'kv' },
  { method: 'DELETE', pattern: /^\/kvstore\/church\/[\w-]+$/, kind: 'kv' },
];

function classify(method: string, path: string): CallKind | null {
  const bare = path.split('?')[0];
  if (method === 'GET') {
    if (bare.startsWith('/kvstore/')) return 'kv';
    if (bare.startsWith('/m/default_search/search/')) return 'search';
    return 'read';
  }
  return ALLOWED_NON_GET.find((a) => a.method === method && a.pattern.test(bare))?.kind ?? null;
}

// ── Scripture store (subscribe/getSnapshot for useSyncExternalStore) ──────────────────────

let entries: ScriptureEntry[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

export const scripture = {
  subscribe(fn: () => void): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  getSnapshot(): ScriptureEntry[] {
    return entries;
  },
  add(e: Omit<ScriptureEntry, 'id' | 'at'>): void {
    entries = [...entries, { ...e, id: nextId++, at: Date.now() }];
    listeners.forEach((fn) => fn());
  },
};

export interface ScriptureSummary {
  calls: number;
  engineRuns: number;
  kvWrites: number;
  blocked: number;
  simulated: number;
  /** Executed calls that could change Cribl configuration. The allowlist makes this 0; it is still counted, not assumed. */
  configMutations: number;
  endpoints: string[];
}

export function summarizeScripture(list: ScriptureEntry[]): ScriptureSummary {
  const executed = list.filter((e) => e.status !== 'BLOCKED' && e.status !== 'SIM');
  const endpoints = [...new Set(executed.map((e) => `${e.method} ${e.path.split('?')[0].replace(/\/jobs\/[^/]+/, '/jobs/{id}')}`))];
  return {
    calls: executed.length,
    engineRuns: executed.filter((e) => e.kind === 'engine').length,
    kvWrites: executed.filter((e) => e.kind === 'kv' && e.method !== 'GET').length,
    blocked: list.filter((e) => e.status === 'BLOCKED').length,
    simulated: list.filter((e) => e.status === 'SIM').length,
    configMutations: executed.filter((e) => e.method !== 'GET' && classify(e.method, e.path) === null).length,
    endpoints,
  };
}

// ── Mode ──────────────────────────────────────────────────────────────────────────────────

let demoMode = false;
export const setDemoMode = (on: boolean): void => {
  demoMode = on;
};
export const isDemoMode = (): boolean => demoMode;

/** Record what LIVE mode would have called, without calling it. */
export function recordSimulated(method: string, path: string, purpose: string): void {
  scripture.add({ method, path, status: 'SIM', ms: 0, kind: classify(method, path) ?? 'read', purpose });
}

// ── Fetch ─────────────────────────────────────────────────────────────────────────────────

const apiBase = (): string => window.CRIBL_API_URL ?? '/api/v1';
const snippet = (v: unknown): string | undefined =>
  v === undefined ? undefined : (typeof v === 'string' ? v : JSON.stringify(v)).slice(0, SNIPPET);

export class CriblCallError extends Error {
  readonly status: CallStatus;
  constructor(status: CallStatus, message: string) {
    super(message);
    this.status = status;
  }
}

export async function criblFetch(method: string, path: string, opts: CallOptions): Promise<CallResult> {
  const kind = classify(method, path);
  if (kind === null || (method === 'DELETE' && !opts.confirmed)) {
    scripture.add({ method, path, status: 'BLOCKED', ms: 0, kind: 'blocked', purpose: `${opts.purpose} — blocked: the Church never changes Cribl configuration`, request: snippet(opts.body) });
    return { status: 'BLOCKED', ok: false, data: undefined, text: 'Blocked by the Church allowlist', ms: 0 };
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const t0 = performance.now();
  let result: CallResult;
  try {
    const hasBody = opts.body !== undefined;
    const res = await fetch(apiBase() + path, {
      method,
      cache: 'no-store',
      signal: ctrl.signal,
      headers: hasBody ? { 'content-type': opts.textBody ? 'text/plain' : 'application/json' } : undefined,
      body: hasBody ? (opts.textBody ? String(opts.body) : JSON.stringify(opts.body)) : undefined,
    });
    const text = await res.text();
    let data: unknown = text;
    try {
      data = JSON.parse(text);
    } catch {
      /* NDJSON or plain text — callers that need it parse `text` themselves */
    }
    // An HTML page means a web-server fallback answered (e.g. running outside Cribl), not the API.
    const isHtml = (res.headers.get('content-type') ?? '').includes('text/html');
    result = { status: res.status, ok: res.ok && !isHtml, data, text, ms: Math.round(performance.now() - t0) };
  } catch (err) {
    const aborted = err instanceof DOMException && err.name === 'AbortError';
    result = { status: aborted ? 'TIMEOUT' : 'ERR', ok: false, data: undefined, text: err instanceof Error ? err.message : String(err), ms: Math.round(performance.now() - t0) };
  } finally {
    clearTimeout(timer);
  }

  scripture.add({ method, path, status: result.status, ms: result.ms, kind, purpose: opts.purpose, request: snippet(opts.body), response: snippet(result.text) });
  return result;
}

/** criblFetch that throws unless the call succeeded; returns parsed JSON. */
export async function criblJson(method: string, path: string, opts: CallOptions): Promise<unknown> {
  const r = await criblFetch(method, path, opts);
  if (!r.ok) throw new CriblCallError(r.status, describeFailure(r.status));
  return r.data;
}

export function describeFailure(status: CallStatus): string {
  if (status === 401 || status === 403) return `${status} — the Goat was denied access`;
  if (status === 404) return '404 — not available on this tenant';
  if (status === 'TIMEOUT') return 'timed out';
  if (status === 'BLOCKED') return 'blocked by the Church allowlist';
  if (status === 'ERR') return 'Cribl could not be reached';
  return `HTTP ${String(status)}`;
}

export const failureReason = (err: unknown): string =>
  err instanceof CriblCallError ? err.message : err instanceof Error ? err.message : String(err);

// ── Small JSON helpers ────────────────────────────────────────────────────────────────────

export type Json = Record<string, unknown>;
export const isObj = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v);
export const itemsOf = (v: unknown): Json[] => (isObj(v) && Array.isArray(v.items) ? (v.items as Json[]) : []);
export const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : v == null ? fallback : String(v));
