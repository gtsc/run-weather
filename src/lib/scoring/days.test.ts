import { describe, it, expect } from 'vitest';
import { groupIntoDays } from './days';
import type { ScoredHour } from '../types';

const hour = (time: string, score: number) =>
  ({ time, date: time.slice(0, 10), score }) as ScoredHour;

describe('groupIntoDays', () => {
  const hours = [
    hour('2026-07-01T22:00', 90),
    hour('2026-07-01T23:00', 80),
    hour('2026-07-02T00:00', 40),
    hour('2026-07-02T01:00', 70),
    hour('2026-07-03T09:00', 60),
  ];

  it('indexes days relative to the location-local "now", not UTC', () => {
    // 00:30 local on 2 July — in UTC (BST-1) it would still be 1 July.
    const days = groupIntoDays(hours, '2026-07-02T00:30');
    expect(days.map((d) => [d.date, d.dayIndex])).toEqual([
      ['2026-07-01', -1],
      ['2026-07-02', 0],
      ['2026-07-03', 1],
    ]);
  });

  it('only counts hours that have not started yet towards bestScore', () => {
    const days = groupIntoDays(hours, '2026-07-02T00:30');
    expect(days[1].bestScore).toBe(70); // 00:00 (40) has started; 01:00 (70) has not
    expect(days[0].bestScore).toBe(0); // all past
  });
});
