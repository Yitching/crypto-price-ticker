import { describe, expect, it } from 'vitest';
import type { ProviderQuote } from '../core/types';
import { QuoteBook, aggregate } from './aggregator';

const q = (provider: string, bid: number, ask: number, ts = 0): ProviderQuote => ({
  provider,
  symbol: 'BTC/USD',
  bid,
  ask,
  ts,
});

describe('aggregate', () => {
  it('takes the highest bid and lowest ask, each with its provider', () => {
    const result = aggregate('BTC/USD', [q('kraken', 100, 102), q('coinbase', 101, 103), q('binance', 99, 101.5)]);
    expect(result.bid).toEqual({ price: 101, provider: 'coinbase' });
    expect(result.ask).toEqual({ price: 101.5, provider: 'binance' });
  });

  it('has no price when nobody is quoting', () => {
    expect(aggregate('BTC/USD', [])).toMatchObject({ bid: null, ask: null, sources: [] });
  });
});

describe('QuoteBook', () => {
  it('reports a change only when a price moves', () => {
    const book = new QuoteBook();
    expect(book.update(q('kraken', 100, 101))).toBe(true);
    expect(book.update(q('kraken', 100, 101))).toBe(false);
    expect(book.update(q('kraken', 100, 101.5))).toBe(true);
  });

  it('ignores invalid prices', () => {
    const book = new QuoteBook();
    expect(book.update(q('kraken', Number.NaN, 101))).toBe(false);
    expect(book.aggregate('BTC/USD').sources).toHaveLength(0);
  });

  it('drops a disconnected provider', () => {
    const book = new QuoteBook();
    book.update(q('kraken', 100, 101));
    book.update(q('coinbase', 99, 102));
    expect(book.removeProvider('kraken')).toEqual(['BTC/USD']);
    expect(book.aggregate('BTC/USD').bid?.provider).toBe('coinbase');
  });

  it('expires stale quotes', () => {
    const book = new QuoteBook();
    book.update(q('kraken', 100, 101, 1_000));
    book.update(q('coinbase', 99, 102, 9_000));
    expect(book.expire(10_000, 5_000)).toEqual(['BTC/USD']);
    expect(book.aggregate('BTC/USD').sources.map((s) => s.provider)).toEqual(['coinbase']);
  });
});