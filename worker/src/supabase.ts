import { createClient } from '@supabase/supabase-js';
import type { Env } from './types';

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
