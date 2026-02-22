import type { ScoredHour, RunWindow } from '../types';

export function findRunWindows(
  dayHours: ScoredHour[],
  scores: number[],
  durationHours: number,
): RunWindow[] {
  const stepsNeeded = Math.ceil(durationHours);

  if (dayHours.length < stepsNeeded) return [];

  const now = new Date();
  const windows: RunWindow[] = [];

  for (let i = 0; i <= dayHours.length - stepsNeeded; i++) {
    const windowHours = dayHours.slice(i, i + stepsNeeded);
    const windowScores = scores.slice(i, i + stepsNeeded);

    // Skip windows that have already started
    if (new Date(windowHours[0].time) < now) continue;

    // Skip windows containing any hour below 20
    if (windowScores.some((s) => s < 20)) continue;

    const avgScore = Math.round(windowScores.reduce((sum, s) => sum + s, 0) / windowScores.length);

    windows.push({
      startHour: windowHours[0].hour,
      endHour: (windowHours[windowHours.length - 1].hour + 1) % 24,
      startTime: windowHours[0].time,
      endTime: windowHours[windowHours.length - 1].time,
      score: avgScore,
      hours: windowHours,
      scores: windowScores,
    });
  }

  windows.sort((a, b) => b.score - a.score);
  return windows.slice(0, 3);
}
