import { describe, expect, it } from 'vitest';
import {
  firstDifference,
  formatPrice,
  formatQuantity,
  priceSegments,
  splitPrice,
  spreadInPips,
} from './priceFormat';

describe('splitPrice', () => {
  it.each([
    ['64,123.45', 0, { big: '64,1', pips: '23', tail: '.45' }],
    ['0.12345', 4, { big: '0.12', pips: '34', tail: '5' }],
    ['2.5123', 3, { big: '2.5', pips: '12', tail: '3' }],
    ['100,000', -1, { big: '100,', pips: '00', tail: '0' }],
    ['15.123', 2, { big: '15.', pips: '12', tail: '3' }],
  ])('splits %s at pip decimal %i', (text, pip, expected) => {
    expect(splitPrice(text, pip)).toEqual(expected);
  });

  it('falls back to all pips when the position does not exist', () => {
    expect(splitPrice('5', -1)).toEqual({ big: '', pips: '5', tail: '' });
    expect(splitPrice('0.5', 3)).toEqual({ big: '', pips: '0.5', tail: '' });
  });
});

describe('formatting', () => {
  it('formats prices with fixed decimals and grouping', () => {
    expect(formatPrice(64123.4, 2)).toBe('64,123.40');
  });

  it('formats quantities without trailing zeros', () => {
    expect(formatQuantity(1.5, 4)).toBe('1.5');
    expect(formatQuantity(10000, 0)).toBe('10,000');
  });

  it('measures spread in pips', () => {
    expect(spreadInPips(100.1, 100.35, 2)).toBeCloseTo(25);
  });
});

describe('changed-digit segments', () => {
  it('finds the first differing character', () => {
    expect(firstDifference('64,123.47', '64,123.45')).toBe(8);
    expect(firstDifference('64,123.45', '64,123.45')).toBe(-1);
    expect(firstDifference('64,123.45', undefined)).toBe(-1);
    expect(firstDifference('10,000.00', '9,999.99')).toBe(0);
  });

  it('marks only the changed suffix, across big/pips/tail', () => {
    expect(priceSegments('64,123.47', 0, 8)).toEqual([
      { text: '64,1', role: 'big', changed: false },
      { text: '23', role: 'pips', changed: false },
      { text: '.4', role: 'tail', changed: false },
      { text: '7', role: 'tail', changed: true },
    ]);
    expect(priceSegments('64,129.10', 0, 5)).toEqual([
      { text: '64,1', role: 'big', changed: false },
      { text: '2', role: 'pips', changed: false },
      { text: '9', role: 'pips', changed: true },
      { text: '.10', role: 'tail', changed: true },
    ]);
  });

  it('marks nothing when there is no previous price', () => {
    expect(priceSegments('1.25', 2, -1).every((s) => !s.changed)).toBe(true);
  });
});