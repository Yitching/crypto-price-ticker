import { createContext, useContext } from 'react';
import { LIVE_INSTRUMENTS } from '../core/instruments';
import type { ConnectionState } from '../core/types';
import { stressInstruments } from '../config/symbols';
import { createFeedClient } from '../feed/FeedClient';
import type { FeedStats } from '../feed/FeedEngine';
import type { ProviderSpec } from '../providers/types';
import { MidHistory } from '../store/MidHistory';
import { QuoteStore, frameScheduler, immediateScheduler } from '../store/QuoteStore';
import { ValueStore } from '../store/ValueStore';
import { SimulatedVenue } from '../trading/SimulatedVenue';
import { TradeService } from '../trading/TradeService';

export interface AppConfig {
  mode: 'live' | 'stress';
  conflate: boolean;
  stressCount: number;
  stressRate: number;
  useWorker: boolean;
}

export interface ProviderStatus {
  readonly state: ConnectionState;
  readonly detail?: string;
}

/** Composition root: builds and starts everything, once. */
export function createServices(config: AppConfig) {
  const instruments = config.mode === 'stress' ? stressInstruments(config.stressCount) : [...LIVE_INSTRUMENTS];
  const symbols = instruments.map((i) => i.symbol);
  const quotes = new QuoteStore(config.conflate ? frameScheduler : immediateScheduler);
  const statuses = new ValueStore<Record<string, ProviderStatus>>({});
  const stats = new ValueStore<FeedStats | null>(null);

  const feed = createFeedClient(
    {
      quotes: (batch) => quotes.ingest(batch),
      status: (provider, state, detail) => statuses.set((prev) => ({ ...prev, [provider]: { state, detail } })),
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

  // Trades execute against the price that is on screen.
  const trading = new TradeService(new SimulatedVenue((symbol) => quotes.get(symbol)));

  // Sparklines: sample each mid once a second, not on every tick.
  const history = new MidHistory(60);
  setInterval(() => {
    for (const symbol of symbols) {
      const q = quotes.get(symbol);
      if (q?.bid && q.ask) history.record(symbol, (q.bid.price + q.ask.price) / 2);
    }
  }, 1000);

  return { config, instruments, symbols, quotes, statuses, stats, feed, trading, history };
}

export type Services = ReturnType<typeof createServices>;

export const ServicesContext = createContext<Services | null>(null);

export function useServices(): Services {
  const services = useContext(ServicesContext);
  if (!services) throw new Error('useServices must be used inside ServicesContext.Provider');
  return services;
}
