import { describe, expect, it } from 'vitest';
import { parseAmount } from './amount';

describe('parseAmount', () => {
  it.each([
    ['2.5', 2.5],
    ['10k', 10_000],
    ['1.5M', 1_500_000],
    ['1,000,000', 1_000_000],
    ['.5', 0.5],
    [' 3 ', 3],
  ])('parses %s', (input, expected) => {
    expect(parseAmount(input)).toBe(expected);
  });

  it.each(['', '0', 'abc', '-1', '1..2', '1kk'])('rejects %j', (input) => {
    expect(parseAmount(input)).toBeNull();
  });
});