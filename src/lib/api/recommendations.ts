import type { Recommendation } from '../types';
import { supabase } from '../stores/auth.svelte';

async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function fetchSlotRecommendations(
  slotDatetime: string,
  latitude: number,
  longitude: number,
): Promise<Recommendation[]> {
  const token = await getToken();
  if (!token) return [];
  const params = new URLSearchParams({
    slot: slotDatetime,
    lat: String(latitude),
    lng: String(longitude),
  });
  const res = await fetch(`/recommendations?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { recommendations: Recommendation[] };
  return json.recommendations;
}

export async function fetchHistory(): Promise<Recommendation[]> {
  const token = await getToken();
  if (!token) return [];
  const res = await fetch('/recommendations/history', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { recommendations: Recommendation[] };
  return json.recommendations;
}
