import { memo } from 'react';
import { useServices } from '../../app/services';
import type { Instrument, Side } from '../../core/types';
import { useQuote } from '../../store/hooks';
import { spreadInPips } from '../../utils/priceFormat';
import { PriceButton, type PriceButtonVariant } from './PriceButton';

interface Props {
  readonly instrument: Instrument;
  readonly pending: Side | null;
  readonly disabled: boolean;
  readonly variant?: PriceButtonVariant;
  onExecute(side: Side): void;
}

/** Sell / spread / Buy. The only part of a tile or ticket that re-renders on every tick. */
export const TwoWayPrice = memo(function TwoWayPrice({ instrument, pending, disabled, variant, onExecute }: Props) {
  const { quotes } = useServices();
  const quote = useQuote(quotes, instrument.symbol);
  const bid = quote?.bid ?? null;
  const ask = quote?.ask ?? null;
  const spread = bid && ask ? spreadInPips(bid.price, ask.price, instrument.pipDecimals) : null;
  const locked = pending !== null;

  return (
    <div className="prices-row">
      <PriceButton
        side="sell"
        level={bid}
        previous={quote?.bidPrev}
        move={quote?.bidMove ?? 0}
        seq={quote?.bidSeq ?? 0}
        instrument={instrument}
        pending={pending === 'sell'}
        disabled={disabled || locked}
        variant={variant}
        onExecute={onExecute}
      />
      <span
        className="spread"
        data-crossed={spread !== null && spread < 0}
        title={spread !== null && spread < 0 ? 'Crossed: one venue bids above another venue offers' : 'Spread in pips'}
      >
        {spread === null ? '–' : spread < 0 ? 'Crossed' : spread.toFixed(1)}
      </span>
      <PriceButton
        side="buy"
        level={ask}
        previous={quote?.askPrev}
        move={quote?.askMove ?? 0}
        seq={quote?.askSeq ?? 0}
        instrument={instrument}
        pending={pending === 'buy'}
        disabled={disabled || locked}
        variant={variant}
        onExecute={onExecute}
      />
    </div>
  );
});
