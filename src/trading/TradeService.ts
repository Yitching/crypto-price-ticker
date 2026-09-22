import { ValueStore } from '../store/ValueStore';
import { errorMessage } from '../utils/guards';
import type { ExecutionResult, ExecutionVenue, Trade, TradeRequest } from './types';

/** Owns the trade lifecycle and the blotter. The venue decides the outcome. */
export class TradeService {
  readonly trades = new ValueStore<readonly Trade[]>([]);
  private sequence = 0;
  private readonly venue: ExecutionVenue;
  private readonly now: () => number;
  private readonly maxTrades: number;

  constructor(venue: ExecutionVenue, now: () => number = Date.now, maxTrades = 200) {
    this.venue = venue;
    this.now = now;
    this.maxTrades = maxTrades;
  }

  async submit(request: TradeRequest): Promise<Trade> {
    const id = `T${String(++this.sequence).padStart(4, '0')}`;
    const pending: Trade = { id, request, status: 'pending', requestedAt: this.now() };
    this.trades.set((list) => [pending, ...list].slice(0, this.maxTrades));

    let result: ExecutionResult;
    try {
      result = await this.venue.execute(request);
    } catch (error) {
      result = { status: 'rejected', reason: errorMessage(error) };
    }

    const completedAt = this.now();
    const done: Trade =
      result.status === 'filled'
        ? {
            ...pending,
            status: 'filled',
            completedAt,
            fill: { price: result.price, baseAmount: result.baseAmount, quoteAmount: result.quoteAmount },
          }
        : { ...pending, status: 'rejected', completedAt, rejectReason: result.reason };

    this.trades.set((list) => list.map((t) => (t.id === id ? done : t)));
    return done;
  }
}