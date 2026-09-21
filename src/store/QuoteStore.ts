import type { AggregatedQuote } from '../core/types';

/** Latest aggregated quote per symbol. Notifies only that symbol's subscribers. */
export class QuoteStore {
  private readonly quotes = new Map<string, AggregatedQuote>();
  private readonly listeners = new Map<string, Set<() => void>>();

  set(quote: AggregatedQuote): void {
    this.quotes.set(quote.symbol, quote);
    this.listeners.get(quote.symbol)?.forEach((listener) => listener());
  }

  get(symbol: string): AggregatedQuote | undefined {
    return this.quotes.get(symbol);
  }

  subscribe(symbol: string, listener: () => void): () => void {
    let set = this.listeners.get(symbol);
    if (!set) {
      set = new Set();
      this.listeners.set(symbol, set);
    }
    set.add(listener);
    return () => {
      set.delete(listener);
      if (set.size === 0) this.listeners.delete(symbol);
    };
  }
}