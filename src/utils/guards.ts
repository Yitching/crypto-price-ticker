export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Exchanges often send numbers as strings; anything unparseable becomes NaN. */
export function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') return Number(value);
  return Number.NaN;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}