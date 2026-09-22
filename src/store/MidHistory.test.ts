import { describe, expect, it, vi } from 'vitest';
import { MidHistory } from './MidHistory';

describe('MidHistory', () => {
  it('keeps a rolling window and notifies only that symbol', () => {
    const history = new MidHistory(3);
    const a = vi.fn();
    const b = vi.fn();
    history.subscribe('A', a);
    history.subscribe('B', b);
    for (const v of [1, 2, 3, 4]) history.record('A', v);
    expect(history.get('A')).toEqual([2, 3, 4]);
    expect(a).toHaveBeenCalledTimes(4);
    expect(b).not.toHaveBeenCalled();
  });

  it('returns a new array per record, so React sees the change', () => {
    const history = new MidHistory();
    history.record('A', 1);
    const before = history.get('A');
    history.record('A', 2);
    expect(history.get('A')).not.toBe(before);
  });

  it('resets', () => {
    const history = new MidHistory();
    history.record('A', 1);
    history.reset();
    expect(history.get('A')).toEqual([]);
  });
});
