import type { BestWindow, DayData, ScoredHour } from '../types';
import { daysBetween } from '../utils/dates';

/** Hours within this many points of the peak count as part of the best window. */
const WINDOW_TOLERANCE = 3;
const MAX_WINDOW_HOURS = 3;

/**
 * The best upcoming window in a day: the earliest peak-scoring hour that hasn't started,
 * widened (later first, then earlier) over neighbouring upcoming hours within
 * WINDOW_TOLERANCE points, up to MAX_WINDOW_HOURS.
 */
export function bestWindow(hours: ScoredHour[], now: string): BestWindow | null {
  const upcoming = (i: number) => i >= 0 && i < hours.length && hours[i].time >= now;
  let peak = -1;
  hours.forEach((h, i) => {
    if (upcoming(i) && (peak === -1 || h.score > hours[peak].score)) peak = i;
  });
  if (peak === -1) return null;

  const score = hours[peak].score;
  const fits = (i: number) => upcoming(i) && hours[i].score >= score - WINDOW_TOLERANCE;
  let start = peak;
  let end = peak + 1;
  while (end - start < MAX_WINDOW_HOURS && (fits(end) || fits(start - 1))) {
    if (fits(end)) end++;
    else start--;
  }
  return { start, end, score };
}

/** Group scored hours by date. `now` is wall-clock time at the forecast location. */
export function groupIntoDays(hours: ScoredHour[], now: string): DayData[] {
  const today = now.slice(0, 10);
  return [...Map.groupBy(hours, (h) => h.date)].map(([date, dayHours]) => {
    const best = bestWindow(dayHours, now);
    return {
      date,
      dayIndex: daysBetween(today, date),
      hours: dayHours,
      scores: dayHours.map((h) => h.score),
      bestScore: best?.score ?? 0,
      best,
    };
  });
}

/** The best window across today and tomorrow — the "when should I go next?" answer. */
export function nextBestRun(days: DayData[]): { day: DayData; window: BestWindow } | null {
  let result: { day: DayData; window: BestWindow } | null = null;
  for (const day of days) {
    if (day.dayIndex < 0 || day.dayIndex > 1 || !day.best) continue;
    if (!result || day.best.score > result.window.score) result = { day, window: day.best };
  }
  return result;
}
