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
  'dew_point_2m',
] as const;

type HourlyResponse = { time: string[] } & Record<(typeof HOURLY_PARAMS)[number], number[]>;

export interface ForecastOptions {
  /** IANA time zone for the returned wall-clock times. Default: the location's own (`auto`). */
  timezone?: string;
  signal?: AbortSignal;
}

export interface Forecast {
  /** IANA time zone the hourly times are expressed in. */
  timezone: string;
  hours: HourData[];
  /** Set when the service worker served a cached copy (offline): when it was fetched. */
  cachedAt?: number;
}

export async function fetchForecast(
  latitude: number,
  longitude: number,
  { timezone = 'auto', signal }: ForecastOptions = {},
): Promise<Forecast> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    hourly: HOURLY_PARAMS.join(','),
    forecast_days: '8',
    timezone,
  });

  // No AbortSignal construction here: this module is also bundled into the Scriptable
  // widget, whose runtime has no AbortSignal. Callers pass a signal if they want one.
  const res = await fetch(`${BASE_URL}?${params}`, signal ? { signal } : undefined);
  if (!res.ok) throw new Error(`Failed to fetch forecast (HTTP ${res.status})`);
  const data = (await res.json()) as { timezone: string; hourly: HourlyResponse };

  // `headers` is optional because the Scriptable widget's fetch shim has none.
  const cachedAt = Number(res.headers?.get('x-sw-cached-at')) || undefined;

  return { timezone: data.timezone, hours: reshapeHourly(data.hourly), cachedAt };
}

function reshapeHourly(hourly: HourlyResponse): HourData[] {
  return hourly.time.map((time, i) => ({
    time,
    date: time.slice(0, 10),
    hour: Number(time.slice(11, 13)),
    temperature: hourly.temperature_2m[i],
    feelsLike: hourly.apparent_temperature[i],
    precipProbability: hourly.precipitation_probability[i],
    precipitation: hourly.precipitation[i],
    windSpeed: hourly.wind_speed_10m[i],
    windGusts: hourly.wind_gusts_10m[i],
    weatherCode: hourly.weather_code[i],
    snowDepth: hourly.snow_depth[i],
    isDay: hourly.is_day[i] === 1,
    dewPoint: hourly.dew_point_2m[i],
  }));
}
