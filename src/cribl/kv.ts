// The Book of Offerings: anonymous ritual counters shared by every judge, in the app-scoped KV
// store. Verified on a live tenant: the store keeps the raw request body, so documents are
// written as text/plain JSON strings.
import { criblFetch, describeFailure, isDemoMode, recordSimulated } from './client';
import { emptyBook } from './fixtures';
import type { Book, Sourced } from './types';

const KEY = '/kvstore/church/book';

function parseBook(text: string): Book {
  try {
    const doc = JSON.parse(text) as Partial<Book>;
    const base = emptyBook();
    return {
      believers: Number(doc.believers ?? 0),
      sacrifices: { ...base.sacrifices, ...doc.sacrifices },
      finalFirst: { ...base.finalFirst, ...doc.finalFirst },
      lastRitualAt: doc.lastRitualAt,
    };
  } catch {
    return emptyBook();
  }
}

let memoryBook = emptyBook();
// Serialize read-modify-write within this session so quick clicks never lose an update.
let queue: Promise<unknown> = Promise.resolve();

async function read(): Promise<Sourced<Book>> {
  if (isDemoMode()) {
    recordSimulated('GET', KEY, 'Open the Book of Offerings');
    return { value: memoryBook, simulated: true, reason: 'Performing the rite from memory', source: KEY };
  }
  const r = await criblFetch('GET', KEY, { purpose: 'Open the Book of Offerings' });
  if (r.status === 404) return { value: emptyBook(), simulated: false, source: KEY };
  if (!r.ok) return { value: memoryBook, simulated: true, reason: describeFailure(r.status), source: KEY };
  return { value: parseBook(r.text), simulated: false, source: KEY };
}

export const loadBook = (): Promise<Sourced<Book>> => read();

export function updateBook(purpose: string, mutate: (b: Book) => Book): Promise<Sourced<Book>> {
  const job = queue.then(async (): Promise<Sourced<Book>> => {
    const current = await read();
    const next = { ...mutate(current.value), lastRitualAt: new Date().toISOString() };
    memoryBook = next;
    if (current.simulated) {
      if (isDemoMode()) recordSimulated('PUT', KEY, purpose);
      return { ...current, value: next };
    }
    const w = await criblFetch('PUT', KEY, { purpose, body: JSON.stringify(next), textBody: true });
    return w.ok ? { value: next, simulated: false, source: KEY } : { value: next, simulated: true, reason: describeFailure(w.status), source: KEY };
  });
  queue = job.catch(() => undefined);
  return job;
}

/** Deletes the Book. Only call from the confirmation modal in Settings. */
export async function forgetBook(): Promise<boolean> {
  memoryBook = emptyBook();
  if (isDemoMode()) {
    recordSimulated('DELETE', KEY, 'Burn the Book of Offerings');
    return true;
  }
  const r = await criblFetch('DELETE', KEY, { purpose: 'Burn the Book of Offerings', confirmed: true });
  return r.ok || r.status === 404;
}
