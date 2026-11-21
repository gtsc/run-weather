import type { HourData, Location } from '../types';
import { fetchForecast } from '../api/forecast';
import { scoreHour } from '../scoring/engine';
import { groupIntoDays } from '../scoring/days';
import { wallClock } from '../utils/dates';
import { preferences } from './preferences.svelte';

const FETCH_TIMEOUT_MS = 15_000;
const CLOCK_TICK_MS = 60_000;
/** Refetch when the tab becomes visible again and the data is older than this. */
const STALE_AFTER_MS = 60 * 60_000;

class WeatherStore {
  #rawHours = $state<HourData[]>([]);
  #clock = $state(Date.now());
  #controller: AbortController | null = null;
  #lastLoad: { location: Location; at: number } | null = null;

  loading = $state(false);
  error = $state<string | null>(null);
  /** IANA time zone of the loaded forecast. */
  timezone = $state<string | undefined>(undefined);

  /** Current wall-clock time at the forecast location ("YYYY-MM-DDTHH:MM"). */
  now = $derived(wallClock(this.timezone, new Date(this.#clock)));

  /** Hours scored against the current preferences, grouped by day, from today onwards. */
  days = $derived.by(() => {
    const scored = this.#rawHours.map((h) => ({ ...h, score: scoreHour(h, preferences) }));
    return groupIntoDays(scored, this.now).filter((d) => d.dayIndex >= 0);
  });

  constructor() {
    setInterval(() => (this.#clock = Date.now()), CLOCK_TICK_MS);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') return;
      this.#clock = Date.now();
      if (this.#lastLoad && Date.now() - this.#lastLoad.at > STALE_AFTER_MS) {
        this.load(this.#lastLoad.location);
      }
    });
  }

  async load(location: Location): Promise<void> {
    // A newer search supersedes any request still in flight.
    this.#controller?.abort();
    const controller = new AbortController();
    this.#controller = controller;

    this.loading = true;
    this.error = null;
    try {
      const forecast = await fetchForecast(location.latitude, location.longitude, {
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(FETCH_TIMEOUT_MS)]),
      });
      this.#rawHours = forecast.hours;
      this.timezone = forecast.timezone;
      this.#clock = Date.now();
      this.#lastLoad = { location, at: Date.now() };
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
