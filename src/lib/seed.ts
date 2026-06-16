import { Column, Row, Database, Page, User, Workspace, ViewConfig, Comment, Activity, Notification, Account, Channel, ChatMessage, PortalMessage } from './types';

// ─── Seed Data ───────────────────────────────────────────────────────────────

export const WORKSPACE: Workspace = {
  id: 'ws-1',
  name: "Appercept's Space",
  slug: 'appercept',
  created_at: '2026-01-01T00:00:00Z',
};

export const USERS: User[] = [
  { id: 'u-1',     workspace_id: 'ws-1', name: 'Gašpar Bodulica', email: 'gbodulica@appercept.net', role: 'admin', initials: 'GB', color: '#4f6fff' },
  { id: 'u-karlo', workspace_id: 'ws-1', name: 'Karlo Časni',     email: 'kcasni@appercept.net',  role: 'admin', initials: 'KČ', color: '#3ecf8e' },
  { id: 'u-bruno', workspace_id: 'ws-1', name: 'Bruno Vujčec',    email: 'bvujcec@appercept.net', role: 'admin', initials: 'BV', color: '#a78bfa' },
];

// Per-user PRIVATE To-Do — one page+database each, only visible to its owner
const PRIVATE_TODO_PAGES: Page[] = USERS.map((u, i) => ({
  id: `p-ptodo-${u.id}`,
  workspace_id: 'ws-1',
  title: 'My To-Do',
  icon: 'IconCircleCheck',
  iconColor: '#00d2ff',
  type: 'custom',
  position: 100 + i,
  slug: `my-todo-${u.id}`,
  owner_id: u.id,
}));

export const PAGES: Page[] = [
  { id: 'p-todo', workspace_id: 'ws-1', title: 'To-Do', icon: 'IconCheckbox', iconColor: '#1c75bc', type: 'todo', position: 1, slug: 'todo', is_active: true },
  { id: 'p-clients', workspace_id: 'ws-1', title: 'Clients', icon: 'IconUsers', iconColor: '#2ee89a', type: 'clients', position: 2, slug: 'clients' },
  { id: 'p-projects', workspace_id: 'ws-1', title: 'Projects', icon: 'IconFolderOpen', iconColor: '#a78bfa', type: 'projects', position: 3, slug: 'projects' },
  { id: 'p-consulting', workspace_id: 'ws-1', title: 'Consulting', icon: 'IconBriefcase', iconColor: '#00d2ff', type: 'custom', position: 4, slug: 'consulting' },
  { id: 'p-meetings', workspace_id: 'ws-1', title: 'Meetings', icon: 'IconCalendar', iconColor: '#fb923c', type: 'meetings', position: 6, slug: 'meetings' },
  { id: 'p-companies', workspace_id: 'ws-1', title: 'Companies', icon: 'IconBuildingFactory2', iconColor: '#60a5fa', type: 'companies', position: 7, slug: 'companies' },
  { id: 'p-costs', workspace_id: 'ws-1', title: 'P&L Account', icon: 'IconCurrencyEuro', iconColor: '#f5c518', type: 'costs', position: 8, slug: 'costs' },
  { id: 'p-cashflow', workspace_id: 'ws-1', title: 'Cash Flow Statement', icon: 'IconArrowsExchange', iconColor: '#2dd4bf', type: 'custom', position: 8.1, slug: 'cashflow' },
  { id: 'p-balance', workspace_id: 'ws-1', title: 'Balance Sheet', icon: 'IconScale', iconColor: '#60a5fa', type: 'custom', position: 8.2, slug: 'balance-sheet' },
  { id: 'p-forecast', workspace_id: 'ws-1', title: 'Forecast', icon: 'IconChartLine', iconColor: '#3ecf8e', type: 'custom', position: 8.3, slug: 'forecast' },
  { id: 'p-files', workspace_id: 'ws-1', title: 'Files', icon: 'IconFolder', iconColor: '#6b7280', type: 'files', position: 9, slug: 'files' },
  { id: 'p-passwords', workspace_id: 'ws-1', title: 'Passwords', icon: 'IconLock', iconColor: '#ff4f6a', type: 'passwords', position: 10, slug: 'passwords' },
  { id: 'p-clubcrowd', workspace_id: 'ws-1', title: 'ClubCrowd Clients', icon: 'IconMusic', iconColor: '#f472b6', type: 'clubcrowd', position: 11, slug: 'clubcrowd' },
  ...PRIVATE_TODO_PAGES,
];

// Build a private To-Do database for each user
function makePrivateTodoDb(userId: string): Database {
  const dbId = `db-ptodo-${userId}`;
  const cols: Column[] = [
    { id: `${dbId}-task`,     database_id: dbId, name: 'Task',     type: 'text',     position: 0, config: {}, hidden: false, width: 300 },
    { id: `${dbId}-status`,   database_id: dbId, name: 'Status',   type: 'status',   position: 1, config: {}, hidden: false, width: 140 },
    { id: `${dbId}-priority`, database_id: dbId, name: 'Priority', type: 'priority', position: 2, config: {}, hidden: false, width: 120 },
    { id: `${dbId}-due`,      database_id: dbId, name: 'Due date', type: 'date',     position: 3, config: {}, hidden: false, width: 130 },
    { id: `${dbId}-done`,     database_id: dbId, name: 'Done',     type: 'checkbox', position: 4, config: {}, hidden: false, width: 80 },
  ];
  const rows: Row[] = [];
  return {
    id: dbId, page_id: `p-ptodo-${userId}`, name: 'My To-Do',
    columns: cols, rows,
    views: [{ id: `${dbId}-view`, database_id: dbId, name: 'My Tasks', type: 'table', icon: '☰', filters: [], sorts: [], hidden_cols: [], is_default: true }],
    default_view: 'table',
  };
}

const PRIVATE_TODO_DATABASES: Record<string, Database> = Object.fromEntries(
  USERS.map((u) => [`db-ptodo-${u.id}`, makePrivateTodoDb(u.id)])
);

// ─── TO-DO DATABASE ──────────────────────────────────────────────────────────
const TODO_COLS: Column[] = [
  { id: 'tc-name', database_id: 'db-todo', name: 'Task name', type: 'text', position: 0, config: {}, hidden: false, width: 280 },
  { id: 'tc-status', database_id: 'db-todo', name: 'Status', type: 'status', position: 1, config: {}, hidden: false, width: 130 },
  { id: 'tc-assignee', database_id: 'db-todo', name: 'Assignee', type: 'person', position: 2, config: {}, hidden: false, width: 140 },
  { id: 'tc-due', database_id: 'db-todo', name: 'Due date', type: 'date', position: 3, config: {}, hidden: false, width: 120 },
  { id: 'tc-priority', database_id: 'db-todo', name: 'Priority', type: 'priority', position: 4, config: {}, hidden: false, width: 100 },
  { id: 'tc-tags', database_id: 'db-todo', name: 'Task type', type: 'tags', position: 5, config: {}, hidden: false, width: 180 },
  { id: 'tc-desc', database_id: 'db-todo', name: 'Description', type: 'text', position: 6, config: {}, hidden: false, width: 200 },
];

const TODO_VIEWS: ViewConfig[] = [
  { id: 'tv-all', database_id: 'db-todo', name: 'All Tasks', type: 'table', icon: '⭐', filters: [], sorts: [], hidden_cols: [], is_default: true },
  { id: 'tv-board', database_id: 'db-todo', name: 'By Status', type: 'board', icon: '⊞', filters: [], sorts: [], hidden_cols: [] },
  { id: 'tv-my', database_id: 'db-todo', name: 'My Tasks', type: 'list', icon: '👤', filters: [{ id: 'f-my', column_id: 'tc-assignee', operator: 'is_me', value: null }], sorts: [{ column_id: 'tc-due', direction: 'asc' }], hidden_cols: [] },
];

const TODO_ROWS: Row[] = [];

// ─── CLIENTS DATABASE ─────────────────────────────────────────────────────────
const CLIENT_COLS: Column[] = [
  { id: 'cc-name', database_id: 'db-clients', name: 'Name', type: 'text', position: 0, config: {}, hidden: false, width: 200 },
  { id: 'cc-company', database_id: 'db-clients', name: 'Company', type: 'text', position: 1, config: {}, hidden: false, width: 180 },
  { id: 'cc-email', database_id: 'db-clients', name: 'Email', type: 'email', position: 2, config: {}, hidden: false, width: 200 },
  { id: 'cc-phone', database_id: 'db-clients', name: 'Phone', type: 'phone', position: 3, config: {}, hidden: false, width: 140 },
  { id: 'cc-status', database_id: 'db-clients', name: 'Status', type: 'select', position: 4, config: { options: [{ id: 'o1', label: 'Active', color: '#3ecf8e' }, { id: 'o2', label: 'Pending', color: '#f5a623' }, { id: 'o3', label: 'Inactive', color: '#6b7280' }] }, hidden: false, width: 100 },
  { id: 'cc-notes', database_id: 'db-clients', name: 'Notes', type: 'text', position: 5, config: {}, hidden: false, width: 240 },
];

const CLIENT_ROWS: Row[] = [];

// ─── PROJECTS DATABASE ────────────────────────────────────────────────────────
const PROJECT_COLS: Column[] = [
  { id: 'pc-name',     database_id: 'db-projects', name: 'Project name',  type: 'text',     position: 0, config: {},               hidden: false, width: 240 },
  { id: 'pc-client',   database_id: 'db-projects', name: 'Client',        type: 'text',     position: 1, config: {},               hidden: false, width: 160 },
  { id: 'pc-status',   database_id: 'db-projects', name: 'Status',        type: 'status',   position: 2, config: {},               hidden: false, width: 130 },
  { id: 'pc-progress', database_id: 'db-projects', name: 'Progress',      type: 'number',   position: 3, config: { suffix: '%' },  hidden: false, width: 100 },
  { id: 'pc-start',    database_id: 'db-projects', name: 'Start of payment', type: 'date',  position: 4, config: {},               hidden: false, width: 140 },
  { id: 'pc-end',      database_id: 'db-projects', name: 'End of payment',   type: 'date',  position: 5, config: {},               hidden: false, width: 140 },
  { id: 'pc-upfront',  database_id: 'db-projects', name: 'Upfront (€)',   type: 'number',   position: 6, config: { prefix: '€' },  hidden: false, width: 120 },
  { id: 'pc-monthly',  database_id: 'db-projects', name: 'Monthly (€)',   type: 'number',   position: 7, config: { prefix: '€' },  hidden: false, width: 120 },
  { id: 'pc-priority', database_id: 'db-projects', name: 'Priority',      type: 'priority', position: 8, config: {},               hidden: false, width: 100 },
];

const PROJECT_ROWS: Row[] = [];

// ─── MEETINGS DATABASE ────────────────────────────────────────────────────────
const MEETING_COLS: Column[] = [
  { id: 'mc-title', database_id: 'db-meetings', name: 'Title', type: 'text', position: 0, config: {}, hidden: false, width: 240 },
  { id: 'mc-client', database_id: 'db-meetings', name: 'Client', type: 'text', position: 1, config: {}, hidden: false, width: 160 },
  { id: 'mc-assignee', database_id: 'db-meetings', name: 'Assignee', type: 'person', position: 2, config: {}, hidden: false, width: 140 },
  { id: 'mc-date', database_id: 'db-meetings', name: 'Date & time', type: 'date', position: 3, config: {}, hidden: false, width: 160 },
  { id: 'mc-duration', database_id: 'db-meetings', name: 'Duration (min)', type: 'number', position: 4, config: {}, hidden: false, width: 120 },
  { id: 'mc-status', database_id: 'db-meetings', name: 'Status', type: 'status', position: 5, config: {}, hidden: false, width: 120 },
  { id: 'mc-notes', database_id: 'db-meetings', name: 'Notes', type: 'text', position: 6, config: {}, hidden: false, width: 240 },
  { id: 'mc-synced', database_id: 'db-meetings', name: 'Apple synced', type: 'checkbox', position: 7, config: {}, hidden: false, width: 100 },
];

const MEETING_ROWS: Row[] = [];

// ─── COMPANIES DATABASE ───────────────────────────────────────────────────────
const COMPANY_COLS: Column[] = [
  { id: 'coc-name', database_id: 'db-companies', name: 'Company name', type: 'text', position: 0, config: {}, hidden: false, width: 220 },
  { id: 'coc-industry', database_id: 'db-companies', name: 'Industry', type: 'multi_select', position: 1, config: { options: [{ id: 'i1', label: 'Healthcare', color: '#3ecf8e' }, { id: 'i2', label: 'AI Consulting', color: '#1c75bc' }, { id: 'i9', label: 'AI Voicebot', color: '#00d2ff' }, { id: 'i10', label: 'AI Chatbot', color: '#60a5fa' }, { id: 'i11', label: 'Process Automation', color: '#a78bfa' }, { id: 'i3', label: 'Media', color: '#f5a623' }, { id: 'i4', label: 'Music', color: '#a78bfa' }, { id: 'i5', label: 'Fitness', color: '#2dd4bf' }, { id: 'i6', label: 'Beauty', color: '#f472b6' }, { id: 'i7', label: 'E-commerce', color: '#fb923c' }, { id: 'i8', label: 'Education', color: '#6b7280' }] }, hidden: false, width: 220 },
  { id: 'coc-oib', database_id: 'db-companies', name: 'OIB', type: 'text', position: 2, config: {}, hidden: false, width: 130 },
  { id: 'coc-director', database_id: 'db-companies', name: 'Director', type: 'text', position: 3, config: {}, hidden: false, width: 160 },
  { id: 'coc-email', database_id: 'db-companies', name: 'Email', type: 'email', position: 4, config: {}, hidden: false, width: 200 },
  { id: 'coc-phone', database_id: 'db-companies', name: 'Phone', type: 'phone', position: 5, config: {}, hidden: false, width: 140 },
  { id: 'coc-address', database_id: 'db-companies', name: 'Address', type: 'text', position: 6, config: {}, hidden: false, width: 220 },
  { id: 'coc-revenue', database_id: 'db-companies', name: 'Monthly revenue', type: 'formula', position: 7, config: { formula: 'company_revenue', prefix: '€' }, hidden: false, width: 150 },
  { id: 'coc-profit', database_id: 'db-companies', name: 'Monthly profit', type: 'formula', position: 8, config: { formula: 'company_profit', prefix: '€' }, hidden: false, width: 150 },
];

const COMPANY_ROWS: Row[] = [
  { id: 'cor-appercept', database_id: 'db-companies', position: 0, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'coc-name': 'Appercept', 'coc-oib': '56594199654', 'coc-director': 'Gašpar Bodulica', 'coc-industry': ['AI Consulting', 'AI Voicebot', 'AI Chatbot', 'Process Automation'] } },
  { id: 'cor-2', database_id: 'db-companies', position: 1, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'coc-name': 'Egzosfera obrt', 'coc-oib': '56594199654', 'coc-director': 'Gašpar Bodulica', 'coc-industry': ['AI Consulting'] } },
];
// Note: keeping Appercept and Egzosfera obrt as these are the real companies.

// ─── COSTS DATABASE ───────────────────────────────────────────────────────────
const COST_COLS: Column[] = [
  { id: 'costc-item', database_id: 'db-costs', name: 'Expense', type: 'text', position: 0, config: {}, hidden: false, width: 240 },
  { id: 'costc-amount', database_id: 'db-costs', name: 'Amount', type: 'number', position: 1, config: { prefix: '€' }, hidden: false, width: 110 },
  { id: 'costc-date', database_id: 'db-costs', name: 'Date', type: 'date', position: 2, config: {}, hidden: false, width: 110 },
  { id: 'costc-status', database_id: 'db-costs', name: 'Status', type: 'status', position: 3, config: { options: [{ id: 'cost-active', label: 'Active', color: '#3ecf8e' }, { id: 'cost-past', label: 'Past', color: '#6b7280' }] }, hidden: false, width: 120 },
  { id: 'costc-category', database_id: 'db-costs', name: 'Category', type: 'select', position: 4, config: { options: [{ id: 'cat1', label: 'SaaS', color: '#4f6fff' }, { id: 'cat2', label: 'Freelance', color: '#a78bfa' }, { id: 'cat3', label: 'Tools', color: '#2dd4bf' }, { id: 'cat4', label: 'Tax', color: '#ff5c5c' }, { id: 'cat6', label: 'Marketing', color: '#fb923c' }, { id: 'cat7', label: 'Office', color: '#6b7280' }] }, hidden: false, width: 140 },
  { id: 'costc-company', database_id: 'db-costs', name: 'Company', type: 'select', position: 5, config: { options: [{ id: 'co-app', label: 'Appercept', color: '#1c75bc' }, { id: 'co-ml', label: 'Medikal Lux', color: '#3ecf8e' }, { id: 'co-pm', label: 'Papaya Music', color: '#a78bfa' }, { id: 'co-24', label: '24 Sata', color: '#f5a623' }, { id: 'co-gb', label: 'GymBros', color: '#2dd4bf' }, { id: 'co-bb', label: 'Backstage Beauty', color: '#f472b6' }, { id: 'co-ka', label: 'Kashetta', color: '#fb923c' }, { id: 'co-efzg', label: 'EFZG', color: '#6b7280' }] }, hidden: false, width: 150 },
  { id: 'costc-frequency', database_id: 'db-costs', name: 'Frequency', type: 'select', position: 6, config: { options: [{ id: 'fr-once', label: 'One-time', color: '#6b7280' }, { id: 'fr-month', label: 'Monthly', color: '#1c75bc' }, { id: 'fr-year', label: 'Yearly', color: '#a78bfa' }] }, hidden: false, width: 120 },
  { id: 'costc-notes', database_id: 'db-costs', name: 'Notes', type: 'text', position: 7, config: {}, hidden: false, width: 220 },
];

// Costs holds EXPENSES only. Revenue comes from the company's Monthly revenue.
const COST_ROWS: Row[] = [];

// ─── CASH FLOW STATEMENT ──────────────────────────────────────────────────────
const CASHFLOW_COLS: Column[] = [
  { id: 'cfc-item',    database_id: 'db-cashflow', name: 'Description', type: 'text',   position: 0, config: {}, hidden: false, width: 240 },
  { id: 'cfc-activity',database_id: 'db-cashflow', name: 'Activity',    type: 'select', position: 1, config: { options: [{ id: 'cfa-op', label: 'Operating', color: '#3ecf8e' }, { id: 'cfa-inv', label: 'Investing', color: '#a78bfa' }, { id: 'cfa-fin', label: 'Financing', color: '#f5a623' }] }, hidden: false, width: 130 },
  { id: 'cfc-dir',     database_id: 'db-cashflow', name: 'Direction',   type: 'select', position: 2, config: { options: [{ id: 'cfd-in', label: 'Inflow', color: '#3ecf8e' }, { id: 'cfd-out', label: 'Outflow', color: '#ff5c5c' }] }, hidden: false, width: 110 },
  { id: 'cfc-amount',  database_id: 'db-cashflow', name: 'Amount',      type: 'number', position: 3, config: { prefix: '€' }, hidden: false, width: 120 },
  { id: 'cfc-date',    database_id: 'db-cashflow', name: 'Date',        type: 'date',   position: 4, config: {}, hidden: false, width: 120 },
  { id: 'cfc-company', database_id: 'db-cashflow', name: 'Company',     type: 'select', position: 5, config: { options: [{ id: 'cfco-app', label: 'Appercept', color: '#1c75bc' }, { id: 'cfco-egz', label: 'Egzosfera obrt', color: '#2dd4bf' }] }, hidden: false, width: 140 },
  { id: 'cfc-notes',   database_id: 'db-cashflow', name: 'Notes',       type: 'text',   position: 6, config: {}, hidden: false, width: 220 },
];

// Operating cash flow is auto-derived from real revenue (Clients/Consulting/ClubCrowd)
// and real costs (Costs DB). This statement holds only NON-operating movements —
// Investing (equipment, asset purchases) and Financing (owner draws, loans).
const CASHFLOW_ROWS: Row[] = [];

// ─── BALANCE SHEET ────────────────────────────────────────────────────────────
const BALANCE_COLS: Column[] = [
  { id: 'bsc-item',   database_id: 'db-balance', name: 'Item',        type: 'text',   position: 0, config: {}, hidden: false, width: 240 },
  { id: 'bsc-cat',    database_id: 'db-balance', name: 'Category',    type: 'select', position: 1, config: { options: [{ id: 'bsc-asset', label: 'Asset', color: '#3ecf8e' }, { id: 'bsc-liab', label: 'Liability', color: '#ff5c5c' }, { id: 'bsc-eq', label: 'Equity', color: '#60a5fa' }] }, hidden: false, width: 120 },
  { id: 'bsc-type',   database_id: 'db-balance', name: 'Type',        type: 'select', position: 2, config: { options: [{ id: 'bst-cur', label: 'Current', color: '#2dd4bf' }, { id: 'bst-non', label: 'Non-current', color: '#a78bfa' }] }, hidden: false, width: 130 },
  { id: 'bsc-amount', database_id: 'db-balance', name: 'Amount',      type: 'number', position: 3, config: { prefix: '€' }, hidden: false, width: 120 },
  { id: 'bsc-date',   database_id: 'db-balance', name: 'As of',       type: 'date',   position: 4, config: {}, hidden: false, width: 120 },
  { id: 'bsc-notes',  database_id: 'db-balance', name: 'Notes',       type: 'text',   position: 5, config: {}, hidden: false, width: 220 },
];

const BALANCE_ROWS: Row[] = [];

// ─── PASSWORDS DATABASE ───────────────────────────────────────────────────────
const PASSWORD_COLS: Column[] = [
  { id: 'pwc-service', database_id: 'db-passwords', name: 'Service', type: 'text', position: 0, config: {}, hidden: false, width: 200 },
  { id: 'pwc-url', database_id: 'db-passwords', name: 'URL', type: 'url', position: 1, config: {}, hidden: false, width: 200 },
  { id: 'pwc-username', database_id: 'db-passwords', name: 'Username / Email', type: 'email', position: 2, config: {}, hidden: false, width: 200 },
  { id: 'pwc-password', database_id: 'db-passwords', name: 'Password', type: 'password', position: 3, config: {}, hidden: false, width: 170 },
  { id: 'pwc-notes', database_id: 'db-passwords', name: 'Notes', type: 'text', position: 4, config: {}, hidden: false, width: 220 },
  { id: 'pwc-tags', database_id: 'db-passwords', name: 'Tags', type: 'tags', position: 5, config: {}, hidden: false, width: 160 },
];

const PASSWORD_ROWS: Row[] = [];

// ─── CLUBCROWD DATABASE ───────────────────────────────────────────────────────
// Revenue model: Appercept takes a fee per table reservation (no subscription plans).
// Stripe Connect: each venue connects their Stripe account; fees flow automatically.
const CLUBCROWD_COLS: Column[] = [
  { id: 'clc-venue',       database_id: 'db-clubcrowd', name: 'Venue name',             type: 'text',   position: 0, config: {},                       hidden: false, width: 200 },
  { id: 'clc-city',        database_id: 'db-clubcrowd', name: 'City',                   type: 'text',   position: 1, config: {},                       hidden: false, width: 120 },
  { id: 'clc-contact',     database_id: 'db-clubcrowd', name: 'Contact info',           type: 'text',   position: 1.5, config: {},                     hidden: false, width: 220 },
  { id: 'clc-fee',         database_id: 'db-clubcrowd', name: 'Fee / reservation (€)',  type: 'number', position: 2, config: { prefix: '€' },           hidden: false, width: 160 },
  { id: 'clc-reservations',database_id: 'db-clubcrowd', name: 'Monthly reservations',   type: 'number', position: 3, config: {},                       hidden: false, width: 160 },
  { id: 'clc-avg-spend',   database_id: 'db-clubcrowd', name: 'Avg table spend (€)',    type: 'number', position: 4, config: { prefix: '€' },           hidden: false, width: 150 },
  { id: 'clc-season',      database_id: 'db-clubcrowd', name: 'Operating season',       type: 'select', position: 5, config: { options: [{ id: 'os12', label: 'Year-round', color: '#3ecf8e' }, { id: 'os9', label: '9 months', color: '#60a5fa' }, { id: 'os6', label: '6 months', color: '#f5a623' }, { id: 'os3', label: '3 months', color: '#f472b6' }] }, hidden: false, width: 150 },
  { id: 'clc-season-start', database_id: 'db-clubcrowd', name: 'Season starts',         type: 'select', position: 6, config: { options: [{ id: 'm1', label: 'January', color: '#6b7280' }, { id: 'm2', label: 'February', color: '#6b7280' }, { id: 'm3', label: 'March', color: '#3ecf8e' }, { id: 'm4', label: 'April', color: '#3ecf8e' }, { id: 'm5', label: 'May', color: '#f5a623' }, { id: 'm6', label: 'June', color: '#f5a623' }, { id: 'm7', label: 'July', color: '#f472b6' }, { id: 'm8', label: 'August', color: '#f472b6' }, { id: 'm9', label: 'September', color: '#60a5fa' }, { id: 'm10', label: 'October', color: '#60a5fa' }, { id: 'm11', label: 'November', color: '#a78bfa' }, { id: 'm12', label: 'December', color: '#a78bfa' }] }, hidden: false, width: 130 },
  { id: 'clc-stripe-id',   database_id: 'db-clubcrowd', name: 'Stripe Account ID',      type: 'text',   position: 7, config: {},                       hidden: false, width: 200 },
  { id: 'clc-stripe-st',   database_id: 'db-clubcrowd', name: 'Stripe status',          type: 'select', position: 8, config: { options: [{ id: 'ss1', label: 'Connected', color: '#3ecf8e' }, { id: 'ss2', label: 'Pending', color: '#f5a623' }, { id: 'ss3', label: 'Disconnected', color: '#ff5c5c' }] }, hidden: false, width: 130 },
  { id: 'clc-joined',      database_id: 'db-clubcrowd', name: 'Platform joined',        type: 'date',   position: 9, config: {},                       hidden: false, width: 130 },
  { id: 'clc-status',      database_id: 'db-clubcrowd', name: 'Status',                 type: 'select', position: 10, config: { options: [{ id: 'cs-lead', label: 'Lead', color: '#60a5fa' }, { id: 'cs-onb', label: 'Onboarding', color: '#f5a623' }, { id: 'cs-active', label: 'Active', color: '#3ecf8e' }, { id: 'cs-past', label: 'Past', color: '#6b7280' }] }, hidden: false, width: 110 },
  { id: 'clc-notes',       database_id: 'db-clubcrowd', name: 'Notes',                  type: 'text',   position: 11, config: {},                      hidden: false, width: 240 },
];

const CLUBCROWD_ROWS: Row[] = [];

// ─── TEAM DATABASE ────────────────────────────────────────────────────────────
// ─── FILES DATABASE ───────────────────────────────────────────────────────────
const FILE_COLS: Column[] = [
  { id: 'fc-name', database_id: 'db-files', name: 'File name', type: 'text', position: 0, config: {}, hidden: false, width: 260 },
  { id: 'fc-type', database_id: 'db-files', name: 'Type', type: 'select', position: 1, config: { options: [{ id: 'ft1', label: 'PDF', color: '#ff5c5c' }, { id: 'ft-pptx', label: 'PPTX', color: '#fb923c' }, { id: 'ft-docx', label: 'DOCX', color: '#4f6fff' }, { id: 'ft-xlsx', label: 'XLSX', color: '#3ecf8e' }, { id: 'ft2', label: 'Image', color: '#a78bfa' }, { id: 'ft5', label: 'Video', color: '#2dd4bf' }, { id: 'ft6', label: 'Archive', color: '#6b7280' }, { id: 'ft7', label: 'Other', color: '#f5c518' }] }, hidden: false, width: 120 },
  { id: 'fc-size', database_id: 'db-files', name: 'Size (MB)', type: 'number', position: 2, config: { suffix: ' MB' }, hidden: false, width: 100 },
  { id: 'fc-url', database_id: 'db-files', name: 'File', type: 'file', position: 3, config: {}, hidden: false, width: 220 },
  { id: 'fc-by', database_id: 'db-files', name: 'Uploaded by', type: 'person', position: 4, config: {}, hidden: false, width: 150 },
  { id: 'fc-date', database_id: 'db-files', name: 'Upload date', type: 'date', position: 5, config: {}, hidden: false, width: 120 },
  { id: 'fc-tags', database_id: 'db-files', name: 'Tags', type: 'tags', position: 6, config: {}, hidden: false, width: 180 },
  { id: 'fc-notes', database_id: 'db-files', name: 'Notes', type: 'text', position: 7, config: {}, hidden: false, width: 220 },
];

const FILE_ROWS: Row[] = [];

// ─── CONSULTING DATABASE ──────────────────────────────────────────────────────
const CONSULTING_COLS: Column[] = [
  { id: 'con-name', database_id: 'db-consulting', name: 'Consultation name', type: 'text', position: 0, config: {}, hidden: false, width: 240 },
  { id: 'con-client', database_id: 'db-consulting', name: 'Client name', type: 'text', position: 1, config: {}, hidden: false, width: 160 },
  { id: 'con-service', database_id: 'db-consulting', name: 'Service type', type: 'select', position: 2, config: { options: [{ id: 's1', label: 'Voice Bot', color: '#1c75bc' }, { id: 's2', label: 'Chat Bot', color: '#3ecf8e' }, { id: 's3', label: 'Process Automation', color: '#a78bfa' }, { id: 's4', label: 'AI Integrations', color: '#2dd4bf' }, { id: 's5', label: 'AI Audit & Roadmap', color: '#fb923c' }, { id: 's6', label: 'AI Workshop', color: '#f472b6' }] }, hidden: false, width: 150 },
  { id: 'con-status', database_id: 'db-consulting', name: 'Status', type: 'status', position: 3, config: {}, hidden: false, width: 120 },
  { id: 'con-assignee', database_id: 'db-consulting', name: 'Consultant', type: 'person', position: 4, config: {}, hidden: false, width: 140 },
  { id: 'con-date', database_id: 'db-consulting', name: 'Consultation date', type: 'date', position: 5, config: {}, hidden: false, width: 150 },
  { id: 'con-fee', database_id: 'db-consulting', name: 'Fee', type: 'number', position: 6, config: { prefix: '€' }, hidden: false, width: 110 },
  { id: 'con-roi', database_id: 'db-consulting', name: 'Estimated ROI', type: 'text', position: 7, config: {}, hidden: false, width: 180 },
];

const CONSULTING_ROWS: Row[] = [];

// ─── ASSEMBLED DATABASES ──────────────────────────────────────────────────────
export const DATABASES: Record<string, Database> = {
  'db-todo': { id: 'db-todo', page_id: 'p-todo', name: 'To-Do', columns: TODO_COLS, rows: TODO_ROWS, views: TODO_VIEWS, default_view: 'table' },
  'db-clients': { id: 'db-clients', page_id: 'p-clients', name: 'Clients', columns: CLIENT_COLS, rows: CLIENT_ROWS, views: [{ id: 'cv-all', database_id: 'db-clients', name: 'All Clients', type: 'table', icon: '👥', filters: [], sorts: [], hidden_cols: [], is_default: true }], default_view: 'table' },
  'db-projects': { id: 'db-projects', page_id: 'p-projects', name: 'Projects', columns: PROJECT_COLS, rows: PROJECT_ROWS, views: [{ id: 'pv-all', database_id: 'db-projects', name: 'All Projects', type: 'table', icon: '🗂', filters: [], sorts: [], hidden_cols: [], is_default: true }, { id: 'pv-board', database_id: 'db-projects', name: 'Board', type: 'board', icon: '⊞', filters: [], sorts: [], hidden_cols: [] }], default_view: 'table' },
  'db-meetings': { id: 'db-meetings', page_id: 'p-meetings', name: 'Meetings', columns: MEETING_COLS, rows: MEETING_ROWS, views: [{ id: 'mv-cal', database_id: 'db-meetings', name: 'Calendar', type: 'calendar', icon: '📅', filters: [], sorts: [], hidden_cols: [], is_default: true }, { id: 'mv-all', database_id: 'db-meetings', name: 'All Meetings', type: 'table', icon: '☰', filters: [], sorts: [], hidden_cols: [] }], default_view: 'calendar' },
  'db-companies': { id: 'db-companies', page_id: 'p-companies', name: 'Companies', columns: COMPANY_COLS, rows: COMPANY_ROWS, views: [{ id: 'comv-all', database_id: 'db-companies', name: 'All Companies', type: 'table', icon: 'IconBuildingFactory2', filters: [], sorts: [], hidden_cols: [], is_default: true }], default_view: 'table' },
  'db-costs': { id: 'db-costs', page_id: 'p-costs', name: 'Costs', columns: COST_COLS, rows: COST_ROWS, views: [{ id: 'cosv-all', database_id: 'db-costs', name: 'All Costs', type: 'table', icon: '💰', filters: [], sorts: [], hidden_cols: [], is_default: true }], default_view: 'table' },
  'db-cashflow': { id: 'db-cashflow', page_id: 'p-cashflow', name: 'Cash Flow Statement', columns: CASHFLOW_COLS, rows: CASHFLOW_ROWS, views: [{ id: 'cfv-all', database_id: 'db-cashflow', name: 'All Flows', type: 'table', icon: 'IconArrowsExchange', filters: [], sorts: [{ column_id: 'cfc-date', direction: 'desc' }], hidden_cols: [], is_default: true }], default_view: 'table' },
  'db-balance': { id: 'db-balance', page_id: 'p-balance', name: 'Balance Sheet', columns: BALANCE_COLS, rows: BALANCE_ROWS, views: [{ id: 'bsv-all', database_id: 'db-balance', name: 'All Items', type: 'table', icon: 'IconScale', filters: [], sorts: [], hidden_cols: [], is_default: true }], default_view: 'table' },
  'db-passwords': { id: 'db-passwords', page_id: 'p-passwords', name: 'Passwords', columns: PASSWORD_COLS, rows: PASSWORD_ROWS, views: [{ id: 'pwv-all', database_id: 'db-passwords', name: 'All', type: 'table', icon: '🔐', filters: [], sorts: [], hidden_cols: [], is_default: true }], default_view: 'table' },
  'db-clubcrowd': { id: 'db-clubcrowd', page_id: 'p-clubcrowd', name: 'ClubCrowd Clients', columns: CLUBCROWD_COLS, rows: CLUBCROWD_ROWS, views: [{ id: 'clv-all', database_id: 'db-clubcrowd', name: 'All Venues', type: 'table', icon: '🎵', filters: [], sorts: [], hidden_cols: [], is_default: true }], default_view: 'table' },
  'db-files': { id: 'db-files', page_id: 'p-files', name: 'Files', columns: FILE_COLS, rows: FILE_ROWS, views: [
    { id: 'fv-all', database_id: 'db-files', name: 'All Files', type: 'table', icon: 'IconFiles', filters: [], sorts: [{ column_id: 'fc-date', direction: 'desc' }], hidden_cols: [], is_default: true },
    { id: 'fv-pdf', database_id: 'db-files', name: 'PDFs', type: 'table', icon: 'IconFileTypePdf', filters: [{ id: 'f-pdf', column_id: 'fc-type', operator: 'equals', value: 'PDF' }], sorts: [], hidden_cols: [] },
    { id: 'fv-pptx', database_id: 'db-files', name: 'Presentations', type: 'table', icon: 'IconPresentation', filters: [{ id: 'f-pptx', column_id: 'fc-type', operator: 'equals', value: 'PPTX' }], sorts: [], hidden_cols: [] },
    { id: 'fv-docx', database_id: 'db-files', name: 'Documents', type: 'table', icon: 'IconFileText', filters: [{ id: 'f-docx', column_id: 'fc-type', operator: 'equals', value: 'DOCX' }], sorts: [], hidden_cols: [] },
    { id: 'fv-xlsx', database_id: 'db-files', name: 'Spreadsheets', type: 'table', icon: 'IconTable', filters: [{ id: 'f-xlsx', column_id: 'fc-type', operator: 'equals', value: 'XLSX' }], sorts: [], hidden_cols: [] },
    { id: 'fv-img', database_id: 'db-files', name: 'Images', type: 'table', icon: 'IconPhoto', filters: [{ id: 'f-img', column_id: 'fc-type', operator: 'equals', value: 'Image' }], sorts: [], hidden_cols: [] },
    { id: 'fv-vid', database_id: 'db-files', name: 'Videos', type: 'table', icon: 'IconVideo', filters: [{ id: 'f-vid', column_id: 'fc-type', operator: 'equals', value: 'Video' }], sorts: [], hidden_cols: [] },
  ], default_view: 'table' },
  'db-consulting': {
    id: 'db-consulting',
    page_id: 'p-consulting',
    name: 'Consulting Pipeline',
    columns: CONSULTING_COLS,
    rows: CONSULTING_ROWS,
    views: [
      { id: 'conv-dash', database_id: 'db-consulting', name: 'Dashboard', type: 'dashboard', icon: '📊', filters: [], sorts: [], hidden_cols: [], is_default: true },
      { id: 'conv-all', database_id: 'db-consulting', name: 'Pipeline', type: 'table', icon: '💼', filters: [], sorts: [], hidden_cols: [] },
      { id: 'conv-board', database_id: 'db-consulting', name: 'By Status', type: 'board', icon: '⊞', filters: [], sorts: [], hidden_cols: [] }
    ],
    default_view: 'dashboard'
  },
  ...PRIVATE_TODO_DATABASES,
};

// ─── PAGE → DATABASE MAP ──────────────────────────────────────────────────────
export const PAGE_DB_MAP: Record<string, string> = {
  'p-todo': 'db-todo',
  'p-clients': 'db-clients',
  'p-projects': 'db-projects',
  'p-meetings': 'db-meetings',
  'p-companies': 'db-companies',
  'p-costs': 'db-costs',
  'p-cashflow': 'db-cashflow',
  'p-balance': 'db-balance',
  'p-passwords': 'db-passwords',
  'p-clubcrowd': 'db-clubcrowd',
  'p-consulting': 'db-consulting',
};

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
// ─── LOGIN ACCOUNTS ───────────────────────────────────────────────────────────
// The admin account always exists so there's a way in. Others sign up and wait
// for the admin to grant access.
// Real accounts come from Supabase auth now. Only the owner remains as the seed
// admin (and the demo accounts are stripped from any saved data on load).
export const ACCOUNTS: Account[] = [
  { id: 'acc-admin', name: 'Gašpar Bodulica', email: 'gbodulica@appercept.net', password: '2804Gaspar!', approved: true, role: 'admin', initials: 'GB', color: '#1c75bc', created_at: '2026-01-01T00:00:00Z' },
  { id: 'acc-karlo', name: 'Karlo Časni',     email: 'kcasni@appercept.net',  password: '2804Karlo!',   approved: true, role: 'admin', initials: 'KČ', color: '#3ecf8e', created_at: '2026-01-01T00:00:00Z' },
  { id: 'acc-bruno', name: 'Bruno Vujčec',    email: 'bvujcec@appercept.net', password: '2804Bruno!',   approved: true, role: 'admin', initials: 'BV', color: '#a78bfa', created_at: '2026-01-01T00:00:00Z' },
];

// Demo accounts to purge from persisted localStorage (migration in store.ts).
export const REMOVED_DEMO_EMAILS = ['gaspar@appercept.net', 'albert@medikallux.hr', 'ana@appercept.net', 'ivan@gymbros.hr'];

// ─── MESSAGING (Teams-like) ───────────────────────────────────────────────────
export const CHANNELS: Channel[] = [
  { id: 'ch-general',  kind: 'channel', name: 'General',      emoji: 'IconMessage',   color: '#1c75bc', description: 'Company-wide announcements & chat', member_ids: ['u-1', 'u-karlo', 'u-bruno'], created_by: 'u-1', created_at: '2026-01-01T00:00:00Z' },
];

export const CHAT_MESSAGES: ChatMessage[] = [];

// ─── CLIENT PORTAL Q&A ────────────────────────────────────────────────────────
export const PORTAL_MESSAGES: PortalMessage[] = [];

export const NOTIFICATIONS: Notification[] = [];

// ─── SAMPLE COMMENTS ──────────────────────────────────────────────────────────
export const COMMENTS: Comment[] = [];

// ─── ACTIVITY LOG ─────────────────────────────────────────────────────────────
export const ACTIVITIES: Activity[] = [];

// ─── TEAM REVENUE ROLES ───────────────────────────────────────────────────────
import type { TeamRole, ProjectShare } from './types';

export const TEAM_ROLES: TeamRole[] = [
  { id: 'tr-1', name: 'Gašpar Bodulica', user_id: 'u-1', role_title: 'Lead / Strategy', email: 'gbodulica@appercept.net', default_share: 70, is_external: false, color: '#1c75bc', created_at: '2026-01-01T00:00:00Z' },
];

// Demo people (workspace users + team roles) to strip from saved data — by ID,
// so re-adding someone later (with a fresh ID) is never blocked.
export const REMOVED_DEMO_USER_IDS = ['u-2', 'u-3', 'u-4'];
export const REMOVED_DEMO_ROLE_IDS = ['tr-2'];
// Company retention = 100 − sum of all role shares (auto-calculated in UI)
// Default: 45 + 25 = 70% team, 30% stays in Appercept

export const PROJECT_SHARES: ProjectShare[] = [];
