import { describe, expect, it } from 'vitest';
import { criblFetch, scripture, summarizeScripture } from './client';

describe('criblFetch allowlist', () => {
  it('blocks anything that could change Cribl configuration, without calling the network', async () => {
    const attempts: Array<[string, string]> = [
      ['PATCH', '/m/default/pipelines/main'],
      ['POST', '/m/default/pipelines'],
      ['DELETE', '/m/default/system/outputs/devnull'],
      ['PUT', '/m/default/routes/default'],
      ['POST', '/system/inputs'],
    ];
    for (const [method, path] of attempts) {
      const r = await criblFetch(method, path, { purpose: 'test' });
      expect(r.status).toBe('BLOCKED');
    }
  });

  it('blocks an unconfirmed DELETE even on the app’s own KV key', async () => {
    const r = await criblFetch('DELETE', '/kvstore/church/book', { purpose: 'test' });
    expect(r.status).toBe('BLOCKED');
  });

  it('counts blocked attempts but never as config mutations', () => {
    const summary = summarizeScripture(scripture.getSnapshot());
    expect(summary.blocked).toBe(6);
    expect(summary.configMutations).toBe(0);
    expect(summary.calls).toBe(0);
  });
});
