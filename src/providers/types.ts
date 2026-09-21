import type { ConnectionState, ProviderQuote } from '../core/types';

/** Where adapters send what they receive. */
export interface QuoteSink {
  quote(quote: ProviderQuote): void;
  status(provider: string, state: ConnectionState, detail?: string): void;
}

/** Every price source implements this. The rest of the app knows nothing else about exchanges. */
export interface ProviderAdapter {
  readonly id: string;
  start(symbols: readonly string[], sink: QuoteSink): void;
  stop(): void;
}

/** A serialisable description of an adapter, so it can be sent to the worker. */
export interface ProviderSpec {
  readonly kind: string;
  readonly options?: unknown;
}