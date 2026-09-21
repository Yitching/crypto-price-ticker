import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AggregatedQuote } from '../core/types';
import type { ProviderAdapter, QuoteSink } from '../providers/types';
import { FeedEngine } from './FeedEngine';

class FakeAdapter implements ProviderAdapter {
  readonly id = 'fake';
  private sink: QuoteSink | null = null;
  
  start(_symbols: readonly string[], sink: QuoteSink) {
    this.sink = sink;
  }
  stop() {
    this.sink = null;
  }
  push(symbol: string, bid: number) {
    this.sink?.quote({ provider: 'fake', symbol, bid, ask: bid + 1, ts: Date.now() });
  }
}

describe('FeedEngine', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('turns many ticks into one update per symbol per flush', () => {
    const batches: (readonly AggregatedQuote[])[] = [];
    const engine = new FeedEngine({ quotes: (b) => batches.push(b), status: () => {}, stats: () => {} });
    const adapter = new FakeAdapter();
    engine.start({
      symbols: ['BTC/USD', 'ETH/USD'],
      providers: [{ kind: 'fake' }],
      options: { flushIntervalMs: 16, staleAfterMs: 30_000, conflate: true },
    });
    for (let i = 0; i < 50; i++) adapter.push('BTC/USD', 100 + i);
    adapter.push('ETH/USD', 10);
    vi.advanceTimersByTime(16);

    expect(batches).toHaveLength(1); // one batch…
    expect(batches[0]).toHaveLength(2); // …with one entry per symbol…
    expect(batches[0]?.find((q) => q.symbol === 'BTC/USD')?.bid?.price).toBe(149); // …holding the latest price
    engine.stop();
  });
});