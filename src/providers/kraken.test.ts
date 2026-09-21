import { describe, expect, it } from 'vitest';
import { KrakenAdapter } from './kraken';

describe('KrakenAdapter.parse', () => {
  const adapter = new KrakenAdapter();

  it('reads ticker updates', () => {
    const message = {
      channel: 'ticker',
      type: 'update',
      data: [{ symbol: 'BTC/USD', bid: 64000.1, bid_qty: 0.5, ask: 64000.2, ask_qty: 1.2 }],
    };
    expect(adapter.parse(message)).toEqual([{ providerSymbol: 'BTC/USD', bid: 64000.1, ask: 64000.2 }]);
  });

  it('ignores heartbeats', () => {
    expect(adapter.parse({ channel: 'heartbeat' })).toEqual([]);
  });
});