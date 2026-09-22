import { memo } from 'react';
import type { Move } from '../../store/QuoteStore';
import { firstDifference, formatPrice, priceSegments } from '../../utils/priceFormat';

interface Props {
  readonly price: number;
  readonly previous?: number;
  readonly decimals: number;
  readonly pipDecimals: number;
  readonly move: Move;
  /** Bumps on every change; remounting the changed span restarts its flash. */
  readonly seq: number;
}

/** A price with big figure / pips / tail sizing, flashing only the digits that changed. */
export const PriceDigits = memo(function PriceDigits({ price, previous, decimals, pipDecimals, move, seq }: Props) {
  const text = formatPrice(price, decimals);
  const changedFrom = previous === undefined ? -1 : firstDifference(text, formatPrice(previous, decimals));
  const direction = move > 0 ? 'up' : move < 0 ? 'down' : undefined;

  return (
    <span className="digits">
      {priceSegments(text, pipDecimals, changedFrom).map((segment, i) => (
        <span
          key={segment.changed ? `changed-${seq}-${i}` : `same-${i}`}
          className={`d-${segment.role}`}
          data-changed={segment.changed ? direction : undefined}
        >
          {segment.text}
        </span>
      ))}
    </span>
  );
});
