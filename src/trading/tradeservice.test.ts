import { describe, expect, it } from 'vitest';
import type { AggregatedQuote } from '../core/types';
import { TradeService } from './TradeService';
import { SimulatedVenue } from './SimulatedVenue';
import type { ExecutionVenue, TradeRequest } from './types';

const book = (bid: number, ask: number): AggregatedQuote => ({
  symbol: 'BTC/USD',
  bid: { price: bid, provider: 'kraken' },
  ask: { price: ask, provider: 'kraken' },
  sources: [{ provider: 'kraken', symbol: 'BTC/USD', bid, ask, ts: 0 }],
});

const request = (overrides: Partial<TradeRequest> = {}): TradeRequest => ({
  symbol: 'BTC/USD',
  side: 'buy',
  amount: 2,
  dealtCurrency: 'BTC',
  price: 100_000,
  provider: 'kraken',
  ...overrides,
});

describe('SimulatedVenue last look', () => {
  it('fills when the price has not moved beyond tolerance', () => {
    const venue = new SimulatedVenue(() => book(99_990, 100_005), { toleranceBps: 10 });
    expect(venue.decide(request())).toEqual({ status: 'filled', price: 100_000, baseAmount: 2, quoteAmount: 200_000 });
  });

  it('rejects an adverse move beyond tolerance', () => {
    const venue = new SimulatedVenue(() => book(100_150, 100_200), { toleranceBps: 10 });
    const result = venue.decide(request());
    expect(result.status).toBe('rejected');
  });

  it('fills when the price moved in the client’s favour', () => {
    const venue = new SimulatedVenue(() => book(99_000, 99_100), { toleranceBps: 1 });
    expect(venue.decide(request()).status).toBe('filled');
  });

  it('converts a quote-currency amount to base', () => {
    const venue = new SimulatedVenue(() => book(99_990, 100_000));
    const result = venue.decide(request({ amount: 50_000, dealtCurrency: 'USD' }));
    expect(result).toMatchObject({ status: 'filled', baseAmount: 0.5 });
  });

  it('rejects when the provider stopped quoting', () => {
    const venue = new SimulatedVenue(() => undefined);
    expect(venue.decide(request())).toMatchObject({ status: 'rejected' });
  });
});

describe('TradeService', () => {
  it('records a pending trade then its outcome', async () => {
    let resolve!: (v: Awaited<ReturnType<ExecutionVenue['execute']>>) => void;
    const venue: ExecutionVenue = { execute: () => new Promise((r) => (resolve = r)) };
    const service = new TradeService(venue, () => 1);

    const done = service.submit(request());
    expect(service.trades.get()[0]).toMatchObject({ id: 'T0001', status: 'pending' });

    resolve({ status: 'filled', price: 100_000, baseAmount: 2, quoteAmount: 200_000 });
    const trade = await done;
    expect(trade.status).toBe('filled');
    expect(service.trades.get()).toEqual([trade]);
  });

  it('turns venue errors into rejections', async () => {
    const service = new TradeService({ execute: () => Promise.reject(new Error('Gateway down')) });
    const trade = await service.submit(request());
    expect(trade).toMatchObject({ status: 'rejected', rejectReason: 'Gateway down' });
  });
});