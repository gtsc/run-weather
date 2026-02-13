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
  isDay: boolean;
}

export interface ScoredHour extends HourData {
  score: number;
}

export interface RunWindow {
  startHour: number;
  endHour: number;
  startTime: string;
  endTime: string;
  score: number;
  hours: ScoredHour[];
  scores: number[];
}

export interface DayData {
  date: string;
  dayIndex: number;
  hours: ScoredHour[];
  scores: number[];
  bestScore: number;
  windows: RunWindow[];
}

export interface Preferences {
  rainTolerance: number;
  tempMin: number;
  tempMax: number;
  durationHours: number;
}

export interface WeatherInfo {
  label: string;
  penalty: number;
}
