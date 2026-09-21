import { createContext, useContext } from 'react';
import { LIVE_SYMBOLS, stressSymbols } from '../config/symbols';
import { FeedEngine, type FeedStats } from '../feed/FeedEngine';
import { BinanceAdapter } from '../providers/binance';
import { CoinbaseAdapter } from '../providers/coinbase';
import { KrakenAdapter } from '../providers/kraken';
import { SimulatorAdapter } from '../providers/simulators';
import type { ProviderAdapter } from '../providers/types';
import { QuoteStore, frameScheduler, immediateScheduler } from '../store/QuoteStore';
import { ValueStore } from '../store/ValueStore';

export interface AppConfig {
  mode: 'live' | 'stress';
  conflate: boolean;
  stressCount: number;
  stressRate: number;
}

/** Composition root: builds and starts everything, once. */
export function createServices(config: AppConfig) {
  const symbols = config.mode === 'stress' ? stressSymbols(config.stressCount) : [...LIVE_SYMBOLS];
  const quotes = new QuoteStore(config.conflate ? frameScheduler : immediateScheduler);
  const statuses = new ValueStore<Record<string, string>>({});
  const stats = new ValueStore<FeedStats | null>(null);

  const engine = new FeedEngine(
    {
      quotes: (batch) => quotes.ingest(batch),
      status: (provider, state, detail) =>
        statuses.set((prev) => ({ ...prev, [provider]: detail ? `${state} (${detail})` : state })),
      stats: (s) => stats.set(s),
    },
    { flushIntervalMs: 16, staleAfterMs: 30_000, conflate: config.conflate },
  );

  const adapters: ProviderAdapter[] =
    config.mode === 'stress'
      ? [new SimulatorAdapter({ ratePerSecond: config.stressRate, venues: ['sim-a', 'sim-b', 'sim-c'] })]
      : [new KrakenAdapter(), new CoinbaseAdapter(), new BinanceAdapter()];
  engine.start(symbols, adapters);

  return { config, symbols, quotes, statuses, stats };
}

export type Services = ReturnType<typeof createServices>;

export const ServicesContext = createContext<Services | null>(null);

export function useServices(): Services {
  const services = useContext(ServicesContext);
  if (!services) throw new Error('useServices must be used inside ServicesContext.Provider');
  return services;
}