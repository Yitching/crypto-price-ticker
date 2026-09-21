import { isRecord } from '../utils/guards';
import { WebSocketAdapter, type RawQuote } from './WebSocketAdapter';
/**
 * {
    "channel": "ticker",
    "type": "update",
    "data": [
        {
            "symbol": "ETH/USD",
            "bid": 2727,
            "bid_qty": 1.71170942,
            "ask": 2727.01,
            "ask_qty": 4.14973056,
            "last": 2727.05,
            "volume": 59206.59864743,
            "vwap": 2662.38,
            "low": 2573.6,
            "high": 2748.87,
            "change": 149.98,
            "change_pct": 5.82,
            "trades": 81314,
            "timestamp": "2026-09-21T12:53:29.601494Z"
        }
    ]
}
 */
/** Kraken spot WebSocket v2, ticker channel. */
export class KrakenAdapter extends WebSocketAdapter {
  readonly id = 'kraken';
  protected readonly url = 'wss://ws.kraken.com/v2';

  protected toProviderSymbol(symbol: string): string {
    return symbol; // Kraken v2 already uses "BTC/USD"
  }

  protected subscribeMessages(symbols: string[]): unknown[] {
    return [{ method: 'subscribe', params: { channel: 'ticker', symbol: symbols, event_trigger: 'bbo' } }];
  }

  parse(message: unknown): RawQuote[] {
    console.log('Kraken message', message);
    if (!isRecord(message) || message.channel !== 'ticker' || !Array.isArray(message.data)) return [];
    const quotes: RawQuote[] = [];
    for (const item of message.data as unknown[]) {
      if (!isRecord(item)) continue;
      const { symbol, bid, ask } = item;
      if (typeof symbol !== 'string' || typeof bid !== 'number' || typeof ask !== 'number') continue;
      quotes.push({ providerSymbol: symbol, bid, ask });
    }
    return quotes;
  }
}