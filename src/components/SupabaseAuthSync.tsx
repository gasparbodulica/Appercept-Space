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
      if (active && acc) {
        // Check if admin pre-registered this email — if so, auto-approve and use the admin's name
        const { pendingInvites, removePendingInvite } = useAppStore.getState();
        const invite = pendingInvites.find(i => i.email.toLowerCase() === acc.email.toLowerCase());
        const resolved = invite
          ? { ...acc, name: invite.name, approved: true, role: invite.role as typeof acc.role }
          : acc;
        if (invite) removePendingInvite(invite.email);

        setAuthedAccount(resolved, justSignedIn);
        const firstName = resolved.name.trim().split(/\s+/)[0];
        if (firstName) {
          document.cookie = `appercept_fn=${encodeURIComponent(firstName)}; domain=.appercept.net; max-age=${365 * 24 * 3600}; path=/; SameSite=Lax; Secure`;
        }
      } else if (active) setAuthedAccount(null);
    };

    // 1) Resolve the existing session on load — treat a remembered session as
    //    justSignedIn so the WelcomeScreen appears even on auto-login.
    supabase.auth.getSession().then(async ({ data }) => {
      const hasSession = !!data.session?.user?.id;
      await apply(data.session?.user?.id, hasSession);
      if (active) setAuthChecked(true);
    });

    // 2) React to future auth changes — treat SIGNED_IN and INITIAL_SESSION
    //    (remembered session) as justSignedIn; TOKEN_REFRESHED etc. are silent.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      const isEntry = event === 'SIGNED_IN' || event === 'INITIAL_SESSION';
      void apply(session?.user?.id, isEntry && !!session?.user?.id);
    });

    return () => { active = false; sub.subscription.unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
