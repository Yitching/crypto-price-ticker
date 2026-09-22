import { describe, expect, it } from 'vitest';
import { defineInstrument, inferPrecision } from './instruments';

describe('instruments', () => {
  it('splits symbols into base and quote', () => {
    const i = defineInstrument('BTC/USD', { priceDecimals: 2, pipDecimals: 0, sizeDecimals: 5, defaultAmount: 1 });
    expect(i.base).toBe('BTC');
    expect(i.quote).toBe('USD');
  });

  it('rejects malformed symbols', () => {
    expect(() => defineInstrument('BTCUSD', { priceDecimals: 2, pipDecimals: 0, sizeDecimals: 5, defaultAmount: 1 })).toThrow();
  });

  it('infers precision from magnitude and keeps the decimal point out of the pips', () => {
    expect(inferPrecision(100_000)).toMatchObject({ priceDecimals: 0, pipDecimals: -1 });
    expect(inferPrecision(3_500)).toMatchObject({ priceDecimals: 2, pipDecimals: 0, defaultAmount: 3 });
    expect(inferPrecision(0.2)).toMatchObject({ priceDecimals: 6, pipDecimals: 5, defaultAmount: 50_000 });
  });
});