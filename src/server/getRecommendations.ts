import { fetchRecommendationsForSlot, fetchRecommendationHistory } from './supabase';
import type { Env, GetRecommendationsResponse } from './types';

export async function handleGetRecommendations(
  req: Request,
  env: Env,
  userToken: string,
): Promise<Response> {
  const url = new URL(req.url);
  const slot = url.searchParams.get('slot');
  const lat = url.searchParams.get('lat');
  const lng = url.searchParams.get('lng');

  if (!slot || !lat || !lng) {
    return new Response(JSON.stringify({ error: 'Missing slot, lat, or lng' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const recommendations = await fetchRecommendationsForSlot(
    env,
    userToken,
    slot,
    parseFloat(lat),
    parseFloat(lng),
  );

  const res: GetRecommendationsResponse = { recommendations };
  return new Response(JSON.stringify(res), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function handleGetHistory(
  req: Request,
  env: Env,
  userToken: string,
): Promise<Response> {
  const recommendations = await fetchRecommendationHistory(env, userToken);
  const res: GetRecommendationsResponse = { recommendations };
  return new Response(JSON.stringify(res), {
    headers: { 'Content-Type': 'application/json' },
  });
}
