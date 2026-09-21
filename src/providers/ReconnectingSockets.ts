import type { ConnectionState } from '../core/types';

export interface ReconnectingSocketHandlers {
  onOpen(send: (data: string) => void): void;
  onMessage(data: string): void;
  onState(state: ConnectionState, detail?: string): void;
}

const DEFAULTS = { minDelayMs: 1_000, maxDelayMs: 30_000, idleTimeoutMs: 10_000 };

/** A WebSocket that reconnects with backoff and detects silent connections. Knows nothing about exchanges. */
export class ReconnectingSocket {
  private ws: WebSocket | null = null;
  private attempt = 0;
  private stopped = true;
  private lastMessageAt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  private idleTimer: ReturnType<typeof setInterval> | undefined;

  private readonly url: string;
  private readonly handlers: ReconnectingSocketHandlers;
  private readonly options: typeof DEFAULTS;

  constructor(url: string, handlers: ReconnectingSocketHandlers, options = DEFAULTS) {
    this.url = url;
    this.handlers = handlers;
    this.options = options;
  }

  open(): void {
    if (!this.stopped) return;
    this.stopped = false;
    this.handlers.onState('connecting');
    this.connect();
  }

  /** Intentional close: no reconnect. */
  close(): void {
    this.stopped = true;
    clearTimeout(this.reconnectTimer);
    this.teardown();
    this.handlers.onState('closed');
  }

  private connect(): void {
    const ws = new WebSocket(this.url);
    this.ws = ws;

    ws.onopen = () => {
      this.attempt = 0; // healthy again: next failure starts from the short delay
      this.lastMessageAt = Date.now();
      this.startIdleWatch();
      this.handlers.onState('open');
      this.handlers.onOpen((data) => ws.send(data));
    };
    ws.onmessage = (event: MessageEvent<string>) => {
      this.lastMessageAt = Date.now();
      this.handlers.onMessage(event.data);
    };
    ws.onclose = (event) => {
      this.teardown();
      this.scheduleReconnect(`Connection closed (code ${event.code})`);
    };
  }

  private teardown(): void {
    clearInterval(this.idleTimer);
    const ws = this.ws;
    this.ws = null;
    if (!ws) return;
    ws.onopen = null;
    ws.onmessage = null;
    ws.onclose = null;
    ws.close();
  }

  private scheduleReconnect(reason: string): void {
    if (this.stopped) return;
    const { minDelayMs, maxDelayMs } = this.options;
    const backoff = Math.min(maxDelayMs, minDelayMs * 2 ** this.attempt); // 1s, 2s, 4s, 8s … 30s
    const delay = backoff * (0.5 + Math.random() / 2); // jitter: 50–100% of that
    this.attempt++;
    this.handlers.onState('reconnecting', `${reason}. Retrying in ${Math.ceil(delay / 1000)}s`);
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  private startIdleWatch(): void {
    clearInterval(this.idleTimer);
    this.idleTimer = setInterval(() => {
      if (Date.now() - this.lastMessageAt <= this.options.idleTimeoutMs) return;
      this.teardown();
      this.scheduleReconnect('No data received');
    }, 1_000);
  }
}