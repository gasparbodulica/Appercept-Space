import { Column, Row, Database, Page, User, Workspace, ViewConfig, Comment, Activity, Notification } from './types';

// ─── Seed Data ───────────────────────────────────────────────────────────────

export const WORKSPACE: Workspace = {
  id: 'ws-1',
  name: "Appercept's Space",
  slug: 'appercept',
  created_at: '2026-01-01T00:00:00Z',
};

export const USERS: User[] = [
  { id: 'u-1', workspace_id: 'ws-1', name: 'Gašpar Bodulica', email: 'gaspar@appercept.net', role: 'admin', initials: 'GB', color: '#4f6fff' },
  { id: 'u-2', workspace_id: 'ws-1', name: 'Karlo Casni', email: 'kcasni@appercept.net', role: 'member', initials: 'KC', color: '#3ecf8e' },
  { id: 'u-3', workspace_id: 'ws-1', name: 'Design Lead', email: 'design@appercept.net', role: 'member', initials: 'DL', color: '#a78bfa' },
  { id: 'u-4', workspace_id: 'ws-1', name: 'Dev Freelancer', email: 'dev@appercept.net', role: 'member', initials: 'DF', color: '#2dd4bf' },
];

export const PAGES: Page[] = [
  { id: 'p-todo', workspace_id: 'ws-1', title: 'To-Do', icon: '✅', type: 'todo', position: 1, slug: 'todo', is_active: true },
  { id: 'p-clients', workspace_id: 'ws-1', title: 'Clients', icon: '👥', type: 'clients', position: 2, slug: 'clients' },
  { id: 'p-projects', workspace_id: 'ws-1', title: 'Projects', icon: '🗂', type: 'projects', position: 3, slug: 'projects' },
  { id: 'p-team', workspace_id: 'ws-1', title: 'Team & Roles', icon: '👤', type: 'custom', position: 4, slug: 'team' },
  { id: 'p-meetings', workspace_id: 'ws-1', title: 'Meetings', icon: '📅', type: 'meetings', position: 5, slug: 'meetings', badge: 3 },
  { id: 'p-companies', workspace_id: 'ws-1', title: 'Companies', icon: '🏭', type: 'companies', position: 6, slug: 'companies' },
  { id: 'p-costs', workspace_id: 'ws-1', title: 'Costs', icon: '💰', type: 'costs', position: 7, slug: 'costs' },
  { id: 'p-files', workspace_id: 'ws-1', title: 'Files', icon: '📁', type: 'files', position: 8, slug: 'files' },
  { id: 'p-passwords', workspace_id: 'ws-1', title: 'Passwords', icon: '🔐', type: 'passwords', position: 9, slug: 'passwords' },
  { id: 'p-clubcrowd', workspace_id: 'ws-1', title: 'ClubCrowd Clients', icon: '🎵', type: 'clubcrowd', position: 10, slug: 'clubcrowd' },
];

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

const TODO_ROWS: Row[] = [
  { id: 'tr-1', database_id: 'db-todo', position: 0, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'tc-name': 'Appercept Marketing – Campaign', 'tc-status': 'Not started', 'tc-assignee': 'u-1', 'tc-due': null, 'tc-priority': 'Medium', 'tc-tags': ['IG', 'TT', 'LIN'] } },
  { id: 'tr-2', database_id: 'db-todo', position: 1, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'tc-name': 'GymBros Demo', 'tc-status': 'Not started', 'tc-assignee': 'u-1', 'tc-due': '2026-03-11', 'tc-priority': 'Medium', 'tc-tags': ['Dev'] } },
  { id: 'tr-3', database_id: 'db-todo', position: 2, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'tc-name': 'GymBros Marketing – Campaign', 'tc-status': 'Not started', 'tc-assignee': 'u-1', 'tc-due': '2026-03-04', 'tc-priority': 'Medium', 'tc-tags': ['IG', 'TT'] } },
  { id: 'tr-4', database_id: 'db-todo', position: 3, created_by: 'u-2', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'tc-name': 'd.o.o.', 'tc-status': 'In progress', 'tc-assignee': 'u-2', 'tc-due': '2026-02-25', 'tc-priority': 'Low', 'tc-tags': ['Dev'] } },
  { id: 'tr-5', database_id: 'db-todo', position: 4, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'tc-name': 'GymBros Social', 'tc-status': 'Not started', 'tc-assignee': 'u-1', 'tc-due': '2026-03-04', 'tc-priority': 'Medium', 'tc-tags': ['IG', 'TT'] } },
  { id: 'tr-6', database_id: 'db-todo', position: 5, created_by: 'u-2', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'tc-name': 'EFZG Cold Call', 'tc-status': 'Done', 'tc-assignee': 'u-2', 'tc-due': '2026-02-20', 'tc-priority': 'High', 'tc-tags': ['Call'] } },
  { id: 'tr-7', database_id: 'db-todo', position: 6, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'tc-name': 'EFZG Contract', 'tc-status': 'Not started', 'tc-assignee': 'u-1', 'tc-due': '2026-02-23', 'tc-priority': 'High', 'tc-tags': ['Contract'] } },
  { id: 'tr-8', database_id: 'db-todo', position: 7, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'tc-name': 'Backstage Beauty TT/Reels', 'tc-status': 'Started', 'tc-assignee': 'u-1', 'tc-due': '2026-03-08|2026-03-15', 'tc-priority': 'Medium', 'tc-tags': ['TT', 'IG'] } },
  { id: 'tr-9', database_id: 'db-todo', position: 8, created_by: 'u-2', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'tc-name': 'MedikalLux Contract', 'tc-status': 'Not started', 'tc-assignee': 'u-2', 'tc-due': '2026-03-09|2026-03-15', 'tc-priority': 'High', 'tc-tags': ['Contract'] } },
  { id: 'tr-10', database_id: 'db-todo', position: 9, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'tc-name': 'MedikalLux GDPR', 'tc-status': 'Done', 'tc-assignee': 'u-1', 'tc-due': '2026-03-09', 'tc-priority': 'High', 'tc-tags': ['Info'] } },
  { id: 'tr-11', database_id: 'db-todo', position: 10, created_by: 'u-2', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'tc-name': 'Appercept contract template', 'tc-status': 'Done', 'tc-assignee': 'u-2', 'tc-due': '2026-03-08', 'tc-priority': 'High', 'tc-tags': ['Contract'] } },
  { id: 'tr-12', database_id: 'db-todo', position: 11, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'tc-name': 'ClubCrowd FINAL', 'tc-status': 'In progress', 'tc-assignee': 'u-1', 'tc-due': '2026-03-13', 'tc-priority': 'High', 'tc-tags': ['Dev'] } },
  { id: 'tr-13', database_id: 'db-todo', position: 12, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'tc-name': 'ClubCrowd PPTX', 'tc-status': 'Done', 'tc-assignee': 'u-1', 'tc-due': '2026-03-17', 'tc-priority': 'High', 'tc-tags': ['PPTX'] } },
  { id: 'tr-14', database_id: 'db-todo', position: 13, created_by: 'u-2', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'tc-name': 'Appercept Posts/Template', 'tc-status': 'Done', 'tc-assignee': 'u-2', 'tc-due': '2026-03-20', 'tc-priority': 'Medium', 'tc-tags': ['IG', 'LIN'] } },
  { id: 'tr-15', database_id: 'db-todo', position: 14, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'tc-name': 'Appercept Thank You Card', 'tc-status': 'Done', 'tc-assignee': 'u-1', 'tc-due': null, 'tc-priority': 'Low', 'tc-tags': ['Contract'] } },
  { id: 'tr-16', database_id: 'db-todo', position: 15, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'tc-name': 'Appercept Invoice Template', 'tc-status': 'In progress', 'tc-assignee': 'u-1', 'tc-due': null, 'tc-priority': 'Medium', 'tc-tags': ['Contract'] } },
];

// ─── CLIENTS DATABASE ─────────────────────────────────────────────────────────
const CLIENT_COLS: Column[] = [
  { id: 'cc-name', database_id: 'db-clients', name: 'Name', type: 'text', position: 0, config: {}, hidden: false, width: 200 },
  { id: 'cc-company', database_id: 'db-clients', name: 'Company', type: 'text', position: 1, config: {}, hidden: false, width: 180 },
  { id: 'cc-email', database_id: 'db-clients', name: 'Email', type: 'email', position: 2, config: {}, hidden: false, width: 200 },
  { id: 'cc-phone', database_id: 'db-clients', name: 'Phone', type: 'phone', position: 3, config: {}, hidden: false, width: 140 },
  { id: 'cc-status', database_id: 'db-clients', name: 'Status', type: 'select', position: 4, config: { options: [{ id: 'o1', label: 'Active', color: '#3ecf8e' }, { id: 'o2', label: 'Pending', color: '#f5a623' }, { id: 'o3', label: 'Inactive', color: '#6b7280' }] }, hidden: false, width: 100 },
  { id: 'cc-revenue', database_id: 'db-clients', name: 'Monthly revenue', type: 'number', position: 5, config: { prefix: '€' }, hidden: false, width: 140 },
  { id: 'cc-notes', database_id: 'db-clients', name: 'Notes', type: 'text', position: 6, config: {}, hidden: false, width: 240 },
];

const CLIENT_ROWS: Row[] = [
  { id: 'cr-1', database_id: 'db-clients', position: 0, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'cc-name': 'Albert Karner', 'cc-company': 'Medikal Lux d.o.o.', 'cc-email': 'albert@medikallux.hr', 'cc-status': 'Active', 'cc-revenue': 5600 } },
  { id: 'cr-2', database_id: 'db-clients', position: 1, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'cc-name': 'Stjepan Ursa', 'cc-company': 'Projekt90', 'cc-email': 'stjepan@projekt90.hr', 'cc-status': 'Active', 'cc-revenue': 2200 } },
  { id: 'cr-3', database_id: 'db-clients', position: 2, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'cc-name': 'Marketing tim', 'cc-company': '24 Sata', 'cc-email': 'marketing@24sata.hr', 'cc-status': 'Active', 'cc-revenue': 8400 } },
  { id: 'cr-4', database_id: 'db-clients', position: 3, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'cc-name': 'Nina Barić', 'cc-company': 'Papaya Music', 'cc-email': 'nina@papaya.hr', 'cc-status': 'Active', 'cc-revenue': 1800 } },
  { id: 'cr-5', database_id: 'db-clients', position: 4, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'cc-name': 'Ana Kovač', 'cc-company': 'Backstage Beauty', 'cc-email': 'ana@backstage.hr', 'cc-status': 'Active', 'cc-revenue': 3200 } },
  { id: 'cr-6', database_id: 'db-clients', position: 5, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'cc-name': 'Kristo Jaksa', 'cc-company': 'EFZG', 'cc-email': 'k.jaksa@efzg.hr', 'cc-status': 'Pending', 'cc-revenue': 0 } },
  { id: 'cr-7', database_id: 'db-clients', position: 6, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'cc-name': 'Ivan Perić', 'cc-company': 'GymBros d.o.o.', 'cc-email': 'ivan@gymbros.hr', 'cc-status': 'Pending', 'cc-revenue': 0 } },
  { id: 'cr-8', database_id: 'db-clients', position: 7, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'cc-name': 'Marta Šimić', 'cc-company': 'Kashetta', 'cc-email': 'marta@kashetta.hr', 'cc-status': 'Active', 'cc-revenue': 1400 } },
];

// ─── PROJECTS DATABASE ────────────────────────────────────────────────────────
const PROJECT_COLS: Column[] = [
  { id: 'pc-name', database_id: 'db-projects', name: 'Project name', type: 'text', position: 0, config: {}, hidden: false, width: 240 },
  { id: 'pc-client', database_id: 'db-projects', name: 'Client', type: 'text', position: 1, config: {}, hidden: false, width: 160 },
  { id: 'pc-status', database_id: 'db-projects', name: 'Status', type: 'status', position: 2, config: {}, hidden: false, width: 130 },
  { id: 'pc-progress', database_id: 'db-projects', name: 'Progress', type: 'number', position: 3, config: { suffix: '%' }, hidden: false, width: 100 },
  { id: 'pc-start', database_id: 'db-projects', name: 'Start date', type: 'date', position: 4, config: {}, hidden: false, width: 110 },
  { id: 'pc-end', database_id: 'db-projects', name: 'End date', type: 'date', position: 5, config: {}, hidden: false, width: 110 },
  { id: 'pc-budget', database_id: 'db-projects', name: 'Budget', type: 'number', position: 6, config: { prefix: '€' }, hidden: false, width: 110 },
  { id: 'pc-priority', database_id: 'db-projects', name: 'Priority', type: 'priority', position: 7, config: {}, hidden: false, width: 100 },
];

const PROJECT_ROWS: Row[] = [
  { id: 'pr-1', database_id: 'db-projects', position: 0, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'pc-name': 'Voice Bot — Medikal Lux', 'pc-client': 'Medikal Lux', 'pc-status': 'In progress', 'pc-progress': 78, 'pc-end': '2026-06-14', 'pc-priority': 'High' } },
  { id: 'pr-2', database_id: 'db-projects', position: 1, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'pc-name': 'ClubCrowd FINAL', 'pc-client': 'Internal', 'pc-status': 'In progress', 'pc-progress': 55, 'pc-end': '2026-03-13', 'pc-priority': 'High' } },
  { id: 'pr-3', database_id: 'db-projects', position: 2, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'pc-name': 'Projekt90 Content Pack', 'pc-client': 'Projekt90', 'pc-status': 'In progress', 'pc-progress': 92, 'pc-end': '2026-06-05', 'pc-priority': 'Medium' } },
  { id: 'pr-4', database_id: 'db-projects', position: 3, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'pc-name': 'Social Media Strategy', 'pc-client': '24 Sata', 'pc-status': 'In progress', 'pc-progress': 40, 'pc-end': '2026-06-20', 'pc-priority': 'Medium' } },
  { id: 'pr-5', database_id: 'db-projects', position: 4, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'pc-name': 'Appercept Brand Refresh', 'pc-client': 'Internal', 'pc-status': 'Not started', 'pc-progress': 30, 'pc-end': '2026-06-30', 'pc-priority': 'Low' } },
  { id: 'pr-6', database_id: 'db-projects', position: 5, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'pc-name': 'GymBros Demo', 'pc-client': 'GymBros', 'pc-status': 'Not started', 'pc-progress': 10, 'pc-end': '2026-03-11', 'pc-priority': 'Medium' } },
];

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

const MEETING_ROWS: Row[] = [
  { id: 'mr-1', database_id: 'db-meetings', position: 0, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'mc-title': 'Onboarding call', 'mc-client': 'Medikal Lux', 'mc-assignee': 'u-1', 'mc-date': '2026-06-02T09:30:00', 'mc-duration': 60, 'mc-status': 'Not started', 'mc-synced': false } },
  { id: 'mr-2', database_id: 'db-meetings', position: 1, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'mc-title': 'Brand strategy review', 'mc-client': 'Papaya Music', 'mc-assignee': 'u-1', 'mc-date': '2026-06-02T13:00:00', 'mc-duration': 45, 'mc-status': 'Not started', 'mc-synced': false } },
  { id: 'mr-3', database_id: 'db-meetings', position: 2, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'mc-title': 'Monthly retainer sync', 'mc-client': '24 Sata', 'mc-assignee': 'u-1', 'mc-date': '2026-06-02T16:00:00', 'mc-duration': 30, 'mc-status': 'Not started', 'mc-synced': false } },
  { id: 'mr-4', database_id: 'db-meetings', position: 3, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'mc-title': 'GymBros demo call', 'mc-client': 'GymBros', 'mc-assignee': 'u-1', 'mc-date': '2026-06-04T10:00:00', 'mc-duration': 60, 'mc-status': 'Not started', 'mc-synced': false } },
  { id: 'mr-5', database_id: 'db-meetings', position: 4, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'mc-title': 'Sprint planning', 'mc-client': 'ClubCrowd Internal', 'mc-assignee': 'u-1', 'mc-date': '2026-06-05T14:00:00', 'mc-duration': 90, 'mc-status': 'Not started', 'mc-synced': false } },
];

// ─── COMPANIES DATABASE ───────────────────────────────────────────────────────
const COMPANY_COLS: Column[] = [
  { id: 'coc-name', database_id: 'db-companies', name: 'Company name', type: 'text', position: 0, config: {}, hidden: false, width: 220 },
  { id: 'coc-industry', database_id: 'db-companies', name: 'Industry', type: 'select', position: 1, config: { options: [{ id: 'i1', label: 'Healthcare', color: '#3ecf8e' }, { id: 'i2', label: 'AI Consulting', color: '#4f6fff' }, { id: 'i3', label: 'Media', color: '#f5a623' }, { id: 'i4', label: 'Music', color: '#a78bfa' }, { id: 'i5', label: 'Fitness', color: '#2dd4bf' }, { id: 'i6', label: 'Beauty', color: '#f472b6' }, { id: 'i7', label: 'E-commerce', color: '#fb923c' }, { id: 'i8', label: 'Education', color: '#6b7280' }] }, hidden: false, width: 140 },
  { id: 'coc-oib', database_id: 'db-companies', name: 'OIB', type: 'text', position: 2, config: {}, hidden: false, width: 130 },
  { id: 'coc-director', database_id: 'db-companies', name: 'Director', type: 'text', position: 3, config: {}, hidden: false, width: 160 },
  { id: 'coc-email', database_id: 'db-companies', name: 'Email', type: 'email', position: 4, config: {}, hidden: false, width: 200 },
  { id: 'coc-phone', database_id: 'db-companies', name: 'Phone', type: 'phone', position: 5, config: {}, hidden: false, width: 140 },
  { id: 'coc-address', database_id: 'db-companies', name: 'Address', type: 'text', position: 6, config: {}, hidden: false, width: 220 },
];

const COMPANY_ROWS: Row[] = [
  { id: 'cor-1', database_id: 'db-companies', position: 0, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'coc-name': 'Medikal Lux d.o.o.', 'coc-oib': '90063835455', 'coc-director': 'Albert Karner', 'coc-industry': 'Healthcare' } },
  { id: 'cor-2', database_id: 'db-companies', position: 1, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'coc-name': 'Egzosfera obrt', 'coc-oib': '56594199654', 'coc-director': 'Gašpar Bodulica', 'coc-industry': 'AI Consulting' } },
  { id: 'cor-3', database_id: 'db-companies', position: 2, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'coc-name': '24 Sata d.o.o.', 'coc-oib': null, 'coc-director': null, 'coc-industry': 'Media' } },
  { id: 'cor-4', database_id: 'db-companies', position: 3, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'coc-name': 'Papaya Music', 'coc-oib': null, 'coc-director': 'Nina Barić', 'coc-industry': 'Music' } },
  { id: 'cor-5', database_id: 'db-companies', position: 4, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'coc-name': 'GymBros d.o.o.', 'coc-oib': null, 'coc-director': 'Ivan Perić', 'coc-industry': 'Fitness' } },
  { id: 'cor-6', database_id: 'db-companies', position: 5, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'coc-name': 'Backstage Beauty', 'coc-oib': null, 'coc-director': 'Ana Kovač', 'coc-industry': 'Beauty' } },
  { id: 'cor-7', database_id: 'db-companies', position: 6, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'coc-name': 'Kashetta', 'coc-oib': null, 'coc-director': 'Marta Šimić', 'coc-industry': 'E-commerce' } },
  { id: 'cor-8', database_id: 'db-companies', position: 7, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'coc-name': 'EFZG', 'coc-oib': null, 'coc-director': null, 'coc-industry': 'Education' } },
];

// ─── COSTS DATABASE ───────────────────────────────────────────────────────────
const COST_COLS: Column[] = [
  { id: 'costc-item', database_id: 'db-costs', name: 'Item', type: 'text', position: 0, config: {}, hidden: false, width: 240 },
  { id: 'costc-type', database_id: 'db-costs', name: 'Type', type: 'select', position: 1, config: { options: [{ id: 'ct1', label: 'Income', color: '#3ecf8e' }, { id: 'ct2', label: 'Expense', color: '#ff5c5c' }] }, hidden: false, width: 100 },
  { id: 'costc-amount', database_id: 'db-costs', name: 'Amount', type: 'number', position: 2, config: { prefix: '€' }, hidden: false, width: 110 },
  { id: 'costc-date', database_id: 'db-costs', name: 'Date', type: 'date', position: 3, config: {}, hidden: false, width: 110 },
  { id: 'costc-status', database_id: 'db-costs', name: 'Status', type: 'status', position: 4, config: {}, hidden: false, width: 120 },
  { id: 'costc-category', database_id: 'db-costs', name: 'Category', type: 'select', position: 5, config: { options: [{ id: 'cat1', label: 'SaaS', color: '#4f6fff' }, { id: 'cat2', label: 'Freelance', color: '#a78bfa' }, { id: 'cat3', label: 'Tools', color: '#2dd4bf' }, { id: 'cat4', label: 'Tax', color: '#ff5c5c' }, { id: 'cat5', label: 'Client Revenue', color: '#3ecf8e' }] }, hidden: false, width: 140 },
  { id: 'costc-notes', database_id: 'db-costs', name: 'Notes', type: 'text', position: 6, config: {}, hidden: false, width: 220 },
];

const COST_ROWS: Row[] = [
  { id: 'costr-1', database_id: 'db-costs', position: 0, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'costc-item': 'Voice Bot SaaS — Medikal Lux', 'costc-type': 'Income', 'costc-amount': 600, 'costc-date': '2026-06-01', 'costc-status': 'Done', 'costc-category': 'Client Revenue' } },
  { id: 'costr-2', database_id: 'db-costs', position: 1, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'costc-item': 'One-time implementation — Medikal Lux', 'costc-type': 'Income', 'costc-amount': 5000, 'costc-date': '2026-05-28', 'costc-status': 'Done', 'costc-category': 'Client Revenue' } },
  { id: 'costr-3', database_id: 'db-costs', position: 2, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'costc-item': 'Adobe Creative Cloud', 'costc-type': 'Expense', 'costc-amount': 60, 'costc-date': '2026-06-01', 'costc-status': 'Done', 'costc-category': 'SaaS' } },
  { id: 'costr-4', database_id: 'db-costs', position: 3, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'costc-item': 'DigitalOcean hosting', 'costc-type': 'Expense', 'costc-amount': 48, 'costc-date': '2026-06-01', 'costc-status': 'Done', 'costc-category': 'Tools' } },
  { id: 'costr-5', database_id: 'db-costs', position: 4, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'costc-item': 'Papaya Music retainer', 'costc-type': 'Income', 'costc-amount': 1800, 'costc-date': '2026-06-02', 'costc-status': 'In progress', 'costc-category': 'Client Revenue' } },
  { id: 'costr-6', database_id: 'db-costs', position: 5, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'costc-item': 'Freelance dev payment', 'costc-type': 'Expense', 'costc-amount': 800, 'costc-date': '2026-06-03', 'costc-status': 'Not started', 'costc-category': 'Freelance' } },
];

// ─── PASSWORDS DATABASE ───────────────────────────────────────────────────────
const PASSWORD_COLS: Column[] = [
  { id: 'pwc-service', database_id: 'db-passwords', name: 'Service', type: 'text', position: 0, config: {}, hidden: false, width: 200 },
  { id: 'pwc-url', database_id: 'db-passwords', name: 'URL', type: 'url', position: 1, config: {}, hidden: false, width: 200 },
  { id: 'pwc-username', database_id: 'db-passwords', name: 'Username / Email', type: 'email', position: 2, config: {}, hidden: false, width: 200 },
  { id: 'pwc-password', database_id: 'db-passwords', name: 'Password', type: 'text', position: 3, config: {}, hidden: false, width: 160 },
  { id: 'pwc-notes', database_id: 'db-passwords', name: 'Notes', type: 'text', position: 4, config: {}, hidden: false, width: 220 },
  { id: 'pwc-tags', database_id: 'db-passwords', name: 'Tags', type: 'tags', position: 5, config: {}, hidden: false, width: 160 },
];

const PASSWORD_ROWS: Row[] = [
  { id: 'pwr-1', database_id: 'db-passwords', position: 0, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'pwc-service': 'Raiffeisenbank Austria', 'pwc-username': 'IBAN: HR4024840083237303819', 'pwc-password': '••••••••••••' } },
  { id: 'pwr-2', database_id: 'db-passwords', position: 1, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'pwc-service': 'Stripe Dashboard', 'pwc-url': 'https://dashboard.stripe.com', 'pwc-username': 'gaspar@appercept.net', 'pwc-password': '••••••••••••' } },
  { id: 'pwr-3', database_id: 'db-passwords', position: 2, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'pwc-service': 'DigitalOcean', 'pwc-url': 'https://cloud.digitalocean.com', 'pwc-username': 'gaspar@appercept.net', 'pwc-password': '••••••••••••' } },
  { id: 'pwr-4', database_id: 'db-passwords', position: 3, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'pwc-service': 'Adobe Creative Cloud', 'pwc-url': 'https://creativecloud.adobe.com', 'pwc-username': 'gaspar@appercept.net', 'pwc-password': '••••••••••••' } },
  { id: 'pwr-5', database_id: 'db-passwords', position: 4, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'pwc-service': 'Notion Workspace', 'pwc-url': 'https://notion.so', 'pwc-username': 'gaspar@appercept.net', 'pwc-password': '••••••••••••' } },
  { id: 'pwr-6', database_id: 'db-passwords', position: 5, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'pwc-service': 'Appercept Hosting', 'pwc-username': 'gaspar@appercept.net', 'pwc-password': '••••••••••••' } },
];

// ─── CLUBCROWD DATABASE ───────────────────────────────────────────────────────
const CLUBCROWD_COLS: Column[] = [
  { id: 'clc-venue', database_id: 'db-clubcrowd', name: 'Venue name', type: 'text', position: 0, config: {}, hidden: false, width: 180 },
  { id: 'clc-city', database_id: 'db-clubcrowd', name: 'City', type: 'text', position: 1, config: {}, hidden: false, width: 120 },
  { id: 'clc-plan', database_id: 'db-clubcrowd', name: 'Subscription plan', type: 'select', position: 2, config: { options: [{ id: 'sp1', label: 'Free', color: '#6b7280' }, { id: 'sp2', label: 'Starter', color: '#f5a623' }, { id: 'sp3', label: 'Pro', color: '#4f6fff' }] }, hidden: false, width: 120 },
  { id: 'clc-bookings', database_id: 'db-clubcrowd', name: 'Monthly bookings', type: 'number', position: 3, config: {}, hidden: false, width: 140 },
  { id: 'clc-joined', database_id: 'db-clubcrowd', name: 'Platform joined', type: 'date', position: 4, config: {}, hidden: false, width: 130 },
  { id: 'clc-status', database_id: 'db-clubcrowd', name: 'Status', type: 'select', position: 5, config: { options: [{ id: 'cs1', label: 'Active', color: '#3ecf8e' }, { id: 'cs2', label: 'Pending', color: '#f5a623' }] }, hidden: false, width: 100 },
];

const CLUBCROWD_ROWS: Row[] = [
  { id: 'clr-1', database_id: 'db-clubcrowd', position: 0, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'clc-venue': 'Aquarius Club', 'clc-city': 'Zagreb', 'clc-plan': 'Pro', 'clc-status': 'Active' } },
  { id: 'clr-2', database_id: 'db-clubcrowd', position: 1, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'clc-venue': 'Amadeus Club', 'clc-city': 'Zagreb', 'clc-plan': 'Starter', 'clc-status': 'Active' } },
  { id: 'clr-3', database_id: 'db-clubcrowd', position: 2, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'clc-venue': 'Boogaloo', 'clc-city': 'Zagreb', 'clc-plan': 'Free', 'clc-status': 'Pending' } },
];

// ─── TEAM DATABASE ────────────────────────────────────────────────────────────
const TEAM_COLS: Column[] = [
  { id: 'tmc-name', database_id: 'db-team', name: 'Name', type: 'text', position: 0, config: {}, hidden: false, width: 200 },
  { id: 'tmc-role', database_id: 'db-team', name: 'Role', type: 'text', position: 1, config: {}, hidden: false, width: 160 },
  { id: 'tmc-email', database_id: 'db-team', name: 'Email', type: 'email', position: 2, config: {}, hidden: false, width: 200 },
  { id: 'tmc-rate', database_id: 'db-team', name: 'Hourly rate', type: 'number', position: 3, config: { prefix: '€', suffix: '/h' }, hidden: false, width: 120 },
  { id: 'tmc-notes', database_id: 'db-team', name: 'Notes', type: 'text', position: 4, config: {}, hidden: false, width: 240 },
];

const TEAM_ROWS: Row[] = [
  { id: 'tmr-1', database_id: 'db-team', position: 0, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'tmc-name': 'Gašpar Bodulica', 'tmc-role': 'Founder & CEO', 'tmc-email': 'gaspar@appercept.net' } },
  { id: 'tmr-2', database_id: 'db-team', position: 1, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'tmc-name': 'Karlo Casni', 'tmc-role': 'Operations', 'tmc-email': 'kcasni@appercept.net' } },
  { id: 'tmr-3', database_id: 'db-team', position: 2, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'tmc-name': 'Design Lead', 'tmc-role': 'UI/UX', 'tmc-email': 'design@appercept.net' } },
  { id: 'tmr-4', database_id: 'db-team', position: 3, created_by: 'u-1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z', cells: { 'tmc-name': 'Dev Freelancer', 'tmc-role': 'Development', 'tmc-email': 'dev@appercept.net' } },
];

// ─── ASSEMBLED DATABASES ──────────────────────────────────────────────────────
export const DATABASES: Record<string, Database> = {
  'db-todo': { id: 'db-todo', page_id: 'p-todo', name: 'To-Do', columns: TODO_COLS, rows: TODO_ROWS, views: TODO_VIEWS, default_view: 'table' },
  'db-clients': { id: 'db-clients', page_id: 'p-clients', name: 'Clients', columns: CLIENT_COLS, rows: CLIENT_ROWS, views: [{ id: 'cv-all', database_id: 'db-clients', name: 'All Clients', type: 'table', icon: '👥', filters: [], sorts: [], hidden_cols: [], is_default: true }], default_view: 'table' },
  'db-projects': { id: 'db-projects', page_id: 'p-projects', name: 'Projects', columns: PROJECT_COLS, rows: PROJECT_ROWS, views: [{ id: 'pv-all', database_id: 'db-projects', name: 'All Projects', type: 'table', icon: '🗂', filters: [], sorts: [], hidden_cols: [], is_default: true }, { id: 'pv-board', database_id: 'db-projects', name: 'Board', type: 'board', icon: '⊞', filters: [], sorts: [], hidden_cols: [] }], default_view: 'table' },
  'db-meetings': { id: 'db-meetings', page_id: 'p-meetings', name: 'Meetings', columns: MEETING_COLS, rows: MEETING_ROWS, views: [{ id: 'mv-cal', database_id: 'db-meetings', name: 'Calendar', type: 'calendar', icon: '📅', filters: [], sorts: [], hidden_cols: [], is_default: true }, { id: 'mv-all', database_id: 'db-meetings', name: 'All Meetings', type: 'table', icon: '☰', filters: [], sorts: [], hidden_cols: [] }], default_view: 'calendar' },
  'db-companies': { id: 'db-companies', page_id: 'p-companies', name: 'Companies', columns: COMPANY_COLS, rows: COMPANY_ROWS, views: [{ id: 'comv-all', database_id: 'db-companies', name: 'All Companies', type: 'table', icon: '🏭', filters: [], sorts: [], hidden_cols: [], is_default: true }], default_view: 'table' },
  'db-costs': { id: 'db-costs', page_id: 'p-costs', name: 'Costs', columns: COST_COLS, rows: COST_ROWS, views: [{ id: 'cosv-all', database_id: 'db-costs', name: 'All Costs', type: 'table', icon: '💰', filters: [], sorts: [], hidden_cols: [], is_default: true }], default_view: 'table' },
  'db-passwords': { id: 'db-passwords', page_id: 'p-passwords', name: 'Passwords', columns: PASSWORD_COLS, rows: PASSWORD_ROWS, views: [{ id: 'pwv-all', database_id: 'db-passwords', name: 'All', type: 'table', icon: '🔐', filters: [], sorts: [], hidden_cols: [], is_default: true }], default_view: 'table' },
  'db-clubcrowd': { id: 'db-clubcrowd', page_id: 'p-clubcrowd', name: 'ClubCrowd Clients', columns: CLUBCROWD_COLS, rows: CLUBCROWD_ROWS, views: [{ id: 'clv-all', database_id: 'db-clubcrowd', name: 'All Venues', type: 'table', icon: '🎵', filters: [], sorts: [], hidden_cols: [], is_default: true }], default_view: 'table' },
  'db-team': { id: 'db-team', page_id: 'p-team', name: 'Team & Roles', columns: TEAM_COLS, rows: TEAM_ROWS, views: [{ id: 'tmv-all', database_id: 'db-team', name: 'All Members', type: 'table', icon: '👤', filters: [], sorts: [], hidden_cols: [], is_default: true }], default_view: 'table' },
};

// ─── PAGE → DATABASE MAP ──────────────────────────────────────────────────────
export const PAGE_DB_MAP: Record<string, string> = {
  'p-todo': 'db-todo',
  'p-clients': 'db-clients',
  'p-projects': 'db-projects',
  'p-meetings': 'db-meetings',
  'p-companies': 'db-companies',
  'p-costs': 'db-costs',
  'p-passwords': 'db-passwords',
  'p-clubcrowd': 'db-clubcrowd',
  'p-team': 'db-team',
};

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
export const NOTIFICATIONS: Notification[] = [
  { id: 'n-1', type: 'due_soon', title: 'Task due tomorrow', body: 'ClubCrowd FINAL is due Mar 13', row_id: 'tr-12', read: false, created_at: '2026-06-02T08:00:00Z' },
  { id: 'n-2', type: 'meeting_soon', title: 'Meeting in 15 minutes', body: 'Onboarding call with Medikal Lux at 09:30', row_id: 'mr-1', read: false, created_at: '2026-06-02T09:15:00Z' },
  { id: 'n-3', type: 'assigned', title: 'New task assigned', body: 'EFZG Contract assigned to you', row_id: 'tr-7', read: true, created_at: '2026-06-01T14:00:00Z' },
];

// ─── SAMPLE COMMENTS ──────────────────────────────────────────────────────────
export const COMMENTS: Comment[] = [
  { id: 'cm-1', row_id: 'pr-1', user_id: 'u-1', body: 'Sent to Albert for review', created_at: '2026-06-01T14:23:00Z' },
  { id: 'cm-2', row_id: 'pr-1', user_id: 'u-2', body: 'Waiting on signature', created_at: '2026-06-02T09:10:00Z' },
];

// ─── ACTIVITY LOG ─────────────────────────────────────────────────────────────
export const ACTIVITIES: Activity[] = [
  { id: 'act-1', row_id: 'pr-1', user_id: 'u-1', action: 'updated', diff: { 'pc-status': { from: 'Not started', to: 'In progress' } }, created_at: '2026-06-01T10:00:00Z' },
  { id: 'act-2', row_id: 'pr-1', user_id: 'u-2', action: 'commented', created_at: '2026-06-02T09:10:00Z' },
];
