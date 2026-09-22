import { memo } from 'react';
import { providerLabel } from '../../config/providers';
import type { Instrument, PriceLevel, Side } from '../../core/types';
import type { Move } from '../../store/QuoteStore';
import { formatPrice } from '../../utils/priceFormat';
import { PriceDigits } from './PriceDigits';

export type PriceButtonVariant = 'solid' | 'quiet';

interface Props {
  readonly side: Side;
  readonly level: PriceLevel | null;
  readonly previous?: number;
  readonly move: Move;
  readonly seq: number;
  readonly instrument: Instrument;
  readonly pending: boolean;
  readonly disabled: boolean;
  /** solid = FX tile style; quiet = neutral until hovered (board ticket). */
  readonly variant?: PriceButtonVariant;
  onExecute(side: Side): void;
}

const ACTION: Record<Side, { idle: string; busy: string }> = {
  sell: { idle: 'Sell', busy: 'Selling' },
  buy: { idle: 'Buy', busy: 'Buying' },
};

export const PriceButton = memo(function PriceButton({
  side,
  level,
  previous,
  move,
  seq,
  instrument,
  pending,
  disabled,
  variant = 'solid',
  onExecute,
}: Props) {
  const action = ACTION[side];

  if (!level) {
    return (
      <button type="button" className="price-button" data-side={side} data-variant={variant} disabled>
        <span className="pb-action">{action.idle}</span>
        <span className="pb-empty">Waiting for price</span>
      </button>
    );
  }

  const venue = providerLabel(level.provider);

  return (
    <button
      type="button"
      className="price-button"
      data-side={side}
      data-variant={variant}
      data-move={move > 0 ? 'up' : move < 0 ? 'down' : undefined}
      disabled={disabled}
      aria-busy={pending}
      aria-label={`${action.idle} ${instrument.base} at ${formatPrice(level.price, instrument.priceDecimals)} on ${venue}`}
      onClick={() => onExecute(side)}
    >
      <span className="pb-action">{pending ? action.busy : action.idle}</span>
      <span className="pb-price">
        <PriceDigits
          price={level.price}
          previous={previous}
          decimals={instrument.priceDecimals}
          pipDecimals={instrument.pipDecimals}
          move={move}
          seq={seq}
        />
      </span>
      <span className="pb-venue">{venue}</span>
    </button>
  );
});
