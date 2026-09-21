import { isRecord, toNumber } from '../utils/guards';
import { WebSocketAdapter, type RawQuote } from './WebSocketAdapter';

/**
 * {
    "type": "ticker",
    "sequence": 136476180848,
    "product_id": "BTC-USD",
    "price": "85239.01",
    "open_24h": "80451.15",
    "volume_24h": "7680.14725984",
    "low_24h": "80377.5",
    "high_24h": "85457.35",
    "volume_30d": "188434.59975415",
    "best_bid": "85239.01",
    "best_bid_size": "0.10402468",
    "best_ask": "85239.02",
    "best_ask_size": "0.09520733",
    "side": "sell",
    "time": "2026-09-21T12:53:30.493800Z",
    "trade_id": 1096046387,
    "last_size": "0.00000035"
}
*/
/** Coinbase Exchange public feed, ticker channel. */
export class CoinbaseAdapter extends WebSocketAdapter {
  readonly id = 'coinbase';
  protected readonly url = 'wss://ws-feed.exchange.coinbase.com';

  protected toProviderSymbol(symbol: string): string {
    return symbol.replace('/', '-'); // "BTC/USD" -> "BTC-USD"
  }

  protected subscribeMessages(productIds: string[]): unknown[] {
    return [{ type: 'subscribe', product_ids: productIds, channels: ['ticker', 'heartbeat'] }];
  }

  parse(message: unknown): RawQuote[] {
    console.log('Coinbase message', message);
    if (!isRecord(message) || message.type !== 'ticker' || typeof message.product_id !== 'string') return [];
    return [{ providerSymbol: message.product_id, bid: toNumber(message.best_bid), ask: toNumber(message.best_ask) }];
  }
}