import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { RitualProvider, useRitual } from '../state/ritual';
import { installThemeBridge } from '../host-theme';
import { SceneIndexContext, StageContext } from './stage';
import { CandleRail, TopBar } from './hud/Hud';
import { ScriptureDrawer } from './hud/ScriptureDrawer';
import { SettingsDrawer } from './hud/SettingsDrawer';
import { Particles } from './fx/Particles';
import { setMuted, unlockAudio } from './fx/sound';
import { preloadTracks, stopAllTracks } from './fx/tracks';
import { Facade, Invitation, Prophecy } from './scenes/ActOne';
import { Revelation, Sacrifice } from './scenes/ActTwo';
import { Incident } from './scenes/ActThree';
import { Builders, Priestess } from './scenes/ActFour';
import { Exorcism, Possession } from './scenes/ActFive';
import { Awakening, FinalButton, Report, Reveal } from './scenes/ActSix';
import './ritual.css';

interface SceneDef {
  id: string;
  Component: ComponentType;
  /** Rite number on the candle rail (1–12), or null for the Façade. 13 = beyond the rite. */
  rite: number | null;
  /** Show the ritual chamber (candles, sigil, embers) behind the scene. */
  chamber: boolean;
}

const SCENES: SceneDef[] = [
  { id: 'facade', Component: Facade, rite: null, chamber: false },
  { id: 'invitation', Component: Invitation, rite: 1, chamber: true },
  { id: 'prophecy', Component: Prophecy, rite: 2, chamber: true },
  { id: 'sacrifice', Component: Sacrifice, rite: 3, chamber: true },
  { id: 'revelation', Component: Revelation, rite: 4, chamber: true },
  { id: 'incident', Component: Incident, rite: 5, chamber: false },
  { id: 'builders', Component: Builders, rite: 6, chamber: true },
  { id: 'priestess', Component: Priestess, rite: 7, chamber: true },
  { id: 'exorcism', Component: Exorcism, rite: 8, chamber: true },
  { id: 'possession', Component: Possession, rite: 9, chamber: true },
  { id: 'final', Component: FinalButton, rite: 10, chamber: true },
  { id: 'awakening', Component: Awakening, rite: 11, chamber: true },
  { id: 'report', Component: Report, rite: 12, chamber: true },
  { id: 'reveal', Component: Reveal, rite: 13, chamber: false },
];

const AUTOPLAY_IDLE_MS = 4500;

// Start fetching the soundtrack before the first scene mounts.
preloadTracks();

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(t.tagName));

function Stage() {
  const { state, actions } = useRitual();
  const primaryRef = useRef<(() => void) | null>(null);
  const [primaryKey, setPrimaryKey] = useState('');

  const stageApi = useMemo(() => ({
    setPrimary: (fn: (() => void) | null, key: string) => {
      primaryRef.current = fn;
      setPrimaryKey(key);
    },
  }), []);

  const firePrimary = useCallback(() => {
    unlockAudio();
    primaryRef.current?.();
  }, []);

  // A restart (R, or BEGIN AGAIN) silences the soundtrack; the Façade starts it again.
  useEffect(() => {
    if (state.runId > 0) stopAllTracks();
  }, [state.runId]);

  // The Cribl shell owns the theme; light = holy Goat, dark = demonic Goat.
  useEffect(() => installThemeBridge((theme) => actions.patch({ theme })), [actions]);

  // Presenter hotkeys.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const drawers = state.scriptureOpen || state.settingsOpen;
      if (e.key === 'Escape' && drawers) return;
      if (drawers && e.key !== 's' && e.key !== 'S') return;
      switch (e.key) {
        case 'ArrowRight':
        case 'Enter':
        case ' ':
          if (isTyping(e.target)) return;
          e.preventDefault();
          firePrimary();
          break;
        case 'ArrowLeft':
          actions.back();
          break;
        case 'r':
        case 'R':
          actions.restart();
          break;
        case 's':
        case 'S':
          actions.patch({ scriptureOpen: !state.scriptureOpen });
          break;
        case 'm':
        case 'M':
          setMuted(!state.muted);
          actions.patch({ muted: !state.muted });
          break;
        case 'd':
        case 'D':
          actions.setDemo(!state.demo);
          break;
        case 'a':
        case 'A':
          actions.patch({ autoplay: !state.autoplay });
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [actions, firePrimary, state.scriptureOpen, state.settingsOpen, state.muted, state.demo, state.autoplay]);

  // Autoplay: press the primary action after a quiet moment.
  useEffect(() => {
    if (!state.autoplay || state.scriptureOpen || state.settingsOpen) return;
    const t = setTimeout(() => primaryRef.current?.(), AUTOPLAY_IDLE_MS);
    return () => clearTimeout(t);
  }, [state.autoplay, state.scriptureOpen, state.settingsOpen, primaryKey, state.scene]);

  const scene = SCENES[state.scene];
  const Scene = scene.Component;

  return (
    <StageContext.Provider value={stageApi}>
      <div
        className={`ritual ${scene.chamber ? 'ritual--chamber' : ''} ritual--${scene.id}`}
        data-alignment={state.theme === 'dark' ? 'demonic' : 'holy'}
      >
        {scene.chamber && (
          <div className="r-chamber" aria-hidden="true">
            <div className="r-chamber__sigil" />
            <Particles mode="embers" rate={14} />
            <div className="r-chamber__candles">
              {Array.from({ length: 6 }, (_, i) => <span key={i} className="r-chamber__candle" />)}
            </div>
            <div className="r-chamber__vignette" />
          </div>
        )}
        {scene.rite !== null && <TopBar />}
        <AnimatePresence mode="wait">
          <motion.main
            key={`${state.runId}:${scene.id}`}
            className="r-stage"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.45 }}
          >
            <SceneIndexContext.Provider value={state.scene}>
              <Scene />
            </SceneIndexContext.Provider>
          </motion.main>
        </AnimatePresence>
        {scene.rite !== null && <CandleRail rite={scene.rite} />}
        <ScriptureDrawer />
        <SettingsDrawer />
      </div>
    </StageContext.Provider>
  );
}

export default function RitualStage() {
  return (
    <RitualProvider sceneCount={SCENES.length}>
      <Stage />
    </RitualProvider>
  );
}
