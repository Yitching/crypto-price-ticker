import { describe, expect, it, vi } from 'vitest';
import type { AggregatedQuote } from '../core/types';
import { QuoteStore } from './QuoteStore';

const quote = (symbol: string, bid: number): AggregatedQuote => ({
  symbol,
  bid: { price: bid, provider: 'kraken' },
  ask: { price: bid + 1, provider: 'kraken' },
  sources: [],
});

describe('QuoteStore', () => {
  it('notifies only subscribers of the symbol that changed', () => {
    const store = new QuoteStore();
    const btc = vi.fn();
    const eth = vi.fn();
    store.subscribe('BTC/USD', btc);
    store.subscribe('ETH/USD', eth);

    store.set(quote('BTC/USD', 100));

    expect(btc).toHaveBeenCalledOnce();
    expect(eth).not.toHaveBeenCalled();
    expect(store.get('BTC/USD')?.bid?.price).toBe(100);
  });

  it('stops notifying after unsubscribe', () => {
    const store = new QuoteStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe('BTC/USD', listener);
    unsubscribe();
    store.set(quote('BTC/USD', 100));
    expect(listener).not.toHaveBeenCalled();
  });
});