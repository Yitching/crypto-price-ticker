export type ProviderId = string;

/** One provider's two-way price for one pair, as received. */
export interface ProviderQuote {
  readonly provider: ProviderId;
  readonly symbol: string; // canonical, e.g. "BTC/USD"
  readonly bid: number;
  readonly ask: number;
  readonly ts: number; // when WE received it (Date.now())
}

/** One side of the best price, and who is showing it. */
export interface PriceLevel {
  readonly price: number;
  readonly provider: ProviderId;
}

/** Best bid and best ask across every provider quoting a pair. */
export interface AggregatedQuote {
  readonly symbol: string;
  readonly bid: PriceLevel | null;
  readonly ask: PriceLevel | null;
  readonly sources: readonly ProviderQuote[];
}

export type ConnectionState = 'connecting' | 'open' | 'reconnecting' | 'closed';

export type Side = 'buy' | 'sell';

/** Display and trading precision for one pair. */
export interface Instrument {
  readonly symbol: string;
  readonly base: string;
  readonly quote: string;
  /** Decimals shown for prices. */
  readonly priceDecimals: number;
  /**
   * Decimal position of the last "pip" digit. The two digits ending here are drawn large,
   * like the big figure / pips split on FX tiles. 0 = units, negative = tens and above.
   */
  readonly pipDecimals: number;
  /** Decimals allowed for a base-currency amount. */
  readonly sizeDecimals: number;
  readonly defaultAmount: number;
}
