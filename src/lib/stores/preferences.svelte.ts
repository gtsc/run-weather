import type { Preferences } from '../types';

const STORAGE_KEY = 'run-weather-prefs';

export const DEFAULT_PREFERENCES: Readonly<Preferences> = {
  rainTolerance: 0.3,
  tempMin: -2,
  tempMax: 25,
};

function load(): Preferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
  } catch {}
  return { ...DEFAULT_PREFERENCES };
}

/** Reactive user preferences. Read fields directly; write via `updatePreferences`. */
export const preferences = $state<Preferences>(load());

export function updatePreferences(updates: Partial<Preferences>): void {
  Object.assign(preferences, updates);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {}
}
