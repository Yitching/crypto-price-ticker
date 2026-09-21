import type { QuoteSink, ProviderAdapter } from './types';

/** A quote in the provider's own naming, before mapping to canonical symbols. */
export interface RawQuote {
  readonly providerSymbol: string;
  readonly bid: number;
  readonly ask: number;
}

export abstract class WebSocketAdapter implements ProviderAdapter {
  abstract readonly id: string;
  protected abstract readonly url: string;

  /** "BTC/USD" -> this exchange's name for it. */
  protected abstract toProviderSymbol(symbol: string): string;
  protected abstract subscribeMessages(providerSymbols: string[]): unknown[];
  /** Pure: one decoded message in, quotes out. Returns [] for anything else. */
  abstract parse(message: unknown): RawQuote[];

  private ws: WebSocket | null = null;
  private toCanonical = new Map<string, string>();

  start(symbols: readonly string[], sink: QuoteSink): void {
    this.stop();
    this.toCanonical = new Map(symbols.map((s) => [this.toProviderSymbol(s), s]));
    const providerSymbols = [...this.toCanonical.keys()];

    const ws = new WebSocket(this.url);
    this.ws = ws;
    sink.status(this.id, 'connecting');

    ws.onopen = () => {
      sink.status(this.id, 'open');
      for (const message of this.subscribeMessages(providerSymbols)) ws.send(JSON.stringify(message));
    };
    ws.onmessage = (event: MessageEvent<string>) => this.handleMessage(event.data, sink);
    ws.onclose = () => sink.status(this.id, 'closed');
  }

  stop(): void {
    if (!this.ws) return;
    this.ws.onclose = null; // we're closing on purpose; don't report it as a drop
    this.ws.close();
    this.ws = null;
  }

  private handleMessage(data: string, sink: QuoteSink): void {
    let message: unknown;
    try {
      message = JSON.parse(data);
    } catch {
      return;
    }
    const now = Date.now();
    for (const raw of this.parse(message)) {
      const symbol = this.toCanonical.get(raw.providerSymbol);
      if (!symbol) continue;
      sink.quote({ provider: this.id, symbol, bid: raw.bid, ask: raw.ask, ts: now });
    }
  }
}