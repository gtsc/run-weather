import { describe, it, expect } from 'vitest';
import { bandOf, GREAT_SCORE, POOR_BELOW } from './chart';

describe('bandOf', () => {
  it('splits scores into great / ok / poor at the thresholds', () => {
    expect(bandOf(100)).toBe('great');
    expect(bandOf(GREAT_SCORE)).toBe('great');
    expect(bandOf(GREAT_SCORE - 1)).toBe('ok');
    expect(bandOf(POOR_BELOW)).toBe('ok');
    expect(bandOf(POOR_BELOW - 1)).toBe('poor');
    expect(bandOf(0)).toBe('poor');
  });
});
