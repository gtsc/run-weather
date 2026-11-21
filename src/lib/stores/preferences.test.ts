import { describe, it, expect } from 'vitest';
import { sanitizePreferences, DEFAULT_PREFERENCES } from './preferences';

describe('sanitizePreferences', () => {
  it('falls back to defaults for missing or non-numeric values', () => {
    expect(sanitizePreferences({ tempMin: 'cold', rainTolerance: null })).toEqual(
      DEFAULT_PREFERENCES,
    );
  });

  it('clamps out-of-range values', () => {
    expect(sanitizePreferences({ rainTolerance: 5, tempMin: -100, tempMax: 999 })).toEqual({
      rainTolerance: 1,
      tempMin: -30,
      tempMax: 50,
    });
  });

  it('swaps an inverted temperature range', () => {
    const p = sanitizePreferences({ tempMin: 20, tempMax: 5 });
    expect([p.tempMin, p.tempMax]).toEqual([5, 20]);
  });
});
