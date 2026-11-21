import { describe, it, expect } from 'vitest';
import { wallClock, daysBetween, addDays, minutesOfDay } from './dates';

describe('wallClock', () => {
  it('uses the given time zone, not UTC (00:30 BST is still the next day)', () => {
    const instant = new Date('2026-07-01T23:30:00Z');
    expect(wallClock('Europe/London', instant)).toBe('2026-07-02T00:30');
    expect(wallClock('UTC', instant)).toBe('2026-07-01T23:30');
    expect(wallClock('Asia/Tokyo', instant)).toBe('2026-07-02T08:30');
  });

  it('formats midnight as 00, not 24', () => {
    expect(wallClock('UTC', new Date('2026-01-01T00:05:00Z'))).toBe('2026-01-01T00:05');
  });
});

describe('daysBetween / addDays', () => {
  it('counts calendar days across a DST change', () => {
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
    expect(daysBetween('2026-03-30T12:00', '2026-03-28')).toBe(-2);
  });

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('minutesOfDay', () => {
  it('parses HH:MM of a wall-clock string', () => {
    expect(minutesOfDay('2026-07-02T13:45')).toBe(825);
  });
});
