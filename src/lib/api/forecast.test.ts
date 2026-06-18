import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchForecast } from './forecast';

const emptyHourly = {
  time: [],
  temperature_2m: [],
  apparent_temperature: [],
  precipitation_probability: [],
  precipitation: [],
  wind_speed_10m: [],
  wind_gusts_10m: [],
  weather_code: [],
  snow_depth: [],
  is_day: [],
  dew_point_2m: [],
};

function mockFetch() {
  const mock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ hourly: emptyHourly }),
  });
  vi.stubGlobal('fetch', mock);
  return mock;
}

afterEach(() => vi.unstubAllGlobals());

describe('fetchForecast', () => {
  it('requests dew_point_2m in the hourly params', async () => {
    const mock = mockFetch();
    await fetchForecast(51.5, -0.1);
    const url: string = mock.mock.calls[0][0];
    expect(url).toContain('dew_point_2m');
  });

  it('maps dew_point_2m to dewPoint on each hour', async () => {
    const mock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        hourly: {
          ...emptyHourly,
          time: ['2024-01-01T12:00'],
          temperature_2m: [15],
          apparent_temperature: [15],
          precipitation_probability: [0],
          precipitation: [0],
          wind_speed_10m: [0],
          wind_gusts_10m: [0],
          weather_code: [0],
          snow_depth: [0],
          is_day: [1],
          dew_point_2m: [12.5],
        },
      }),
    });
    vi.stubGlobal('fetch', mock);
    const hours = await fetchForecast(51.5, -0.1);
    expect(hours[0].dewPoint).toBe(12.5);
  });

  it('uses Europe/London as the default timezone', async () => {
    const mock = mockFetch();
    await fetchForecast(51.5, -0.1);
    const url: string = mock.mock.calls[0][0];
    expect(url).toContain('timezone=Europe%2FLondon');
  });

  it('uses the provided timezone when supplied', async () => {
    const mock = mockFetch();
    await fetchForecast(48.1, 11.6, 'Europe/Berlin');
    const url: string = mock.mock.calls[0][0];
    expect(url).toContain('timezone=Europe%2FBerlin');
  });
});
