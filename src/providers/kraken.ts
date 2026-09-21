import type { ProviderQuote } from '../core/types';
import { isRecord } from '../utils/guards';

export const KRAKEN_URL = 'wss://ws.kraken.com/v2';

// bbo makes event trigger only when best bid or best ask changes, trades makes event trigger on every trade. We only want bbo.\
// based on https://docs.kraken.com/exchange/api-reference/spot-websocket-v2/ticker
type KrakenEventTrigger = 'bbo' | 'trades'; 
interface KrakenTickerSubscribe {
  method: 'subscribe';
  params: {
    channel: 'ticker';
    symbol: string[];
    event_trigger?: KrakenEventTrigger;
    snapshot?: boolean;
  };
}

export function krakenSubscribe(symbols: string[]): KrakenTickerSubscribe {
  return { method: 'subscribe', params: { channel: 'ticker', symbol: symbols, event_trigger: 'bbo' } };
}

/** Returns quotes from one Kraken message, or [] for anything else. */
export function parseKraken(message: unknown, now: number): ProviderQuote[] {
    // sometimes receive message.channel === 'heartbeat' which keeps the connection alive, but has no price data. 
    // sometimes receive message.channel === 'systemStatus' which is just a status message.
  if (!isRecord(message) || message.channel !== 'ticker' || !Array.isArray(message.data)) return [];
  const quotes: ProviderQuote[] = [];
  for (const item of message.data as unknown[]) {
    if (!isRecord(item)) continue;
    const { symbol, bid, ask } = item;
    if (typeof symbol !== 'string' || typeof bid !== 'number' || typeof ask !== 'number') continue;
    quotes.push({ provider: 'kraken', symbol, bid, ask, ts: now });
  }
  return quotes;
}