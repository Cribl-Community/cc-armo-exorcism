import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { motion } from 'motion/react';
import { useRitual } from '../../state/ritual';
import { scripture, summarizeScripture, type ScriptureEntry } from '../../cribl/client';
import { Goat } from '../goat/Goat';
import { CHARACTERS } from '../characters/characters';
import { celebrate } from '../fx/fx';
import { isMuted, play } from '../fx/sound';
import { playLayer } from '../fx/tracks';
import { SceneFrame, usePrimary } from '../stage';
import './finale.css';

// ── The Scripture — the finale ──────────────────────────────────────────────────────────
// The Goat preaches its Commandments: one per real Cribl endpoint it called, read aloud in its
// own voice, stamped onto an unrolling scroll, cheered by a head-banging congregation, followed
// by the credits. Everything on the scroll comes from the Scripture log.

interface Commandment {
  text: string;
  call: string;
  note: string;
}

const RULES: Array<{ test: RegExp; text: string }> = [
  { test: /\/system\/info/, text: 'THOU SHALT KNOW THY VERSION' },
  { test: /\/products\/stream\/groups/, text: 'THOU SHALT FIND THY WORKER GROUP' },
  { test: /\/pipelines/, text: 'THOU SHALT COUNT THE SACRED PIPELINES' },
  { test: /\/routes/, text: 'THOU SHALT FOLLOW THE SACRED ROUTES' },
  { test: /\/status\/inputs/, text: 'THOU SHALT INSPECT THE ALTARS' },
  { test: /\/status\/outputs/, text: 'THOU SHALT BLESS THE DESTINATIONS' },
  { test: /\/metrics\/query/, text: 'THOU SHALT WEIGH THE OFFERINGS' },
  { test: /preview/, text: 'THOU SHALT EXORCISE IN PREVIEW, AND SAVE NOTHING' },
  { test: /\/kvstore/, text: 'THOU SHALT KEEP THE BOOK OF OFFERINGS' },
  { test: /\/search\//, text: 'THOU SHALT CONSULT THE SCROLLS' },
];

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

function buildCommandments(entries: ScriptureEntry[]): Commandment[] {
  const byRule = new Map<string, { entry: ScriptureEntry; count: number }>();
  for (const e of entries) {
    if (e.status === 'BLOCKED') continue;
    const rule = RULES.find((r) => r.test.test(e.path));
    if (!rule) continue;
    const seen = byRule.get(rule.text);
    if (seen) seen.count++;
    else byRule.set(rule.text, { entry: e, count: 1 });
  }
  return [...byRule.entries()].map(([text, { entry, count }]) => ({
    text,
    call: `${entry.method} ${entry.path.split('?')[0].replace(/\/jobs\/[^/]+/, '/jobs/{id}')}`,
    note: entry.status === 'SIM' ? 'simulated' : `${String(entry.status)}${count > 1 ? ` · ×${count}` : ''}`,
  }));
}

/** The Goat speaks (Web Speech API), as low and slow as the browser allows. */
function speak(text: string): void {
  if (isMuted() || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(text.toLowerCase());
  u.pitch = 0.1;
  u.rate = 0.85;
  u.volume = 0.9;
  const voice = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith('en'));
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
}

const REVEAL_MS = 1500;

export function Scripture() {
  const { state, actions } = useRitual();
  const entries = useSyncExternalStore(scripture.subscribe, scripture.getSnapshot);
  const summary = summarizeScripture(entries);
  // The commandments are frozen when the sermon starts (after the Goat clears its throat).
  const [commandments, setCommandments] = useState<Commandment[]>([]);
  const total = commandments.length + 1; // + THOU SHALT NOT MUTATE
  const [shown, setShown] = useState(0);
  const [credits, setCredits] = useState(false);
  const listRef = useRef<HTMLOListElement>(null);
  const ex = state.rite?.value.exorcism;

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  useEffect(() => {
    if (shown === 0) {
      const t = setTimeout(() => {
        setCommandments(buildCommandments(scripture.getSnapshot()));
        setShown(1);
        speak('Hear the commandments of the goat.');
      }, 1200);
      return () => clearTimeout(t);
    }
    if (shown <= total) {
      const current = shown <= commandments.length ? commandments[shown - 1] : null;
      play('slam');
      if (current) speak(current.text);
      else {
        speak(`Thou shalt not mutate. ${summary.configMutations} mutations.`);
        playLayer('scream', 0.7, 0.8);
      }
      listRef.current?.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    if (shown < total) {
      const t = setTimeout(() => setShown((n) => n + 1), REVEAL_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setCredits(true);
      celebrate();
      play('choir');
      playLayer('scream', 1);
      playLayer('scream', 1.35, 0.6);
    }, 2600);
    return () => clearTimeout(t);
  }, [shown, total, commandments, summary.configMutations]);

  usePrimary(() => actions.restart(), 'scripture');

  const miracles = useMemo(
    () => [
      { label: 'API CALLS', value: state.demo ? `${summary.simulated}` : `${summary.calls}`, sub: state.demo ? 'simulated' : 'real ones' },
      { label: 'ENGINE RITE', value: state.rite ? `${(state.rite.value.ms / 1000).toFixed(1)}s` : '—', sub: state.rite?.simulated ? 'emulated' : 'in your Cribl' },
      { label: 'HERESY REMOVED', value: ex ? `${ex.bytesReducedPct}%` : '—', sub: 'of the bytes' },
    ],
    [state.demo, state.rite, summary.simulated, summary.calls, ex],
  );

  return (
    <SceneFrame className="r-finale">
      <div className="r-disco" aria-hidden="true" />
      <header className="r-finale__head">
        <h1 className="r-title r-title--gold r-finale__title">📜 THE SCRIPTURE</h1>
        <p className="r-whisper">As dictated by the Goat, from everything it actually did in your Cribl.</p>
      </header>

      <div className="r-finale__grid">
        <div className="r-finale__preacher">
          <Goat state={credits ? 'HOLY' : 'SUPREME'} className="r-finale__goat" follow />
          <motion.p key={shown} className="r-finale__bubble" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            {shown === 0 ? 'Ahem.' : shown <= commandments.length ? `${ROMAN[shown - 1]}!` : credits ? 'AMEN. 🤘' : 'AND ABOVE ALL…'}
          </motion.p>
        </div>

        <div className="r-parchment-scroll">
          <div className="r-parchment-scroll__rod" aria-hidden="true" />
          <ol className="r-commandments" ref={listRef}>
            {commandments.slice(0, shown).map((c, i) => (
              <motion.li key={c.text} className="r-commandment" initial={{ opacity: 0, scale: 1.6, rotate: -3 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}>
                <span className="r-commandment__num">{ROMAN[i]}.</span>
                <span className="r-commandment__text">{c.text}</span>
                <code className="r-commandment__call">{c.call} · {c.note}</code>
              </motion.li>
            ))}
            {shown > commandments.length && (
              <motion.li className="r-commandment r-commandment--final" initial={{ opacity: 0, scale: 2.4, rotate: 8 }} animate={{ opacity: 1, scale: 1, rotate: -2 }} transition={{ type: 'spring', stiffness: 220, damping: 12 }}>
                <span className="r-commandment__num">{ROMAN[commandments.length] ?? '∞'}.</span>
                <span className="r-commandment__text">THOU SHALT NOT MUTATE.</span>
                <span className="r-commandment__stamp">CONFIG MUTATIONS: {summary.configMutations}</span>
              </motion.li>
            )}
          </ol>
          <div className="r-parchment-scroll__rod r-parchment-scroll__rod--bottom" aria-hidden="true" />
        </div>

        <div className="r-finale__miracles">
          <span className="r-finale__miracles-title">MIRACLES PERFORMED</span>
          {miracles.map((m, i) => (
            <motion.div key={m.label} className="r-miracle" initial={{ opacity: 0, scale: 2, rotate: 12 }} animate={{ opacity: 1, scale: 1, rotate: i % 2 ? 3 : -3 }} transition={{ delay: 0.6 + i * 0.5, type: 'spring', stiffness: 200, damping: 12 }}>
              <span className="r-miracle__value">{m.value}</span>
              <span className="r-miracle__label">{m.label}</span>
              <span className="r-miracle__sub">{m.sub}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <Congregation cheering={credits} />

      <div className="r-finale__actions">
        <button className="r-btn r-btn--gold" onClick={() => actions.restart()}>↺ BEGIN AGAIN</button>
        <button className="r-btn r-btn--ghost" onClick={() => actions.patch({ scriptureOpen: true })}>📜 OPEN THE REAL SCRIPTURE</button>
      </div>

      {credits && <Credits calls={summary.calls} engineRuns={summary.engineRuns} mutations={summary.configMutations} />}
    </SceneFrame>
  );
}

function Congregation({ cheering }: { cheering: boolean }) {
  const members = ['🐐', '🐐', '🐐', '🤘', '🐐', '🐐', '🕯️', '🐐', '🐐', '🐐', '🤘', '🐐', '🐐', '🕯️', '🐐', '🐐'];
  return (
    <div className={`r-congregation ${cheering ? 'r-congregation--cheering' : ''}`} aria-hidden="true">
      {members.map((m, i) => (
        <span key={i} className="r-congregation__member" style={{ animationDelay: `${(i % 4) * 0.12}s` }}>{m}</span>
      ))}
    </div>
  );
}

function Credits({ calls, engineRuns, mutations }: { calls: number; engineRuns: number; mutations: number }) {
  const lines: Array<[string, string]> = [
    ['THE CHURCH OF GOAT', ''],
    ['a Cribl App', ''],
    ['', ''],
    ['Directed by', 'THE GOAT'],
    ['The Architect', CHARACTERS.arno.name],
    ['The Forbidden Engineer', `${CHARACTERS.moise.name} (still missing)`],
    ['The High Priestess of Telemetry', 'as herself'],
    ['The CEO', 'as a ghost'],
    ['Catering', '1 GB of logs'],
    ['Real API calls', String(calls)],
    ['Engine rites performed', String(engineRuns)],
    ['Config mutations', String(mutations)],
    ['', ''],
    ['Filmed on location', 'inside your Cribl'],
    ['No production systems', 'were harmed'],
    ['', ''],
    ['🐐 THE GOAT WILL RETURN', ''],
  ];
  return (
    <div className="r-credits" aria-label="Credits">
      <div className="r-credits__roll">
        {lines.map(([a, b], i) => (
          <p key={i} className={b ? 'r-credits__line' : 'r-credits__title'}>
            <span>{a}</span>
            {b && <span className="r-credits__who">{b}</span>}
          </p>
        ))}
      </div>
    </div>
  );
}
