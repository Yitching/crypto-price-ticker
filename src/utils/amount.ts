const MULTIPLIERS: Record<string, number> = { k: 1e3, m: 1e6, b: 1e9 };
/**
 * Parses trader shorthand: "2.5", "10k", "1.5m", "1,000,000".
 * Returns null for anything that isn't a positive finite amount.
 */
export function parseAmount(input: string): number | null {
  const s = input.trim().toLowerCase().replace(/,/g, '');
  const match = /^(\d+(?:\.\d*)?|\.\d+)([kmb])?$/.exec(s);
  if (!match) return null;
  const multiplier = match[2] ? MULTIPLIERS[match[2]] ?? 1 : 1;
  const value = Number(match[1]) * multiplier;
  return Number.isFinite(value) && value > 0 ? value : null;
}