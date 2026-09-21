import { createContext, useContext } from 'react';
import { LIVE_SYMBOLS, stressSymbols } from '../config/symbols';
import { QuoteStore, frameScheduler, immediateScheduler } from '../store/QuoteStore';
import { ValueStore } from '../store/ValueStore';
import { createFeedClient } from '../feed/FeedClient';
import type { FeedStats } from '../feed/FeedEngine';
import type { ProviderSpec } from '../providers/types';

export interface AppConfig {
  mode: 'live' | 'stress';
  conflate: boolean;
  stressCount: number;
  stressRate: number;
  useWorker: boolean;
}

/** Composition root: builds and starts everything, once. */
export function createServices(config: AppConfig) {
  const symbols = config.mode === 'stress' ? stressSymbols(config.stressCount) : [...LIVE_SYMBOLS];
  const quotes = new QuoteStore(config.conflate ? frameScheduler : immediateScheduler);
  const statuses = new ValueStore<Record<string, string>>({});
  const stats = new ValueStore<FeedStats | null>(null);

  const feed = createFeedClient(
    {
      quotes: (batch) => quotes.ingest(batch),
      status: (provider, state, detail) =>
        statuses.set((prev) => ({ ...prev, [provider]: detail ? `${state} (${detail})` : state })),
      stats: (s) => stats.set(s),
    },
    config.useWorker,
  );

  const providers: ProviderSpec[] =
    config.mode === 'stress'
      ? [{ kind: 'simulator', options: { ratePerSecond: config.stressRate, venues: ['sim-a', 'sim-b', 'sim-c'] } }]
      : [{ kind: 'kraken' }, { kind: 'coinbase' }, { kind: 'binance' }];

  feed.start({
    symbols,
    providers,
    options: { flushIntervalMs: 16, staleAfterMs: 30_000, conflate: config.conflate },
  });

  return { config, symbols, quotes, statuses, stats, feed };}

export type Services = ReturnType<typeof createServices>;

export const ServicesContext = createContext<Services | null>(null);

export function useServices(): Services {
  const services = useContext(ServicesContext);
  if (!services) throw new Error('useServices must be used inside ServicesContext.Provider');
  return services;
}