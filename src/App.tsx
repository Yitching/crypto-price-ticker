import { useEffect, useState } from 'react';
import type { AggregatedQuote } from './core/types';
import { QuoteBook } from './feed/aggregator';
import { BinanceAdapter } from './providers/binance';
import { CoinbaseAdapter } from './providers/coinbase';
import { KrakenAdapter } from './providers/kraken';
import type { QuoteSink } from './providers/types';

const SYMBOLS = ['BTC/USD', 'ETH/USD', 'SOL/USD', 'XRP/USD'];

export default function App() {
  const [quotes, setQuotes] = useState<Record<string, AggregatedQuote>>({});
  const [statuses, setStatuses] = useState<Record<string, string>>({});

  useEffect(() => {
    const book = new QuoteBook();
    const publish = (symbol: string) => setQuotes((prev) => ({ ...prev, [symbol]: book.aggregate(symbol) }));

    const sink: QuoteSink = {
      quote: (q) => {
        if (book.update(q)) publish(q.symbol);
      },
      status: (provider, state, detail) => {
        setStatuses((prev) => ({ ...prev, [provider]: detail ? `${state} (${detail})` : state }));
        // Never show a price from a provider we can't reach.
        if (state === 'reconnecting' || state === 'closed') {
          for (const symbol of book.removeProvider(provider)) publish(symbol);
        }
      },
    };

    const adapters = [new KrakenAdapter(), new CoinbaseAdapter(), new BinanceAdapter()];
    for (const adapter of adapters) adapter.start(SYMBOLS, sink);
    return () => {
      for (const adapter of adapters) adapter.stop();
    };
  }, []);

  return (
    <main>
      <h1>Crypto ticker</h1>
      <p>
        {Object.entries(statuses)
          .map(([provider, state]) => `${provider}: ${state}`)
          .join(' · ')}
      </p>
      <table>
        <thead>
          <tr>
            <th>Pair</th>
            <th>Best bid</th>
            <th>Spread</th>
            <th>Best ask</th>
            <th>Venues</th>
          </tr>
        </thead>
        <tbody>
          {SYMBOLS.map((symbol) => {
            const q = quotes[symbol];
            const spread = q?.bid && q.ask ? q.ask.price - q.bid.price : null;
            return (
              <tr key={symbol}>
                <td>{symbol}</td>
                <td>{q?.bid ? `${q.bid.price} (${q.bid.provider})` : '–'}</td>
                <td>{spread === null ? '–' : spread.toFixed(4)}</td>
                <td>{q?.ask ? `${q.ask.price} (${q.ask.provider})` : '–'}</td>
                <td>{q?.sources.length ?? 0}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
}