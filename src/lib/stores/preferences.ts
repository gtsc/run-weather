import type { Preferences } from '../types';

export const DEFAULT_PREFERENCES: Readonly<Preferences> = {
  rainTolerance: 0.3,
  tempMin: -2,
  tempMax: 25,
};

export const TEMP_LIMITS = { min: -30, max: 50 } as const;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Coerce untrusted input (localStorage, form fields) into valid preferences. */
export function sanitizePreferences(
  input: Partial<Record<keyof Preferences, unknown>>,
): Preferences {
  const num = (v: unknown, fallback: number) =>
    typeof v === 'number' && Number.isFinite(v) ? v : fallback;
  const rainTolerance = clamp(num(input.rainTolerance, DEFAULT_PREFERENCES.rainTolerance), 0, 1);
  let tempMin = clamp(
    Math.round(num(input.tempMin, DEFAULT_PREFERENCES.tempMin)),
    TEMP_LIMITS.min,
    TEMP_LIMITS.max,
  );
  let tempMax = clamp(
    Math.round(num(input.tempMax, DEFAULT_PREFERENCES.tempMax)),
    TEMP_LIMITS.min,
    TEMP_LIMITS.max,
  );
  if (tempMin > tempMax) [tempMin, tempMax] = [tempMax, tempMin];
  return { rainTolerance, tempMin, tempMax };
}
