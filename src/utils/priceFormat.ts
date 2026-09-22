const fixedFormatters = new Map<number, Intl.NumberFormat>();
const quantityFormatters = new Map<number, Intl.NumberFormat>();

function cached(cache: Map<number, Intl.NumberFormat>, decimals: number, minimum: number): Intl.NumberFormat {
  let formatter = cache.get(decimals);
  if (!formatter) {
    // Constructing Intl.NumberFormat is expensive; formatting with one is cheap.
    formatter = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: minimum,
      maximumFractionDigits: decimals,
    });
    cache.set(decimals, formatter);
  }
  return formatter;
}

/** Fixed decimals, grouped: 64123.4 -> "64,123.40" */
export function formatPrice(value: number, decimals: number): string {
  return cached(fixedFormatters, decimals, decimals).format(value);
}

/** Up to maxDecimals, trailing zeros dropped: 1.5 -> "1.5" */
export function formatQuantity(value: number, maxDecimals: number): string {
  return cached(quantityFormatters, maxDecimals, 0).format(value);
}

export interface PriceParts {
  readonly big: string;
  readonly pips: string;
  readonly tail: string;
}

const isDigit = (c: string | undefined): boolean => c !== undefined && c >= '0' && c <= '9';

function previousDigit(s: string, from: number): number {
  for (let i = from - 1; i >= 0; i--) if (isDigit(s[i])) return i;
  return -1;
}

function digitAtDecimal(s: string, decimal: number): number {
  const point = s.indexOf('.');
  if (decimal > 0) {
    const i = point === -1 ? -1 : point + decimal;
    return isDigit(s[i]) ? i : -1;
  }
  let i = (point === -1 ? s.length : point) - 1;
  if (!isDigit(s[i])) return -1;
  for (let n = 0; n < -decimal; n++) {
    i = previousDigit(s, i);
    if (i < 0) return -1;
  }
  return i;
}

/**
 * Splits a formatted price into big figure, pips and tail, FX-tile style:
 * splitPrice("64,123.45", 0) -> { big: "64,1", pips: "23", tail: ".45" }
 * Falls back to showing everything as pips if the position doesn't exist.
 */
export function splitPrice(formatted: string, pipDecimals: number): PriceParts {
  const end = digitAtDecimal(formatted, pipDecimals);
  const start = end < 0 ? -1 : previousDigit(formatted, end);
  if (start < 0) return { big: '', pips: formatted, tail: '' };
  return {
    big: formatted.slice(0, start),
    pips: formatted.slice(start, end + 1),
    tail: formatted.slice(end + 1),
  };
}

export function spreadInPips(bid: number, ask: number, pipDecimals: number): number {
  return (ask - bid) * 10 ** pipDecimals;
}

/** Index of the first character that differs, or -1 if there is no previous value or no change. */
export function firstDifference(text: string, previous: string | undefined): number {
  if (previous === undefined || previous === text) return -1;
  const n = Math.min(text.length, previous.length);
  for (let i = 0; i < n; i++) if (text[i] !== previous[i]) return i;
  return n;
}

export interface PriceSegment {
  readonly text: string;
  readonly role: 'big' | 'pips' | 'tail';
  readonly changed: boolean;
}

/**
 * Big figure / pips / tail, each further split at the first changed digit,
 * so the UI can flash only the digits that actually moved.
 */
export function priceSegments(text: string, pipDecimals: number, changedFrom: number): PriceSegment[] {
  const { big, pips, tail } = splitPrice(text, pipDecimals);
  const segments: PriceSegment[] = [];
  let offset = 0;
  for (const [role, part] of [
    ['big', big],
    ['pips', pips],
    ['tail', tail],
  ] as const) {
    if (!part) continue;
    const cut = changedFrom < 0 ? part.length : Math.min(part.length, Math.max(0, changedFrom - offset));
    if (cut > 0) segments.push({ text: part.slice(0, cut), role, changed: false });
    if (cut < part.length) segments.push({ text: part.slice(cut), role, changed: true });
    offset += part.length;
  }
  return segments;
}