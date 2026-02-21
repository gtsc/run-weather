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
