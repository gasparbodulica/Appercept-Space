import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Database, Row, Column, CellValue, Comment, Activity, Notification, Page, ViewConfig, Filter, Sort, User, Workspace, Account, Channel, ChatMessage, PortalMessage, AbsenceEntry, TeamRole, ProjectShare } from './types';
import { DATABASES, PAGES, USERS, WORKSPACE, COMMENTS, ACTIVITIES, NOTIFICATIONS, ACCOUNTS, CHANNELS, CHAT_MESSAGES, PORTAL_MESSAGES, TEAM_ROLES, PROJECT_SHARES, REMOVED_DEMO_EMAILS, REMOVED_DEMO_USER_IDS, REMOVED_DEMO_ROLE_IDS } from './seed';
import { isSupabaseConfigured } from './supabase';
import { signOutSupabase, registerInviteToken } from './auth';

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
  justSignedIn: boolean; // transient — triggers the welcome screen, not persisted
  authChecked: boolean;  // transient — true once the real (Supabase) session has been resolved
  pendingInvites: { email: string; name: string; role: 'admin' | 'member' | 'viewer' }[];
  inviteLinks: { token: string; createdAt: string; expiresAt: string; usedCount: number }[];

  // Messaging
  channels: Channel[];
  chatMessages: ChatMessage[];

  // Client portal Q&A
  portalMessages: PortalMessage[];
  portalReadAt: Record<string, string>; // clientName → ISO timestamp last read by team
  portalColors: Record<string, string>; // company name → custom accent colour

  // Monthly revenue snapshots — saved once per month when the dashboard loads.
  revenueSnapshots: Array<{
    ym: string;       // 'YYYY-MM'
    label: string;    // 'June 2026'
    upfront: number;
    monthly: number;
    clubs: number;
    consulting: number;
    costs: number;
    profit: number;
    forecastRevenue: number;
  }>;

  // Revenue sharing
  teamRoles: TeamRole[];
  projectShares: ProjectShare[];
  companyRetentionPct: number; // % the company keeps (default 30)

  // Forecast assumptions (editable predictions layered on the real run-rate)
  forecastAssumptions: { monthlyConsulting: number; quarterlyGrowthPct: number; annualTarget: number };

  // Team availability
  absences: AbsenceEntry[];

  // UI state
  currentPageSlug: string;
  currentViewId: string | null;
  sidebarCollapsed: boolean;
  sidebarNavOrder: string[];
  mobileNavOpen: boolean; // transient — the slide-in sidebar drawer on phones
  openRowId: string | null;
  openDatabaseId: string | null;
  commandPaletteOpen: boolean;
  newPageModalOpen: boolean;
  currentUserId: string;

  // Actions — navigation
  setCurrentPage: (slug: string) => void;
  setCurrentView: (viewId: string) => void;
  toggleSidebar: () => void;
  setMobileNavOpen: (open: boolean) => void;
  setSidebarNavOrder: (order: string[]) => void;
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
  updateColumnOption: (databaseId: string, columnId: string, optionId: string, updates: { label?: string; color?: string }) => void;
  deleteColumnOption: (databaseId: string, columnId: string, optionId: string) => void;
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
  signInLocalFirst: (email: string, password: string) => { ok: boolean };
  loginAsLocalAdmin: () => void;
  signOut: () => void;
  clearJustSignedIn: () => void;
  // Real (Supabase) auth bridge — set the signed-in user from the live session
  setAuthedAccount: (account: Account | null, justSignedIn?: boolean) => void;
  setAuthChecked: (v: boolean) => void;
  addPendingInvite: (invite: { email: string; name: string; role: 'admin' | 'member' | 'viewer' }) => void;
  removePendingInvite: (email: string) => void;
  generateInviteLink: () => string;
  revokeInviteLink: (token: string) => void;
  consumeInviteLink: (token: string) => boolean;
  saveRevenueSnapshot: (snap: AppState['revenueSnapshots'][number]) => void;
  changePassword: (currentPassword: string, newPassword: string) => { ok: boolean; error?: string };
  resetPassword: (email: string, newPassword: string) => { ok: boolean; error?: string };
  // Email-code reset flow
  requestResetCode: (email: string) => { ok: boolean; error?: string; code?: string; name?: string };
  confirmReset: (email: string, code: string, newPassword: string) => { ok: boolean; error?: string };
  approveAccount: (id: string) => void;
  setAccountRole: (id: string, role: 'admin' | 'member' | 'viewer') => void;
  approveAsClient: (id: string, company: string) => void;
  revokeAccount: (id: string) => void;
  mergeSupabaseAccounts: (incoming: Account[]) => void;
  deleteAccount: (id: string) => void;
  createAccount: (name: string, email: string, password: string, role: 'member' | 'viewer' | 'client', clientCompany?: string) => { ok: boolean; error?: string };

  // Actions — messaging
  sendMessage: (channelId: string, body: string, extra?: { attachment?: ChatMessage['attachment']; dbref?: ChatMessage['dbref'] }) => void;
  createChannel: (name: string, memberIds: string[], opts?: { description?: string; emoji?: string; color?: string }) => Channel;
  createOrOpenDM: (userId: string) => Channel;
  createGroupChat: (memberIds: string[], name?: string) => Channel;
  addChannelMember: (channelId: string, userId: string) => void;
  removeChannelMember: (channelId: string, userId: string) => void;
  renameChannel: (channelId: string, name: string) => void;
  updateChannel: (channelId: string, updates: Partial<Pick<Channel, 'name' | 'emoji' | 'color' | 'description'>>) => void;
  deleteChannel: (channelId: string) => void;

  // Actions — client portal
  addPortalMessage: (client: string, body: string, from?: 'client' | 'team') => void;
  markPortalRead: (client: string) => void;
  setPortalColor: (company: string, color: string) => void;
  renameClientCompany: (oldName: string, newName: string) => void;
  deleteClientCompany: (company: string) => void;

  // Actions — revenue sharing
  addTeamRole: (role: Omit<TeamRole, 'id' | 'created_at'>) => void;
  updateTeamRole: (id: string, updates: Partial<Omit<TeamRole, 'id' | 'created_at'>>) => void;
  deleteTeamRole: (id: string) => void;
  setCompanyRetentionPct: (pct: number) => void;
  setForecastAssumptions: (updates: Partial<AppState['forecastAssumptions']>) => void;
  addProjectShare: (share: Omit<ProjectShare, 'id' | 'created_at'>) => void;
  deleteProjectShare: (id: string) => void;

  // Actions — absences
  addAbsence: (entry: Omit<AbsenceEntry, 'id' | 'created_at'>) => void;
  deleteAbsence: (id: string) => void;

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

// Transient store of password-reset codes (in-memory; cleared on reload).
const resetCodes: Record<string, { code: string; expires: number }> = {};

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
      justSignedIn: false,
      authChecked: !isSupabaseConfigured,
      pendingInvites: [],
      inviteLinks: [],
      revenueSnapshots: [],
      channels: CHANNELS,
      chatMessages: CHAT_MESSAGES,
      portalMessages: PORTAL_MESSAGES,
      portalReadAt: {},
      portalColors: {},
      teamRoles: TEAM_ROLES,
      projectShares: PROJECT_SHARES,
      companyRetentionPct: 30,
      forecastAssumptions: { monthlyConsulting: 0, quarterlyGrowthPct: 0, annualTarget: 100000 },
      absences: [],
      comments: COMMENTS,
      activities: ACTIVITIES,
      notifications: NOTIFICATIONS,
      currentPageSlug: 'todo',
      currentViewId: null,
      sidebarCollapsed: false,
      mobileNavOpen: false,
      sidebarNavOrder: ['home', 'messages', 'client-portal', 'revenue-split'],
      openRowId: null,
      openDatabaseId: null,
      commandPaletteOpen: false,
      newPageModalOpen: false,
      currentUserId: 'u-1',

      // ── Navigation ─────────────────────────────────────────────────────────
      setCurrentPage: (slug) => set({ currentPageSlug: slug, currentViewId: null, openRowId: null }),
      setCurrentView: (viewId) => set({ currentViewId: viewId }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
      setSidebarNavOrder: (order) => set({ sidebarNavOrder: order }),
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
          const nowISO = new Date().toISOString();
          const rows = db.rows.map((r) =>
            r.id === rowId
              ? { ...r, cells: { ...r.cells, [columnId]: value }, updated_at: nowISO }
              : r
          );
          const nextDatabases = { ...s.databases, [databaseId]: { ...db, rows } };

          // When a CLIENT is set to "Past", auto-end payment on their connected
          // projects (set "End of payment" to today) so the calculation stops and
          // there's a record of when it ended.
          if (databaseId === 'db-clients' && String(value) === 'Past') {
            const statusCol = db.columns.find((c) => c.name === 'Status');
            const companyCol = db.columns.find((c) => c.name === 'Company');
            if (statusCol && statusCol.id === columnId && companyCol) {
              const clientRow = rows.find((r) => r.id === rowId);
              const company = String(clientRow?.cells[companyCol.id] ?? '').toLowerCase().trim();
              const projDb = nextDatabases['db-projects'];
              const endCol = projDb?.columns.find((c) => c.id === 'pc-end');
              const projClientCol = projDb?.columns.find((c) => c.name === 'Client' || c.id === 'pc-client');
              if (company && projDb && endCol && projClientCol) {
                const today = nowISO.slice(0, 10);
                const matches = (a: string, b: string) => { a = a.toLowerCase().trim(); b = b.toLowerCase().trim(); return !!a && !!b && (a === b || a.includes(b) || b.includes(a)); };
                const projRows = projDb.rows.map((pr) => {
                  const pc = String(pr.cells[projClientCol.id] ?? '');
                  const hasEnd = String(pr.cells[endCol.id] ?? '').trim() !== '';
                  return matches(pc, company) && !hasEnd
                    ? { ...pr, cells: { ...pr.cells, [endCol.id]: today }, updated_at: nowISO }
                    : pr;
                });
                nextDatabases['db-projects'] = { ...projDb, rows: projRows };
              }
            }
          }

          return { databases: nextDatabases };
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

      updateColumnOption: (databaseId, columnId, optionId, updates) => {
        set((s) => {
          const db = s.databases[databaseId];
          if (!db) return s;
          const columns = db.columns.map((c) => {
            if (c.id !== columnId) return c;
            const options = (c.config.options ?? []).map((o) => o.id === optionId ? { ...o, ...updates } : o);
            return { ...c, config: { ...c.config, options } };
          });
          return { databases: { ...s.databases, [databaseId]: { ...db, columns } } };
        });
      },

      deleteColumnOption: (databaseId, columnId, optionId) => {
        set((s) => {
          const db = s.databases[databaseId];
          if (!db) return s;
          const columns = db.columns.map((c) => {
            if (c.id !== columnId) return c;
            const options = (c.config.options ?? []).filter((o) => o.id !== optionId);
            return { ...c, config: { ...c.config, options } };
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
        // Trigger the welcome screen only when entering with an approved account
        set({ sessionAccountId: acc.id, justSignedIn: acc.approved });
        return { ok: true };
      },

      // Emergency owner login — ALWAYS works, independent of the persisted store.
      // Ensures the seed admin exists, then logs in. Used by the AuthScreen bypass
      // so the owner can never be locked out of their own workspace.
      loginAsLocalAdmin: () => {
        // Wipe any stale Supabase session so its remembered token can't wake up
        // later and override this local admin login (which booted us before).
        if (isSupabaseConfigured) void signOutSupabase();
        set((s) => {
          const seedAdmin = ACCOUNTS.find((a) => a.id === 'acc-admin');
          if (!seedAdmin) return {};
          const exists = s.accounts.some((a) => a.id === 'acc-admin');
          const accounts = exists
            ? s.accounts.map((a) => a.id === 'acc-admin' ? { ...a, password: seedAdmin.password, role: seedAdmin.role, approved: true } : a)
            : [seedAdmin, ...s.accounts];
          return { accounts, sessionAccountId: 'acc-admin', justSignedIn: true, authChecked: true };
        });
      },

      // Try a LOCAL account login first (built-in admins / seed accounts). Works
      // even when Supabase is connected, and clears any stale Supabase session so
      // the bridge can't override it. Returns ok=false if no local match.
      signInLocalFirst: (email, password) => {
        const e = email.trim().toLowerCase();
        const acc = get().accounts.find((a) => a.email.toLowerCase() === e);
        if (!acc || acc.password !== password) return { ok: false };
        if (isSupabaseConfigured) void signOutSupabase();
        set({ sessionAccountId: acc.id, justSignedIn: acc.approved, authChecked: true });
        return { ok: true };
      },

      signOut: () => { if (isSupabaseConfigured) void signOutSupabase(); set({ sessionAccountId: null, justSignedIn: false }); },

      // Real (Supabase) auth bridge
      setAuthedAccount: (account, justSignedIn = false) => set((s) => {
        if (!account) return { sessionAccountId: null, justSignedIn: false };
        const others = s.accounts.filter((a) => a.id !== account.id);
        // Once the welcome screen is showing (justSignedIn=true) don't let a
        // follow-up auth event (TOKEN_REFRESHED, INITIAL_SESSION, etc.) reset it —
        // only clearJustSignedIn() may do that after the 3-second timer fires.
        return { accounts: [account, ...others], sessionAccountId: account.id, justSignedIn: s.justSignedIn || justSignedIn };
      }),
      setAuthChecked: (v) => set({ authChecked: v }),
      clearJustSignedIn: () => set({ justSignedIn: false }),
      addPendingInvite: (invite: { email: string; name: string; role: 'admin' | 'member' | 'viewer' }) => set((s) => ({ pendingInvites: [...s.pendingInvites.filter(i => i.email.toLowerCase() !== invite.email.toLowerCase()), invite] })),
      removePendingInvite: (email: string) => set((s) => ({ pendingInvites: s.pendingInvites.filter(i => i.email.toLowerCase() !== email.toLowerCase()) })),
      generateInviteLink: () => {
        const token = Array.from(crypto.getRandomValues(new Uint8Array(18))).map(b => b.toString(16).padStart(2, '0')).join('');
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 7 * 24 * 3600 * 1000).toISOString();
        set((s) => ({ inviteLinks: [...s.inviteLinks, { token, createdAt: now.toISOString(), expiresAt, usedCount: 0 }] }));
        // Register in Supabase so the token can be validated when the invitee signs
        // up on their own browser (local inviteLinks only exist in the owner's store).
        if (isSupabaseConfigured) void registerInviteToken(token, expiresAt);
        return token;
      },
      revokeInviteLink: (token: string) => set((s) => ({ inviteLinks: s.inviteLinks.filter(l => l.token !== token) })),
      consumeInviteLink: (token: string) => {
        const links = useAppStore.getState().inviteLinks;
        const link = links.find(l => l.token === token && new Date(l.expiresAt) > new Date());
        if (!link) return false;
        set((s) => ({ inviteLinks: s.inviteLinks.map(l => l.token === token ? { ...l, usedCount: l.usedCount + 1 } : l) }));
        return true;
      },
      saveRevenueSnapshot: (snap) => set((s) => {
        const existing = s.revenueSnapshots.filter(r => r.ym !== snap.ym);
        return { revenueSnapshots: [...existing, snap].sort((a, b) => a.ym.localeCompare(b.ym)).slice(-18) };
      }),

      changePassword: (currentPassword, newPassword) => {
        const acc = get().accounts.find((a) => a.id === get().sessionAccountId);
        if (!acc) return { ok: false, error: 'No account is signed in.' };
        if (acc.password !== currentPassword) return { ok: false, error: 'Current password is incorrect.' };
        if (newPassword.length < 6) return { ok: false, error: 'New password must be at least 6 characters.' };
        if (newPassword === currentPassword) return { ok: false, error: 'New password must be different.' };
        set((s) => ({ accounts: s.accounts.map((a) => (a.id === acc.id ? { ...a, password: newPassword } : a)) }));
        return { ok: true };
      },

      resetPassword: (email, newPassword) => {
        const e = email.trim().toLowerCase();
        const acc = get().accounts.find((a) => a.email.toLowerCase() === e);
        if (!acc) return { ok: false, error: 'No account found with that email.' };
        if (newPassword.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };
        set((s) => ({ accounts: s.accounts.map((a) => (a.id === acc.id ? { ...a, password: newPassword } : a)) }));
        return { ok: true };
      },

      requestResetCode: (email) => {
        const e = email.trim().toLowerCase();
        const acc = get().accounts.find((a) => a.email.toLowerCase() === e);
        if (!acc) return { ok: false, error: 'No account found with that email.' };
        const code = String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
        resetCodes[e] = { code, expires: Date.now() + 15 * 60 * 1000 }; // 15 min
        return { ok: true, code, name: acc.name };
      },

      confirmReset: (email, code, newPassword) => {
        const e = email.trim().toLowerCase();
        const entry = resetCodes[e];
        if (!entry) return { ok: false, error: 'Request a code first.' };
        if (Date.now() > entry.expires) { delete resetCodes[e]; return { ok: false, error: 'Code expired — request a new one.' }; }
        if (entry.code !== code.trim()) return { ok: false, error: 'Incorrect code.' };
        if (newPassword.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };
        const acc = get().accounts.find((a) => a.email.toLowerCase() === e);
        if (!acc) return { ok: false, error: 'No account found.' };
        set((s) => ({ accounts: s.accounts.map((a) => (a.id === acc.id ? { ...a, password: newPassword } : a)) }));
        delete resetCodes[e];
        return { ok: true };
      },

      approveAccount: (id) => set((s) => ({ accounts: s.accounts.map((a) => (a.id === id ? { ...a, approved: true, role: a.role === 'viewer' || a.role === 'client' ? 'member' : a.role, client_company: undefined } : a)) })),
      setAccountRole: (id, role) => set((s) => ({ accounts: s.accounts.map((a) => (a.id === id ? { ...a, role } : a)) })),
      approveAsClient: (id, company) => set((s) => ({ accounts: s.accounts.map((a) => (a.id === id ? { ...a, approved: true, role: 'client', client_company: company } : a)) })),
      revokeAccount: (id) => set((s) => ({ accounts: s.accounts.map((a) => (a.id === id ? { ...a, approved: false } : a)) })),
      // Merge real Supabase profiles into the accounts list (admin approval UI),
      // deduped by email. A live Supabase row (UUID id) wins over a seed/local
      // placeholder for the same email so approvals act on the real account.
      mergeSupabaseAccounts: (incoming) => set((s) => {
        const sid = s.sessionAccountId;
        const activeAccount = s.accounts.find((a) => a.id === sid);
        const byEmail = new Map<string, Account>();
        for (const a of s.accounts) byEmail.set(a.email.toLowerCase(), a);
        for (const a of incoming) {
          const key = a.email.toLowerCase();
          const existing = byEmail.get(key);
          // NEVER replace the account we're currently logged in as — doing so
          // orphans the session (sessionAccountId points to an id that no longer
          // exists) and instantly logs the user out. This was the Access-tab logout.
          if (existing && existing.id === sid) continue;
          // Otherwise prefer the incoming Supabase row (real UUID, authoritative).
          if (!existing || existing.id.startsWith('acc-')) byEmail.set(key, a);
        }
        const result = Array.from(byEmail.values());
        // Safety net: guarantee the active session account is always present.
        if (sid && activeAccount && !result.some((a) => a.id === sid)) result.push(activeAccount);
        return { accounts: result };
      }),
      deleteAccount: (id) => set((s) => ({
        accounts: s.accounts.filter((a) => a.id !== id),
        sessionAccountId: s.sessionAccountId === id ? null : s.sessionAccountId,
      })),

      createAccount: (name, email, password, role, clientCompany) => {
        const existing = get().accounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
        if (existing) return { ok: false, error: 'An account with this email already exists.' };
        if (!name.trim() || !email.trim() || !password.trim()) return { ok: false, error: 'Name, email and password are required.' };
        const initials = name.trim().split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
        const colors = ['#4f6fff', '#3ecf8e', '#a78bfa', '#2dd4bf', '#f472b6', '#fb923c', '#f5c518', '#60a5fa', '#ff5c5c'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const acc: Account = {
          id: generateId('acc'),
          name: name.trim(), email: email.trim().toLowerCase(), password: password.trim(),
          approved: true, role,
          client_company: role === 'client' ? clientCompany : undefined,
          initials, color,
          created_at: new Date().toISOString(),
        };
        set((s) => ({ accounts: [...s.accounts, acc] }));
        return { ok: true };
      },

      // ── Messaging ──────────────────────────────────────────────────────────
      sendMessage: (channelId, body, extra) => {
        const text = body.trim();
        if (!text && !extra?.attachment && !extra?.dbref) return;
        const msg: ChatMessage = {
          id: generateId('msg'),
          channel_id: channelId,
          sender_id: get().currentUserId,
          body: text,
          created_at: new Date().toISOString(),
          attachment: extra?.attachment,
          dbref: extra?.dbref,
        };
        set((s) => ({ chatMessages: [...s.chatMessages, msg] }));
      },

      createChannel: (name, memberIds, opts) => {
        const me = get().currentUserId;
        const members = Array.from(new Set([me, ...memberIds]));
        const colors = ['#1c75bc', '#2ee89a', '#a78bfa', '#fb923c', '#f472b6', '#00d2ff'];
        const channel: Channel = {
          id: generateId('ch'),
          kind: 'channel',
          name: name.trim() || 'New channel',
          description: opts?.description,
          emoji: opts?.emoji ?? 'IconMessage',
          color: opts?.color ?? colors[get().channels.length % colors.length],
          member_ids: members,
          created_by: me,
          created_at: new Date().toISOString(),
        };
        set((s) => ({ channels: [...s.channels, channel] }));
        return channel;
      },

      createOrOpenDM: (userId) => {
        const me = get().currentUserId;
        const existing = get().channels.find(
          (c) => c.kind === 'dm' && c.member_ids.length === 2 && c.member_ids.includes(me) && c.member_ids.includes(userId)
        );
        if (existing) return existing;
        const dm: Channel = {
          id: generateId('ch'),
          kind: 'dm',
          name: '',
          member_ids: [me, userId],
          created_by: me,
          created_at: new Date().toISOString(),
        };
        set((s) => ({ channels: [...s.channels, dm] }));
        return dm;
      },

      createGroupChat: (memberIds, name) => {
        const me = get().currentUserId;
        const members = Array.from(new Set([me, ...memberIds]));
        // A 2-person chat is just a 1:1 DM
        if (members.length === 2) return get().createOrOpenDM(members.find((id) => id !== me)!);
        // Reuse an existing group chat with the exact same members
        const sortedKey = [...members].sort().join(',');
        const existing = get().channels.find(
          (c) => c.kind === 'dm' && [...c.member_ids].sort().join(',') === sortedKey
        );
        if (existing) return existing;
        const dm: Channel = {
          id: generateId('ch'),
          kind: 'dm',
          name: name?.trim() ?? '',
          member_ids: members,
          created_by: me,
          created_at: new Date().toISOString(),
        };
        set((s) => ({ channels: [...s.channels, dm] }));
        return dm;
      },

      addChannelMember: (channelId, userId) => {
        set((s) => ({
          channels: s.channels.map((c) =>
            c.id === channelId && !c.member_ids.includes(userId)
              ? { ...c, member_ids: [...c.member_ids, userId] }
              : c
          ),
        }));
      },

      removeChannelMember: (channelId, userId) => {
        set((s) => ({
          channels: s.channels.map((c) =>
            c.id === channelId ? { ...c, member_ids: c.member_ids.filter((id) => id !== userId) } : c
          ),
        }));
      },

      renameChannel: (channelId, name) => {
        set((s) => ({ channels: s.channels.map((c) => (c.id === channelId ? { ...c, name: name.trim() } : c)) }));
      },

      updateChannel: (channelId, updates) => {
        set((s) => ({ channels: s.channels.map((c) => (c.id === channelId ? { ...c, ...updates } : c)) }));
      },

      // ── Client portal ──────────────────────────────────────────────────────
      addPortalMessage: (client, body, from = 'team') => {
        const text = body.trim();
        if (!text) return;
        const msg: PortalMessage = {
          id: generateId('pm'),
          client,
          from,
          sender_id: from === 'team' ? get().currentUserId : undefined,
          body: text,
          created_at: new Date().toISOString(),
        };
        set((s) => ({ portalMessages: [...s.portalMessages, msg] }));
      },

      markPortalRead: (client) => set((s) => ({ portalReadAt: { ...s.portalReadAt, [client]: new Date().toISOString() } })),

      setPortalColor: (company, color) => set((s) => ({ portalColors: { ...s.portalColors, [company]: color } })),

      // Rename a client company everywhere it's referenced (Clients DB rows,
      // portal messages, read state, colours, and client logins).
      renameClientCompany: (oldName, newName) => set((s) => {
        const clean = newName.trim();
        if (!clean || clean === oldName) return {};
        const clientsDb = Object.values(s.databases).find((d) => d.id === 'db-clients'
          || (d.columns.some((c) => c.name === 'Company') && d.columns.some((c) => c.name === 'Status')));
        const databases = { ...s.databases };
        if (clientsDb) {
          const compCol = clientsDb.columns.find((c) => c.name === 'Company');
          if (compCol) {
            databases[clientsDb.id] = {
              ...clientsDb,
              rows: clientsDb.rows.map((r) =>
                String(r.cells[compCol.id] ?? '') === oldName
                  ? { ...r, cells: { ...r.cells, [compCol.id]: clean } }
                  : r),
            };
          }
        }
        const portalColors = { ...s.portalColors };
        if (portalColors[oldName] !== undefined) { portalColors[clean] = portalColors[oldName]; delete portalColors[oldName]; }
        const portalReadAt = { ...s.portalReadAt };
        if (portalReadAt[oldName] !== undefined) { portalReadAt[clean] = portalReadAt[oldName]; delete portalReadAt[oldName]; }
        return {
          databases,
          portalColors,
          portalReadAt,
          portalMessages: s.portalMessages.map((m) => m.client === oldName ? { ...m, client: clean } : m),
          accounts: s.accounts.map((a) => a.client_company === oldName ? { ...a, client_company: clean } : a),
        };
      }),

      // Delete a client portal: remove its Clients DB rows, messages, and colour.
      // Client login accounts are kept (manage them in Settings → Access).
      deleteClientCompany: (company) => set((s) => {
        const clientsDb = Object.values(s.databases).find((d) => d.id === 'db-clients'
          || (d.columns.some((c) => c.name === 'Company') && d.columns.some((c) => c.name === 'Status')));
        const databases = { ...s.databases };
        if (clientsDb) {
          const compCol = clientsDb.columns.find((c) => c.name === 'Company');
          if (compCol) {
            databases[clientsDb.id] = {
              ...clientsDb,
              rows: clientsDb.rows.filter((r) => String(r.cells[compCol.id] ?? '') !== company),
            };
          }
        }
        const portalColors = { ...s.portalColors }; delete portalColors[company];
        const portalReadAt = { ...s.portalReadAt }; delete portalReadAt[company];
        return {
          databases,
          portalColors,
          portalReadAt,
          portalMessages: s.portalMessages.filter((m) => m.client !== company),
        };
      }),

      // ── Absences ───────────────────────────────────────────────────────────
      addAbsence: (entry) => {
        const absence: AbsenceEntry = { ...entry, id: generateId('abs'), created_at: new Date().toISOString() };
        set((s) => ({ absences: [...s.absences, absence] }));
      },
      deleteAbsence: (id) => set((s) => ({ absences: s.absences.filter((a) => a.id !== id) })),

      // ── Revenue sharing ────────────────────────────────────────────────────
      addTeamRole: (role) => {
        const newRole: TeamRole = { ...role, id: generateId('tr'), created_at: new Date().toISOString() };
        set((s) => ({ teamRoles: [...s.teamRoles, newRole] }));
      },
      updateTeamRole: (id, updates) => set((s) => ({ teamRoles: s.teamRoles.map((r) => r.id === id ? { ...r, ...updates } : r) })),
      deleteTeamRole: (id) => set((s) => ({ teamRoles: s.teamRoles.filter((r) => r.id !== id) })),
      setCompanyRetentionPct: (pct) => set({ companyRetentionPct: Math.max(0, Math.min(100, pct)) }),
      setForecastAssumptions: (updates) => set((s) => ({ forecastAssumptions: { ...s.forecastAssumptions, ...updates } })),
      addProjectShare: (share) => {
        const newShare: ProjectShare = { ...share, id: generateId('ps'), created_at: new Date().toISOString() };
        set((s) => ({ projectShares: [newShare, ...s.projectShares] }));
      },
      deleteProjectShare: (id) => set((s) => ({ projectShares: s.projectShares.filter((p) => p.id !== id) })),

      deleteChannel: (channelId) => {
        set((s) => ({
          channels: s.channels.filter((c) => c.id !== channelId),
          chatMessages: s.chatMessages.filter((m) => m.channel_id !== channelId),
        }));
      },

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
        // Remove the workspace user AND their revenue-split role (linked by user_id),
        // so a removed member disappears from the dashboard and Revenue everywhere.
        set((s) => ({
          users: s.users.filter((u) => u.id !== userId),
          teamRoles: s.teamRoles.filter((r) => r.user_id !== userId),
        }));
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
      name: 'appercept-space-store-v12',
      partialize: (state) => ({
        databases: state.databases,
        pages: state.pages,
        users: state.users,
        workspace: state.workspace,
        accounts: state.accounts,
        sessionAccountId: state.sessionAccountId,
        channels: state.channels,
        chatMessages: state.chatMessages,
        portalMessages: state.portalMessages,
        portalReadAt: state.portalReadAt,
        portalColors: state.portalColors,
        teamRoles: state.teamRoles,
        projectShares: state.projectShares,
        companyRetentionPct: state.companyRetentionPct,
        forecastAssumptions: state.forecastAssumptions,
        absences: state.absences,
        comments: state.comments,
        activities: state.activities,
        notifications: state.notifications,
        sidebarCollapsed: state.sidebarCollapsed,
        sidebarNavOrder: state.sidebarNavOrder,
        currentUserId: state.currentUserId,
        pendingInvites: state.pendingInvites,
        inviteLinks: state.inviteLinks,
        revenueSnapshots: state.revenueSnapshots,
      }),
      // Always merge seed databases & pages over persisted data so new
      // entries added in seed.ts are never silently missing after a deploy.
      merge: (persisted: unknown, current) => {
        const p = persisted as Partial<AppState>;
        const persistedPages = p.pages ?? [];
        const persistedAccounts = p.accounts ?? [];

        // Start from seed so newly-shipped seed databases always appear,
        // then let persisted data win so the user's edits are preserved.
        const mergedDatabases = { ...DATABASES, ...(p.databases ?? {}) };

        // Upgrade the Passwords db: mark the Password column as type 'password'
        // (so it gets the masked + eye-toggle UI) and swap any leftover dot
        // placeholders for the real demo passwords from seed.
        const pwDb = mergedDatabases['db-passwords'];
        if (pwDb) {
          const seedPw = DATABASES['db-passwords'];
          const pwCol = pwDb.columns.find((c) => c.name === 'Password');
          const seedPwColId = seedPw?.columns.find((c) => c.name === 'Password')?.id;
          const seedByRow: Record<string, string> = {};
          if (seedPwColId) seedPw.rows.forEach((r) => { seedByRow[r.id] = String(r.cells[seedPwColId] ?? ''); });
          mergedDatabases['db-passwords'] = {
            ...pwDb,
            columns: pwDb.columns.map((c) => (c.name === 'Password' ? { ...c, type: 'password' as const } : c)),
            rows: pwDb.rows.map((r) => {
              if (!pwCol) return r;
              const v = String(r.cells[pwCol.id] ?? '');
              if (/^[•·]+$/.test(v) && seedByRow[r.id]) {
                return { ...r, cells: { ...r.cells, [pwCol.id]: seedByRow[r.id] } };
              }
              return r;
            }),
          };
        }

        // Strip client companies from Companies DB — keep only own legal entities.
        // Removes: (a) original seed client rows by ID, (b) any row-* rows whose
        // name matches a company in the Clients DB (added by the old ClientPortalSync).
        const OLD_CLIENT_COR_IDS = new Set(['cor-1','cor-3','cor-4','cor-5','cor-6','cor-7','cor-8']);
        const coDb = mergedDatabases['db-companies'];
        if (coDb) {
          const clientsDbForMigration = mergedDatabases['db-clients'];
          const ccCompColId = clientsDbForMigration?.columns.find(c => c.name === 'Company')?.id;
          const normStr = (s: string) => s.toLowerCase().replace(/\s+(d\.o\.o\.|j\.d\.o\.o\.|obrt)\.?$/, '').trim();
          const clientCompanyNames = new Set(
            (clientsDbForMigration?.rows ?? [])
              .map(r => ccCompColId ? normStr(String(r.cells[ccCompColId] ?? '')) : '')
              .filter(Boolean)
          );
          const coNameColId = coDb.columns.find(c => c.position === 0)?.id ?? 'coc-name';
          mergedDatabases['db-companies'] = {
            ...coDb,
            rows: coDb.rows.filter((r) => {
              if (OLD_CLIENT_COR_IDS.has(r.id)) return false;
              const name = normStr(String(r.cells[coNameColId] ?? ''));
              if (name && clientCompanyNames.has(name)) return false;
              return true;
            }),
          };
        }

        // Upgrade Files DB views to include type-filtered views if still on the old single-view setup
        const filesDb = mergedDatabases['db-files'];
        if (filesDb && filesDb.views.length === 1 && filesDb.views[0].id === 'fv-all') {
          mergedDatabases['db-files'] = { ...filesDb, views: DATABASES['db-files'].views };
        }

        // Migrate ClubCrowd DB to the new revenue (fee-per-reservation) schema.
        // The old schema had a 'clc-plan' column; if it's still there, replace
        // the whole DB with the new seed (columns + rows) since the model changed.
        let ccDb = mergedDatabases['db-clubcrowd'];
        if (ccDb && ccDb.columns.some((c) => c.id === 'clc-plan')) {
          mergedDatabases['db-clubcrowd'] = DATABASES['db-clubcrowd'];
          ccDb = mergedDatabases['db-clubcrowd'];
        } else if (ccDb) {
          // Already on the new schema but the Status pipeline options may be old
          // (Active/Inactive/Onboarding). Refresh the Status column config to the
          // new pipeline (Lead/Onboarding/Active/Past) without touching rows.
          const statusCol = ccDb.columns.find((c) => c.id === 'clc-status');
          const hasLead = statusCol?.config.options?.some((o) => o.label === 'Lead');
          if (statusCol && !hasLead) {
            const seedStatusCol = DATABASES['db-clubcrowd'].columns.find((c) => c.id === 'clc-status');
            mergedDatabases['db-clubcrowd'] = {
              ...ccDb,
              columns: ccDb.columns.map((c) => (c.id === 'clc-status' && seedStatusCol ? { ...c, config: seedStatusCol.config } : c)),
            };
            ccDb = mergedDatabases['db-clubcrowd'];
          }
        }

        // Costs status → exactly Active / Past (drives whether a cost is still paid).
        const costsDbM = mergedDatabases['db-costs'];
        if (costsDbM) {
          const seedCostStatus = DATABASES['db-costs'].columns.find((c) => c.id === 'costc-status');
          const costStatus = costsDbM.columns.find((c) => c.id === 'costc-status');
          const labels = costStatus?.config.options?.map((o) => o.label).sort().join(',') ?? '';
          if (costStatus && seedCostStatus && labels !== 'Active,Past') {
            mergedDatabases['db-costs'] = {
              ...costsDbM,
              columns: costsDbM.columns.map((c) => (c.id === 'costc-status' ? { ...c, config: seedCostStatus.config } : c)),
            };
          }
        }

        // Add the 'Operating season' column if missing, defaulting existing rows
        // to Year-round (needed to calculate real yearly revenue per club).
        if (ccDb && !ccDb.columns.some((c) => c.id === 'clc-season')) {
          const seedSeasonCol = DATABASES['db-clubcrowd'].columns.find((c) => c.id === 'clc-season');
          if (seedSeasonCol) {
            // Insert season after avg-spend (position 4), bump later columns by 1
            const cols = ccDb.columns.map((c) => (c.position >= 5 ? { ...c, position: c.position + 1 } : c));
            mergedDatabases['db-clubcrowd'] = {
              ...ccDb,
              columns: [...cols, { ...seedSeasonCol, database_id: ccDb.id }].sort((a, b) => a.position - b.position),
              rows: ccDb.rows.map((r) => ({ ...r, cells: { ...r.cells, 'clc-season': r.cells['clc-season'] ?? 'Year-round' } })),
            };
            ccDb = mergedDatabases['db-clubcrowd'];
          }
        }

        // Clear the FAKE seed Stripe IDs (acct_1Qx*) that were shipped earlier —
        // no club has actually connected yet. Only touches these known demo IDs,
        // never real Stripe accounts (acct_1...) the user connects later.
        if (ccDb) {
          const FAKE_STRIPE = /^acct_1Qx/;
          const touched = ccDb.rows.some((r) => FAKE_STRIPE.test(String(r.cells['clc-stripe-id'] ?? '')));
          if (touched) {
            mergedDatabases['db-clubcrowd'] = {
              ...ccDb,
              rows: ccDb.rows.map((r) => {
                if (!FAKE_STRIPE.test(String(r.cells['clc-stripe-id'] ?? ''))) return r;
                return { ...r, cells: { ...r.cells, 'clc-stripe-id': '', 'clc-stripe-st': 'Disconnected' } };
              }),
            };
          }
        }

        // Team & Roles DB was merged into the Team & Revenue page — drop it.
        delete mergedDatabases['db-team'];

        // Migrate Clients DB: revenue is derived from Projects DB now — strip any
        // editable revenue columns (old Revenue/Frequency and the short-lived
        // cc-upfront/cc-monthly) so there's no double-typing or double-counting.
        const clientsDbM = mergedDatabases['db-clients'];
        if (clientsDbM && clientsDbM.columns.some(c => ['cc-revenue', 'cc-frequency', 'cc-upfront', 'cc-monthly'].includes(c.id))) {
          mergedDatabases['db-clients'] = {
            ...clientsDbM,
            columns: clientsDbM.columns.filter(c => !['cc-revenue', 'cc-frequency', 'cc-upfront', 'cc-monthly'].includes(c.id)),
          };
        }

        // Migrate projects: always ensure Upfront (€) and Monthly (€) columns exist
        // with the canonical IDs the finance engine reads. Also drops the old Budget column.
        // SAFE: never deletes existing columns or cell values — just adds missing canonical ones.
        const projDb = mergedDatabases['db-projects'];
        if (projDb) {
          const hasBudget  = projDb.columns.some(c => c.id === 'pc-budget');
          const hasUpfront = projDb.columns.some(c => c.id === 'pc-upfront');
          const hasMonthly = projDb.columns.some(c => c.id === 'pc-monthly');
          if (hasBudget || !hasUpfront || !hasMonthly) {
            mergedDatabases['db-projects'] = {
              ...projDb,
              columns: [
                ...projDb.columns
                  .filter(c => c.id !== 'pc-budget')
                  .map(c => c.id === 'pc-priority' ? { ...c, position: 8 } : c),
                ...(!hasUpfront ? [{ id: 'pc-upfront', database_id: 'db-projects', name: 'Upfront (€)', type: 'number' as const, position: 6, config: { prefix: '€' }, hidden: false, width: 120 }] : []),
                ...(!hasMonthly ? [{ id: 'pc-monthly', database_id: 'db-projects', name: 'Monthly (€)', type: 'number' as const, position: 7, config: { prefix: '€' }, hidden: false, width: 120 }] : []),
              ],
            };
          }
          // Rename the date columns to "Start of payment" / "End of payment".
          const pdb = mergedDatabases['db-projects'];
          if (pdb.columns.some(c => (c.id === 'pc-start' && c.name !== 'Start of payment') || (c.id === 'pc-end' && c.name !== 'End of payment'))) {
            mergedDatabases['db-projects'] = {
              ...pdb,
              columns: pdb.columns.map(c =>
                c.id === 'pc-start' ? { ...c, name: 'Start of payment' } :
                c.id === 'pc-end'   ? { ...c, name: 'End of payment' } : c,
              ),
            };
          }
        }

        return {
          ...current,
          ...p,
          // Workspace (incl. uploaded logo) is always preserved across loads.
          // If the store version bumped and wiped the persisted workspace, recover
          // the logo from the version-independent localStorage key.
          workspace: (() => {
            const base = p.workspace ?? current.workspace;
            if (!base.logo_url && typeof window !== 'undefined') {
              const saved = localStorage.getItem('appercept-logo');
              if (saved) return { ...base, logo_url: saved };
            }
            return base;
          })(),
          databases: mergedDatabases,
          // Strip demo team members everywhere (workspace users + revenue roles),
          // by ID so re-adding people later is never blocked.
          // Keep persisted user edits, drop demo users, AND always include any
          // seed team members (e.g. Karlo, Bruno) that aren't persisted yet — so
          // built-in team accounts show up everywhere (messaging, person columns).
          users: (() => {
            const persistedUsers = (p.users ?? []).filter((u) => !REMOVED_DEMO_USER_IDS.includes(u.id));
            const missingSeed = USERS.filter((su) => !persistedUsers.some((pu) => pu.id === su.id));
            return persistedUsers.length > 0 ? [...persistedUsers, ...missingSeed] : USERS;
          })(),
          // Clean channels: drop the demo DM, strip removed demo users from every
          // channel's member list (they were inflating the member count and showing
          // empty avatar slots), drop channels left with no real members, and make
          // sure a General channel exists containing the whole real team.
          channels: (() => {
            const teamIds = USERS.map((u) => u.id);
            const src = (p.channels ?? CHANNELS).filter((c) => c.id !== 'ch-dm-u2');
            let cleaned = src
              .map((c) => ({ ...c, member_ids: c.member_ids.filter((id) => !REMOVED_DEMO_USER_IDS.includes(id)) }))
              .filter((c) => c.member_ids.length > 0);
            if (!cleaned.some((c) => c.id === 'ch-general')) cleaned = [CHANNELS[0], ...cleaned];
            cleaned = cleaned.map((c) => c.id === 'ch-general'
              ? { ...c, member_ids: Array.from(new Set([...c.member_ids, ...teamIds])) }
              : c);
            return cleaned;
          })(),
          teamRoles: (p.teamRoles ?? current.teamRoles).filter((r) => !REMOVED_DEMO_ROLE_IDS.includes(r.id)),
          // Seed pages keep their slot/order but adopt any persisted edits
          // (rename/icon/colour); user-created pages are appended after.
          // 'p-team' is explicitly dropped — the Team & Roles DB was removed.
          pages: [
            ...PAGES.map((sp) => { const pp = persistedPages.find((pp) => pp.id === sp.id) ?? sp; return { ...pp, badge: sp.badge }; }),
            ...persistedPages.filter((pp) => pp.id !== 'p-team' && !PAGES.some((sp) => sp.id === pp.id)),
          ],
          // Seed admin + persisted accounts, with the old demo accounts stripped
          // and deduped by email (a real Supabase UUID account wins over the seed
          // placeholder for the same email).
          accounts: (() => {
            const demo = new Set(REMOVED_DEMO_EMAILS.map((e) => e.toLowerCase()));
            const base = [
              // For seed accounts (incl. the admin), keep any persisted edits like name/
              // avatar, but ALWAYS force the seed password, role and approval — so the
              // built-in admin can always log in with the seed credentials even if an old
              // store had a different password saved.
              ...ACCOUNTS.map((sa) => {
                const pa = persistedAccounts.find((pa) => pa.id === sa.id);
                return pa ? { ...pa, password: sa.password, role: sa.role, approved: sa.approved } : sa;
              }),
              ...persistedAccounts.filter((pa) => !ACCOUNTS.some((sa) => sa.id === pa.id)),
            ].filter((a) => !demo.has(a.email.toLowerCase()));
            const byEmail = new Map<string, typeof base[number]>();
            for (const a of base) {
              const key = a.email.toLowerCase();
              const existing = byEmail.get(key);
              // Prefer a real (non-seed) account id over the 'acc-…' placeholder
              if (!existing || (existing.id.startsWith('acc-') && !a.id.startsWith('acc-'))) byEmail.set(key, a);
            }
            return Array.from(byEmail.values());
          })(),
          sessionAccountId: p.sessionAccountId ?? null,
          pendingInvites: p.pendingInvites ?? [],
          inviteLinks: p.inviteLinks ?? [],
          revenueSnapshots: p.revenueSnapshots ?? [],
          // Pre-mark seed portal clients as read so demo messages never show as
          // unread on a fresh install. Persisted read-stamps win if they exist.
          portalReadAt: (() => {
            const base = p.portalReadAt ?? {};
            const merged = { ...base };
            for (const msg of PORTAL_MESSAGES) {
              if (!merged[msg.client]) merged[msg.client] = '2099-01-01T00:00:00Z';
            }
            return merged;
          })(),
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

/** Total unread portal messages from clients (only counts `from === 'client'` messages newer than the team's last read timestamp). */
export const useUnreadPortalCount = () =>
  useAppStore((s) => {
    let total = 0;
    const uniqueClients = Array.from(new Set(s.portalMessages.map((m) => m.client)));
    for (const client of uniqueClients) {
      const lastRead = s.portalReadAt[client] ?? '1970-01-01T00:00:00Z';
      total += s.portalMessages.filter((m) => m.client === client && m.from === 'client' && m.created_at > lastRead).length;
    }
    return total;
  });

/** Count of accounts waiting for admin approval. */
export const usePendingApprovalCount = () =>
  useAppStore((s) => s.accounts.filter((a) => !a.approved).length);
