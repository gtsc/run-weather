export interface Location {
  latitude: number;
  longitude: number;
  name: string;
}

export interface HourData {
  time: string;
  date: string;
  hour: number;
  temperature: number;
  feelsLike: number;
  precipProbability: number;
  precipitation: number;
  windSpeed: number;
  windGusts: number;
  weatherCode: number;
  snowDepth: number;
  isDay: boolean;
  dewPoint: number;
}

export interface ScoredHour extends HourData {
  score: number;
}

export interface DayData {
  date: string;
  dayIndex: number;
  hours: ScoredHour[];
  scores: number[];
  bestScore: number;
}

export interface Preferences {
  rainTolerance: number;
  tempMin: number;
  tempMax: number;
}

export interface WeatherInfo {
  label: string;
  penalty: number;
}

export interface Recommendation {
  id: string;
  slot_datetime: string;
  run_description: string | null;
  weather_snapshot: import('./utils/weatherInput').WeatherInput;
  recommendation: string;
  feedback: string | null;
  latitude: number;
  longitude: number;
  location_name: string;
  created_at: string;
}
