import type { Location } from '../types';

const STORAGE_KEY = 'run-weather-location';

function isLocation(value: unknown): value is Location {
  const v = value as Location;
  return (
    typeof v?.name === 'string' &&
    Number.isFinite(v.latitude) &&
    Math.abs(v.latitude) <= 90 &&
    Number.isFinite(v.longitude) &&
    Math.abs(v.longitude) <= 180
  );
}

function load(): Location | null {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    return isLocation(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Last searched location, remembered across visits. */
export const location = $state<{ current: Location | null }>({ current: load() });

export function setLocation(loc: Location): void {
  location.current = loc;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
  } catch {}
}
