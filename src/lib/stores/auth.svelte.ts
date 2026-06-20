import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string,
);

interface AuthState {
  user: { id: string; email: string } | null;
  loading: boolean;
}

let state = $state<AuthState>({ user: null, loading: true });
let isRecovery = $state(false);

supabase.auth.getSession().then(({ data }) => {
  const u = data.session?.user;
  state.user = u ? { id: u.id, email: u.email ?? '' } : null;
  state.loading = false;
});

supabase.auth.onAuthStateChange((event, session) => {
  const u = session?.user;
  state.user = u ? { id: u.id, email: u.email ?? '' } : null;
  if (event === 'PASSWORD_RECOVERY') {
    isRecovery = true;
  } else if (event === 'USER_UPDATED' || event === 'SIGNED_OUT') {
    isRecovery = false;
  }
});

export function getAuthState(): AuthState {
  return state;
}

export function getIsRecovery(): boolean {
  return isRecovery;
}

export async function signIn(email: string, password: string): Promise<string | null> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error ? error.message : null;
}

export async function signUp(email: string, password: string): Promise<string | null> {
  const { error } = await supabase.auth.signUp({ email, password });
  return error ? error.message : null;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function resetPassword(email: string): Promise<string | null> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
  return error ? error.message : null;
}

export async function updatePassword(password: string): Promise<string | null> {
  const { error } = await supabase.auth.updateUser({ password });
  return error ? error.message : null;
}

export async function fetchNotes(): Promise<string> {
  const { data } = await supabase.from('user_memory').select('content').maybeSingle();
  return data?.content ?? '';
}

export async function saveNotes(content: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from('user_memory')
    .upsert({ user_id: user.id, content, updated_at: new Date().toISOString() });
}
