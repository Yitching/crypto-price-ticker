import { isRecord, toNumber } from '../utils/guards';
import { WebSocketAdapter, type RawQuote } from './WebSocketAdapter';

/** 
 * {
    "u": 100428144057,
    "s": "BTCUSDT",
    "b": "85241.94000000",
    "B": "3.50632000",
    "a": "85241.95000000",
    "A": "0.00099000"
    }
 * 
 * **/
/** Binance spot bookTicker: best bid/ask on every change. USD maps to USDT (allowed by the brief). */
export class BinanceAdapter extends WebSocketAdapter {
  readonly id = 'binance';
  protected readonly url = 'wss://data-stream.binance.vision/ws';

  protected toProviderSymbol(symbol: string): string {
    const [base, quote] = symbol.split('/');
    return `${base}${quote === 'USD' ? 'USDT' : quote}`; // "BTC/USD" -> "BTCUSDT"
  }

  protected subscribeMessages(symbols: string[]): unknown[] {
    return [{ method: 'SUBSCRIBE', params: symbols.map((s) => `${s.toLowerCase()}@bookTicker`), id: 1 }];
  }

  parse(message: unknown): RawQuote[] {
    console.log('Binance message', message);    
    if (!isRecord(message) || typeof message.s !== 'string') return [];
    return [{ providerSymbol: message.s, bid: toNumber(message.b), ask: toNumber(message.a) }];
  }
}