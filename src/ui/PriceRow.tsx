import { memo } from 'react';
import { useServices } from '../app/services';
import { useQuote } from '../store/hooks';

/** One pair. Subscribes to its own symbol only. */
export const PriceRow = memo(function PriceRow({ symbol }: { symbol: string }) {
  const { quotes } = useServices();
  const q = useQuote(quotes, symbol);
  const spread = q?.bid && q.ask ? q.ask.price - q.bid.price : null;

  return (
    <tr>
      <td>{symbol}</td>
      <td>{q?.bid ? `${q.bid.price} (${q.bid.provider})` : '–'}</td>
      <td>{spread === null ? '–' : spread < 0 ? 'Crossed' : spread.toFixed(4)}</td>
      <td>{q?.ask ? `${q.ask.price} (${q.ask.provider})` : '–'}</td>
      <td>{q?.sources.length ?? 0}</td>
    </tr>
  );
});