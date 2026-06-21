import { createClient } from '@supabase/supabase-js';
import type { Env, RecommendationRow, WeatherInput } from './types';

export function supabaseForUser(env: Env, userToken: string) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${userToken}` } },
    auth: { persistSession: false },
  });
}

export async function fetchMemory(env: Env, userToken: string): Promise<string> {
  const db = supabaseForUser(env, userToken);
  const { data, error } = await db.from('user_memory').select('content').maybeSingle();
  if (error) throw new Error(`Supabase fetch error: ${error.message}`);
  return data?.content ?? '';
}

export async function saveMemory(
  env: Env,
  userToken: string,
  userId: string,
  content: string,
): Promise<void> {
  const db = supabaseForUser(env, userToken);
  const { error } = await db
    .from('user_memory')
    .upsert({ user_id: userId, content, updated_at: new Date().toISOString() });
  if (error) throw new Error(`Supabase save error: ${error.message}`);
}

function round2dp(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function saveRecommendation(
  env: Env,
  userToken: string,
  userId: string,
  params: {
    slot_datetime: string;
    run_description?: string;
    weather_snapshot: WeatherInput;
    recommendation: string;
    latitude: number;
    longitude: number;
    location_name: string;
  },
): Promise<string> {
  const db = supabaseForUser(env, userToken);
  const { data, error } = await db
    .from('recommendations')
    .insert({
      user_id: userId,
      slot_datetime: params.slot_datetime,
      run_description: params.run_description ?? null,
      weather_snapshot: params.weather_snapshot,
      recommendation: params.recommendation,
      latitude: round2dp(params.latitude),
      longitude: round2dp(params.longitude),
      location_name: params.location_name,
    })
    .select('id')
    .single();
  if (error) throw new Error(`Supabase insert error: ${error.message}`);
  return data.id as string;
}

export async function fetchRecommendationsForSlot(
  env: Env,
  userToken: string,
  slot_datetime: string,
  latitude: number,
  longitude: number,
): Promise<RecommendationRow[]> {
  const db = supabaseForUser(env, userToken);
  const { data, error } = await db
    .from('recommendations')
    .select('*')
    .eq('slot_datetime', slot_datetime)
    .eq('latitude', round2dp(latitude))
    .eq('longitude', round2dp(longitude))
    .order('created_at', { ascending: true });
  if (error) throw new Error(`Supabase fetch error: ${error.message}`);
  return (data ?? []) as RecommendationRow[];
}

export async function fetchRecommendationHistory(
  env: Env,
  userToken: string,
): Promise<RecommendationRow[]> {
  const db = supabaseForUser(env, userToken);
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data, error } = await db
    .from('recommendations')
    .select('*')
    .gte('slot_datetime', since)
    .order('slot_datetime', { ascending: false });
  if (error) throw new Error(`Supabase fetch error: ${error.message}`);
  return (data ?? []) as RecommendationRow[];
}

export async function fetchRecommendationById(
  env: Env,
  userToken: string,
  id: string,
): Promise<RecommendationRow | null> {
  const db = supabaseForUser(env, userToken);
  const { data, error } = await db.from('recommendations').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`Supabase fetch error: ${error.message}`);
  return data as RecommendationRow | null;
}

export async function updateRecommendationFeedback(
  env: Env,
  userToken: string,
  id: string,
  feedback: string,
): Promise<void> {
  const db = supabaseForUser(env, userToken);
  const { error } = await db.from('recommendations').update({ feedback }).eq('id', id);
  if (error) throw new Error(`Supabase update error: ${error.message}`);
}
