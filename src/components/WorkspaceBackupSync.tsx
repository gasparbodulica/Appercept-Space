'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { isSupabaseConfigured } from '@/lib/supabase';
import { saveWorkspaceBackup, maybeRestoreWorkspaceBackup } from '@/lib/workspaceBackup';

/**
 * Keeps the whole workspace backed up to Supabase so typed-in data
 * (projects, venues, members, logo, …) is saved forever and survives a
 * cleared browser cache or a different device.
 *   - On mount: restore from the cloud if it's newer than what's local.
 *   - On every change: debounced save of the full store to the cloud.
 */
export function WorkspaceBackupSync() {
  const restoredRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1) Restore on first load
  useEffect(() => {
    if (!isSupabaseConfigured || restoredRef.current) return;
    restoredRef.current = true;
    void maybeRestoreWorkspaceBackup().then((restored) => {
      // If we pulled a newer copy from the cloud, reload so Zustand rehydrates it.
      if (restored) window.location.reload();
    });
  }, []);

  // 2) Debounced save on every store change
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const unsub = useAppStore.subscribe(() => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => { void saveWorkspaceBackup(); }, 1500);
    });
    return () => {
      unsub();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return null;
}
