import { supabase, isSupabaseConfigured } from './supabase';

// The localStorage key Zustand persist writes to (keep in sync with store.ts `name`).
const PERSIST_KEY = 'appercept-space-store-v12';
// Where we remember when we last synced, to decide local-vs-cloud freshness.
const SAVED_AT_KEY = 'appercept-backup-savedAt';
// Single-tenant row id — this is one owner's workspace.
const BACKUP_ID = 'main';

/**
 * Cloud backup of the whole workspace so data survives cache clears / new devices.
 * The entire persisted Zustand blob (projects, venues, members, logo, everything)
 * is stored as one JSON document in Supabase. All ops are best-effort and never throw.
 */

/** Push the current localStorage store blob to Supabase. */
export async function saveWorkspaceBackup(): Promise<void> {
  try {
    if (!isSupabaseConfigured || !supabase || typeof localStorage === 'undefined') return;
    const blob = localStorage.getItem(PERSIST_KEY);
    if (!blob) return;
    const updatedAt = new Date().toISOString();
    const { error } = await supabase
      .from('workspace_state')
      .upsert({ id: BACKUP_ID, data: blob, updated_at: updatedAt }, { onConflict: 'id' });
    if (!error) localStorage.setItem(SAVED_AT_KEY, updatedAt);
  } catch {
    /* best-effort; never break the app */
  }
}

/**
 * On load, decide whether the cloud copy should replace what's local.
 * Returns true if a restore happened (caller should reload the page).
 * Restores when the cloud backup is newer than our last local sync — which
 * covers a freshly-cleared browser (no local sync marker) and other devices.
 */
export async function maybeRestoreWorkspaceBackup(): Promise<boolean> {
  try {
    if (!isSupabaseConfigured || !supabase || typeof localStorage === 'undefined') return false;
    const { data, error } = await supabase
      .from('workspace_state')
      .select('data, updated_at')
      .eq('id', BACKUP_ID)
      .single();
    if (error || !data?.data) return false;

    const cloudUpdatedAt = String(data.updated_at ?? '');
    const localSavedAt = localStorage.getItem(SAVED_AT_KEY) ?? '';
    const localBlob = localStorage.getItem(PERSIST_KEY);

    // Restore if: we have no local data at all, OR the cloud copy is newer than
    // the last time this browser synced (someone saved more recently elsewhere).
    const cloudIsNewer = !localSavedAt || cloudUpdatedAt > localSavedAt;
    if (!localBlob || cloudIsNewer) {
      const cloudBlob = typeof data.data === 'string' ? data.data : JSON.stringify(data.data);
      localStorage.setItem(PERSIST_KEY, cloudBlob);
      localStorage.setItem(SAVED_AT_KEY, cloudUpdatedAt);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
