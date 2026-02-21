import { describe, it, expect } from 'vitest';
import { scoreHour } from './engine';
import type { HourData, Preferences } from '../types';

const baseHour: HourData = {
  time: '2024-01-01T12:00',
  date: '2024-01-01',
  hour: 12,
  temperature: 15,
  feelsLike: 15,
  precipProbability: 0,
  precipitation: 0,
  windSpeed: 0,
  windGusts: 0,
  weatherCode: 0,
  snowDepth: 0,
  isDay: true,
};

const neutralPrefs: Preferences = {
  rainTolerance: 0,
  tempMin: 5,
  tempMax: 25,
  durationHours: 1,
};

describe('rain scoring: combined probability × intensity model', () => {
  it('low probability + low intensity → low penalty (score near 100)', () => {
    const hour = { ...baseHour, precipProbability: 10, precipitation: 0.1 };
    const score = scoreHour(hour, neutralPrefs);
    expect(score).toBeGreaterThanOrEqual(93);
  });

  it('high probability + low intensity → moderate penalty', () => {
    const hour = { ...baseHour, precipProbability: 80, precipitation: 0.2 };
    const score = scoreHour(hour, neutralPrefs);
    expect(score).toBeGreaterThanOrEqual(60);
    expect(score).toBeLessThan(90);
  });

  it('low probability + high intensity → moderate penalty', () => {
    const hour = { ...baseHour, precipProbability: 20, precipitation: 2 };
    const score = scoreHour(hour, neutralPrefs);
    expect(score).toBeGreaterThanOrEqual(60);
    expect(score).toBeLessThan(90);
  });

  it('high probability + high intensity → high penalty (score low)', () => {
    const hour = { ...baseHour, precipProbability: 90, precipitation: 2 };
    const score = scoreHour(hour, neutralPrefs);
    expect(score).toBeLessThan(45);
  });

  it('zero probability → no rain penalty regardless of intensity', () => {
    const noRain = scoreHour({ ...baseHour, precipProbability: 0, precipitation: 0 }, neutralPrefs);
    const weirdAPI = scoreHour({ ...baseHour, precipProbability: 0, precipitation: 5 }, neutralPrefs);
    expect(weirdAPI).toBe(noRain);
  });

  it('rain tolerance reduces penalty', () => {
    const hour = { ...baseHour, precipProbability: 80, precipitation: 2 };
    const withoutTolerance = scoreHour(hour, { ...neutralPrefs, rainTolerance: 0 });
    const withTolerance = scoreHour(hour, { ...neutralPrefs, rainTolerance: 1 });
    expect(withTolerance).toBeGreaterThan(withoutTolerance);
  });
});
