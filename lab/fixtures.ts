import type { WeatherInput } from './utils';

export const SEED_MEMORY = `\
Runs noticeably warm during sustained efforts above ~155bpm (tempo, intervals, progressive) — often comfortable in just a t-shirt/long-sleeve and shorts down to 5-8°C, even with a cool/windy start. Prefers removable layers (unzip rather than remove) for progressive runs with cold starts. At easy/recovery effort (<145bpm), wind is the dominant factor: calm conditions need ~2°C less coverage than windy ones at the same temperature. Below 0°C always needs ear coverage (buff), regardless of body layers — 2 layers (long-sleeve + windbreaker) is plenty if calm, but windy sub-zero needs a third layer. Standard wind layer handles light drizzle fine; moderate/heavy rain or high rain probability needs a waterproof shell instead. Social/group runs push HR higher than planned, reducing layering needs. On long runs in warming conditions, heat builds progressively — outer layer often needs removing mid-to-late run.`;

export const SAMPLE_WEATHER: WeatherInput = {
  hour: 7,
  isDay: true,
  temperature: 9,
  feelsLike: 6,
  conditions: 'Partly cloudy',
  windSpeed: 22,
  windGusts: 35,
  precipProbability: 10,
  precipitation: 0,
  dewPoint: 5,
};
