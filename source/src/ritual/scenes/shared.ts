import { useEffect, useState } from 'react';

export const formatCount = (n: number): string => Math.round(n).toLocaleString('en-US');

export function formatBytes(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)} TB`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} GB`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} MB`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)} KB`;
  return `${Math.round(n)} B`;
}

export const SACRIFICE_NAME = { ceo: 'CEO', pipeline: 'PIPELINE', logs: '1 GB OF LOGS' } as const;

/** The pipeline offered on the altar: `main` if it exists, else the first interesting one. */
export function pipelineOffering(pipelines?: string[]): string {
  const ps = pipelines ?? [];
  return ps.includes('main') ? 'main' : ps.find((p) => p !== 'devnull' && p !== 'passthru') ?? ps[0] ?? 'main';
}

export const RITE_NODES = [
  { id: 'banish', label: 'BANISH', func: 'drop', glyph: '🚫' },
  { id: 'seal', label: 'SEAL THE SECRETS', func: 'mask', glyph: '🔏' },
  { id: 'anoint', label: 'ANOINT', func: 'eval', glyph: '🫗' },
  { id: 'tithe', label: 'TITHE', func: 'sampling', glyph: '⚖️' },
] as const;

/** Milliseconds since `since`, ticking while `running`. */
export function useElapsed(since?: number, running = true): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!since || !running) return;
    const t = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(t);
  }, [since, running]);
  return since ? Math.max(0, now - since) : 0;
}

export function incidentTicket(soul?: number): string {
  return `GOAT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(soul ?? 0).padStart(3, '0')}`;
}
