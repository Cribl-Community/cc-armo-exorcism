// "Performing the rite from memory": realistic stand-ins used in demo mode and for any slice
// the judge's tenant cannot provide. Everything built from these is shown with the 🟡 sigil.
import type { Book, HeresyItem, LeaderInfo, RouteInfo, Scroll, StatusItem, Totals } from './types';

export const FIXTURE_PIPELINES = ['main', 'passthru', 'security_logs', 'cisco_asa', 'palo_alto_traffic', 'devnull', 'goat_offerings'];

export const FIXTURE_ROUTES: RouteInfo[] = [
  { name: 'firewall-to-lake', filter: "sourcetype=='pan:traffic'", pipeline: 'palo_alto_traffic', output: 'cribl_lake', disabled: false, final: true },
  { name: 'security', filter: "__inputId.startsWith('syslog')", pipeline: 'security_logs', output: 'splunk_prod', disabled: false, final: true },
  { name: 'asa', filter: "sourcetype=='cisco:asa'", pipeline: 'cisco_asa', output: 's3_archive', disabled: false, final: true },
  { name: 'default', filter: 'true', pipeline: 'main', output: 'devnull', disabled: false, final: false },
];

export const FIXTURE_SOURCES: StatusItem[] = [
  { id: 'syslog:in_syslog', type: 'syslog', health: 'Green' },
  { id: 'http:in_http', type: 'http', health: 'Green' },
  { id: 'splunk_hec:in_splunk_hec', type: 'splunk_hec', health: 'Green' },
  { id: 'datagen:goat_offerings', type: 'datagen', health: 'Green' },
  { id: 'kafka:in_kafka_heresy', type: 'kafka', health: 'Red' },
  { id: 'tcp:in_tcp', type: 'tcp', health: 'Yellow' },
];

export const FIXTURE_DESTINATIONS: StatusItem[] = [
  { id: 'devnull', type: 'devnull', health: 'Green' },
  { id: 'splunk_prod', type: 'splunk_hec', health: 'Green' },
  { id: 'cribl_lake', type: 'cribl_lake', health: 'Green' },
  { id: 's3_archive', type: 's3', health: 'Yellow' },
];

export const FIXTURE_TOTALS: Totals = { events: 4_281_932, bytes: 3_418_205_117, dropped: 66_613 };

export const fixtureSeries = (): number[] =>
  Array.from({ length: 60 }, (_, i) => Math.round(70_000 + 18_000 * Math.sin(i / 6) + 9_000 * Math.sin(i / 1.7)));

export const FIXTURE_HERESY: HeresyItem[] = [
  { kind: 'source', title: 'kafka:in_kafka_heresy', severity: 'Red' },
  { kind: 'source', title: 'tcp:in_tcp', severity: 'Yellow' },
  { kind: 'leader', title: 'A goat was detected in the Leader', severity: 'Red' },
];

export const FIXTURE_LEADER: LeaderInfo = {
  version: '4.20.1',
  messages: [{ title: 'A goat was detected in the Leader', severity: 'error' }],
};

export const FIXTURE_SCROLLS: Scroll[] = [
  { message: 'Pipeline function returned an unholy value', channel: 'func:eval' },
  { message: 'Destination backpressure: the Goat is eating faster than Splunk can index', channel: 'output:splunk_prod' },
  { message: 'Connection reset by goat', channel: 'input:in_kafka_heresy' },
];

export const emptyBook = (): Book => ({
  believers: 0,
  sacrifices: { ceo: 0, pipeline: 0, logs: 0 },
  finalFirst: { calm: 0, run: 0, summon: 0 },
});
