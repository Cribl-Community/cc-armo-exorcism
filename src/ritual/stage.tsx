/* eslint-disable react/only-export-components */
import { createContext, useCallback, useContext, useEffect, type ReactNode } from 'react';
import { useRitual } from '../state/ritual';
import { useLatest } from './useLatest';

// Each scene registers its current primary action. The stage uses it for the → / Enter hotkeys
// and for autoplay (presenter mode), so the keyboard always does exactly what the big button does.

interface StageApi {
  setPrimary: (fn: (() => void) | null, key: string) => void;
}

export const StageContext = createContext<StageApi | null>(null);

/** Index of the scene a component belongs to. An exiting scene keeps its old index. */
export const SceneIndexContext = createContext(0);

/** Advance past this scene — a no-op if the ritual has already moved on. */
export function useNext(): () => void {
  const index = useContext(SceneIndexContext);
  const { actions } = useRitual();
  return useCallback(() => actions.advanceFrom(index), [actions, index]);
}

export function usePrimary(fn: (() => void) | null, key: string): void {
  const api = useContext(StageContext);
  const ref = useLatest(fn);
  const has = fn !== null;
  useEffect(() => {
    if (!api) return;
    api.setPrimary(has ? () => ref.current?.() : null, key);
    return () => api.setPrimary(null, `${key}:unmounted`);
  }, [api, key, has, ref]);
}

/** Run `fn` once after `ms`. Cleared if the scene unmounts first. */
export function useAfter(ms: number | null, fn: () => void): void {
  const ref = useLatest(fn);
  useEffect(() => {
    if (ms === null) return;
    const t = setTimeout(() => ref.current(), ms);
    return () => clearTimeout(t);
  }, [ms, ref]);
}

export function SceneFrame({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={`r-scene ${className ?? ''}`}>{children}</section>;
}
