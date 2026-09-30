import { useSyncExternalStore } from 'react';
import { Drawer, Pill, Text } from '@capra/core';
import { scripture, summarizeScripture, type ScriptureEntry } from '../../cribl/client';
import { useRitual } from '../../state/ritual';

function appearance(e: ScriptureEntry): 'success' | 'danger' | 'warning' | 'default' | 'info' {
  if (e.status === 'SIM') return 'info';
  if (e.status === 'BLOCKED') return 'warning';
  if (typeof e.status === 'number' && e.status < 400) return 'success';
  if (e.status === 404) return 'warning';
  return 'danger';
}

export function ScriptureDrawer() {
  const { state, actions } = useRitual();
  const entries = useSyncExternalStore(scripture.subscribe, scripture.getSnapshot);
  const s = summarizeScripture(entries);

  return (
    <Drawer
      isOpen={state.scriptureOpen}
      onClose={() => actions.patch({ scriptureOpen: false })}
      modal={false}
      width={600}
      title={<Drawer.Heading>📜 The Scripture</Drawer.Heading>}
    >
      <div className="r-scripture">
        <Text as="p" variant="body-sm-normal" color="subtle">
          Every Cribl API call the Goat made, as it happened. {s.calls} calls · {s.engineRuns} engine run(s) ·{' '}
          {s.kvWrites} KV write(s) · {s.blocked} blocked · <strong>{s.configMutations} config mutations</strong>
          {s.simulated > 0 && ` · ${s.simulated} simulated`}
        </Text>
        <ol className="r-scripture__list" reversed>
          {[...entries].reverse().map((e) => (
            <li key={e.id} className="r-scripture__entry">
              <div className="r-scripture__row">
                <Pill appearance={appearance(e)} variant="muted">{String(e.status)}</Pill>
                <Text variant="body-sm-semibold">{e.purpose}</Text>
              </div>
              <code className="r-scripture__call">{e.method} {e.path}{e.ms ? ` · ${e.ms} ms` : ''}</code>
              {(e.request || e.response) && (
                <details className="r-scripture__details">
                  <summary>Request / response</summary>
                  {e.request && <pre>{e.request}</pre>}
                  {e.response && <pre>{e.response}</pre>}
                </details>
              )}
            </li>
          ))}
        </ol>
      </div>
    </Drawer>
  );
}
