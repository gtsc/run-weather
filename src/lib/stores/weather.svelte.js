import { fetchForecast } from '../api/forecast.js';
import { scoreHour } from '../scoring/engine.js';
import { findRunWindows } from '../scoring/windows.js';
import { getPreferences } from './preferences.svelte.js';

let rawHours = $state([]);
let loading = $state(false);
let error = $state(null);

export function getWeatherState() {
  const prefs = getPreferences();

  const scored = rawHours.map(h => ({
    ...h,
    score: scoreHour(h, prefs),
  }));

  // Group by date
  const dayMap = new Map();
  for (const h of scored) {
    if (!dayMap.has(h.date)) dayMap.set(h.date, []);
    dayMap.get(h.date).push(h);
  }

  const days = [...dayMap.entries()].map(([date, hours]) => {
    const scores = hours.map(h => h.score);
    const bestScore = Math.max(...scores, 0);
    const windows = findRunWindows(hours, scores, prefs.durationHours);
    return { date, hours, scores, bestScore, windows };
  });

  return { days, loading, error };
}

export async function loadForecast(latitude, longitude) {
  loading = true;
  error = null;
  try {
    rawHours = await fetchForecast(latitude, longitude);
  } catch (e) {
    error = e.message;
    rawHours = [];
  } finally {
    loading = false;
  }
}
