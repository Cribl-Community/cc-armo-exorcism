import { useRef, useState } from 'react';
import { Alert, Button, Pill, Text } from '@capra/core';
import { runProbe, type ProbeReport, type ProbeResult } from './probe';
import './probe.css';

function statusAppearance(r: ProbeResult): 'success' | 'danger' | 'warning' | 'default' {
  if (r.status === 'SKIPPED') return 'default';
  if (r.ok) return 'success';
  if (r.status === 404) return 'warning';
  return 'danger';
}

export default function ProbePage({ onExit }: { onExit: () => void }) {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<ProbeResult[]>([]);
  const [report, setReport] = useState<ProbeReport | null>(null);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'select'>('idle');
  const reportRef = useRef<HTMLTextAreaElement>(null);

  const start = async () => {
    setRunning(true);
    setResults([]);
    setReport(null);
    setCopyState('idle');
    try {
      const r = await runProbe((res) => setResults((prev) => [...prev, res]));
      setReport(r);
    } finally {
      setRunning(false);
    }
  };

  const copy = async () => {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
      setCopyState('copied');
    } catch {
      // Clipboard is often blocked inside the sandboxed iframe — select the text instead.
      reportRef.current?.select();
      setCopyState('select');
    }
  };

  return (
    <div className="probe-page">
      <header className="probe-header">
        <div className="probe-header__row">
          <Text as="h1" variant="heading">🐐 Tenant probe (step 0)</Text>
          <div className="probe-header__actions">
            <Button variant="secondary" onClick={onExit} disabled={running}>Back</Button>
            <Button variant="primary" onClick={() => void start()} pending={running} disabled={running}>
              {report ? 'Run probe again' : 'Run probe'}
            </Button>
          </div>
        </div>
        <Text as="p" variant="body" color="subtle">
          Checks every Cribl call the Church of Goat depends on. It only reads config, runs pipeline
          previews (nothing is saved), creates one small search job, and writes a single key in this
          app's own KV store.
        </Text>
      </header>

      {results.length > 0 && (
        <table className="probe-table">
          <thead>
            <tr>
              <th>Check</th>
              <th>Call</th>
              <th>Status</th>
              <th>ms</th>
              <th>Finding</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.id}>
                <td>{r.label}</td>
                <td className="probe-mono">{r.method} {r.path}</td>
                <td><Pill appearance={statusAppearance(r)} variant="muted">{String(r.status)}</Pill></td>
                <td className="probe-mono">{r.ms}</td>
                <td>{r.finding}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {report && (
        <section className="probe-report">
          <Alert appearance="info" title="Send this report back">
            Copy the JSON below and paste it into the chat. It contains response snippets from your
            tenant (resource names, counts, the Cribl version), but no credentials.
          </Alert>
          <div className="probe-header__actions">
            <Button variant="primary" onClick={() => void copy()}>Copy report</Button>
            {copyState === 'copied' && <Text variant="body-sm-normal" color="subtle">Copied to clipboard.</Text>}
            {copyState === 'select' && <Text variant="body-sm-normal" color="subtle">Clipboard blocked by the iframe. The text is selected: press Ctrl+C.</Text>}
          </div>
          <textarea ref={reportRef} className="probe-json" readOnly value={JSON.stringify(report, null, 2)} />
        </section>
      )}
    </div>
  );
}
