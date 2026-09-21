import type { AggregatedQuote, ConnectionState } from '../core/types';
import type { FeedConfig, FeedOutput, FeedStats } from './FeedEngine';

/** Main thread -> worker. */
export type FeedCommand = { type: 'start'; config: FeedConfig } | { type: 'stop' };

/** Worker -> main thread. */
export type FeedEvent =
  | { type: 'quotes'; quotes: readonly AggregatedQuote[] }
  | { type: 'status'; provider: string; state: ConnectionState; detail?: string }
  | { type: 'stats'; stats: FeedStats };

/** Turns a received event back into a FeedOutput call. */
export function deliver(event: FeedEvent, out: FeedOutput): void {
  switch (event.type) {
    case 'quotes':
      out.quotes(event.quotes);
      break;
    case 'status':
      out.status(event.provider, event.state, event.detail);
      break;
    case 'stats':
      out.stats(event.stats);
      break;
  }
}