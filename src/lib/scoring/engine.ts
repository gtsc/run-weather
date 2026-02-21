import type { HourData, Preferences } from '../types';
import { getWeatherInfo } from './weatherCodes';

export function scoreHour(hour: HourData, prefs: Preferences): number {
  let score = 100;

  // Rain penalty: geometric mean of probability and intensity, up to 65 pts
  // Both must be high for maximum penalty; either alone gives moderate penalty
  // Zero probability → zero penalty regardless of intensity
  const precipProb = hour.precipProbability / 100;
  const precipIntensity = Math.min(hour.precipitation / 2, 1);
  score -= Math.sqrt(precipProb * precipIntensity) * 65 * (1 - prefs.rainTolerance * 0.5);

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

  // Snow depth on ground: up to 30 pts penalty
  if (hour.snowDepth >= 0.01) {
    let snowPenalty = hour.snowDepth > 0.05 ? 30 : hour.snowDepth > 0.03 ? 20 : 10;
    // Discount by 40% when temp > 2°C (streets thaw faster)
    if (hour.temperature > 2) {
      snowPenalty *= 0.6;
    }
    score -= snowPenalty;
  }

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
  if (hour.snowDepth >= 0.03) badFactors++;

  // Each stacking factor beyond the first reduces the score by an additional 8%
  if (badFactors >= 2) {
    score *= 1 - (badFactors - 1) * 0.08;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}
