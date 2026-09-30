import { useState, useEffect, useCallback } from 'react';
import { Spinner, EmptyState, Text, Tooltip, CustomTooltipTrigger, Button } from '@capra/core';

type Health = 'Green' | 'Yellow' | 'Red' | 'Unknown';

interface WorkerGroup {
  id: string;
}

interface SourceStatus {
  id: string;
  type?: string;
  status: {
    health: Health;
    healthCounts?: Partial<Record<Health, number>>;
    error?: { message: string };
  };
}

interface ApiList<T> {
  items: T[];
}

interface GroupPasture {
  group: WorkerGroup;
  sources: SourceStatus[];
  error?: string;
}

const HEALTH_LABEL: Record<Health, string> = {
  Green: 'Healthy',
  Yellow: 'Degraded',
  Red: 'Critical',
  Unknown: 'Unknown',
};

const GOAT_CLASS: Record<Health, string> = {
  Green: 'goat--grazing',
  Yellow: 'goat--wobbly',
  Red: 'goat--down',
  Unknown: 'goat--unknown',
};

// Worst-of across the aggregate and every Worker Process, so one sick process is enough to separate the goat.
function healthOf(source: SourceStatus): Health {
  const status = source.status;
  const counts = status?.healthCounts ?? {};
  if (status?.health === 'Red' || (counts.Red ?? 0) > 0) return 'Red';
  if (status?.health === 'Yellow' || (counts.Yellow ?? 0) > 0 || status?.error) return 'Yellow';
  if (status?.health === 'Green') return 'Green';
  return 'Unknown';
}

const DEMO_PASTURES: GroupPasture[] = [
  {
    group: { id: 'default' },
    sources: [
      { id: 'in_syslog', type: 'syslog', status: { health: 'Green' } },
      { id: 'in_http', type: 'http', status: { health: 'Green' } },
      { id: 'in_splunk_hec', type: 'splunk_hec', status: { health: 'Green' } },
      { id: 'broken_goat', type: 'kafka', status: { health: 'Red', error: { message: 'Connection to broker failed' } } },
      { id: 'slow_goat', type: 'tcp', status: { health: 'Yellow' } },
      { id: 'mystery_goat', type: 'cribl', status: { health: 'Unknown' } },
    ],
  },
  { group: { id: 'edge_barn' }, sources: [{ id: 'in_file', type: 'file', status: { health: 'Green' } }] },
  { group: { id: 'empty_field' }, sources: [] },
];

const isDemo = new URLSearchParams(window.location.search).has('demo');

function GoatFigure({ source }: { source: SourceStatus }) {
  const health = healthOf(source);
  const parts = [source.id, source.type, HEALTH_LABEL[health], source.status?.error?.message].filter(Boolean);
  const label = parts.join(' · ');
  return (
    <Tooltip title={label}>
      <CustomTooltipTrigger>
        <span className={`goat ${GOAT_CLASS[health]}`} role="img" aria-label={`Source ${label}`} tabIndex={0}>
          <span className="goat__emoji" aria-hidden="true">🐐</span>
          <span className="goat__label">{source.id}</span>
        </span>
      </CustomTooltipTrigger>
    </Tooltip>
  );
}

function PastureField({ pasture }: { pasture: GroupPasture }) {
  const { group, sources, error } = pasture;
  const herd = sources.filter(s => healthOf(s) === 'Green');
  const strays = sources.filter(s => healthOf(s) !== 'Green');

  return (
    <article className="field">
      <header className="field__header">
        <Text as="h2" variant="heading-sm">{group.id}</Text>
        {!error && (
          <Text as="span" variant="body-sm-normal" color="subtle">
            {herd.length}/{sources.length} sources healthy
          </Text>
        )}
      </header>

      <div className="field__fence">
        {error && (
          <div className="field__empty-label">
            <Text variant="body-sm-normal" color="subtle">Couldn't check this field: {error}</Text>
          </div>
        )}

        {!error && sources.length === 0 && (
          <div className="field__empty-label">
            <Text variant="body-sm-normal" color="subtle">No sources grazing here</Text>
          </div>
        )}

        {herd.length > 0 && (
          <div className="field__herd">
            {herd.map(s => <GoatFigure key={s.id} source={s} />)}
          </div>
        )}

        {strays.length > 0 && (
          <div className="field__stray">
            <span className="field__stray-label">Separated from herd</span>
            <div className="field__stray-goats">
              {strays.map(s => <GoatFigure key={s.id} source={s} />)}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function App() {
  const [pastures, setPastures] = useState<GroupPasture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (isDemo) {
      setPastures(DEMO_PASTURES);
      setLoading(false);
      return;
    }
    const base = window.CRIBL_API_URL ?? '/api/v1';
    const getList = async <T,>(path: string): Promise<ApiList<T>> => {
      const r = await fetch(`${base}${path}`, { cache: 'no-store' });
      if (!r.ok) throw new Error(`${path} returned HTTP ${r.status}`);
      return r.json() as Promise<ApiList<T>>;
    };

    try {
      const groups = (await getList<WorkerGroup>('/products/stream/groups')).items ?? [];
      // One field failing (e.g. a group with no Workers) shouldn't empty the whole pasture.
      const results = await Promise.allSettled(
        groups.map(g => getList<SourceStatus>(`/m/${encodeURIComponent(g.id)}/system/status/inputs?type=true`)),
      );
      setPastures(
        groups.map((group, i) => {
          const r = results[i];
          return r.status === 'fulfilled'
            ? { group, sources: r.value.items ?? [] }
            : { group, sources: [], error: String(r.reason instanceof Error ? r.reason.message : r.reason) };
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const allSources = pastures.flatMap(p => p.sources);
  const grazingCount = allSources.filter(s => healthOf(s) === 'Green').length;
  const separatedCount = allSources.length - grazingCount;

  return (
    <div className="pasture-page">
      <header className="pasture-header">
        <div className="pasture-header__title-row">
          <Text as="h1" variant="heading">🐐 ArMoGoat</Text>
          <Button onClick={() => void load()} variant="secondary" disabled={loading}>
            Refresh
          </Button>
        </div>
        {!loading && !error && (
          <Text as="p" variant="body" color="subtle">
            {pastures.length} field{pastures.length !== 1 ? 's' : ''} ·{' '}
            {grazingCount} source{grazingCount !== 1 ? 's' : ''} grazing · {separatedCount} separated
            {isDemo && ' · demo data'}
          </Text>
        )}
      </header>

      <main className="pasture-main">
        {loading && (
          <div className="pasture-center">
            <Spinner size="lg" title="Counting goats…" />
          </div>
        )}

        {!loading && error && (
          <div className="pasture-center">
            <EmptyState title="Couldn't load the pasture" description={error} size="lg">
              <Button onClick={() => void load()} variant="primary">Try again</Button>
            </EmptyState>
          </div>
        )}

        {!loading && !error && pastures.length === 0 && (
          <div className="pasture-center">
            <EmptyState
              title="No Worker Groups"
              description="No worker groups were found in this Cribl Stream deployment."
              size="lg"
            />
          </div>
        )}

        {!loading && !error && pastures.length > 0 && (
          <div className="pasture-grid">
            {pastures.map(p => <PastureField key={p.group.id} pasture={p} />)}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
