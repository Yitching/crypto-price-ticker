import { describe, expect, it } from 'vitest';
import { BinanceAdapter } from './binance';

describe('BinanceAdapter.parse', () => {
  const adapter = new BinanceAdapter();

  it('reads bookTicker updates, converting string prices to numbers', () => {
    const message = {
      u: 100428144057,
      s: 'BTCUSDT',
      b: '85241.94000000',
      B: '3.50632000',
      a: '85241.95000000',
      A: '0.00099000',
    };
    expect(adapter.parse(message)).toEqual([{ providerSymbol: 'BTCUSDT', bid: 85241.94, ask: 85241.95 }]);
  });

  it('ignores the subscribe acknowledgement', () => {
    expect(adapter.parse({ result: null, id: 1 })).toEqual([]);
  });

  it('ignores messages that are not objects', () => {
    expect(adapter.parse(null)).toEqual([]);
    expect(adapter.parse('BTCUSDT')).toEqual([]);
    expect(adapter.parse([])).toEqual([]);
  });

  it('passes unparseable prices through as NaN so the QuoteBook can reject them', () => {
    expect(adapter.parse({ s: 'BTCUSDT', b: '', a: 'abc' })).toEqual([
      { providerSymbol: 'BTCUSDT', bid: Number.NaN, ask: Number.NaN },
    ]);
  });
});
