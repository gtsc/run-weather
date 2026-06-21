import Anthropic from '@anthropic-ai/sdk';
import { UPDATE_MEMORY_SYSTEM } from './prompts';
import { formatWeather } from './weather';
import {
  fetchMemory,
  saveMemory,
  fetchRecommendationById,
  updateRecommendationFeedback,
} from './supabase';
import type { Env, FeedbackRequest, FeedbackResponse } from './types';

export async function handleFeedback(
  req: Request,
  env: Env,
  userToken: string,
  userId: string,
): Promise<Response> {
  const body = (await req.json()) as FeedbackRequest;
  if (!body.recommendation_id || !body.feedback) {
    return new Response(JSON.stringify({ error: 'Missing recommendation_id or feedback' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const rec = await fetchRecommendationById(env, userToken, body.recommendation_id);
  if (!rec) {
    return new Response(JSON.stringify({ error: 'Recommendation not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await updateRecommendationFeedback(env, userToken, body.recommendation_id, body.feedback);

  const currentMemory = await fetchMemory(env, userToken);

  const userMessage = [
    'Current memory:',
    currentMemory || '(empty)',
    '',
    'Weather at time of run:',
    formatWeather(rec.weather_snapshot),
    '',
    rec.run_description
      ? `Run description: ${rec.run_description}`
      : 'Run description: (not provided)',
    '',
    `Original clothing suggestion: ${rec.recommendation}`,
    '',
    `Runner feedback: ${body.feedback}`,
  ].join('\n');

  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    system: UPDATE_MEMORY_SYSTEM,
    messages: [{ role: 'user', content: userMessage }],
  });

  const updatedMemory = (msg.content[0] as { type: string; text: string }).text;
  await saveMemory(env, userToken, userId, updatedMemory);

  const res: FeedbackResponse = { memory: updatedMemory };
  return new Response(JSON.stringify(res), {
    headers: { 'Content-Type': 'application/json' },
  });
}
