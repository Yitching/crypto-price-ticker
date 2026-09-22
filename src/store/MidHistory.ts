import { KeyedListeners } from './KeyedListeners';

const EMPTY: readonly number[] = [];

/**
 * Rolling mid-price samples per symbol for sparklines. Sampled on a slow
 * timer (not per tick), so charts cost one update per symbol per second.
 */
export class MidHistory {
  private readonly series = new Map<string, readonly number[]>();
  private readonly listeners = new KeyedListeners();

  private readonly capacity: number;

  constructor(capacity = 60) {
    this.capacity = capacity;
  }

  record(symbol: string, value: number): void {
    const previous = this.series.get(symbol) ?? EMPTY;
    const start = Math.max(0, previous.length - this.capacity + 1);
    this.series.set(symbol, [...previous.slice(start), value]);
    this.listeners.notify(symbol);
  }

  get(symbol: string): readonly number[] {
    return this.series.get(symbol) ?? EMPTY;
  }

  subscribe(symbol: string, listener: () => void): () => void {
    return this.listeners.subscribe(symbol, listener);
  }

  reset(): void {
    const symbols = [...this.series.keys()];
    this.series.clear();
    for (const symbol of symbols) this.listeners.notify(symbol);
  }
}
