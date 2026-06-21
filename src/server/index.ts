import { handleRecommend } from './recommend';
import { handleFeedback } from './feedback';
import { handleGetRecommendations, handleGetHistory } from './getRecommendations';
import { supabaseForUser } from './supabase';
import type { Env } from './types';

function jsonResponse(body: string, status: number): Response {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function authenticate(
  req: Request,
  env: Env,
): Promise<{ token: string; userId: string } | Response> {
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) {
    return jsonResponse(JSON.stringify({ error: 'Missing Authorization header' }), 401);
  }
  const token = auth.slice(7);
  const db = supabaseForUser(env, token);
  const { data, error } = await db.auth.getUser();
  if (error || !data.user) {
    return jsonResponse(JSON.stringify({ error: 'Invalid or expired token' }), 401);
  }
  return { token, userId: data.user.id };
}

function missingSecrets(env: Env): string[] {
  return (['ANTHROPIC_API_KEY', 'SUPABASE_URL', 'SUPABASE_ANON_KEY'] as const).filter(
    (k) => !env[k],
  );
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    try {
      const missing = missingSecrets(env);
      if (missing.length > 0) {
        console.error('Missing secrets:', missing.join(', '));
        return jsonResponse(JSON.stringify({ error: 'Worker not configured' }), 503);
      }

      const authResult = await authenticate(req, env);
      if (authResult instanceof Response) return authResult;
      const { token, userId } = authResult;

      const { method } = req;
      const path = new URL(req.url).pathname;

      if (method === 'GET') {
        if (path === '/recommendations') return await handleGetRecommendations(req, env, token);
        if (path === '/recommendations/history') return await handleGetHistory(req, env, token);
        return jsonResponse(JSON.stringify({ error: 'Not found' }), 404);
      }

      if (method === 'POST') {
        if (path === '/recommend') return await handleRecommend(req, env, token, userId);
        if (path === '/feedback') return await handleFeedback(req, env, token, userId);
        return jsonResponse(JSON.stringify({ error: 'Not found' }), 404);
      }

      return jsonResponse(JSON.stringify({ error: 'Method not allowed' }), 405);
    } catch (err) {
      console.error(err);
      return jsonResponse(JSON.stringify({ error: 'Internal server error' }), 500);
    }
  },
};
