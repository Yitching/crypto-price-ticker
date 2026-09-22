import { useServices } from '../../app/services';
import { providerLabel } from '../../config/providers';
import type { Instrument } from '../../core/types';
import { useQuote } from '../../store/hooks';
import { formatPrice } from '../../utils/priceFormat';

/** Per-venue prices behind the aggregate. Only subscribes while open. */
export function SourceList({ instrument }: { readonly instrument: Instrument }) {
  const { quotes } = useServices();
  const quote = useQuote(quotes, instrument.symbol);
  const sources = quote?.sources ?? [];

  if (sources.length === 0) return <p className="sources-empty">No venue is quoting this pair right now.</p>;

  return (
    <table className="sources">
      <thead>
        <tr>
          <th scope="col">Venue</th>
          <th scope="col">Bid</th>
          <th scope="col">Ask</th>
        </tr>
      </thead>
      <tbody>
        {sources.map((s) => (
          <tr key={s.provider}>
            <th scope="row">{providerLabel(s.provider)}</th>
            <td data-best={quote?.bid?.provider === s.provider}>{formatPrice(s.bid, instrument.priceDecimals)}</td>
            <td data-best={quote?.ask?.provider === s.provider}>{formatPrice(s.ask, instrument.priceDecimals)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
