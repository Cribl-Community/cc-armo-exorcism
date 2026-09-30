import { Button, CustomTooltipTrigger, Tooltip } from '@capra/core';
import { useRitual } from '../../state/ritual';
import { setMuted } from '../fx/sound';

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
export const RITES = 12;

export function CandleRail({ rite }: { rite: number }) {
  return (
    <nav className="r-rail" aria-label={`Rite ${rite} of ${RITES}`}>
      <ol className="r-rail__candles">
        {Array.from({ length: RITES }, (_, i) => (
          <li key={i} className={`r-candle ${i < rite ? 'r-candle--lit' : ''} ${i === rite - 1 ? 'r-candle--current' : ''}`} aria-hidden="true">
            <span className="r-candle__flame" />
            <span className="r-candle__wax" />
          </li>
        ))}
      </ol>
      <span className="r-rail__label">{rite > RITES ? 'AMEN' : `RITE ${ROMAN[rite]} OF ${ROMAN[RITES]}`}</span>
    </nav>
  );
}

export function TopBar() {
  const { state, actions } = useRitual();
  const live = !state.demo && state.group && !state.group.simulated;
  const version = state.leader && !state.leader.simulated ? ` · v${state.leader.value.version}` : '';
  const sigil = live ? `🟢 LIVE CRIBL · ${state.group?.value.chosen ?? ''}${version}` : '🟡 SIMULATED';
  const why = live
    ? 'Numbers marked 🟢 come from this Cribl environment. Open the Scripture to see every call.'
    : state.demo
      ? 'Performing the rite from memory (Settings → Perform from memory).'
      : `The Goat cannot see your Cribl: ${state.group?.reason ?? 'connecting…'}`;

  const toggleMute = () => {
    setMuted(!state.muted);
    actions.patch({ muted: !state.muted });
  };

  return (
    <header className="r-topbar">
      <span className="r-topbar__mark">🐐 THE CHURCH OF GOAT</span>
      <div className="r-topbar__actions">
        <Tooltip title={why}>
          <CustomTooltipTrigger>
            <span className={`r-sigil ${live ? 'r-sigil--live' : 'r-sigil--sim'}`} tabIndex={0} role="button" aria-label={`${sigil}. ${why}`}>{sigil}</span>
          </CustomTooltipTrigger>
        </Tooltip>
        <Tooltip title="Every Cribl API call the Goat made" shortcut="S">
          <Button size="sm" variant="secondary" onClick={() => actions.patch({ scriptureOpen: true })}>📜 Scripture</Button>
        </Tooltip>
        <Tooltip title="Settings">
          <Button size="sm" variant="secondary" onClick={() => actions.patch({ settingsOpen: true })}>⚙</Button>
        </Tooltip>
        <Tooltip title={state.muted ? 'Unmute' : 'Mute'} shortcut="M">
          <Button size="sm" variant="secondary" onClick={toggleMute}>{state.muted ? '🔇' : '🔊'}</Button>
        </Tooltip>
      </div>
    </header>
  );
}
