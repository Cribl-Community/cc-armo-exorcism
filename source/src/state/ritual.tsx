/* eslint-disable react/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react';
import { setDemoMode } from '../cribl/client';
import { loadCensus, loadGroup, loadJudge, loadLeader, type GroupChoice } from '../cribl/census';
import { forgetBook, loadBook, updateBook } from '../cribl/kv';
import { loadInputHeresy, loadSeries, loadTotals } from '../cribl/metrics';
import { goatifyEvents, performRite, summonDemons } from '../cribl/rite';
import { readHeresyScrolls } from '../cribl/search';
import type { Book, Census, FinalChoice, HeresyItem, Judge, LeaderInfo, RiteResult, Sacrifice, Scroll, Sourced, Totals } from '../cribl/types';
import type { HostTheme } from '../host-theme';
import { useLatest } from '../ritual/useLatest';

export interface RitualState {
  scene: number;
  demo: boolean;
  theme: HostTheme;
  muted: boolean;
  autoplay: boolean;
  scriptureOpen: boolean;
  settingsOpen: boolean;
  /** Bumped on restart so every scene remounts cleanly. */
  runId: number;

  judge?: Sourced<Judge>;
  group?: Sourced<GroupChoice>;
  leader?: Sourced<LeaderInfo>;
  census?: Census;
  totals?: Sourced<Totals>;
  series?: Sourced<number[]>;
  inputHeresy?: Sourced<HeresyItem[]>;
  scrolls?: Sourced<Scroll[]>;
  book?: Sourced<Book>;
  environmentReady: boolean;

  soulNumber?: number;
  sacrifice?: Sacrifice;
  finalFirst?: FinalChoice;
  rite?: Sourced<RiteResult>;
  riteStartedAt?: number;
}

type Action =
  | { type: 'patch'; patch: Partial<RitualState> }
  | { type: 'go'; scene: number }
  | { type: 'advance'; from: number; max: number }
  | { type: 'restart' };

function reducer(state: RitualState, action: Action): RitualState {
  switch (action.type) {
    case 'patch':
      return { ...state, ...action.patch };
    case 'go':
      return { ...state, scene: action.scene };
    case 'advance':
      // Ignore stale requests (e.g. a timer in a scene that is already exiting).
      return state.scene === action.from ? { ...state, scene: Math.min(action.from + 1, action.max) } : state;
    case 'restart':
      return { ...state, scene: 0, runId: state.runId + 1, sacrifice: undefined, finalFirst: undefined, soulNumber: undefined, rite: undefined, riteStartedAt: undefined };
  }
}

// Follow the same source as the Capra tokens (the .dark class set by the theme bridge), so the Goat's
// alignment and the Capra surfaces never disagree. The bridge updates this on every toggle.
const initialTheme = (): HostTheme => (document.body.classList.contains('dark') ? 'dark' : 'light');

const initialState = (): RitualState => {
  const params = new URLSearchParams(window.location.search);
  const demo = params.has('demo');
  setDemoMode(demo);
  // Dev only: ?scene=N jumps straight to a scene for rehearsal and visual checks.
  const scene = import.meta.env.DEV ? Math.max(0, Number(params.get('scene')) || 0) : 0;
  return {
    scene, demo, theme: initialTheme(), muted: false, autoplay: false,
    scriptureOpen: false, settingsOpen: false, runId: 0, environmentReady: false,
  };
};

export interface RitualActions {
  patch: (p: Partial<RitualState>) => void;
  next: () => void;
  /** Advance only if `from` is still the current scene. */
  advanceFrom: (from: number) => void;
  back: () => void;
  go: (scene: number) => void;
  restart: () => void;
  setDemo: (on: boolean) => void;
  chooseGroup: (id: string) => void;
  recordBelief: () => void;
  recordSacrifice: (s: Sacrifice) => void;
  recordFinalChoice: (c: FinalChoice) => void;
  /** Start the rite in the Cribl engine. Idempotent per run: the builders only begin it once. */
  beginRite: () => void;
  burnBook: () => Promise<boolean>;
}

interface Ctx {
  state: RitualState;
  actions: RitualActions;
}

const RitualContext = createContext<Ctx | null>(null);

export function RitualProvider({ sceneCount, children }: { sceneCount: number; children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const stateRef = useLatest(state);
  const riteRunRef = useRef<number | null>(null);
  // Resolves when the current summon() has gathered the census; the rite waits on it.
  const envReadyRef = useRef<Promise<void>>(Promise.resolve());
  const envResolveRef = useRef<() => void>(() => undefined);
  const summonIdRef = useRef(0);

  const patch = useCallback((p: Partial<RitualState>) => dispatch({ type: 'patch', patch: p }), []);

  /** Gather everything the ritual needs from the tenant. Runs on mount and when the mode or group changes. */
  const summon = useCallback(async (preferredGroup?: string) => {
    const id = ++summonIdRef.current;
    envReadyRef.current = new Promise<void>((resolve) => { envResolveRef.current = resolve; });
    const current = () => id === summonIdRef.current;
    patch({ environmentReady: false, census: undefined, totals: undefined, series: undefined, inputHeresy: undefined, scrolls: undefined });

    void loadJudge().then((judge) => current() && patch({ judge }));
    void loadLeader().then((leader) => current() && patch({ leader }));
    void loadBook().then((book) => current() && patch({ book }));
    // Search takes ~15–20 s; start it now so the scrolls are ready by the Incident screen.
    void readHeresyScrolls().then((scrolls) => current() && patch({ scrolls }));

    const group = await loadGroup(preferredGroup);
    if (!current()) return;
    patch({ group });
    const [census, totals, series, inputHeresy] = await Promise.all([
      loadCensus(group.value.chosen), loadTotals(), loadSeries(), loadInputHeresy(),
    ]);
    if (!current()) return;
    patch({ census, totals, series, inputHeresy, environmentReady: true });
    envResolveRef.current();
  }, [patch]);

  useEffect(() => {
    void summon();
  }, [summon]);

  const actions = useMemo<RitualActions>(() => ({
    patch,
    next: () => dispatch({ type: 'go', scene: Math.min(stateRef.current.scene + 1, sceneCount - 1) }),
    advanceFrom: (from) => dispatch({ type: 'advance', from, max: sceneCount - 1 }),
    back: () => dispatch({ type: 'go', scene: Math.max(stateRef.current.scene - 1, 0) }),
    go: (scene) => dispatch({ type: 'go', scene }),
    restart: () => {
      riteRunRef.current = null;
      dispatch({ type: 'restart' });
    },
    setDemo: (on) => {
      setDemoMode(on);
      riteRunRef.current = null;
      patch({ demo: on, rite: undefined, riteStartedAt: undefined });
      void summon(stateRef.current.group?.value.chosen);
    },
    chooseGroup: (id) => {
      riteRunRef.current = null;
      patch({ rite: undefined, riteStartedAt: undefined });
      void summon(id);
    },
    recordBelief: () => {
      void updateBook('Record a new believer in the Book of Offerings', (b) => ({ ...b, believers: b.believers + 1 }))
        .then((book) => patch({ book, soulNumber: book.value.believers }));
    },
    recordSacrifice: (s) => {
      patch({ sacrifice: s });
      void updateBook('Record the sacrifice', (b) => ({ ...b, sacrifices: { ...b.sacrifices, [s]: b.sacrifices[s] + 1 } }))
        .then((book) => patch({ book }));
    },
    recordFinalChoice: (c) => {
      if (stateRef.current.finalFirst) return;
      patch({ finalFirst: c });
      void updateBook('Record how the judge faced the Goat', (b) => ({ ...b, finalFirst: { ...b.finalFirst, [c]: b.finalFirst[c] + 1 } }))
        .then((book) => patch({ book }));
    },
    beginRite: () => {
      const s = stateRef.current;
      if (riteRunRef.current === s.runId) return;
      riteRunRef.current = s.runId;
      const runId = s.runId;
      patch({ riteStartedAt: Date.now(), rite: undefined });
      const timeout = new Promise<void>((resolve) => setTimeout(resolve, 10_000));
      void Promise.race([envReadyRef.current, timeout])
        .then(() => {
          const now = stateRef.current;
          const census = now.census;
          const demons = summonDemons(census?.sources.value ?? []);
          const names = goatifyEvents(census?.pipelines.value ?? [], (census?.destinations.value ?? []).map((d) => d.id));
          return performRite(now.group?.value.chosen ?? 'default', [...demons, ...names]);
        })
        .then((rite) => {
          if (stateRef.current.runId === runId) patch({ rite });
        });
    },
    burnBook: async () => {
      const ok = await forgetBook();
      if (ok) patch({ book: { value: { believers: 0, sacrifices: { ceo: 0, pipeline: 0, logs: 0 }, finalFirst: { calm: 0, run: 0, summon: 0 } }, simulated: stateRef.current.demo, source: '/kvstore/church/book' } });
      return ok;
    },
  }), [patch, sceneCount, summon, stateRef]);

  const value = useMemo(() => ({ state, actions }), [state, actions]);
  return <RitualContext.Provider value={value}>{children}</RitualContext.Provider>;
}

export function useRitual(): Ctx {
  const ctx = useContext(RitualContext);
  if (!ctx) throw new Error('useRitual must be used inside <RitualProvider>');
  return ctx;
}
