import { supabase, isSupabaseConfigured } from './supabase';
import { useAppStore } from './store';

// The localStorage key Zustand persist writes to (keep in sync with store.ts `name`).
const PERSIST_KEY = 'appercept-space-store-v12';
// Where we remember when we last synced, to decide local-vs-cloud freshness.
const SAVED_AT_KEY = 'appercept-backup-savedAt';
// Single shared workspace row.
const BACKUP_ID = 'main';

/**
 * Cloud backup of the whole workspace so data survives cache clears / new devices,
 * and syncs live across browsers.
 *
 * SAFETY: the backup must NEVER overwrite good data with an empty workspace. Three
 * guards enforce this:
 *   1. No save happens until the initial restore has completed (prevents a fresh
 *      page-load seed from racing ahead and clobbering the cloud).
 *   2. A local store with 0 rows never overwrites a cloud that has rows.
 *   3. A remote/cloud blob with 0 rows is never applied over a local store that
 *      has rows.
 * All ops are best-effort and never throw.
 */

// Saves are blocked until the first restore resolves.
let restoreComplete = false;
export function markRestoreComplete(): void { restoreComplete = true; }

// Last known number of rows in the cloud copy (−1 = unknown).
let lastCloudRows = -1;

// While we apply a remote change, suppress our own save so we don't echo it back.
let applyingRemote = false;
export function isApplyingRemote(): boolean { return applyingRemote; }

/** Total rows across all databases in a persisted state object (data richness). */
function countRows(state: Record<string, unknown> | undefined): number {
  try {
    const dbs = (state?.databases ?? {}) as Record<string, { rows?: unknown[] }>;
    return Object.values(dbs).reduce((n, d) => n + (Array.isArray(d?.rows) ? d.rows.length : 0), 0);
  } catch { return 0; }
}

function parseBlob(raw: unknown): { state?: Record<string, unknown> } | null {
  try { return typeof raw === 'string' ? JSON.parse(raw) : (raw as { state?: Record<string, unknown> }); }
  catch { return null; }
}

/** Remove the session field from a persisted-store object (mutates a copy). */
function stripSession(parsed: { state?: Record<string, unknown> } | null): typeof parsed {
  if (parsed?.state && 'sessionAccountId' in parsed.state) parsed.state.sessionAccountId = null;
  return parsed;
}

/**
 * Apply a cloud workspace blob to the LIVE store so the UI updates in real time.
 * Skips applying an EMPTY remote over a populated local store.
 */
export function applyCloudBlobLive(rawData: unknown, updatedAt: string): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const parsed = parseBlob(rawData);
    if (!parsed?.state) return;

    const remoteRows = countRows(parsed.state);
    const localParsed = parseBlob(localStorage.getItem(PERSIST_KEY));
    const localRows = countRows(localParsed?.state);
    // Guard 3: never wipe a populated local store with an empty remote.
    if (remoteRows === 0 && localRows > 0) return;

    // Keep this browser's own session
    let localSession: unknown = null;
    try { localSession = (localParsed?.state ?? {}).sessionAccountId ?? null; } catch { /* none */ }
    parsed.state.sessionAccountId = localSession;

    applyingRemote = true;
    useAppStore.setState(parsed.state as Record<string, unknown>);
    localStorage.setItem(SAVED_AT_KEY, updatedAt);
    lastCloudRows = remoteRows;
    setTimeout(() => { applyingRemote = false; }, 150);
  } catch {
    applyingRemote = false;
  }
}

/** Subscribe to live workspace changes from other users/devices. */
export function subscribeToWorkspace(): () => void {
  const sb = supabase;
  if (!isSupabaseConfigured || !sb) return () => {};
  try {
    const channel = sb
      .channel('workspace_state_live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'workspace_state', filter: 'id=eq.main' },
        (payload: { new?: { data?: unknown; updated_at?: string } }) => {
          const row = payload.new;
          if (!row?.data) return;
          const updatedAt = String(row.updated_at ?? '');
          const localSavedAt = (typeof localStorage !== 'undefined' && localStorage.getItem(SAVED_AT_KEY)) || '';
          if (updatedAt && updatedAt <= localSavedAt) return; // own echo / older
          applyCloudBlobLive(row.data, updatedAt);
        },
      )
      .subscribe();
    return () => { try { sb.removeChannel(channel); } catch { /* ignore */ } };
  } catch {
    return () => {};
  }
}

/** Push the current localStorage store blob (minus the session) to Supabase. */
export async function saveWorkspaceBackup(): Promise<void> {
  try {
    if (!isSupabaseConfigured || !supabase || typeof localStorage === 'undefined') return;
    // Guard 1: don't save until the first restore has resolved.
    if (!restoreComplete) return;
    const blob = localStorage.getItem(PERSIST_KEY);
    if (!blob) return;

    const parsed = parseBlob(blob);
    const localRows = countRows(parsed?.state);
    // Guard 2: never overwrite a cloud that has data with an empty local store.
    if (localRows === 0 && lastCloudRows > 0) return;

    const payload = JSON.stringify(stripSession(parsed)) ?? blob;
    const updatedAt = new Date().toISOString();
    const { error } = await supabase
      .from('workspace_state')
      .upsert({ id: BACKUP_ID, data: payload, updated_at: updatedAt }, { onConflict: 'id' });
    if (!error) {
      localStorage.setItem(SAVED_AT_KEY, updatedAt);
      lastCloudRows = localRows;
    }
  } catch {
    /* best-effort */
  }
}

/**
 * On load, decide whether the cloud copy should replace what's local.
 * Returns true if a restore happened (caller should reload the page).
 * Restores when the cloud is newer OR when local is empty but cloud has data.
 * Never wipes a populated local store with an empty cloud.
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

    const parsed = parseBlob(data.data);
    if (!parsed?.state) return false;

    const cloudUpdatedAt = String(data.updated_at ?? '');
    const localSavedAt = localStorage.getItem(SAVED_AT_KEY) ?? '';
    const localBlob = localStorage.getItem(PERSIST_KEY);
    const localParsed = parseBlob(localBlob);

    const cloudRows = countRows(parsed.state);
    const localRows = countRows(localParsed?.state);
    lastCloudRows = cloudRows;

    const cloudIsNewer = !localSavedAt || cloudUpdatedAt > localSavedAt;
    // Restore when: local is empty but cloud has data (recover), OR cloud is newer
    // AND we wouldn't be wiping populated local data with an empty cloud.
    const shouldRestore =
      (localRows === 0 && cloudRows > 0) ||
      (cloudIsNewer && !(cloudRows === 0 && localRows > 0) && (!localBlob || cloudRows >= localRows || cloudIsNewer));

    // Hard stop: never replace populated local with an empty cloud.
    if (cloudRows === 0 && localRows > 0) return false;
    if (localBlob && !cloudIsNewer && !(localRows === 0 && cloudRows > 0)) return false;
    if (!shouldRestore) return false;

    let localSession: unknown = null;
    try { localSession = (localParsed?.state ?? {}).sessionAccountId ?? null; } catch { /* none */ }
    if (parsed.state) parsed.state.sessionAccountId = localSession;

    localStorage.setItem(PERSIST_KEY, JSON.stringify(parsed));
    localStorage.setItem(SAVED_AT_KEY, cloudUpdatedAt);
    return true;
  } catch {
    return false;
  }
}
