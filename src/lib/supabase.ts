import { createClient } from '@supabase/supabase-js';

// Browser-safe client. Uses the publishable/anon key (never the secret key).
// Reads from NEXT_PUBLIC_* env vars so it works on the client and in Vercel.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** True only when the Supabase env vars are present — lets the app fall back
 *  to the local prototype gracefully if they're missing. */
export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,      // keep the user logged in across reloads
        autoRefreshToken: true,    // refresh the session automatically
        detectSessionInUrl: true,  // needed for email-confirm / magic-link redirects
      },
    })
  : null;

// ─── Profile shape stored in the `profiles` table (mirrors the Account type) ──
export interface SupabaseProfile {
  id: string;            // = auth.users.id
  name: string;
  email: string;
  role: 'admin' | 'member' | 'viewer' | 'client';
  approved: boolean;
  client_company: string | null;
  initials: string;
  color: string;
  avatar_url: string | null;
  created_at: string;
}
