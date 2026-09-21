import type { AggregatedQuote, PriceLevel, ProviderQuote } from '../core/types';

export function isValidQuote(q: ProviderQuote): boolean {
  return Number.isFinite(q.bid) && Number.isFinite(q.ask) && q.bid > 0 && q.ask > 0;
}

/** Best bid = highest bid, best ask = lowest ask, each tagged with its provider. */
export function aggregate(symbol: string, sources: Iterable<ProviderQuote>): AggregatedQuote {
  let bid: PriceLevel | null = null;
  let ask: PriceLevel | null = null;
  const list: ProviderQuote[] = [];

  for (const q of sources) {
    list.push(q);
    if (!bid || q.bid > bid.price) bid = { price: q.bid, provider: q.provider };
    if (!ask || q.ask < ask.price) ask = { price: q.ask, provider: q.provider };
  }

  list.sort((a, b) => a.provider.localeCompare(b.provider));
  return { symbol, bid, ask, sources: list };
}

/** The latest quote from each provider for each symbol. */
export class QuoteBook {
  private readonly bySymbol = new Map<string, Map<string, ProviderQuote>>();

  /** Stores the quote. Returns true if the displayed prices could have changed. */
  update(quote: ProviderQuote): boolean {
    if (!isValidQuote(quote)) return false;
    let book = this.bySymbol.get(quote.symbol);
    if (!book) {
      book = new Map();
      this.bySymbol.set(quote.symbol, book);
    }
    const previous = book.get(quote.provider);
    book.set(quote.provider, quote); // always store, so the timestamp stays fresh
    return !previous || previous.bid !== quote.bid || previous.ask !== quote.ask;
  }

  aggregate(symbol: string): AggregatedQuote {
    return aggregate(symbol, this.bySymbol.get(symbol)?.values() ?? []);
  }

  /** Removes a provider everywhere. Returns the symbols that changed. */
  removeProvider(provider: string): string[] {
    const affected: string[] = [];
    for (const [symbol, book] of this.bySymbol) if (book.delete(provider)) affected.push(symbol);
    return affected;
  }

  /** Removes quotes older than maxAgeMs. Returns the symbols that changed. */
  expire(now: number, maxAgeMs: number): string[] {
    const affected: string[] = [];
    for (const [symbol, book] of this.bySymbol) {
      let changed = false;
      for (const [provider, q] of book) {
        if (now - q.ts > maxAgeMs) {
          book.delete(provider);
          changed = true;
        }
      }
      if (changed) affected.push(symbol);
    }
    return affected;
  }

  clear(): void {
    this.bySymbol.clear();
  }
}