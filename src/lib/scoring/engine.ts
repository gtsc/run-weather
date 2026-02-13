import type { HourData, Preferences } from '../types';
import { getWeatherInfo } from './weatherCodes';

export function scoreHour(hour: HourData, prefs: Preferences): number {
  let score = 100;

  // Precipitation probability: up to 60 pts penalty (scaled by rain tolerance)
  // More aggressive curve: square the probability so high values hit harder
  const precipProb = hour.precipProbability / 100;
  score -= precipProb * precipProb * 60 * (1 - prefs.rainTolerance * 0.6);

  // Precipitation amount: up to 20 pts (even light rain hurts)
  const precipAmount = Math.min(hour.precipitation, 3);
  score -= (precipAmount / 3) * 20;

  // Temperature outside feels-like comfort range: up to 25 pts (3 per degree)
  const feelsLike = hour.feelsLike;
  if (feelsLike < prefs.tempMin) {
    score -= Math.min((prefs.tempMin - feelsLike) * 3, 25);
  } else if (feelsLike > prefs.tempMax) {
    score -= Math.min((feelsLike - prefs.tempMax) * 3, 25);
  }

  // Wind: up to 25 pts (kicks in earlier at 10 km/h, steeper curve)
  const excessWind = Math.max(0, hour.windSpeed - 10);
  score -= Math.min((excessWind / 20) * 25, 25);

  // Weather code severity: up to 20 pts
  const weatherInfo = getWeatherInfo(hour.weatherCode);
  score -= (weatherInfo.penalty / 95) * 20;

  // Darkness: 8 pts penalty
  if (!hour.isDay) {
    score -= 8;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}
