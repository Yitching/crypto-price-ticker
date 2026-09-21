import type { ProviderAdapter, QuoteSink } from './types';

export interface SimulatorOptions {
  ratePerSecond: number;
  venues: readonly string[];
}

/** Fake multi-venue feed for load testing. Real feeds can't produce 3,000 updates/s on demand. */
export class SimulatorAdapter implements ProviderAdapter {
  readonly id = 'simulator';
  private readonly options: SimulatorOptions;
  private readonly mids = new Map<string, number>();
  private timer: ReturnType<typeof setInterval> | undefined;
  private carry = 0;

  constructor(options: SimulatorOptions) {
    this.options = options;
  }

  start(symbols: readonly string[], sink: QuoteSink): void {
    this.stop();
    for (const symbol of symbols) this.mids.set(symbol, 10 + Math.random() * 990);
    for (const venue of this.options.venues) sink.status(venue, 'open');

    const tickMs = 10;
    this.timer = setInterval(() => {
      // Spread the rate evenly: 100/s = 1 per 10ms tick, 3000/s = 30 per tick.
      this.carry += (this.options.ratePerSecond * tickMs) / 1000;
      const count = Math.floor(this.carry);
      this.carry -= count;
      for (let i = 0; i < count; i++) this.emit(symbols, sink);
    }, tickMs);
  }

  stop(): void {
    clearInterval(this.timer);
    this.timer = undefined;
  }

  private emit(symbols: readonly string[], sink: QuoteSink): void {
    const { venues } = this.options;
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const venue = venues[Math.floor(Math.random() * venues.length)];
    if (!symbol || !venue) return;

    const mid = (this.mids.get(symbol) ?? 100) * (1 + (Math.random() - 0.5) * 0.0002);
    this.mids.set(symbol, mid);
    const half = mid * 0.0002 * (0.5 + Math.random());
    sink.quote({ provider: venue, symbol, bid: mid - half, ask: mid + half, ts: Date.now() });
  }
}