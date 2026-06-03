import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Database, Row, Column, CellValue, Comment, Activity, Notification, Page, ViewConfig, Filter, Sort, User, Workspace, Account } from './types';
import { DATABASES, PAGES, USERS, WORKSPACE, COMMENTS, ACTIVITIES, NOTIFICATIONS, ACCOUNTS } from './seed';

interface AppState {
  // Core data
  pages: Page[];
  databases: Record<string, Database>;
  users: User[];
  workspace: Workspace;
  comments: Comment[];
  activities: Activity[];
  notifications: Notification[];

  // Auth / access
  accounts: Account[];
  sessionAccountId: string | null;

  // UI state
  currentPageSlug: string;
  currentViewId: string | null;
  sidebarCollapsed: boolean;
  openRowId: string | null;
  openDatabaseId: string | null;
  commandPaletteOpen: boolean;
  newPageModalOpen: boolean;
  currentUserId: string;

  // Actions — navigation
  setCurrentPage: (slug: string) => void;
  setCurrentView: (viewId: string) => void;
  toggleSidebar: () => void;
  openRow: (rowId: string, databaseId: string) => void;
  closeRow: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setNewPageModalOpen: (open: boolean) => void;
  addPage: (title: string, iconName: string, iconColor?: string) => Page;
  updatePage: (pageId: string, updates: Partial<Pick<Page, 'title' | 'icon' | 'iconColor'>>) => void;
  toggleFavorite: (pageId: string) => void;
  createDatabaseForPage: (pageId: string) => Database;

  // Actions — rows
  addRow: (databaseId: string) => Row;
  updateCell: (databaseId: string, rowId: string, columnId: string, value: CellValue) => void;
  deleteRow: (databaseId: string, rowId: string) => void;
  duplicateRow: (databaseId: string, rowId: string) => void;
  reorderRows: (databaseId: string, fromIndex: number, toIndex: number) => void;

  // Actions — columns
  addColumn: (databaseId: string, column: Omit<Column, 'id'>) => void;
  updateColumn: (databaseId: string, columnId: string, updates: Partial<Column>) => void;
  addColumnOption: (databaseId: string, columnId: string, label: string) => void;
  deleteColumn: (databaseId: string, columnId: string) => void;
  reorderColumns: (databaseId: string, fromIndex: number, toIndex: number) => void;
  resizeColumn: (databaseId: string, columnId: string, width: number) => void;

  // Actions — views
  addView: (databaseId: string, view: Omit<ViewConfig, 'id'>) => ViewConfig;
  updateView: (databaseId: string, viewId: string, updates: Partial<ViewConfig>) => void;
  deleteView: (databaseId: string, viewId: string) => void;
  setFilter: (databaseId: string, viewId: string, filters: Filter[]) => void;
  setSort: (databaseId: string, viewId: string, sorts: Sort[]) => void;

  // Actions — comments
  addComment: (rowId: string, body: string) => void;

  // Actions — notifications
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;

  // Actions — pages
  reorderPages: (fromIndex: number, toIndex: number) => void;
  movePage: (draggedId: string, targetId: string) => void;

  // Actions — auth / access
  signUp: (name: string, email: string, password: string) => { ok: boolean; error?: string };
  signIn: (email: string, password: string) => { ok: boolean; error?: string };
  signOut: () => void;
  approveAccount: (id: string) => void;
  revokeAccount: (id: string) => void;
  deleteAccount: (id: string) => void;

  // Actions — users & workspace
  updateUser: (userId: string, updates: Partial<User>) => void;
  updateWorkspace: (updates: Partial<Workspace>) => void;
  addMember: (member: Omit<User, 'id' | 'workspace_id'>) => void;
  removeMember: (userId: string) => void;
}

let rowCounter = 10000;
let colCounter = 10000;
let viewCounter = 10000;
let commentCounter = 10000;

function generateId(prefix: string) {
  return `${prefix}-${++rowCounter}-${Date.now().toString(36)}`;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ── Initial State ──────────────────────────────────────────────────────
      pages: PAGES,
      databases: DATABASES,
      users: USERS,
      workspace: WORKSPACE,
      accounts: ACCOUNTS,
      sessionAccountId: null,
      comments: COMMENTS,
      activities: ACTIVITIES,
      notifications: NOTIFICATIONS,
      currentPageSlug: 'todo',
      currentViewId: null,
      sidebarCollapsed: false,
      openRowId: null,
      openDatabaseId: null,
      commandPaletteOpen: false,
      newPageModalOpen: false,
      currentUserId: 'u-1',

      // ── Navigation ─────────────────────────────────────────────────────────
      setCurrentPage: (slug) => set({ currentPageSlug: slug, currentViewId: null, openRowId: null }),
      setCurrentView: (viewId) => set({ currentViewId: viewId }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      openRow: (rowId, databaseId) => set({ openRowId: rowId, openDatabaseId: databaseId }),
      closeRow: () => set({ openRowId: null, openDatabaseId: null }),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      setNewPageModalOpen: (open) => set({ newPageModalOpen: open }),

      addPage: (title, iconName, iconColor) => {
        const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now().toString(36);
        const page: Page = {
          id: generateId('page'),
          workspace_id: get().workspace.id,
          title,
          icon: iconName,
          iconColor: iconColor ?? '#4f6fff',
          type: 'custom',
          position: get().pages.length,
          slug,
        };
        set((s) => ({ pages: [...s.pages, page] }));
        return page;
      },

      updatePage: (pageId, updates) => {
        set((s) => ({ pages: s.pages.map((p) => (p.id === pageId ? { ...p, ...updates } : p)) }));
      },

      toggleFavorite: (pageId) => {
        set((s) => ({ pages: s.pages.map((p) => (p.id === pageId ? { ...p, favorite: !p.favorite } : p)) }));
      },

      createDatabaseForPage: (pageId) => {
        // Return existing database if one already exists for this page
        const existing = Object.values(get().databases).find((d) => d.page_id === pageId);
        if (existing) return existing;

        const page = get().pages.find((p) => p.id === pageId);
        const dbId = generateId('db');
        const nameColId = generateId('col');
        const statusColId = generateId('col');
        const dateColId = generateId('col');
        const viewId = generateId('view');
        const now = new Date().toISOString();
        const uid = get().currentUserId;

        const mkRow = (pos: number): Row => ({
          id: generateId('row'), database_id: dbId, position: pos,
          created_by: uid, created_at: now, updated_at: now, cells: {},
        });

        const db: Database = {
          id: dbId,
          page_id: pageId,
          name: page?.title ?? 'Table',
          columns: [
            { id: nameColId,   database_id: dbId, name: 'Name',   type: 'text',   position: 0, config: {}, hidden: false, width: 280 },
            { id: statusColId, database_id: dbId, name: 'Status', type: 'status', position: 1, config: {}, hidden: false, width: 150 },
            { id: dateColId,   database_id: dbId, name: 'Date',   type: 'date',   position: 2, config: {}, hidden: false, width: 130 },
          ],
          rows: [mkRow(0), mkRow(1), mkRow(2)],
          views: [
            { id: viewId, database_id: dbId, name: 'Table', type: 'table', icon: '☰', filters: [], sorts: [], hidden_cols: [], is_default: true },
          ],
          default_view: 'table',
        };

        set((s) => ({ databases: { ...s.databases, [dbId]: db } }));
        return db;
      },

      // ── Rows ───────────────────────────────────────────────────────────────
      addRow: (databaseId) => {
        const db = get().databases[databaseId];
        const now = new Date().toISOString();
        const newRow: Row = {
          id: generateId('row'),
          database_id: databaseId,
          position: db.rows.length,
          created_by: get().currentUserId,
          created_at: now,
          updated_at: now,
          cells: {},
        };
        set((s) => ({
          databases: {
            ...s.databases,
            [databaseId]: {
              ...db,
              rows: [...db.rows, newRow],
            },
          },
        }));
        return newRow;
      },

      updateCell: (databaseId, rowId, columnId, value) => {
        set((s) => {
          const db = s.databases[databaseId];
          if (!db) return s;
          const rows = db.rows.map((r) =>
            r.id === rowId
              ? { ...r, cells: { ...r.cells, [columnId]: value }, updated_at: new Date().toISOString() }
              : r
          );
          return { databases: { ...s.databases, [databaseId]: { ...db, rows } } };
        });
      },

      deleteRow: (databaseId, rowId) => {
        set((s) => {
          const db = s.databases[databaseId];
          if (!db) return s;
          return {
            databases: {
              ...s.databases,
              [databaseId]: { ...db, rows: db.rows.filter((r) => r.id !== rowId) },
            },
          };
        });
      },

      duplicateRow: (databaseId, rowId) => {
        set((s) => {
          const db = s.databases[databaseId];
          if (!db) return s;
          const orig = db.rows.find((r) => r.id === rowId);
          if (!orig) return s;
          const now = new Date().toISOString();
          const dup: Row = { ...orig, id: generateId('row'), position: orig.position + 0.5, created_at: now, updated_at: now };
          const rows = [...db.rows, dup].sort((a, b) => a.position - b.position).map((r, i) => ({ ...r, position: i }));
          return { databases: { ...s.databases, [databaseId]: { ...db, rows } } };
        });
      },

      reorderRows: (databaseId, fromIndex, toIndex) => {
        set((s) => {
          const db = s.databases[databaseId];
          if (!db) return s;
          const rows = [...db.rows];
          const [moved] = rows.splice(fromIndex, 1);
          rows.splice(toIndex, 0, moved);
          const reindexed = rows.map((r, i) => ({ ...r, position: i }));
          return { databases: { ...s.databases, [databaseId]: { ...db, rows: reindexed } } };
        });
      },

      // ── Columns ────────────────────────────────────────────────────────────
      addColumn: (databaseId, col) => {
        set((s) => {
          const db = s.databases[databaseId];
          if (!db) return s;
          const newCol: Column = { ...col, id: generateId('col'), database_id: databaseId };
          return {
            databases: {
              ...s.databases,
              [databaseId]: { ...db, columns: [...db.columns, newCol] },
            },
          };
        });
      },

      updateColumn: (databaseId, columnId, updates) => {
        set((s) => {
          const db = s.databases[databaseId];
          if (!db) return s;
          const columns = db.columns.map((c) => (c.id === columnId ? { ...c, ...updates } : c));
          return { databases: { ...s.databases, [databaseId]: { ...db, columns } } };
        });
      },

      addColumnOption: (databaseId, columnId, label) => {
        const palette = ['#1c75bc', '#2ee89a', '#a78bfa', '#fb923c', '#f472b6', '#00d2ff', '#f5c518', '#ff4f6a', '#60a5fa', '#2dd4bf'];
        set((s) => {
          const db = s.databases[databaseId];
          if (!db) return s;
          const columns = db.columns.map((c) => {
            if (c.id !== columnId) return c;
            const options = c.config.options ?? [];
            if (options.some((o) => o.label.toLowerCase() === label.toLowerCase())) return c;
            const newOpt = { id: generateId('opt'), label, color: palette[options.length % palette.length] };
            return { ...c, config: { ...c.config, options: [...options, newOpt] } };
          });
          return { databases: { ...s.databases, [databaseId]: { ...db, columns } } };
        });
      },

      deleteColumn: (databaseId, columnId) => {
        set((s) => {
          const db = s.databases[databaseId];
          if (!db) return s;
          const columns = db.columns.filter((c) => c.id !== columnId);
          const rows = db.rows.map((r) => {
            const cells = { ...r.cells };
            delete cells[columnId];
            return { ...r, cells };
          });
          return { databases: { ...s.databases, [databaseId]: { ...db, columns, rows } } };
        });
      },

      reorderColumns: (databaseId, fromIndex, toIndex) => {
        set((s) => {
          const db = s.databases[databaseId];
          if (!db) return s;
          const cols = [...db.columns];
          const [moved] = cols.splice(fromIndex, 1);
          cols.splice(toIndex, 0, moved);
          const reindexed = cols.map((c, i) => ({ ...c, position: i }));
          return { databases: { ...s.databases, [databaseId]: { ...db, columns: reindexed } } };
        });
      },

      resizeColumn: (databaseId, columnId, width) => {
        set((s) => {
          const db = s.databases[databaseId];
          if (!db) return s;
          const columns = db.columns.map((c) => (c.id === columnId ? { ...c, width: Math.max(80, Math.min(400, width)) } : c));
          return { databases: { ...s.databases, [databaseId]: { ...db, columns } } };
        });
      },

      // ── Views ──────────────────────────────────────────────────────────────
      addView: (databaseId, view) => {
        const newView: ViewConfig = { ...view, id: generateId('view') };
        set((s) => {
          const db = s.databases[databaseId];
          if (!db) return s;
          return {
            databases: {
              ...s.databases,
              [databaseId]: { ...db, views: [...db.views, newView] },
            },
          };
        });
        return newView;
      },

      updateView: (databaseId, viewId, updates) => {
        set((s) => {
          const db = s.databases[databaseId];
          if (!db) return s;
          const views = db.views.map((v) => (v.id === viewId ? { ...v, ...updates } : v));
          return { databases: { ...s.databases, [databaseId]: { ...db, views } } };
        });
      },

      deleteView: (databaseId, viewId) => {
        set((s) => {
          const db = s.databases[databaseId];
          if (!db) return s;
          return {
            databases: {
              ...s.databases,
              [databaseId]: { ...db, views: db.views.filter((v) => v.id !== viewId) },
            },
          };
        });
      },

      setFilter: (databaseId, viewId, filters) => {
        get().updateView(databaseId, viewId, { filters });
      },

      setSort: (databaseId, viewId, sorts) => {
        get().updateView(databaseId, viewId, { sorts });
      },

      // ── Comments ───────────────────────────────────────────────────────────
      addComment: (rowId, body) => {
        const newComment: Comment = {
          id: generateId('cm'),
          row_id: rowId,
          user_id: get().currentUserId,
          body,
          created_at: new Date().toISOString(),
        };
        set((s) => ({ comments: [...s.comments, newComment] }));
      },

      // ── Notifications ──────────────────────────────────────────────────────
      markNotificationRead: (notificationId) => {
        set((s) => ({
          notifications: s.notifications.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
        }));
      },

      markAllNotificationsRead: () => {
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) }));
      },

      // ── Auth / Access ──────────────────────────────────────────────────────
      signUp: (name, email, password) => {
        const e = email.trim().toLowerCase();
        if (!name.trim() || !e || !password) return { ok: false, error: 'Please fill in every field.' };
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return { ok: false, error: 'Enter a valid email address.' };
        if (password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };
        if (get().accounts.some((a) => a.email.toLowerCase() === e)) return { ok: false, error: 'An account with this email already exists.' };
        const initials = name.trim().split(/\s+/).map((w) => w[0]).join('').toUpperCase().slice(0, 2);
        const palette = ['#1c75bc', '#2ee89a', '#a78bfa', '#fb923c', '#f472b6', '#00d2ff', '#f5c518', '#ff4f6a'];
        const acc: Account = {
          id: generateId('acc'),
          name: name.trim(),
          email: e,
          password,
          approved: false,
          role: 'viewer',
          initials,
          color: palette[get().accounts.length % palette.length],
          created_at: new Date().toISOString(),
        };
        set((s) => ({ accounts: [...s.accounts, acc], sessionAccountId: acc.id }));
        return { ok: true };
      },

      signIn: (email, password) => {
        const e = email.trim().toLowerCase();
        const acc = get().accounts.find((a) => a.email.toLowerCase() === e);
        if (!acc || acc.password !== password) return { ok: false, error: 'Incorrect email or password.' };
        set({ sessionAccountId: acc.id });
        return { ok: true };
      },

      signOut: () => set({ sessionAccountId: null }),

      approveAccount: (id) => set((s) => ({ accounts: s.accounts.map((a) => (a.id === id ? { ...a, approved: true, role: a.role === 'viewer' ? 'member' : a.role } : a)) })),
      revokeAccount: (id) => set((s) => ({ accounts: s.accounts.map((a) => (a.id === id ? { ...a, approved: false } : a)) })),
      deleteAccount: (id) => set((s) => ({
        accounts: s.accounts.filter((a) => a.id !== id),
        sessionAccountId: s.sessionAccountId === id ? null : s.sessionAccountId,
      })),

      // ── Users & Workspace ──────────────────────────────────────────────────
      updateUser: (userId, updates) => {
        set((s) => ({ users: s.users.map((u) => (u.id === userId ? { ...u, ...updates } : u)) }));
      },
      updateWorkspace: (updates) => {
        set((s) => ({ workspace: { ...s.workspace, ...updates } }));
      },
      addMember: (member) => {
        const newUser: User = { ...member, id: generateId('user'), workspace_id: get().workspace.id };
        set((s) => ({ users: [...s.users, newUser] }));
      },
      removeMember: (userId) => {
        set((s) => ({ users: s.users.filter((u) => u.id !== userId) }));
      },

      // ── Pages ──────────────────────────────────────────────────────────────
      reorderPages: (fromIndex, toIndex) => {
        set((s) => {
          const pages = [...s.pages];
          const [moved] = pages.splice(fromIndex, 1);
          pages.splice(toIndex, 0, moved);
          return { pages: pages.map((p, i) => ({ ...p, position: i })) };
        });
      },

      movePage: (draggedId, targetId) => {
        set((s) => {
          if (draggedId === targetId) return s;
          const pages = [...s.pages].sort((a, b) => a.position - b.position);
          const from = pages.findIndex((p) => p.id === draggedId);
          const to = pages.findIndex((p) => p.id === targetId);
          if (from === -1 || to === -1) return s;
          const [moved] = pages.splice(from, 1);
          const insertAt = pages.findIndex((p) => p.id === targetId);
          pages.splice(insertAt, 0, moved);
          return { pages: pages.map((p, i) => ({ ...p, position: i })) };
        });
      },
    }),
    {
      name: 'appercept-space-store-v11',
      partialize: (state) => ({
        databases: state.databases,
        pages: state.pages,
        users: state.users,
        workspace: state.workspace,
        accounts: state.accounts,
        sessionAccountId: state.sessionAccountId,
        comments: state.comments,
        activities: state.activities,
        notifications: state.notifications,
        sidebarCollapsed: state.sidebarCollapsed,
        currentUserId: state.currentUserId,
      }),
      // Always merge seed databases & pages over persisted data so new
      // entries added in seed.ts are never silently missing after a deploy.
      merge: (persisted: unknown, current) => {
        const p = persisted as Partial<AppState>;
        const persistedPages = p.pages ?? [];
        const persistedAccounts = p.accounts ?? [];
        return {
          ...current,
          ...p,
          // Start from seed so newly-shipped seed databases always appear,
          // then let persisted data win so the user's edits (columns, rows,
          // renames) AND user-created databases are preserved.
          databases: { ...DATABASES, ...(p.databases ?? {}) },
          // Seed pages keep their slot/order but adopt any persisted edits
          // (rename/icon/colour); user-created pages are appended after.
          pages: [
            ...PAGES.map((sp) => persistedPages.find((pp) => pp.id === sp.id) ?? sp),
            ...persistedPages.filter((pp) => !PAGES.some((sp) => sp.id === pp.id)),
          ],
          // Seed accounts (admin always exists) with persisted state, plus signups.
          accounts: [
            ...ACCOUNTS.map((sa) => persistedAccounts.find((pa) => pa.id === sa.id) ?? sa),
            ...persistedAccounts.filter((pa) => !ACCOUNTS.some((sa) => sa.id === pa.id)),
          ],
          sessionAccountId: p.sessionAccountId ?? null,
        };
      },
    }
  )
);

// ── Selectors ─────────────────────────────────────────────────────────────────
export const useCurrentDatabase = () => {
  const { currentPageSlug, databases, pages } = useAppStore();
  const page = pages.find((p) => p.slug === currentPageSlug);
  if (!page) return null;
  const dbId = Object.values(databases).find((db) => db.page_id === page.id)?.id;
  return dbId ? databases[dbId] : null;
};

export const useCurrentView = () => {
  const { currentViewId, databases, currentPageSlug, pages } = useAppStore();
  const page = pages.find((p) => p.slug === currentPageSlug);
  if (!page) return null;
  const db = Object.values(databases).find((db) => db.page_id === page.id);
  if (!db) return null;
  return db.views.find((v) => v.id === currentViewId) ?? db.views[0] ?? null;
};

export const useUsers = () => useAppStore((s) => s.users);
export const useWorkspace = () => useAppStore((s) => s.workspace);
export const useCurrentAccount = () =>
  useAppStore((s) => s.accounts.find((a) => a.id === s.sessionAccountId) ?? null);

export const useUnreadNotifications = () =>
  useAppStore((s) => s.notifications.filter((n) => !n.read).length);
