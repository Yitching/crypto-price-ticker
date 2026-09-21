import type { AggregatedQuote, ConnectionState, ProviderQuote } from '../core/types';
import type { ProviderAdapter, QuoteSink, ProviderSpec } from '../providers/types';
import { QuoteBook } from './aggregator';
import { createAdapter as defaultCreateAdapter } from '../providers/registry';

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

export interface FeedConfig {
  readonly symbols: readonly string[];
  readonly providers: readonly ProviderSpec[];
  readonly options: FeedOptions;
}

const DEFAULT_OPTIONS: FeedOptions = { flushIntervalMs: 16, staleAfterMs: 30_000, conflate: true };

export class FeedEngine {
  private readonly out: FeedOutput;
  private readonly book = new QuoteBook();
  private readonly dirty = new Set<string>();
  private readonly createAdapter: (spec: ProviderSpec) => ProviderAdapter;
  private adapters: ProviderAdapter[] = [];
  private timers: ReturnType<typeof setInterval>[] = [];
  private ticks = 0;
  private running = false;
  private options: FeedOptions = DEFAULT_OPTIONS;

  constructor(out: FeedOutput, createAdapter = defaultCreateAdapter) {
    this.out = out;
    this.createAdapter = createAdapter; // tests can pass a fake
  }

  start(config: FeedConfig): void {
    this.stop();
    this.running = true;
    this.options = config.options;

    const sink: QuoteSink = {
      quote: (q) => this.onQuote(q),
      status: (provider, state, detail) => this.onStatus(provider, state, detail),
    };

    for (const spec of config.providers) {
      try {
        const adapter = this.createAdapter(spec);
        this.adapters.push(adapter);
        adapter.start(config.symbols, sink);
      } catch (error) {
        // One broken provider must not take the others down.
        this.out.status(spec.kind, 'closed', error instanceof Error ? error.message : String(error));
      }
    }

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