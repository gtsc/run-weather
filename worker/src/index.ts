import { handleRecommend } from './recommend';
import { handleFeedback } from './feedback';
import { supabaseForUser } from './supabase';
import type { Env } from './types';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function corsResponse(body: string, status: number): Response {
  return new Response(body, {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

async function authenticate(
  req: Request,
  env: Env,
): Promise<{ token: string; userId: string } | Response> {
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) {
    return corsResponse(JSON.stringify({ error: 'Missing Authorization header' }), 401);
  }
  const token = auth.slice(7);
  const db = supabaseForUser(env, token);
  const { data, error } = await db.auth.getUser();
  if (error || !data.user) {
    return corsResponse(JSON.stringify({ error: 'Invalid or expired token' }), 401);
  }
  return { token, userId: data.user.id };
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (req.method !== 'POST') {
      return corsResponse(JSON.stringify({ error: 'Method not allowed' }), 405);
    }

    const authResult = await authenticate(req, env);
    if (authResult instanceof Response) return authResult;
    const { token, userId } = authResult;

    const path = new URL(req.url).pathname;

    try {
      if (path === '/recommend') return await handleRecommend(req, env, token);
      if (path === '/feedback') return await handleFeedback(req, env, token, userId);
      return corsResponse(JSON.stringify({ error: 'Not found' }), 404);
    } catch (err) {
      console.error(err);
      return corsResponse(JSON.stringify({ error: 'Internal server error' }), 500);
    }
  },
};
