import type { HourData, DayData, ScoredHour } from '../types';
import { fetchForecast } from '../api/forecast';
import { scoreHour } from '../scoring/engine';
import { preferences } from './preferences.svelte';

const MS_PER_DAY = 86_400_000;
const FETCH_TIMEOUT_MS = 15_000;

function groupIntoDays(hours: ScoredHour[], now: Date): DayData[] {
  const todayStr = new Date().toISOString().slice(0, 10);
  const byDate = Map.groupBy(hours, (h) => h.date);

  return [...byDate].map(([date, dayHours]) => {
    const scores = dayHours.map((h) => h.score);
    const futureScores = dayHours.map((h, i) => (new Date(h.time) >= now ? scores[i] : -1));
    const dayIndex = Math.round(
      (new Date(`${date}T00:00:00`).getTime() - new Date(`${todayStr}T00:00:00`).getTime()) /
        MS_PER_DAY,
    );
    const bestScore = Math.max(...futureScores, 0);
    return { date, dayIndex, hours: dayHours, scores, bestScore };
  });
}

class WeatherStore {
  #rawHours = $state<HourData[]>([]);
  #controller: AbortController | null = null;

  loading = $state(false);
  error = $state<string | null>(null);

  /** Hours scored against the current preferences, grouped by day. */
  days = $derived.by(() => {
    const scored = this.#rawHours.map((h) => ({ ...h, score: scoreHour(h, preferences) }));
    return groupIntoDays(scored, new Date());
  });

  async load(latitude: number, longitude: number): Promise<void> {
    // A newer search supersedes any request still in flight.
    this.#controller?.abort();
    const controller = new AbortController();
    this.#controller = controller;

    this.loading = true;
    this.error = null;
    try {
      this.#rawHours = await fetchForecast(latitude, longitude, {
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(FETCH_TIMEOUT_MS)]),
      });
    } catch (e) {
      if (controller.signal.aborted) return; // superseded by a newer search
      this.error =
        e instanceof DOMException && e.name === 'TimeoutError'
          ? 'The forecast took too long to load. Please try again.'
          : e instanceof Error
            ? e.message
            : String(e);
      this.#rawHours = [];
    } finally {
      if (this.#controller === controller) this.loading = false;
    }
  }
}

export const weather = new WeatherStore();
