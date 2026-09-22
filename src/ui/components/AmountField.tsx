import type { Instrument } from '../../core/types';
import type { TradeTicketState } from '../hooks/useTradeTicket';

type Props = Pick<TradeTicketState, 'amountText' | 'setAmountText' | 'amount' | 'dealt' | 'toggleDealt'> & {
  readonly instrument: Instrument;
};

export function AmountField({ instrument, amountText, setAmountText, amount, dealt, toggleDealt }: Props) {
  const other = dealt === instrument.base ? instrument.quote : instrument.base;
  return (
    <>
      <div className="ticket">
        <button
          type="button"
          className="dealt"
          onClick={toggleDealt}
          aria-label={`Amount is in ${dealt}. Switch to ${other}`}
          title={`Switch to ${other}`}
        >
          {dealt}
        </button>
        <label className="amount">
          <span className="sr-only">Amount in {dealt}</span>
          <input
            inputMode="decimal"
            autoComplete="off"
            value={amountText}
            aria-invalid={amount === null}
            onChange={(e) => setAmountText(e.target.value)}
          />
        </label>
      </div>
      {amount === null && <p className="field-error">Enter an amount like 2.5, 10k or 1.5m</p>}
    </>
  );
}
