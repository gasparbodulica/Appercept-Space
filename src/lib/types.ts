// ─── Column Types ───────────────────────────────────────────────────────────
export type ColumnType =
  | 'text' | 'number' | 'select' | 'multi_select' | 'status' | 'priority'
  | 'date' | 'date_range' | 'person' | 'relation' | 'url' | 'email'
  | 'phone' | 'checkbox' | 'file' | 'formula' | 'tags' | 'password';

export type StatusValue = 'Not started' | 'In progress' | 'Started' | 'Done' | 'Completed' | 'Blocked';
export type PriorityValue = 'High' | 'Medium' | 'Low';

export interface SelectOption {
  id: string;
  label: string;
  color: string;
}

export interface ColumnConfig {
  options?: SelectOption[];
  relation_db_id?: string;
  formula?: string;
  prefix?: string;
  suffix?: string;
}

// ─── Core Entities ──────────────────────────────────────────────────────────
export interface Workspace {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  created_at: string;
}

export interface User {
  id: string;
  workspace_id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role: 'admin' | 'member' | 'viewer';
  initials: string;
  color: string;
}

// A login account. Access is gated: only `approved` accounts can enter.
export interface Account {
  id: string;
  name: string;
  email: string;
  password: string;     // demo only — plaintext in localStorage
  approved: boolean;    // admin must grant access before they can enter
  role: 'admin' | 'member' | 'viewer' | 'client';
  client_company?: string; // for role 'client' — the only portal they can see
  initials: string;
  color: string;
  avatar_url?: string;
  created_at: string;
}

export type PageType =
  | 'todo' | 'clients' | 'projects' | 'meetings' | 'companies' | 'costs'
  | 'files' | 'passwords' | 'clubcrowd' | 'custom' | 'dashboard';

export interface Page {
  id: string;
  workspace_id: string;
  parent_id?: string;
  title: string;
  icon: string;
  iconColor?: string;
  type: PageType;
  position: number;
  slug: string;
  badge?: number;
  is_active?: boolean;
  favorite?: boolean;
  owner_id?: string; // if set, this page is private and only visible to that user
}

export interface Column {
  id: string;
  database_id: string;
  name: string;
  type: ColumnType;
  position: number;
  config: ColumnConfig;
  hidden: boolean;
  width: number;
}

export interface Row {
  id: string;
  database_id: string;
  position: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  cells: Record<string, CellValue>;
}

export type CellValue = string | number | boolean | string[] | null;

export interface Relation {
  id: string;
  from_row_id: string;
  to_row_id: string;
  from_col_id: string;
  to_col_id: string;
}

export type ViewType = 'table' | 'board' | 'calendar' | 'list' | 'gallery' | 'dashboard';

export interface ViewConfig {
  id: string;
  database_id: string;
  name: string;
  type: ViewType;
  icon: string;
  filters: Filter[];
  sorts: Sort[];
  hidden_cols: string[];
  is_default?: boolean;
}

export interface Filter {
  id: string;
  column_id: string;
  operator: string;
  value: CellValue;
}

export interface Sort {
  column_id: string;
  direction: 'asc' | 'desc';
}

export interface Database {
  id: string;
  page_id: string;
  name: string;
  columns: Column[];
  rows: Row[];
  views: ViewConfig[];
  default_view: ViewType;
}

export interface Comment {
  id: string;
  row_id: string;
  user_id: string;
  body: string;
  parent_id?: string;
  created_at: string;
}

export interface Activity {
  id: string;
  row_id: string;
  user_id: string;
  action: 'created' | 'updated' | 'deleted' | 'commented' | 'related';
  diff?: Record<string, { from: CellValue; to: CellValue }>;
  created_at: string;
}

export interface FileEntry {
  id: string;
  workspace_id: string;
  row_id?: string;
  name: string;
  url: string;
  size: number;
  mime_type: string;
  uploaded_by: string;
  created_at: string;
}

export interface Notification {
  id: string;
  type: 'assigned' | 'due_soon' | 'meeting_soon' | 'mention' | 'relation';
  title: string;
  body: string;
  row_id?: string;
  read: boolean;
  created_at: string;
}

// ─── Messaging (Teams-like) ───────────────────────────────────────────────────
export interface Channel {
  id: string;
  kind: 'channel' | 'dm';   // group channel or direct message
  name: string;             // group name; for DMs derived from the other person
  description?: string;
  emoji?: string;
  color?: string;
  member_ids: string[];     // user ids
  created_by: string;
  created_at: string;
}

export interface ChatAttachment {
  kind: 'image' | 'file';
  name: string;
  url: string;        // data URL
  size?: number;      // bytes
  mime?: string;
}

export interface ChatDbRef {
  page_slug: string;  // where to navigate
  database_id: string;
  row_id: string;
  label: string;      // human-readable, e.g. "Projects · ClubCrowd FINAL"
  detail?: string;    // optional column value
}

export interface ChatMessage {
  id: string;
  channel_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  attachment?: ChatAttachment;
  dbref?: ChatDbRef;
}

// ─── Revenue Sharing ──────────────────────────────────────────────────────────

/** A team member (or external collaborator) and their default revenue share. */
export interface TeamRole {
  id: string;
  name: string;           // display name, e.g. "Gašpar Bodulica" or "Freelance Designer"
  user_id?: string;       // linked workspace user id (optional)
  role_title: string;     // e.g. "Lead", "Developer", "Designer", "External"
  default_share: number;  // default % of project revenue (0–100)
  is_external: boolean;   // external collaborators are ad-hoc, not full team
  color: string;
  created_at: string;
}

/** A recorded payout calculation for a specific job/project. */
export interface ProjectShare {
  id: string;
  label: string;           // e.g. "Medikal Lux — Voice Bot Implementation"
  billing_company?: string; // which of your companies invoiced this (e.g. 'Appercept' or 'Egzosfera obrt')
  total_amount: number;    // gross revenue from this job
  company_share: number;   // % that stays in the billing company
  entries: {
    role_id: string;
    name: string;
    share: number;          // % for this specific job (may differ from default)
    amount: number;         // computed: total_amount * share / 100
  }[];
  company_amount: number;  // computed: what stays in Appercept
  created_at: string;
}

// ─── Team Availability (absences / out-of-office) ────────────────────────────
export interface AbsenceEntry {
  id: string;
  user_id: string;
  title: string;       // e.g. "Out of office", "Sick leave", "Vacation"
  date_start: string;  // YYYY-MM-DD
  date_end: string;    // YYYY-MM-DD (same as start for single day)
  note?: string;
  created_at: string;
}

// ─── Client Portal (Q&A between a client and the team) ────────────────────────
export interface PortalMessage {
  id: string;
  client: string;        // company name key (e.g. "Medikal Lux d.o.o.")
  from: 'client' | 'team';
  sender_id?: string;    // team member id when from === 'team'
  body: string;
  created_at: string;
}
