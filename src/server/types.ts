// Matches lib/utils/weatherInput.ts WeatherInput
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

export interface RecommendationRow {
  id: string;
  user_id: string;
  slot_datetime: string;
  run_description: string | null;
  weather_snapshot: WeatherInput;
  recommendation: string;
  feedback: string | null;
  latitude: number;
  longitude: number;
  location_name: string;
  created_at: string;
}

export interface RecommendRequest {
  weather: WeatherInput;
  run_description?: string;
  slot_datetime: string;
  latitude: number;
  longitude: number;
  location_name: string;
}

export interface RecommendResponse {
  id: string;
  recommendation: string;
}

export interface FeedbackRequest {
  recommendation_id: string;
  feedback: string;
}

export interface FeedbackResponse {
  memory: string;
}

export interface GetRecommendationsResponse {
  recommendations: RecommendationRow[];
}

export interface Env {
  ANTHROPIC_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}
