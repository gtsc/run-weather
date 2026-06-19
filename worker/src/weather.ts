import type { WeatherInput } from './types';

function hourLabel(hour: number): string {
  if (hour === 0) return 'midnight';
  if (hour === 12) return '12 PM';
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}

export function formatWeather(w: WeatherInput): string {
  return [
    `Time: ${hourLabel(w.hour)} (${w.isDay ? 'daylight' : 'dark'})`,
    `Temperature: ${w.temperature}°C (feels like ${w.feelsLike}°C)`,
    `Conditions: ${w.conditions}`,
    `Wind: ${w.windSpeed} km/h, gusts ${w.windGusts} km/h`,
    `Rain: ${w.precipProbability}% chance, ${w.precipitation.toFixed(1)} mm`,
    `Dew point: ${w.dewPoint}°C`,
  ].join('\n');
}
