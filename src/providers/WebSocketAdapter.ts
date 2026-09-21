import type { QuoteSink, ProviderAdapter } from './types';
import { ReconnectingSocket } from './ReconnectingSockets';
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

  private socket: ReconnectingSocket | null = null;
  private toCanonical = new Map<string, string>();

 start(symbols: readonly string[], sink: QuoteSink): void {
    this.stop();
    this.toCanonical = new Map(symbols.map((s) => [this.toProviderSymbol(s), s]));
    const providerSymbols = [...this.toCanonical.keys()];

    const socket = new ReconnectingSocket(this.url, {
      // Runs on EVERY connect, including reconnects.
      onOpen: (send) => {
        for (const message of this.subscribeMessages(providerSymbols)) send(JSON.stringify(message));
      },
      onMessage: (data) => this.handleMessage(data, sink),
      onState: (state, detail) => sink.status(this.id, state, detail),
    });
    this.socket = socket;
    socket.open();
  }

  stop(): void {
    const socket = this.socket;
    this.socket = null;
    socket?.close();
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