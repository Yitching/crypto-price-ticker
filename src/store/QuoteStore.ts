import type { AggregatedQuote } from '../core/types';

/** Decides when buffered quotes are applied. */
export type Scheduler = (flush: () => void) => void;

/** Once per screen repaint. */
export const frameScheduler: Scheduler = (flush) => {
  requestAnimationFrame(() => flush());
};

/** Immediately. Used for "conflation off" and in tests. */
export const immediateScheduler: Scheduler = (flush) => flush();

export class QuoteStore {
  private readonly quotes = new Map<string, AggregatedQuote>();
  private readonly pending = new Map<string, AggregatedQuote>();
  private readonly listeners = new Map<string, Set<() => void>>();
  private readonly schedule: Scheduler;
  private scheduled = false;
  private applied = 0;
  private flushes = 0;

  constructor(schedule: Scheduler = frameScheduler) {
    this.schedule = schedule;
  }

  ingest(batch: readonly AggregatedQuote[]): void {
    for (const quote of batch) this.pending.set(quote.symbol, quote); // latest wins
    if (!this.scheduled && this.pending.size > 0) {
      this.scheduled = true;
      this.schedule(this.flush);
    }
  }

  get(symbol: string): AggregatedQuote | undefined {
    return this.quotes.get(symbol);
  }

  subscribe(symbol: string, listener: () => void): () => void {
    let set = this.listeners.get(symbol);
    if (!set) {
      set = new Set();
      this.listeners.set(symbol, set);
    }
    set.add(listener);
    return () => {
      set.delete(listener);
      if (set.size === 0) this.listeners.delete(symbol);
    };
  }

  /** Symbol updates applied so far (for the stats display). */
  get appliedCount(): number {
    return this.applied;
  }

  /** Times the store has pushed changes to React (for the stats display). */
  get flushCount(): number {
    return this.flushes;
  }

  private readonly flush = (): void => {
    this.scheduled = false;
    const changed = [...this.pending.values()];
    this.pending.clear();
    for (const quote of changed) this.quotes.set(quote.symbol, quote);
    this.applied += changed.length;
    this.flushes++;
    for (const quote of changed) this.listeners.get(quote.symbol)?.forEach((listener) => listener());
  };
}