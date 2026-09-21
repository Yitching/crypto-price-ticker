import { BinanceAdapter } from './binance';
import { CoinbaseAdapter } from './coinbase';
import { KrakenAdapter } from './kraken';
import { SimulatorAdapter, type SimulatorOptions } from './simulators';
import type { ProviderAdapter, ProviderSpec } from './types';

type AdapterFactory = (options: unknown) => ProviderAdapter;

/** The one place that maps a provider name to its class. Add new providers here. */
const factories: Record<string, AdapterFactory> = {
  kraken: () => new KrakenAdapter(),
  coinbase: () => new CoinbaseAdapter(),
  binance: () => new BinanceAdapter(),
  simulator: (options) => new SimulatorAdapter(options as SimulatorOptions),
};

export function createAdapter(spec: ProviderSpec): ProviderAdapter {
  const factory = factories[spec.kind];
  if (!factory) throw new Error(`Unknown provider "${spec.kind}"`);
  return factory(spec.options);
}