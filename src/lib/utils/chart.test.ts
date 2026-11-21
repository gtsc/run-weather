import { describe, it, expect } from 'vitest';
import { yOf, runs, linePath, VIEW_H, SCORE_FLOOR } from './chart';

describe('chart geometry', () => {
  it('maps 100 near the top and the floor (or lower) to the baseline', () => {
    expect(yOf(100)).toBeLessThan(10);
    expect(yOf(SCORE_FLOOR)).toBe(VIEW_H);
    expect(yOf(0)).toBe(VIEW_H);
  });

  it('draws one point per hour', () => {
    expect(linePath([50, 60, 70]).split('L')).toHaveLength(3);
  });

  it('finds contiguous runs, including one that reaches the end', () => {
    expect(runs([true, true, false, false, true])).toEqual([
      [0, 2],
      [4, 5],
    ]);
    expect(runs([false, false])).toEqual([]);
  });
});
