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

/** A run of upcoming hours around a day's best score. `end` is exclusive. */
export interface BestWindow {
  start: number;
  end: number;
  score: number;
}

export interface DayData {
  date: string;
  dayIndex: number;
  hours: ScoredHour[];
  scores: number[];
  bestScore: number;
  /** Best upcoming window, or null when every hour has already started. */
  best: BestWindow | null;
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
