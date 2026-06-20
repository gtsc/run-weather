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

export function friendlyAuthError(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes('rate limit'))
    return 'Too many attempts. Please wait a few minutes and try again.';
  if (lower.includes('invalid login') || lower.includes('invalid credentials'))
    return 'Incorrect email or password.';
  if (lower.includes('email not confirmed')) return 'Please confirm your email before signing in.';
  if (lower.includes('user already registered') || lower.includes('already been registered'))
    return 'An account with this email already exists.';
  if (lower.includes('password should be at least') || lower.includes('password must be at least'))
    return 'Password must be at least 6 characters.';
  if (lower.includes('unable to validate')) return 'Incorrect email or password.';
  const clean = msg.charAt(0).toUpperCase() + msg.slice(1);
  return clean.endsWith('.') ? clean : `${clean}.`;
}

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

export async function signUp(
  email: string,
  password: string,
): Promise<{ error: string | null; needsConfirmation: boolean }> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message, needsConfirmation: false };
  // session is null when Supabase email confirmation is enabled
  return { error: null, needsConfirmation: !data.session };
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
