'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  saveWorkspaceBackup, maybeRestoreWorkspaceBackup,
  subscribeToWorkspace, isApplyingRemote, markRestoreComplete, pollWorkspace,
} from '@/lib/workspaceBackup';

/**
 * Keeps the whole workspace synced to Supabase so typed-in data (projects,
 * venues, members, logo, …) is saved forever AND shared live across every
 * account/device:
 *   - On mount: restore from the cloud if it's newer than what's local.
 *   - On every local change: debounced save to the cloud.
 *   - Realtime: apply changes from other users instantly (no reload).
 */
export function WorkspaceBackupSync() {
  const restoredRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1) Restore on first load
  useEffect(() => {
    if (!isSupabaseConfigured || restoredRef.current) return;
    restoredRef.current = true;
    void maybeRestoreWorkspaceBackup().then((restored) => {
      if (restored) { window.location.reload(); return; }
      // Only allow saves once we've confirmed we're not about to clobber the cloud.
      markRestoreComplete();
    });
  }, []);

  // 2) Debounced save on every LOCAL store change (skip while applying remote)
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const unsub = useAppStore.subscribe(() => {
      if (isApplyingRemote()) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => { void saveWorkspaceBackup(); }, 1200);
    });
    return () => {
      unsub();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // 3) Live updates from other users/devices (instant)
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const unsub = subscribeToWorkspace();
    return unsub;
  }, []);

  // 4) Polling fallback every 8s — keeps everyone in sync even if Supabase
  //    Realtime isn't enabled. Pauses when the tab is hidden.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const tick = () => { if (document.visibilityState === 'visible') void pollWorkspace(); };
    const iv = setInterval(tick, 8000);
    return () => clearInterval(iv);
  }, []);

  return null;
}
