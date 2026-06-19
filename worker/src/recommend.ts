import Anthropic from '@anthropic-ai/sdk';
import { RECOMMEND_SYSTEM } from './prompts';
import { formatWeather } from './weather';
import { fetchMemory } from './supabase';
import type { Env, RecommendRequest, RecommendResponse } from './types';

export async function handleRecommend(
  req: Request,
  env: Env,
  userToken: string
): Promise<Response> {
  const body = (await req.json()) as RecommendRequest;
  if (!body.weather) {
    return new Response(JSON.stringify({ error: 'Missing weather field' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const memory = await fetchMemory(env, userToken);

  const userMessage = [
    'Weather conditions:',
    formatWeather(body.weather),
    '',
    body.run_description
      ? `Run description: ${body.run_description}`
      : 'Run description: (not provided)',
    '',
    memory ? `Personal notes:\n${memory}` : 'Personal notes: (none yet)',
  ].join('\n');

  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    system: RECOMMEND_SYSTEM,
    messages: [{ role: 'user', content: userMessage }],
  });

  const recommendation = (msg.content[0] as { type: string; text: string }).text;
  const res: RecommendResponse = { recommendation };
  return new Response(JSON.stringify(res), {
    headers: { 'Content-Type': 'application/json' },
  });
}
