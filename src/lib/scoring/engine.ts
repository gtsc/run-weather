import type { HourData, Preferences } from '../types';
import { getWeatherInfo } from './weatherCodes';

export function scoreHour(hour: HourData, prefs: Preferences): number {
  let score = 100;

  // Precipitation probability: up to 50 pts penalty (scaled by rain tolerance)
  const precipProbPenalty = (hour.precipProbability / 100) * 50 * (1 - prefs.rainTolerance);
  score -= precipProbPenalty;

  // Precipitation amount: up to 15 pts
  const precipAmount = Math.min(hour.precipitation, 5);
  score -= (precipAmount / 5) * 15;

  // Temperature outside feels-like comfort range: up to 20 pts (2 per degree)
  const feelsLike = hour.feelsLike;
  if (feelsLike < prefs.tempMin) {
    score -= Math.min((prefs.tempMin - feelsLike) * 2, 20);
  } else if (feelsLike > prefs.tempMax) {
    score -= Math.min((feelsLike - prefs.tempMax) * 2, 20);
  }

  // Wind over 15 km/h: up to 15 pts
  const excessWind = Math.max(0, hour.windSpeed - 15);
  score -= Math.min((excessWind / 25) * 15, 15);

  // Weather code severity: up to 10 pts
  const weatherInfo = getWeatherInfo(hour.weatherCode);
  score -= (weatherInfo.penalty / 95) * 10;

  // Darkness: 5 pts penalty
  if (!hour.isDay) {
    score -= 5;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}
