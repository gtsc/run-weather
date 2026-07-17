import { createClient } from '@supabase/supabase-js';
import type { Env } from './types';

// Supabase pauses free-tier projects after 7 days with no database
// activity — dashboard visits and API traffic that never reaches Postgres
// don't count. run-weather's AI recommendation path only writes to Supabase
// when a user gets a clothing suggestion, which can go quiet for a week at
// a time (e.g. when it's too hot for the recommendation to matter). This
// runs on a schedule (see wrangler.jsonc `triggers.crons`) to keep the
// project active. A read-only `select` was tried first and reached
// Postgres successfully, but Supabase's pause check didn't count it —
// it appears to require a write, so this upserts into a dedicated table.
export async function pingSupabase(env: Env): Promise<void> {
  const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  const { error } = await db
    .from('keep_alive')
    .upsert({ id: true, pinged_at: new Date().toISOString() });
  if (error) throw new Error(`Supabase keep-alive ping failed: ${error.message}`);
}
