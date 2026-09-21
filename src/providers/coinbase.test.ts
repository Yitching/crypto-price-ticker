import { describe, expect, it } from 'vitest';
import { CoinbaseAdapter } from './coinbase';

describe('CoinbaseAdapter.parse', () => {
  const adapter = new CoinbaseAdapter();

  it('reads ticker messages, converting string prices to numbers', () => {
    const message = {
      type: 'ticker',
      sequence: 136476180848,
      product_id: 'BTC-USD',
      price: '85239.01',
      best_bid: '85239.01',
      best_bid_size: '0.10402468',
      best_ask: '85239.02',
      best_ask_size: '0.09520733',
      side: 'sell',
      time: '2026-09-21T12:53:30.493800Z',
    };
    expect(adapter.parse(message)).toEqual([{ providerSymbol: 'BTC-USD', bid: 85239.01, ask: 85239.02 }]);
  });

  it('ignores heartbeats and subscription acknowledgements', () => {
    expect(adapter.parse({ type: 'heartbeat', product_id: 'BTC-USD' })).toEqual([]);
    expect(adapter.parse({ type: 'subscriptions', channels: [] })).toEqual([]);
  });

  it('ignores ticker messages without a product id', () => {
    expect(adapter.parse({ type: 'ticker', best_bid: '1', best_ask: '2' })).toEqual([]);
  });

  it('ignores messages that are not objects', () => {
    expect(adapter.parse(null)).toEqual([]);
    expect(adapter.parse('ticker')).toEqual([]);
  });

  it('passes missing prices through as NaN so the QuoteBook can reject them', () => {
    expect(adapter.parse({ type: 'ticker', product_id: 'BTC-USD' })).toEqual([
      { providerSymbol: 'BTC-USD', bid: Number.NaN, ask: Number.NaN },
    ]);
  });
});
