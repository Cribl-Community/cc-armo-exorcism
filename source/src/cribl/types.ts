export type Health = 'Green' | 'Yellow' | 'Red' | 'Unknown';

/** A value plus where it came from. `simulated` values are shown with the 🟡 sigil. */
export interface Sourced<T> {
  value: T;
  simulated: boolean;
  /** Why the value is simulated (e.g. "403 — the Goat was denied access"). */
  reason?: string;
  /** Endpoint the value came from, for tooltips. */
  source?: string;
}

export interface StatusItem {
  id: string;
  type: string;
  health: Health;
}

export interface RouteInfo {
  name: string;
  filter: string;
  pipeline: string;
  output: string;
  disabled: boolean;
  final: boolean;
}

export interface Census {
  pipelines: Sourced<string[]>;
  routes: Sourced<RouteInfo[]>;
  sources: Sourced<StatusItem[]>;
  destinations: Sourced<StatusItem[]>;
}

export interface Totals {
  events: number;
  bytes: number;
  dropped: number;
}

export interface LeaderMessage {
  title: string;
  severity: string;
}

export interface LeaderInfo {
  version: string;
  messages: LeaderMessage[];
}

export interface HeresyItem {
  kind: 'source' | 'destination' | 'leader';
  title: string;
  severity: 'Red' | 'Yellow';
}

export interface Scroll {
  message: string;
  channel: string;
}

export interface Judge {
  name: string;
  greeted: boolean;
}

export type Sacrifice = 'ceo' | 'pipeline' | 'logs';
export type FinalChoice = 'calm' | 'run' | 'summon';

export interface Book {
  believers: number;
  sacrifices: Record<Sacrifice, number>;
  finalFirst: Record<FinalChoice, number>;
  lastRitualAt?: string;
}

export interface StageCount {
  id: 'banish' | 'seal' | 'anoint' | 'tithe';
  func: 'drop' | 'mask' | 'eval' | 'sampling';
  label: string;
  eventsIn: number;
  eventsOut: number;
  /** How many events this stage acted on (dropped, masked, anointed, sampled away). */
  touched: number;
}

export interface ExorcismResult {
  eventsIn: number;
  eventsOut: number;
  purified: number;
  resisted: Record<string, unknown>[];
  purifiedSample?: Record<string, unknown>;
  stages: StageCount[];
  bytesIn: number;
  bytesOut: number;
  bytesReducedPct: number;
}

export interface GoatPair {
  kind: 'pipeline' | 'destination' | 'event';
  mortal: string;
  goat: string;
}

export interface RiteResult {
  exorcism: ExorcismResult;
  goatified: GoatPair[];
  ms: number;
  path: string;
}
