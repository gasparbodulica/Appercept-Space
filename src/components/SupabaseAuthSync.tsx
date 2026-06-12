'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { fetchProfile, updateProfileApproval, validateInviteToken } from '@/lib/auth';

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

    // Is a local (emergency/seed) admin currently logged in? Their account id
    // starts with 'acc-'. While they're active, the Supabase bridge must NOT
    // override or clear their session from a stale/remembered Supabase token.
    const localAdminActive = () => {
      const { accounts, sessionAccountId } = useAppStore.getState();
      const current = accounts.find(a => a.id === sessionAccountId);
      return (current?.id ?? '').startsWith('acc-');
    };

    // Clear the session ONLY if the current login came from Supabase.
    const clearIfSupabaseSession = () => {
      const { sessionAccountId } = useAppStore.getState();
      if (sessionAccountId && !localAdminActive()) setAuthedAccount(null);
    };

    // `explicit` = a deliberate fresh SIGNED_IN (not a remembered/refreshed token).
    const apply = async (userId: string | undefined, justSignedIn: boolean, explicit = false) => {
      if (!userId) { clearIfSupabaseSession(); return; }
      // A local admin is active and this is just a stale/remembered Supabase
      // session waking up — never override the local admin with it.
      if (localAdminActive() && !explicit) return;
      const acc = await fetchProfile(userId);
      if (active && acc) {
        // Check if admin pre-registered this email — auto-approve and use the admin's name
        const { pendingInvites, removePendingInvite } = useAppStore.getState();
        const invite = pendingInvites.find(i => i.email.toLowerCase() === acc.email.toLowerCase());

        // Check for a link-based invite token stored by AuthScreen after signup.
        // Validated against Supabase so it works on the invitee's own browser.
        const storedToken = typeof localStorage !== 'undefined' ? localStorage.getItem('appercept_invite') : null;
        const linkInviteValid = storedToken ? await validateInviteToken(storedToken) : false;
        if (storedToken) localStorage.removeItem('appercept_invite');

        let resolved = acc;
        if (invite) {
          resolved = { ...acc, name: invite.name, approved: true, role: invite.role as typeof acc.role };
          removePendingInvite(invite.email);
        } else if (linkInviteValid && !acc.approved) {
          resolved = { ...acc, approved: true, role: 'member' };
          // Write auto-approval back to Supabase (user updates their OWN row)
          void updateProfileApproval(userId, { approved: true, role: 'member' });
        }

        setAuthedAccount(resolved, justSignedIn);
        const firstName = resolved.name.trim().split(/\s+/)[0];
        if (firstName) {
          document.cookie = `appercept_fn=${encodeURIComponent(firstName)}; domain=.appercept.net; max-age=${365 * 24 * 3600}; path=/; SameSite=Lax; Secure`;
        }
      } else if (active) clearIfSupabaseSession();
    };

    // 1) Resolve the existing session on load (remembered token → not explicit).
    supabase.auth.getSession().then(async ({ data }) => {
      const hasSession = !!data.session?.user?.id;
      await apply(data.session?.user?.id, hasSession, false);
      if (active) setAuthChecked(true);
    });

    // 2) React to future auth changes. Only a real SIGNED_IN is an explicit login
    //    that may take over from a local admin; INITIAL_SESSION/TOKEN_REFRESHED are not.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      const explicit = event === 'SIGNED_IN';
      const isEntry = event === 'SIGNED_IN' || event === 'INITIAL_SESSION';
      void apply(session?.user?.id, isEntry && !!session?.user?.id, explicit);
    });

    return () => { active = false; sub.subscription.unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
