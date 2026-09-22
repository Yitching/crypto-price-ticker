import type { AggregatedQuote } from '../core/types';
import { providerLabel } from '../config/providers';
import { baseCurrency } from '../core/instruments';
import type { ExecutionResult, ExecutionVenue, TradeRequest } from './types';

export interface SimulatedVenueOptions {
  minLatencyMs?: number;
  maxLatencyMs?: number;
  /** Max adverse move (basis points) accepted between click and execution. */
  toleranceBps?: number;
  random?: () => number;
}

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Dummy execution with FX-style "last look": after a simulated round trip the
 * venue re-checks its own current price and rejects if it moved against the
 * client by more than the tolerance. Otherwise fills at the requested price.
 */
export class SimulatedVenue implements ExecutionVenue {
  private readonly options: Required<SimulatedVenueOptions>;
  private readonly quoteOf: (symbol: string) => AggregatedQuote | undefined;

  constructor(quoteOf: (symbol: string) => AggregatedQuote | undefined, options: SimulatedVenueOptions = {}) {
    this.quoteOf = quoteOf;
    this.options = { minLatencyMs: 150, maxLatencyMs: 450, toleranceBps: 10, random: Math.random, ...options };
  }

  async execute(request: TradeRequest): Promise<ExecutionResult> {
    const { minLatencyMs, maxLatencyMs, random } = this.options;
    await delay(minLatencyMs + random() * (maxLatencyMs - minLatencyMs));
    return this.decide(request);
  }

  /** The pure last-look decision, separated for testing. */
  decide(request: TradeRequest): ExecutionResult {
    if (!(request.amount > 0)) return { status: 'rejected', reason: 'Amount must be greater than zero' };

    const source = this.quoteOf(request.symbol)?.sources.find((s) => s.provider === request.provider);
    if (!source) return { status: 'rejected', reason: `${providerLabel(request.provider)} is no longer quoting` };

    const current = request.side === 'buy' ? source.ask : source.bid;
    const adverse = request.side === 'buy' ? current - request.price : request.price - current;
    const movedBps = (adverse / request.price) * 10_000;
    if (movedBps > this.options.toleranceBps) {
      return { status: 'rejected', reason: `Price moved ${movedBps.toFixed(1)} bps against you` };
    }

    const baseAmount =
      request.dealtCurrency === baseCurrency(request.symbol) ? request.amount : request.amount / request.price;
    return { status: 'filled', price: request.price, baseAmount, quoteAmount: baseAmount * request.price };
  }
}