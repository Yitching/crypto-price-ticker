import { memo, useState } from 'react';
import type { Instrument } from '../../core/types';
import { useTradeTicket } from '../hooks/useTradeTicket';
import { describeTrade } from '../tradeText';
import { AmountField } from './AmountField';
import { SourceList } from './SourceList';
import { TwoWayPrice } from './TwoWayPrice';

/**
 * The tile owns ticket state and does not subscribe to prices itself; only
 * <TwoWayPrice> and <SourceList> do, so a tick never re-renders the input.
 */
export const PriceTile = memo(function PriceTile({ instrument }: { readonly instrument: Instrument }) {
  const ticket = useTradeTicket(instrument);
  const [showSources, setShowSources] = useState(false);

  return (
    <article className="tile" aria-label={instrument.symbol}>
      <header className="tile-head">
        <h2 className="tile-symbol">
          {instrument.base}
          <span>/{instrument.quote}</span>
        </h2>
        <button
          type="button"
          className="text-button"
          aria-expanded={showSources}
          onClick={() => setShowSources((v) => !v)}
        >
          {showSources ? 'Hide venues' : 'All venues'}
        </button>
      </header>

      <TwoWayPrice
        instrument={instrument}
        pending={ticket.pending}
        disabled={ticket.amount === null}
        onExecute={ticket.execute}
      />
      <AmountField instrument={instrument} {...ticket} />
      {showSources && <SourceList instrument={instrument} />}

      <p className="tile-result" data-status={ticket.result?.status} aria-live="polite">
        {ticket.result ? describeTrade(ticket.result, instrument) : ''}
      </p>
    </article>
  );
});
