import { LIVE_INSTRUMENTS, defineInstrument } from '../core/instruments';
import type { Instrument } from '../core/types';

export const LIVE_SYMBOLS: readonly string[] = LIVE_INSTRUMENTS.map((i) => i.symbol);

export function stressSymbols(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `SIM${String(i + 1).padStart(2, '0')}/USD`);
}

/** Simulated prices sit between 10 and 1,000, so one precision fits every synthetic pair. */
export function stressInstruments(count: number): Instrument[] {
  return stressSymbols(count).map((symbol) =>
    defineInstrument(symbol, { priceDecimals: 3, pipDecimals: 2, sizeDecimals: 2, defaultAmount: 10 }),
  );
}