import type { AggregatedQuote } from '../core/types';
import { KeyedListeners } from './KeyedListeners';

export type Move = -1 | 0 | 1;

/** An aggregated quote plus what the UI needs to animate changes. */
export interface QuoteView extends AggregatedQuote {
  /** Direction of the last price change on each side. */
  readonly bidMove: Move;
  readonly askMove: Move;
  /** Incremented only when that side's price changes; drives the digit flash. */
  readonly bidSeq: number;
  readonly askSeq: number;
  /** The price before the last change, so the UI can flash only the digits that moved. */
  readonly bidPrev?: number;
  readonly askPrev?: number;
}

/** Decides when buffered quotes are applied. */
export type Scheduler = (flush: () => void) => void;

/** Once per screen repaint. */
export const frameScheduler: Scheduler = (flush) => {
  requestAnimationFrame(() => flush());
};

/** Immediately. Used for "conflation off" and in tests. */
export const immediateScheduler: Scheduler = (flush) => flush();

function moveOf(previous: number | undefined, next: number | undefined): Move {
  if (previous === undefined || next === undefined || previous === next) return 0;
  return next > previous ? 1 : -1;
}

export function toView(previous: QuoteView | undefined, next: AggregatedQuote): QuoteView {
  const bidMove = moveOf(previous?.bid?.price, next.bid?.price);
  const askMove = moveOf(previous?.ask?.price, next.ask?.price);
  return {
    ...next,
    bidMove: bidMove || previous?.bidMove || 0,
    askMove: askMove || previous?.askMove || 0,
    bidSeq: (previous?.bidSeq ?? 0) + (bidMove ? 1 : 0),
    askSeq: (previous?.askSeq ?? 0) + (askMove ? 1 : 0),
    bidPrev: bidMove ? previous?.bid?.price : previous?.bidPrev,
    askPrev: askMove ? previous?.ask?.price : previous?.askPrev,
  };
}

/**
 * Quote state outside React. Batches are buffered and applied once per frame (latest wins);
 * only components subscribed to a symbol that changed are notified.
 */
export class QuoteStore {
  private readonly views = new Map<string, QuoteView>();
  private readonly pending = new Map<string, AggregatedQuote>();
  private readonly listeners = new KeyedListeners();
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

  /** What is on screen now. Trades execute against this. */
  get(symbol: string): QuoteView | undefined {
    return this.views.get(symbol);
  }

  subscribe(symbol: string, listener: () => void): () => void {
    return this.listeners.subscribe(symbol, listener);
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
    for (const quote of changed) this.views.set(quote.symbol, toView(this.views.get(quote.symbol), quote));
    this.applied += changed.length;
    this.flushes++;
    for (const quote of changed) this.listeners.notify(quote.symbol);
  };
}