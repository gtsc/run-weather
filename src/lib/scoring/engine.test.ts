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
  dewPoint: 9,
};

const neutralPrefs: Preferences = {
  rainTolerance: 0,
  tempMin: 5,
  tempMax: 25,
  durationHours: 1,
};

describe('humidity scoring: dew point penalty', () => {
  it('humid conditions (dew point 17.5°C) score lower than dry (dew point 9°C)', () => {
    const humid = scoreHour({ ...baseHour, dewPoint: 17.5 }, neutralPrefs);
    const dry = scoreHour({ ...baseHour, dewPoint: 9 }, neutralPrefs);
    expect(humid).toBeLessThan(dry);
  });

  it('dew point 15°C applies ~10 pt penalty', () => {
    const score = scoreHour({ ...baseHour, dewPoint: 15 }, neutralPrefs);
    expect(score).toBeGreaterThanOrEqual(89);
    expect(score).toBeLessThanOrEqual(91);
  });

  it('dew point 20°C hits the 25 pt cap', () => {
    const score = scoreHour({ ...baseHour, dewPoint: 20 }, neutralPrefs);
    expect(score).toBe(75);
  });

  it('dew point above 20°C is capped at 25 pts (same as 20°C)', () => {
    const at20 = scoreHour({ ...baseHour, dewPoint: 20 }, neutralPrefs);
    const at25 = scoreHour({ ...baseHour, dewPoint: 25 }, neutralPrefs);
    expect(at20).toBe(at25);
  });
});

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
    const weirdAPI = scoreHour(
      { ...baseHour, precipProbability: 0, precipitation: 5 },
      neutralPrefs,
    );
    expect(weirdAPI).toBe(noRain);
  });

  it('rain tolerance reduces penalty', () => {
    const hour = { ...baseHour, precipProbability: 80, precipitation: 2 };
    const withoutTolerance = scoreHour(hour, { ...neutralPrefs, rainTolerance: 0 });
    const withTolerance = scoreHour(hour, { ...neutralPrefs, rainTolerance: 1 });
    expect(withTolerance).toBeGreaterThan(withoutTolerance);
  });
});
