import type { HourData } from '../types';

const BASE_URL = 'https://api.open-meteo.com/v1/forecast';

const HOURLY_PARAMS = [
  'temperature_2m',
  'apparent_temperature',
  'precipitation_probability',
  'precipitation',
  'wind_speed_10m',
  'wind_gusts_10m',
  'weather_code',
  'snow_depth',
  'is_day',
].join(',');

interface HourlyResponse {
  time: string[];
  temperature_2m: number[];
  apparent_temperature: number[];
  precipitation_probability: number[];
  precipitation: number[];
  wind_speed_10m: number[];
  wind_gusts_10m: number[];
  weather_code: number[];
  snow_depth: number[];
  is_day: number[];
}

export async function fetchForecast(latitude: number, longitude: number): Promise<HourData[]> {
  const url = `${BASE_URL}?latitude=${latitude}&longitude=${longitude}&hourly=${HOURLY_PARAMS}&forecast_days=8&timezone=Europe%2FLondon`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch forecast');
  const data = await res.json();

  return reshapeHourly(data.hourly);
}

function reshapeHourly(hourly: HourlyResponse): HourData[] {
  const count = hourly.time.length;
  const hours: HourData[] = [];

  for (let i = 0; i < count; i++) {
    hours.push({
      time: hourly.time[i],
      date: hourly.time[i].slice(0, 10),
      hour: new Date(hourly.time[i]).getHours(),
      temperature: hourly.temperature_2m[i],
      feelsLike: hourly.apparent_temperature[i],
      precipProbability: hourly.precipitation_probability[i],
      precipitation: hourly.precipitation[i],
      windSpeed: hourly.wind_speed_10m[i],
      windGusts: hourly.wind_gusts_10m[i],
      weatherCode: hourly.weather_code[i],
      snowDepth: hourly.snow_depth[i],
      isDay: hourly.is_day[i] === 1,
    });
  }

  return hours;
}
