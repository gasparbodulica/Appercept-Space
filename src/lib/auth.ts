import { supabase, isSupabaseConfigured, type SupabaseProfile } from './supabase';
import type { Account } from './types';

// Map a Supabase profile row → the app's existing Account shape, so the rest of
// the app (useCurrentAccount, role checks, layout gate) keeps working unchanged.
export function profileToAccount(p: SupabaseProfile): Account {
  return {
    id: p.id,
    name: p.name,
    email: p.email,
    password: '',                 // never exposed client-side with real auth
    approved: p.approved,
    role: p.role,
    client_company: p.client_company ?? undefined,
    initials: p.initials || p.name.slice(0, 2).toUpperCase(),
    color: p.color || '#1c75bc',
    avatar_url: p.avatar_url ?? undefined,
    created_at: p.created_at,
  };
}

export async function fetchProfile(userId: string): Promise<Account | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error || !data) return null;
  return profileToAccount(data as SupabaseProfile);
}

export async function signUpSupabase(name: string, email: string, password: string): Promise<{ ok: boolean; error?: string; needsConfirm?: boolean }> {
  if (!supabase) return { ok: false, error: 'Auth is not configured.' };
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { name: name.trim() } },
  });
  if (error) return { ok: false, error: error.message };
  // If email confirmation is ON, there's no session yet.
  const needsConfirm = !data.session;
  return { ok: true, needsConfirm };
}

export async function signInSupabase(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Auth is not configured.' };
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function signOutSupabase(): Promise<void> {
  if (supabase) await supabase.auth.signOut();
}

export async function sendResetEmail(email: string): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Auth is not configured.' };
  const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/reset` : undefined;
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export { isSupabaseConfigured };
