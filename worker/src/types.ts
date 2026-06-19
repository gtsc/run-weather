// Matches lab/utils.ts WeatherInput — client derives this from HourData + weatherCode label
export interface WeatherInput {
  hour: number;
  isDay: boolean;
  temperature: number;
  feelsLike: number;
  conditions: string;
  windSpeed: number;
  windGusts: number;
  precipProbability: number;
  precipitation: number;
  dewPoint: number;
}

export interface RecommendRequest {
  weather: WeatherInput;
  run_description?: string;
}

export interface RecommendResponse {
  recommendation: string;
}

export interface FeedbackRequest {
  weather: WeatherInput;
  run_description?: string;
  original_suggestion?: string;
  feedback: string;
}

export interface FeedbackResponse {
  memory: string;
}

export interface Env {
  ANTHROPIC_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}
