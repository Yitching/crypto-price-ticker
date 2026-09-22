import { useServices } from '../../app/services';
import { providerLabel } from '../../config/providers';
import { baseCurrency, inferPrecision } from '../../core/instruments';
import { useValue } from '../../store/hooks';
import type { Trade } from '../../trading/types';
import { formatPrice, formatQuantity } from '../../utils/priceFormat';

const timeFormat = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

function amountText(trade: Trade): string {
  if (trade.fill) {
    const base = baseCurrency(trade.request.symbol);
    return `${formatQuantity(trade.fill.baseAmount, 6)} ${base}`;
  }
  return `${formatQuantity(trade.request.amount, 6)} ${trade.request.dealtCurrency}`;
}

function priceText(trade: Trade): string {
  const price = trade.fill?.price ?? trade.request.price;
  return formatPrice(price, inferPrecision(price).priceDecimals);
}

const STATUS_TEXT = { pending: 'Pending', filled: 'Filled', rejected: 'Rejected' } as const;

export function Blotter() {
  const { trading } = useServices();
  const trades = useValue(trading.trades);

  return (
    <section className="panel blotter" aria-label="Trades">
      <h2>Trades</h2>
      {trades.length === 0 ? (
        <p className="empty">Press Buy or Sell on any pair to trade. Fills and rejections appear here.</p>
      ) : (
        <div className="blotter-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Time</th>
                <th scope="col">Pair</th>
                <th scope="col">Side</th>
                <th scope="col" className="num">Amount</th>
                <th scope="col" className="num">Price</th>
                <th scope="col">Venue</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((t) => (
                <tr key={t.id} data-status={t.status}>
                  <td>{timeFormat.format(t.requestedAt)}</td>
                  <td>{t.request.symbol}</td>
                  <td data-side={t.request.side}>{t.request.side === 'buy' ? 'Buy' : 'Sell'}</td>
                  <td className="num">{amountText(t)}</td>
                  <td className="num">{priceText(t)}</td>
                  <td>{providerLabel(t.request.provider)}</td>
                  <td title={t.rejectReason}>{STATUS_TEXT[t.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
