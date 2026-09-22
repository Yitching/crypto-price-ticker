import { memo, useRef, type KeyboardEvent } from 'react';
import { useServices } from '../../app/services';
import { providerLabel } from '../../config/providers';
import type { Instrument, PriceLevel } from '../../core/types';
import type { Move } from '../../store/QuoteStore';
import { useQuote } from '../../store/hooks';
import { spreadInPips } from '../../utils/priceFormat';
import { PriceDigits } from './PriceDigits';
import { Sparkline } from './Sparkline';

interface Props {
  readonly instruments: readonly Instrument[];
  readonly selected: string | undefined;
  onSelect(symbol: string): void;
}

/**
 * Dense, read-only price board: one row per pair, trading happens in the
 * docked ticket. Rows are memoised; only the price cells subscribe to ticks,
 * and changing the selection re-renders just two rows.
 */
export function PriceBoard({ instruments, selected, onSelect }: Props) {
  const body = useRef<HTMLTableSectionElement>(null);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const index = instruments.findIndex((i) => i.symbol === selected);
    const nextIndex = Math.min(instruments.length - 1, Math.max(0, index + (e.key === 'ArrowDown' ? 1 : -1)));
    const next = instruments[nextIndex];
    if (!next) return;
    onSelect(next.symbol);
    body.current?.querySelector<HTMLElement>(`[data-symbol="${CSS.escape(next.symbol)}"]`)?.focus();
  };

  return (
    <div className="panel board-wrap">
      <table className="board" role="grid" aria-label="Price board. Use the arrow keys to move between pairs.">
        <thead>
          <tr>
            <th scope="col">Pair</th>
            <th scope="col" className="col-spark">
              Last 60s
            </th>
            <th scope="col" className="num">
              Bid
            </th>
            <th scope="col" className="col-spread">
              Spread
            </th>
            <th scope="col" className="num">
              Ask
            </th>
          </tr>
        </thead>
        <tbody ref={body} onKeyDown={onKeyDown}>
          {instruments.map((instrument) => (
            <BoardRow
              key={instrument.symbol}
              instrument={instrument}
              selected={instrument.symbol === selected}
              onSelect={onSelect}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

const BoardRow = memo(function BoardRow({
  instrument,
  selected,
  onSelect,
}: {
  readonly instrument: Instrument;
  readonly selected: boolean;
  onSelect(symbol: string): void;
}) {
  const select = () => onSelect(instrument.symbol);
  return (
    <tr
      data-symbol={instrument.symbol}
      aria-selected={selected}
      tabIndex={selected ? 0 : -1}
      onClick={select}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          select();
        }
      }}
    >
      <th scope="row">
        {instrument.base}
        <span>/{instrument.quote}</span>
      </th>
      <td className="col-spark">
        <Sparkline symbol={instrument.symbol} />
      </td>
      <BoardQuote instrument={instrument} />
    </tr>
  );
});

function BoardQuote({ instrument }: { readonly instrument: Instrument }) {
  const { quotes } = useServices();
  const quote = useQuote(quotes, instrument.symbol);
  const bid = quote?.bid ?? null;
  const ask = quote?.ask ?? null;
  const spread = bid && ask ? spreadInPips(bid.price, ask.price, instrument.pipDecimals) : null;

  return (
    <>
      <td className="num">
        <PriceCell level={bid} previous={quote?.bidPrev} move={quote?.bidMove ?? 0} seq={quote?.bidSeq ?? 0} instrument={instrument} venueFirst />
      </td>
      <td className="col-spread" data-crossed={spread !== null && spread < 0}>
        {spread === null ? '–' : spread < 0 ? 'Crossed' : spread.toFixed(1)}
      </td>
      <td className="num">
        <PriceCell level={ask} previous={quote?.askPrev} move={quote?.askMove ?? 0} seq={quote?.askSeq ?? 0} instrument={instrument} />
      </td>
    </>
  );
}

function PriceCell({
  level,
  previous,
  move,
  seq,
  instrument,
  venueFirst = false,
}: {
  readonly level: PriceLevel | null;
  readonly previous?: number;
  readonly move: Move;
  readonly seq: number;
  readonly instrument: Instrument;
  /** Venues sit on the outer edge of each side, away from the spread. */
  readonly venueFirst?: boolean;
}) {
  if (!level) return <span className="board-empty">–</span>;
  const venue = <span className="board-venue">{providerLabel(level.provider)}</span>;
  return (
    <>
      {venueFirst && venue}
      <PriceDigits
        price={level.price}
        previous={previous}
        decimals={instrument.priceDecimals}
        pipDecimals={instrument.pipDecimals}
        move={move}
        seq={seq}
      />
      {!venueFirst && venue}
    </>
  );
}
