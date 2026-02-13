import type { HourData, Preferences } from '../types';
import { getWeatherInfo } from './weatherCodes';

export function scoreHour(hour: HourData, prefs: Preferences): number {
  let score = 100;

  // Precipitation probability: up to 65 pts penalty
  // Squared curve so high probabilities are punishing
  const precipProb = hour.precipProbability / 100;
  score -= precipProb * precipProb * 65 * (1 - prefs.rainTolerance * 0.5);

  // Precipitation amount: up to 25 pts (saturates at 2mm/h)
  const precipAmount = Math.min(hour.precipitation, 2);
  score -= (precipAmount / 2) * 25;

  // Temperature outside feels-like comfort range: up to 30 pts (4 per degree)
  const feelsLike = hour.feelsLike;
  if (feelsLike < prefs.tempMin) {
    score -= Math.min((prefs.tempMin - feelsLike) * 4, 30);
  } else if (feelsLike > prefs.tempMax) {
    score -= Math.min((feelsLike - prefs.tempMax) * 4, 30);
  }

  // Wind: up to 30 pts (kicks in at 8 km/h, steep)
  const excessWind = Math.max(0, hour.windSpeed - 8);
  score -= Math.min((excessWind / 17) * 30, 30);

  // Weather code severity: up to 25 pts
  const weatherInfo = getWeatherInfo(hour.weatherCode);
  score -= (weatherInfo.penalty / 95) * 25;

  // Darkness: 10 pts penalty
  if (!hour.isDay) {
    score -= 10;
  }

  // Misery multiplier: when rain + wind + cold all stack, it's worse than the sum
  // Count how many "bad" factors are present
  let badFactors = 0;
  if (precipProb > 0.5) badFactors++;
  if (hour.windSpeed > 15) badFactors++;
  if (feelsLike < prefs.tempMin || feelsLike > prefs.tempMax) badFactors++;
  if (weatherInfo.penalty >= 25) badFactors++;

  // Each stacking factor beyond the first reduces the score by an additional 8%
  if (badFactors >= 2) {
    score *= 1 - (badFactors - 1) * 0.08;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}
