import { describe, it, expect } from 'vitest';
import { nextOverride } from './colorScheme';

describe('nextOverride', () => {
  it('stores the opposite of the system when following the system', () => {
    expect(nextOverride('light', 'light')).toBe('dark');
    expect(nextOverride('dark', 'dark')).toBe('light');
  });

  it('clears the override when toggling back to the system scheme', () => {
    expect(nextOverride('dark', 'light')).toBeNull();
    expect(nextOverride('light', 'dark')).toBeNull();
  });
});
