import type { HourData, DayData } from '../types';
import { fetchForecast } from '../api/forecast';
import { scoreHour } from '../scoring/engine';
import { findRunWindows } from '../scoring/windows';
import { getPreferences } from './preferences.svelte';

let rawHours = $state<HourData[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);

export function getWeatherState(): { days: DayData[]; loading: boolean; error: string | null } {
  const prefs = getPreferences();

  const scored = rawHours.map(h => ({
    ...h,
    score: scoreHour(h, prefs),
  }));

  const dayMap = new Map<string, typeof scored>();
  for (const h of scored) {
    if (!dayMap.has(h.date)) dayMap.set(h.date, []);
    dayMap.get(h.date)!.push(h);
  }

  const days: DayData[] = [...dayMap.entries()].map(([date, hours], dayIndex) => {
    const scores = hours.map(h => h.score);
    const bestScore = Math.max(...scores, 0);
    const windows = findRunWindows(hours, scores, prefs.durationHours);
    return { date, dayIndex, hours, scores, bestScore, windows };
  });

  return { days, loading, error };
}

export async function loadForecast(latitude: number, longitude: number): Promise<void> {
  loading = true;
  error = null;
  try {
    rawHours = await fetchForecast(latitude, longitude);
  } catch (e) {
    error = (e as Error).message;
    rawHours = [];
  } finally {
    loading = false;
  }
}
