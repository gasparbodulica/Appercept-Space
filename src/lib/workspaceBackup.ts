import { supabase, isSupabaseConfigured } from './supabase';

// The localStorage key Zustand persist writes to (keep in sync with store.ts `name`).
const PERSIST_KEY = 'appercept-space-store-v12';
// Where we remember when we last synced, to decide local-vs-cloud freshness.
const SAVED_AT_KEY = 'appercept-backup-savedAt';
// Single shared workspace row.
const BACKUP_ID = 'main';

/**
 * Cloud backup of the whole workspace so data survives cache clears / new devices.
 * The entire persisted Zustand blob (projects, venues, members, logo, everything)
 * is stored as one JSON document in Supabase.
 *
 * IMPORTANT: the per-browser login (sessionAccountId) is stripped from the backup
 * and preserved locally on restore — so pulling the shared workspace onto another
 * browser never hijacks whoever is (or isn't) logged in there.
 * All ops are best-effort and never throw.
 */

/** Remove the session field from a persisted-store object (mutates a copy). */
function stripSession(parsed: { state?: Record<string, unknown> } | null): typeof parsed {
  if (parsed?.state && 'sessionAccountId' in parsed.state) parsed.state.sessionAccountId = null;
  return parsed;
}

/** Push the current localStorage store blob (minus the session) to Supabase. */
export async function saveWorkspaceBackup(): Promise<void> {
  try {
    if (!isSupabaseConfigured || !supabase || typeof localStorage === 'undefined') return;
    const blob = localStorage.getItem(PERSIST_KEY);
    if (!blob) return;
    let payload = blob;
    try { payload = JSON.stringify(stripSession(JSON.parse(blob))); } catch { /* keep raw */ }
    const updatedAt = new Date().toISOString();
    const { error } = await supabase
      .from('workspace_state')
      .upsert({ id: BACKUP_ID, data: payload, updated_at: updatedAt }, { onConflict: 'id' });
    if (!error) localStorage.setItem(SAVED_AT_KEY, updatedAt);
  } catch {
    /* best-effort; never break the app */
  }
}

/**
 * On load, decide whether the cloud copy should replace what's local.
 * Returns true if a restore happened (caller should reload the page).
 * Restores when the cloud backup is newer than our last local sync — which
 * covers a freshly-cleared browser (no marker) and other devices.
 * The current browser's own login is always kept, never overwritten.
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

    const cloudIsNewer = !localSavedAt || cloudUpdatedAt > localSavedAt;
    if (localBlob && !cloudIsNewer) return false;

    // Preserve this browser's current login.
    let localSession: unknown = null;
    try { localSession = (JSON.parse(localBlob ?? '{}')?.state ?? {}).sessionAccountId ?? null; } catch { /* none */ }

    // Cloud data may be a JSON string or an object (jsonb). Normalise to an object.
    let parsed: { state?: Record<string, unknown> };
    try {
      parsed = typeof data.data === 'string' ? JSON.parse(data.data) : (data.data as { state?: Record<string, unknown> });
    } catch {
      return false;
    }
    if (parsed?.state) parsed.state.sessionAccountId = localSession;

    localStorage.setItem(PERSIST_KEY, JSON.stringify(parsed));
    localStorage.setItem(SAVED_AT_KEY, cloudUpdatedAt);
    return true;
  } catch {
    return false;
  }
}
