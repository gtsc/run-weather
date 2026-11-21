export type Scheme = 'light' | 'dark';

/**
 * Two-state toggle over a three-state model (system / light / dark).
 * Returns the value to store, or `null` to clear the override and follow the system again.
 * Divergence from the system is only checked here, at toggle time — a stored value the
 * system later happens to match is deliberately kept.
 */
export function nextOverride(rendered: Scheme, system: Scheme): Scheme | null {
  const target: Scheme = rendered === 'dark' ? 'light' : 'dark';
  return target === system ? null : target;
}
