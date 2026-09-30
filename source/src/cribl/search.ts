// Heresy Scrolls: recent errors from Cribl's own logs, via Cribl Search (Cribl.Cloud only).
// A job takes ~15–20 s, so it is started during the Façade and read on the Incident screen.
import { criblFetch, isDemoMode, isObj, itemsOf, recordSimulated, str } from './client';
import { FIXTURE_SCROLLS } from './fixtures';
import type { Scroll, Sourced } from './types';

const JOBS = '/m/default_search/search/jobs';
const QUERY = 'dataset="cribl_internal_logs" | where level=="error" | limit 5';
const POLL_MS = 1500;
const MAX_WAIT_MS = 45_000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function readHeresyScrolls(): Promise<Sourced<Scroll[]>> {
  if (isDemoMode()) {
    recordSimulated('POST', JOBS, 'Consult the Heresy Scrolls (Cribl Search)');
    return { value: FIXTURE_SCROLLS, simulated: true, reason: 'Performing the rite from memory', source: JOBS };
  }
  const unavailable = (reason: string): Sourced<Scroll[]> => ({ value: [], simulated: true, reason, source: JOBS });

  const created = await criblFetch('POST', JOBS, {
    purpose: 'Consult the Heresy Scrolls (Cribl Search)',
    body: { query: QUERY, earliest: '-24h', latest: 'now', isPrivate: true },
    timeoutMs: 15_000,
  });
  const id = itemsOf(created.data)[0]?.id;
  if (!created.ok || typeof id !== 'string') return unavailable('Cribl Search is not available here');

  const started = Date.now();
  while (Date.now() - started < MAX_WAIT_MS) {
    await sleep(POLL_MS);
    const st = await criblFetch('GET', `${JOBS}/${id}/status`, { purpose: 'Wait for the scrolls to unroll' });
    const state = str(itemsOf(st.data)[0]?.status);
    if (state === 'failed' || state === 'canceled') return unavailable(`Search job ${state}`);
    if (state === 'completed') break;
  }

  const res = await criblFetch('GET', `${JOBS}/${id}/results`, { purpose: 'Read the Heresy Scrolls', timeoutMs: 15_000 });
  if (!res.ok) return unavailable('Could not read the scrolls');
  // NDJSON: line 1 is job metadata, the rest are events. Only message + channel are shown.
  const scrolls = res.text
    .split('\n')
    .slice(1)
    .filter(Boolean)
    .flatMap((line): Scroll[] => {
      try {
        const e: unknown = JSON.parse(line);
        if (!isObj(e)) return [];
        const message = str(e.message ?? e._raw).slice(0, 110);
        return message ? [{ message, channel: str(e.channel ?? e.cid, 'cribl') }] : [];
      } catch {
        return [];
      }
    });
  return { value: scrolls, simulated: false, source: JOBS };
}
