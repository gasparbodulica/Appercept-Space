// ─── Column Types ───────────────────────────────────────────────────────────
export type ColumnType =
  | 'text' | 'number' | 'select' | 'multi_select' | 'status' | 'priority'
  | 'date' | 'date_range' | 'person' | 'relation' | 'url' | 'email'
  | 'phone' | 'checkbox' | 'file' | 'formula' | 'tags';

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
