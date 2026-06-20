import type { HourData } from '../types';
import { getWeatherInfo } from '../scoring/weatherCodes';

export interface WeatherInput {
  hour: number;
  isDay: boolean;
  temperature: number;
  feelsLike: number;
  conditions: string;
  windSpeed: number;
  windGusts: number;
  precipProbability: number;
  precipitation: number;
  dewPoint: number;
}

export function toWeatherInput(h: HourData): WeatherInput {
  return {
    hour: h.hour,
    isDay: h.isDay,
    temperature: h.temperature,
    feelsLike: h.feelsLike,
    conditions: getWeatherInfo(h.weatherCode).label,
    windSpeed: h.windSpeed,
    windGusts: h.windGusts,
    precipProbability: h.precipProbability,
    precipitation: h.precipitation,
    dewPoint: h.dewPoint,
  };
}
