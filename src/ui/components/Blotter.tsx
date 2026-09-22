import { useMemo } from 'react';
import { useServices } from '../../app/services';
import { providerLabel } from '../../config/providers';
import { baseCurrency, inferPrecision } from '../../core/instruments';
import type { Instrument } from '../../core/types';
import { useValue } from '../../store/hooks';
import type { Trade } from '../../trading/types';
import { formatPrice, formatQuantity } from '../../utils/priceFormat';

const timeFormat = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

/** Base currency has real trading precision; the quote currency doesn't, so treat it as money. */
function formatDealtAmount(amount: number, currency: string, base: string, instrument: Instrument | undefined): string {
  const decimals = currency === base ? (instrument?.sizeDecimals ?? 6) : 2;
  return `${formatQuantity(amount, decimals)} ${currency}`;
}

/**
 * What was actually typed, in the currency it was typed in — never silently
 * relabelled into the other currency. A fill also shows what it converted
 * to, since that's the number that actually executed; a pending or rejected
 * trade has no such conversion to show.
 */
function amountText(trade: Trade, instrument: Instrument | undefined): string {
  const base = baseCurrency(trade.request.symbol);
  const dealt = formatDealtAmount(trade.request.amount, trade.request.dealtCurrency, base, instrument);
  if (!trade.fill || trade.request.dealtCurrency === base) return dealt;
  const converted = formatDealtAmount(trade.fill.baseAmount, base, base, instrument);
  return `${dealt} → ${converted}`;
}

function priceText(trade: Trade, instrument: Instrument | undefined): string {
  const price = trade.fill?.price ?? trade.request.price;
  const priceDecimals = instrument?.priceDecimals ?? inferPrecision(price).priceDecimals;
  return formatPrice(price, priceDecimals);
}

const STATUS_TEXT = { pending: 'Pending', filled: 'Filled', rejected: 'Rejected' } as const;

export function Blotter() {
  const { trading, instruments } = useServices();
  const trades = useValue(trading.trades);
  const instrumentBySymbol = useMemo(() => new Map(instruments.map((i) => [i.symbol, i])), [instruments]);

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
                <th scope="col" className="num amount-col">Amount</th>
                <th scope="col" className="num">Price</th>
                <th scope="col">Venue</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((t) => {
                const instrument = instrumentBySymbol.get(t.request.symbol);
                return (
                  <tr key={t.id} data-status={t.status}>
                    <td>{timeFormat.format(t.requestedAt)}</td>
                    <td>{t.request.symbol}</td>
                    <td data-side={t.request.side}>{t.request.side === 'buy' ? 'Buy' : 'Sell'}</td>
                    <td className="num amount-col">{amountText(t, instrument)}</td>
                    <td className="num">{priceText(t, instrument)}</td>
                    <td>{providerLabel(t.request.provider)}</td>
                    <td title={t.rejectReason}>{STATUS_TEXT[t.status]}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
