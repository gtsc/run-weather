import { describe, it, expect } from 'vitest';
import { groupIntoDays, bestWindow, nextBestRun } from './days';
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

describe('bestWindow', () => {
  const day = (scores: number[]) =>
    scores.map((s, h) => hour(`2026-07-02T${String(h).padStart(2, '0')}:00`, s));

  it('widens around the earliest peak, up to 3 hours, within 3 points', () => {
    const hours = day([50, 80, 97, 99, 98, 99, 60]);
    expect(bestWindow(hours, '2026-07-02T00:00')).toEqual({ start: 3, end: 6, score: 99 });
  });

  it('extends earlier when later hours fall off', () => {
    const hours = day([50, 97, 99, 60]);
    expect(bestWindow(hours, '2026-07-02T00:00')).toEqual({ start: 1, end: 3, score: 99 });
  });

  it('ignores hours that have already started', () => {
    const hours = day([100, 100, 70, 75]);
    expect(bestWindow(hours, '2026-07-02T01:30')).toEqual({ start: 3, end: 4, score: 75 });
    expect(bestWindow(hours, '2026-07-02T23:30')).toBeNull();
  });
});

describe('nextBestRun', () => {
  it('picks the higher of today and tomorrow, preferring today on a tie', () => {
    const days = groupIntoDays(
      [hour('2026-07-02T10:00', 90), hour('2026-07-03T10:00', 90), hour('2026-07-04T10:00', 99)],
      '2026-07-02T09:00',
    );
    const next = nextBestRun(days);
    expect(next?.day.date).toBe('2026-07-02');
    expect(next?.window.score).toBe(90);
  });
});
