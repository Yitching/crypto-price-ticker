import type { Instrument } from './types';

type Precision = Pick<Instrument, 'priceDecimals' | 'pipDecimals' | 'sizeDecimals' | 'defaultAmount'>;

export function defineInstrument(symbol: string, precision: Precision): Instrument {
  const [base, quote] = symbol.split('/');
  if (!base || !quote) throw new Error(`Invalid symbol "${symbol}", expected BASE/QUOTE`);
  return { symbol, base, quote, ...precision };
}

export function baseCurrency(symbol: string): string {
  return symbol.split('/')[0] ?? symbol;
}

function roundToOneSignificant(x: number): number {
  const step = 10 ** Math.floor(Math.log10(x));
  return Math.round(x / step) * step;
}

/**
 * Derives sensible display precision from a price's magnitude, so any
 * instrument (including generated ones) renders with ~6 significant digits.
 */
export function inferPrecision(referencePrice: number, notional = 10_000): Precision {
  const magnitude = Math.floor(Math.log10(referencePrice));
  const priceDecimals = Math.min(8, Math.max(0, 5 - magnitude));
  const rawPip = priceDecimals - 1;
  // A pip position of 1 would put the decimal point inside the large digits.
  const pipDecimals = rawPip === 1 ? 0 : rawPip;
  const sizeDecimals = Math.min(8, Math.max(0, magnitude));
  const defaultAmount = Number(roundToOneSignificant(notional / referencePrice).toFixed(sizeDecimals)) || 1;
  return { priceDecimals, pipDecimals, sizeDecimals, defaultAmount };
}

/** Pairs shown in live mode. USDT pairs are treated as USD (per the brief). */
export const LIVE_INSTRUMENTS: readonly Instrument[] = [
  defineInstrument('BTC/USD', { priceDecimals: 2, pipDecimals: 0, sizeDecimals: 5, defaultAmount: 1 }),
  defineInstrument('ETH/USD', { priceDecimals: 2, pipDecimals: 0, sizeDecimals: 4, defaultAmount: 10 }),
  defineInstrument('SOL/USD', { priceDecimals: 2, pipDecimals: 0, sizeDecimals: 2, defaultAmount: 100 }),
  defineInstrument('XRP/USD', { priceDecimals: 4, pipDecimals: 3, sizeDecimals: 0, defaultAmount: 10_000 }),
  defineInstrument('ADA/USD', { priceDecimals: 4, pipDecimals: 3, sizeDecimals: 0, defaultAmount: 10_000 }),
  defineInstrument('DOGE/USD', { priceDecimals: 5, pipDecimals: 4, sizeDecimals: 0, defaultAmount: 50_000 }),
  defineInstrument('LTC/USD', { priceDecimals: 2, pipDecimals: 0, sizeDecimals: 3, defaultAmount: 100 }),
  defineInstrument('LINK/USD', { priceDecimals: 3, pipDecimals: 2, sizeDecimals: 2, defaultAmount: 500 }),
  defineInstrument('DOT/USD', { priceDecimals: 3, pipDecimals: 2, sizeDecimals: 2, defaultAmount: 1_000 }),
  defineInstrument('AVAX/USD', { priceDecimals: 2, pipDecimals: 0, sizeDecimals: 2, defaultAmount: 500 }),
];