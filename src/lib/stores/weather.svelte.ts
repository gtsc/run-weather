import type { HourData, DayData } from '../types';
import { fetchForecast } from '../api/forecast';
import { scoreHour } from '../scoring/engine';
import { getPreferences } from './preferences.svelte';

let rawHours = $state<HourData[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);

export function getWeatherState(): { days: DayData[]; loading: boolean; error: string | null } {
  const prefs = getPreferences();

  const scored = rawHours.map((h) => ({
    ...h,
    score: scoreHour(h, prefs),
  }));

  const dayMap = new Map<string, typeof scored>();
  for (const h of scored) {
    if (!dayMap.has(h.date)) dayMap.set(h.date, []);
    dayMap.get(h.date)!.push(h);
  }

  const now = new Date();
  const todayStr = new Date().toISOString().slice(0, 10);

  const days: DayData[] = [...dayMap.entries()].map(([date, hours]) => {
    const scores = hours.map((h) => h.score);
    const futureScores = hours.map((h, i) => (new Date(h.time) >= now ? scores[i] : -1));
    const msPerDay = 86400000;
    const dayIndex = Math.round(
      (new Date(date + 'T00:00:00').getTime() - new Date(todayStr + 'T00:00:00').getTime()) /
        msPerDay,
    );
    const bestScore = dayIndex < 0 ? Math.max(...scores) : Math.max(...futureScores, 0);
    return { date, dayIndex, hours, scores, bestScore };
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
