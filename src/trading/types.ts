import type { ProviderId, Side } from '../core/types';

export interface TradeRequest {
  readonly symbol: string;
  readonly side: Side;
  readonly amount: number;
  /** Currency the amount is in: the base (e.g. BTC) or the quote (e.g. USD). */
  readonly dealtCurrency: string;
  /** Price the user clicked. */
  readonly price: number;
  /** Provider that was showing that price. */
  readonly provider: ProviderId;
}

export interface Fill {
  readonly price: number;
  readonly baseAmount: number;
  readonly quoteAmount: number;
}

export type ExecutionResult =
  | ({ readonly status: 'filled' } & Fill)
  | { readonly status: 'rejected'; readonly reason: string };

/** Swap the simulated venue for a real OMS/FIX gateway without touching the UI. */
export interface ExecutionVenue {
  execute(request: TradeRequest): Promise<ExecutionResult>;
}

export type TradeStatus = 'pending' | 'filled' | 'rejected';

export interface Trade {
  readonly id: string;
  readonly request: TradeRequest;
  readonly status: TradeStatus;
  readonly requestedAt: number;
  readonly completedAt?: number;
  readonly fill?: Fill;
  readonly rejectReason?: string;
}