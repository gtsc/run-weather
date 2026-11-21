import type { DayData, ScoredHour } from '../types';
import { daysBetween } from '../utils/dates';

/** Group scored hours by date. `now` is wall-clock time at the forecast location. */
export function groupIntoDays(hours: ScoredHour[], now: string): DayData[] {
  const today = now.slice(0, 10);
  return [...Map.groupBy(hours, (h) => h.date)].map(([date, dayHours]) => {
    const scores = dayHours.map((h) => h.score);
    // Best score among hours that haven't started yet ("YYYY-MM-DDTHH:MM" compares lexically).
    const upcoming = dayHours.filter((h) => h.time >= now).map((h) => h.score);
    return {
      date,
      dayIndex: daysBetween(today, date),
      hours: dayHours,
      scores,
      bestScore: Math.max(...upcoming, 0),
    };
  });
}
