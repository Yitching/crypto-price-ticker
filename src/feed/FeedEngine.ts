import type { AggregatedQuote, ConnectionState, ProviderQuote } from '../core/types';
import type { ProviderAdapter, QuoteSink } from '../providers/types';
import { QuoteBook } from './aggregator';

export interface FeedStats {
  /** Raw updates received from providers in the last second. */
  readonly ticksPerSecond: number;
}

/** Where the engine sends its results. It never touches React or the stores directly. */
export interface FeedOutput {
  quotes(batch: readonly AggregatedQuote[]): void;
  status(provider: string, state: ConnectionState, detail?: string): void;
  stats(stats: FeedStats): void;
}

export interface FeedOptions {
  flushIntervalMs: number;
  staleAfterMs: number;
  /** Off = send every change immediately (for before/after comparisons). */
  conflate: boolean;
}

const DEFAULT_OPTIONS: FeedOptions = { flushIntervalMs: 16, staleAfterMs: 30_000, conflate: true };

export class FeedEngine {
  private readonly out: FeedOutput;
  private readonly options: FeedOptions;
  private readonly book = new QuoteBook();
  private readonly dirty = new Set<string>();
  private adapters: ProviderAdapter[] = [];
  private timers: ReturnType<typeof setInterval>[] = [];
  private ticks = 0;
  private running = false;

  constructor(out: FeedOutput, options: FeedOptions = DEFAULT_OPTIONS) {
    this.out = out;
    this.options = options;
  }

  start(symbols: readonly string[], adapters: ProviderAdapter[]): void {
    this.stop();
    this.running = true;
    this.adapters = adapters;

    const sink: QuoteSink = {
      quote: (q) => this.onQuote(q),
      status: (provider, state, detail) => this.onStatus(provider, state, detail),
    };
    for (const adapter of adapters) adapter.start(symbols, sink);

    this.timers.push(
      setInterval(() => this.flush(), this.options.flushIntervalMs),
      setInterval(() => this.expireStale(), 1_000),
      setInterval(() => this.reportStats(), 1_000),
    );
  }

  stop(): void {
    this.running = false;
    for (const timer of this.timers) clearInterval(timer);
    this.timers = [];
    for (const adapter of this.adapters) adapter.stop();
    this.adapters = [];
    this.book.clear();
    this.dirty.clear();
  }

  /** Sends one batch: the current best price of every symbol that changed. */
  flush(): void {
    if (this.dirty.size === 0) return;
    const batch = [...this.dirty].map((symbol) => this.book.aggregate(symbol));
    this.dirty.clear();
    this.out.quotes(batch);
  }

  private onQuote(quote: ProviderQuote): void {
    if (!this.running) return;
    this.ticks++;
    if (!this.book.update(quote)) return;
    if (this.options.conflate) {
      this.dirty.add(quote.symbol); // just remember it; flush() sends it later
    } else {
      this.out.quotes([this.book.aggregate(quote.symbol)]); // send right now
    }
  }

  private onStatus(provider: string, state: ConnectionState, detail?: string): void {
    if (!this.running) return;
    if (state === 'reconnecting' || state === 'closed') {
      for (const symbol of this.book.removeProvider(provider)) this.dirty.add(symbol);
    }
    this.out.status(provider, state, detail);
  }

  private expireStale(): void {
    for (const symbol of this.book.expire(Date.now(), this.options.staleAfterMs)) this.dirty.add(symbol);
  }

  private reportStats(): void {
    this.out.stats({ ticksPerSecond: this.ticks });
    this.ticks = 0;
  }
}