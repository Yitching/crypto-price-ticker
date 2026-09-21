import { useEffect, useState } from 'react';
import type { ProviderQuote } from './core/types';
import { BinanceAdapter } from './providers/binance';
import { CoinbaseAdapter } from './providers/coinbase';
import { KrakenAdapter } from './providers/kraken';
import type { QuoteSink } from './providers/types';

const SYMBOLS = ['BTC/USD', 'ETH/USD'];

export default function App() {
  const [quotes, setQuotes] = useState<Record<string, ProviderQuote>>({});
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  useEffect(() => {
    const adapters = [new KrakenAdapter(), new CoinbaseAdapter(), new BinanceAdapter()];
    const sink: QuoteSink = {
    quote: (q) => setQuotes((prev) => ({ ...prev, [`${q.symbol}|${q.provider}`]: q })),
    status: (provider, state, detail) =>
    setStatuses((prev) => ({ ...prev, [provider]: detail ? `${state} (${detail})` : state })),    };
    for (const adapter of adapters) adapter.start(SYMBOLS, sink);
    return () => {
      for (const adapter of adapters) adapter.stop();
    };
  }, []);

  const rows = Object.values(quotes).sort(
    (a, b) => a.symbol.localeCompare(b.symbol) || a.provider.localeCompare(b.provider),
  );

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
            <th>Provider</th>
            <th>Bid</th>
            <th>Ask</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((q) => (
            <tr key={`${q.symbol}|${q.provider}`}>
              <td>{q.symbol}</td>
              <td>{q.provider}</td>
              <td>{q.bid}</td>
              <td>{q.ask}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}