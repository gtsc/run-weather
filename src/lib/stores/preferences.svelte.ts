import type { Preferences } from '../types';
import { DEFAULT_PREFERENCES, sanitizePreferences } from './preferences';

export { DEFAULT_PREFERENCES, TEMP_LIMITS } from './preferences';

const STORAGE_KEY = 'run-weather-prefs';

function load(): Preferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return sanitizePreferences(JSON.parse(stored));
  } catch {}
  return { ...DEFAULT_PREFERENCES };
}

/** Reactive user preferences. Read fields directly; write via `updatePreferences`. */
export const preferences = $state<Preferences>(load());

export function updatePreferences(updates: Partial<Preferences>): void {
  Object.assign(preferences, sanitizePreferences({ ...preferences, ...updates }));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {}
}
