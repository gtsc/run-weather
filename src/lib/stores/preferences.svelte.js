const STORAGE_KEY = 'run-weather-prefs';

const defaults = {
  rainTolerance: 0.3,
  tempMin: 8,
  tempMax: 15,
  durationHours: 1,
};

function loadFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...defaults, ...JSON.parse(stored) };
  } catch {}
  return { ...defaults };
}

let prefs = $state(loadFromStorage());

export function getPreferences() {
  return prefs;
}

export function updatePreferences(updates) {
  Object.assign(prefs, updates);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {}
}
