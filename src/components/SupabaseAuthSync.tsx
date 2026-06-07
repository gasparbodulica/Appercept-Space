'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { fetchProfile } from '@/lib/auth';

/**
 * Bridges the live Supabase auth session into the app's account model.
 * Mounts once in the app layout. When configured, it:
 *   - resolves the current session on load (and marks authChecked)
 *   - listens for sign-in / sign-out and updates the store accordingly
 * If Supabase isn't configured, it does nothing (local prototype mode).
 */
export function SupabaseAuthSync() {
  const setAuthedAccount = useAppStore((s) => s.setAuthedAccount);
  const setAuthChecked = useAppStore((s) => s.setAuthChecked);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) { setAuthChecked(true); return; }
    let active = true;

    const apply = async (userId: string | undefined, justSignedIn: boolean) => {
      if (!userId) { setAuthedAccount(null); return; }
      const acc = await fetchProfile(userId);
      if (active && acc) setAuthedAccount(acc, justSignedIn);
      else if (active) setAuthedAccount(null);
    };

    // 1) Resolve the existing session on load
    supabase.auth.getSession().then(async ({ data }) => {
      await apply(data.session?.user?.id, false);
      if (active) setAuthChecked(true);
    });

    // 2) React to future auth changes
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      void apply(session?.user?.id, event === 'SIGNED_IN');
    });

    return () => { active = false; sub.subscription.unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
