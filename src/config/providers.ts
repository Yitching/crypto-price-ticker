const LABELS: Readonly<Record<string, string>> = {
  kraken: 'Kraken',
  coinbase: 'Coinbase',
  binance: 'Binance',
  simulator: 'Simulator',
  'sim-a': 'Sim A',
  'sim-b': 'Sim B',
  'sim-c': 'Sim C',
};

export function providerLabel(id: string): string {
  return LABELS[id] ?? id;
}