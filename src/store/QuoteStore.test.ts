import { describe, expect, it, vi } from 'vitest';
import type { AggregatedQuote } from '../core/types';
import { QuoteStore, immediateScheduler } from './QuoteStore';

const quote = (symbol: string, bid: number): AggregatedQuote => ({
  symbol,
  bid: { price: bid, provider: 'kraken' },
  ask: { price: bid + 1, provider: 'kraken' },
  sources: [],
});

describe('QuoteStore', () => {
  it('notifies only subscribers of the symbol that changed', () => {
    const store = new QuoteStore(immediateScheduler);
    const btc = vi.fn();
    const eth = vi.fn();
    store.subscribe('BTC/USD', btc);
    store.subscribe('ETH/USD', eth);
    store.ingest([quote('BTC/USD', 100)]);
    expect(btc).toHaveBeenCalledOnce();
    expect(eth).not.toHaveBeenCalled();
    expect(store.get('BTC/USD')?.bid?.price).toBe(100);
  });

  it('stops notifying after unsubscribe', () => {
    const store = new QuoteStore(immediateScheduler);
    const listener = vi.fn();
    const unsubscribe = store.subscribe('BTC/USD', listener);
    unsubscribe();
    store.ingest([quote('BTC/USD', 100)]);
    expect(listener).not.toHaveBeenCalled();
  });

  it('applies only the latest quote per symbol, once per frame', () => {
    let runFrame = () => {};
    const store = new QuoteStore((flush) => {
        runFrame = flush;
    });
    const listener = vi.fn();
    store.subscribe('BTC/USD', listener);

    store.ingest([quote('BTC/USD', 100)]);
    store.ingest([quote('BTC/USD', 101)]);
    store.ingest([quote('BTC/USD', 102)]);
    expect(listener).not.toHaveBeenCalled(); // nothing until the frame

    runFrame();
    expect(listener).toHaveBeenCalledOnce();
    expect(store.get('BTC/USD')?.bid?.price).toBe(102);
  });
});
describe('QuoteStore price movement', () => {
  it('tracks direction, previous price and a sequence that bumps only when a side moves', () => {
    const store = new QuoteStore(immediateScheduler);
    store.ingest([quote('X', 10)]);
    store.ingest([quote('X', 12)]);
    expect(store.get('X')).toMatchObject({ bidMove: 1, bidSeq: 1, bidPrev: 10, askMove: 1, askPrev: 11 });
    store.ingest([{ ...quote('X', 12), ask: { price: 12, provider: 'kraken' } }]);
    expect(store.get('X')).toMatchObject({ bidSeq: 1, askMove: -1, askSeq: 2, askPrev: 13 });
  });
});