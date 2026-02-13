import type { WeatherInfo } from '../types';

const WEATHER_CODES: Record<number, WeatherInfo> = {
  0:  { label: 'Clear sky', penalty: 0 },
  1:  { label: 'Mainly clear', penalty: 0 },
  2:  { label: 'Partly cloudy', penalty: 0 },
  3:  { label: 'Overcast', penalty: 2 },
  45: { label: 'Fog', penalty: 15 },
  48: { label: 'Depositing rime fog', penalty: 20 },
  51: { label: 'Light drizzle', penalty: 15 },
  53: { label: 'Moderate drizzle', penalty: 25 },
  55: { label: 'Dense drizzle', penalty: 35 },
  56: { label: 'Light freezing drizzle', penalty: 40 },
  57: { label: 'Dense freezing drizzle', penalty: 55 },
  61: { label: 'Slight rain', penalty: 25 },
  63: { label: 'Moderate rain', penalty: 45 },
  65: { label: 'Heavy rain', penalty: 70 },
  66: { label: 'Light freezing rain', penalty: 55 },
  67: { label: 'Heavy freezing rain', penalty: 80 },
  71: { label: 'Slight snow fall', penalty: 40 },
  73: { label: 'Moderate snow fall', penalty: 60 },
  75: { label: 'Heavy snow fall', penalty: 80 },
  77: { label: 'Snow grains', penalty: 35 },
  80: { label: 'Slight rain showers', penalty: 20 },
  81: { label: 'Moderate rain showers', penalty: 40 },
  82: { label: 'Violent rain showers', penalty: 75 },
  85: { label: 'Slight snow showers', penalty: 45 },
  86: { label: 'Heavy snow showers', penalty: 75 },
  95: { label: 'Thunderstorm', penalty: 85 },
  96: { label: 'Thunderstorm with slight hail', penalty: 90 },
  99: { label: 'Thunderstorm with heavy hail', penalty: 95 },
};

export function getWeatherInfo(code: number): WeatherInfo {
  return WEATHER_CODES[code] || { label: 'Unknown', penalty: 10 };
}
