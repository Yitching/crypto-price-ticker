export const LIVE_SYMBOLS: readonly string[] = ['BTC/USD', 'ETH/USD', 'SOL/USD', 'XRP/USD', 'ADA/USD', 'DOGE/USD'];

export function stressSymbols(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `SIM${String(i + 1).padStart(2, '0')}/USD`);
}