import { CustomTooltipTrigger, Tooltip } from '@capra/core';
import type { Sourced } from '../../cribl/types';

/** The 🟢 / 🟡 sigil next to every Cribl-derived value. */
export function LiveDot({ of }: { of?: Sourced<unknown> }) {
  if (!of) return null;
  const title = of.simulated
    ? `Simulated — ${of.reason ?? 'no live data'}`
    : `Live from your Cribl${of.source ? ` · ${of.source}` : ''}`;
  return (
    <Tooltip title={title}>
      <CustomTooltipTrigger>
        <span className={`r-live ${of.simulated ? 'r-live--sim' : 'r-live--real'}`} role="img" aria-label={title} tabIndex={0} />
      </CustomTooltipTrigger>
    </Tooltip>
  );
}
