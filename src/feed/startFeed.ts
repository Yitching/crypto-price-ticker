import type { QuoteStore } from '../store/QuoteStore';
import type { ValueStore } from '../store/ValueStore';
import { BinanceAdapter } from '../providers/binance';
import { CoinbaseAdapter } from '../providers/coinbase';
import { KrakenAdapter } from '../providers/kraken';
import type { ProviderAdapter, QuoteSink } from '../providers/types';
import { QuoteBook } from './aggregator';

/** Connects all providers and keeps the stores up to date. Returns a stop function. */
export function startFeed(
  symbols: readonly string[],
  quotes: QuoteStore,
  statuses: ValueStore<Record<string, string>>,
): () => void {
  const book = new QuoteBook();
  const publish = (symbol: string) => quotes.set(book.aggregate(symbol));

  const sink: QuoteSink = {
    quote: (q) => {
      if (book.update(q)) publish(q.symbol);
    },
    status: (provider, state, detail) => {
      statuses.set((prev) => ({ ...prev, [provider]: detail ? `${state} (${detail})` : state }));
      if (state === 'reconnecting' || state === 'closed') {
        for (const symbol of book.removeProvider(provider)) publish(symbol);
      }
    },
  };

  const adapters: ProviderAdapter[] = [new KrakenAdapter(), new CoinbaseAdapter(), new BinanceAdapter()];
  for (const adapter of adapters) adapter.start(symbols, sink);
  return () => {
    for (const adapter of adapters) adapter.stop();
  };
}