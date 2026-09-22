import type { Instrument } from '../../core/types';
import { useTradeTicket } from '../hooks/useTradeTicket';
import { describeTrade } from '../tradeText';
import { AmountField } from './AmountField';
import { SourceList } from './SourceList';
import { TwoWayPrice } from './TwoWayPrice';

/**
 * The board's single docked ticket. Render with key={symbol} so switching
 * pairs starts a fresh ticket rather than carrying over an amount.
 */
export function TradeTicket({ instrument }: { readonly instrument: Instrument }) {
  const ticket = useTradeTicket(instrument);

  return (
    <section className="panel ticket-panel" aria-label={`Trade ${instrument.symbol}`}>
      <h2 className="tile-symbol">
        {instrument.base}
        <span>/{instrument.quote}</span>
      </h2>
      <TwoWayPrice
        instrument={instrument}
        pending={ticket.pending}
        disabled={ticket.amount === null}
        variant="quiet"
        onExecute={ticket.execute}
      />
      <AmountField instrument={instrument} {...ticket} />
      <SourceList instrument={instrument} />
      <p className="tile-result" data-status={ticket.result?.status} aria-live="polite">
        {ticket.result ? describeTrade(ticket.result, instrument) : ''}
      </p>
    </section>
  );
}
