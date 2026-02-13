import type { Preferences } from '../types';

const STORAGE_KEY = 'run-weather-prefs';

const defaults: Preferences = {
  rainTolerance: 0.3,
  tempMin: -2,
  tempMax: 25,
  durationHours: 1,
};

function loadFromStorage(): Preferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...defaults, ...JSON.parse(stored) };
  } catch {}
  return { ...defaults };
}

let prefs = $state<Preferences>(loadFromStorage());

export function getPreferences(): Preferences {
  return prefs;
}

export function updatePreferences(updates: Partial<Preferences>): void {
  Object.assign(prefs, updates);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {}
}
