import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CellValue, StatusValue, PriorityValue } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  // Handle date_range format "2026-03-08|2026-03-15"
  if (dateStr.includes('|')) {
    const [from, to] = dateStr.split('|');
    return `${formatSingleDate(from)} → ${formatSingleDate(to)}`;
  }
  return formatSingleDate(dateStr);
}

function formatSingleDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T12:00:00'));
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) +
      ' · ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return dateStr;
  }
}

export function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const diff = now.getTime() - then.getTime();
  const hours = diff / (1000 * 60 * 60);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${Math.floor(hours)}h ago`;
  if (hours < 48) return 'Yesterday';
  return formatSingleDate(dateStr);
}

export function isOverdue(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const dateToCheck = dateStr.includes('|') ? dateStr.split('|')[0] : dateStr;
  return new Date(dateToCheck) < new Date();
}

export function getStatusConfig(status: string): { color: string; bg: string; icon: string } {
  switch (status as StatusValue) {
    case 'Done':        return { color: 'var(--color-green)',  bg: 'var(--color-green-bg)',  icon: '✓' };
    case 'Completed':   return { color: 'var(--color-green)',  bg: 'var(--color-green-bg)',  icon: '✓' };
    case 'In progress': return { color: 'var(--color-amber)',  bg: 'var(--color-amber-bg)',  icon: '◐' };
    case 'Started':     return { color: 'var(--color-orange)', bg: 'var(--color-orange-bg)', icon: '▶' };
    case 'Blocked':     return { color: 'var(--color-red)',    bg: 'var(--color-red-bg)',    icon: '✕' };
    case 'Not started': return { color: 'var(--color-gray)',   bg: 'var(--color-gray-bg)',   icon: '○' };
    default:            return { color: 'var(--color-gray)',   bg: 'var(--color-gray-bg)',   icon: '○' };
  }
}

export function getPriorityConfig(priority: string): { color: string; bg: string; icon: string } {
  switch (priority as PriorityValue) {
    case 'High':   return { color: 'var(--color-red)',   bg: 'var(--color-red-bg)',   icon: '↑↑' };
    case 'Medium': return { color: 'var(--color-amber)', bg: 'var(--color-amber-bg)', icon: '↑' };
    case 'Low':    return { color: 'var(--color-gray)',  bg: 'var(--color-gray-bg)',  icon: '↓' };
    default:       return { color: 'var(--color-gray)',  bg: 'var(--color-gray-bg)',  icon: '—' };
  }
}

export function getTagConfig(tag: string): { color: string; bg: string } {
  const map: Record<string, { color: string; bg: string }> = {
    IG:       { color: 'var(--color-pink)',   bg: 'var(--color-pink-bg)' },
    TT:       { color: 'var(--color-teal)',   bg: 'var(--color-teal-bg)' },
    LIN:      { color: 'var(--color-accent)', bg: 'var(--color-accent-subtle)' },
    Dev:      { color: 'var(--color-purple)', bg: 'var(--color-purple-bg)' },
    Contract: { color: 'var(--color-amber)',  bg: 'var(--color-amber-bg)' },
    Call:     { color: 'var(--color-orange)', bg: 'var(--color-orange-bg)' },
    Info:     { color: 'var(--color-green)',  bg: 'var(--color-green-bg)' },
    PPTX:     { color: 'var(--color-red)',    bg: 'var(--color-red-bg)' },
  };
  return map[tag] ?? { color: 'var(--color-gray)', bg: 'var(--color-gray-bg)' };
}

export function formatCurrency(value: number, prefix = '€'): string {
  return `${prefix}${value.toLocaleString('en-US')}`;
}

export function applyCellFilter(cellValue: CellValue, operator: string, filterValue: CellValue): boolean {
  const cell = cellValue ?? '';
  const filter = filterValue ?? '';
  switch (operator) {
    case 'contains': return String(cell).toLowerCase().includes(String(filter).toLowerCase());
    case 'does_not_contain': return !String(cell).toLowerCase().includes(String(filter).toLowerCase());
    case 'is': return String(cell) === String(filter);
    case 'is_not': return String(cell) !== String(filter);
    case 'starts_with': return String(cell).toLowerCase().startsWith(String(filter).toLowerCase());
    case 'is_empty': return cell === null || cell === '' || (Array.isArray(cell) && cell.length === 0);
    case 'is_not_empty': return cell !== null && cell !== '' && !(Array.isArray(cell) && cell.length === 0);
    case 'is_checked': return cell === true;
    case 'is_unchecked': return cell !== true;
    case 'is_me': return true; // simplified — matches current user
    case '>': return Number(cell) > Number(filter);
    case '<': return Number(cell) < Number(filter);
    case '>=': return Number(cell) >= Number(filter);
    case '<=': return Number(cell) <= Number(filter);
    default: return true;
  }
}
