'use client';

import { useState } from 'react';
import { Database, Row, Column, ViewConfig, CellValue } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { applyCellFilter, formatDate, getStatusConfig, getPriorityConfig, getTagConfig, isOverdue } from '@/lib/utils';
import { IconPlus, IconCopy, IconCheck, IconTrash } from '@tabler/icons-react';

interface GalleryViewProps {
  database: Database;
  view: ViewConfig;
}

/**
 * Generic block/card view that works for ANY database — renders each row as a
 * card with its title field prominent and the other fields below. Replaces the
 * spreadsheet feel with a Notion-gallery look for every database.
 */
export function GalleryView({ database, view }: GalleryViewProps) {
  const { addRow, openRow, deleteRow } = useAppStore();
  const users = useAppStore(s => s.users);

  const cols = database.columns
    .filter(c => !c.hidden && !(view.hidden_cols ?? []).includes(c.id))
    .sort((a, b) => a.position - b.position);
  const titleCol = cols.find(c => c.position === 0) ?? cols[0];
  const bodyCols = cols.filter(c => c.id !== titleCol?.id);

  const rows = database.rows
    .filter(row => {
      const filters = view.filters ?? [];
      if (filters.length === 0) return true;
      return filters.every(f => applyCellFilter(row.cells[f.column_id] ?? null, f.operator, f.value));
    })
    .sort((a, b) => {
      const sorts = view.sorts ?? [];
      for (const s of sorts) {
        const av = a.cells[s.column_id], bv = b.cells[s.column_id];
        const cmp = String(av ?? '').localeCompare(String(bv ?? ''), undefined, { numeric: true });
        if (cmp !== 0) return s.direction === 'desc' ? -cmp : cmp;
      }
      return a.position - b.position;
    });

  const handleAdd = () => {
    const row = addRow(database.id);
    openRow(row.id, database.id);
  };

  const titleOf = (row: Row) => {
    if (!titleCol) return 'Untitled';
    const v = row.cells[titleCol.id];
    return v !== null && v !== undefined && v !== '' ? String(v) : 'Untitled';
  };

  const accentOf = (row: Row): string => {
    // Pick an accent colour from a status/select/priority field if present
    const statusCol = cols.find(c => c.type === 'status');
    if (statusCol) {
      const v = String(row.cells[statusCol.id] ?? '');
      const opt = statusCol.config.options?.find(o => o.label === v);
      if (opt) return opt.color;
      if (v) return getStatusConfig(v).color;
    }
    return 'var(--color-accent)';
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', background: 'var(--color-bg-base)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
        {rows.map(row => {
          const accent = accentOf(row);
          const initial = titleOf(row).trim().charAt(0).toUpperCase() || '•';
          return (
            <div
              key={row.id}
              onClick={() => openRow(row.id, database.id)}
              style={{
                background: 'var(--color-bg-elevated)',
                border: '0.5px solid var(--color-border-default)',
                borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
                boxShadow: '0 2px 12px rgba(0,0,0,0.22)',
                transition: 'border-color 120ms, box-shadow 120ms, transform 120ms',
                position: 'relative',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.boxShadow = `0 8px 28px ${accent}25`; e.currentTarget.style.transform = 'translateY(-2px)'; (e.currentTarget.querySelector('.row-delete-btn') as HTMLElement | null)?.style.setProperty('opacity', '1'); }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border-default)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.22)'; e.currentTarget.style.transform = 'translateY(0)'; (e.currentTarget.querySelector('.row-delete-btn') as HTMLElement | null)?.style.setProperty('opacity', '0'); }}
            >
              {/* Delete button — top-right corner, visible on hover */}
              <button
                className="row-delete-btn"
                onClick={e => { e.stopPropagation(); deleteRow(database.id, row.id); }}
                title="Delete record"
                style={{ position: 'absolute', top: 10, right: 10, zIndex: 2, width: 26, height: 26, borderRadius: 6, border: 'none', background: 'var(--color-bg-active)', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 120ms, color 120ms, background 120ms' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-red)'; e.currentTarget.style.background = 'var(--color-red-bg)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.background = 'var(--color-bg-active)'; }}
              >
                <IconTrash size={13} />
              </button>
              {/* Accent strip */}
              <div style={{ height: 4, background: accent, opacity: 0.85 }} />
              <div style={{ padding: '14px 16px' }}>
                {/* Title row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: bodyCols.length ? 12 : 0 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: `${accent}22`, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, flexShrink: 0 }}>{initial}</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.25, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {titleOf(row)}
                  </div>
                </div>

                {/* Body fields */}
                {bodyCols.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {bodyCols.slice(0, 7).map(col => {
                      const node = renderField(col, row.cells[col.id] ?? null, users);
                      if (node === null) return null;
                      return (
                        <div key={col.id} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          <span style={{ fontSize: 10, color: 'var(--color-text-muted)', minWidth: 76, maxWidth: 76, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>{col.name}</span>
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Add card */}
        <div
          onClick={handleAdd}
          style={{
            border: '1.5px dashed var(--color-border-default)', borderRadius: 12,
            minHeight: 96, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 8, color: 'var(--color-text-muted)', cursor: 'pointer', transition: 'border-color 120ms, color 120ms',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-accent-bright)'; e.currentTarget.style.color = 'var(--color-accent-bright)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border-default)'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
        >
          <div style={{ width: 32, height: 32, borderRadius: 9, border: '1.5px dashed currentColor', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconPlus size={16} /></div>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Add</span>
        </div>
      </div>
    </div>
  );
}

// ── Lightweight field renderer (a compact version of DisplayCell) ─────────────
function renderField(col: Column, value: CellValue, users: { id: string; name: string; initials: string; color: string; avatar_url?: string }[]): React.ReactNode {
  if (value === null || value === undefined || value === '') return null;
  if (Array.isArray(value) && value.length === 0) return null;

  const chip = (label: string, color: string) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, background: `${color}22`, color, fontSize: 10, fontWeight: 600 }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />{label}
    </span>
  );

  switch (col.type) {
    case 'status': {
      const opt = col.config.options?.find(o => o.label === String(value));
      const color = opt?.color ?? getStatusConfig(String(value)).color;
      return chip(String(value), color);
    }
    case 'priority': {
      const opt = col.config.options?.find(o => o.label === String(value));
      const color = opt?.color ?? getPriorityConfig(String(value)).color;
      return chip(String(value), color);
    }
    case 'select': {
      const opt = col.config.options?.find(o => o.label === String(value));
      return (
        <span style={{ padding: '2px 8px', borderRadius: 20, background: opt?.color ? `${opt.color}22` : 'var(--color-bg-active)', color: opt?.color ?? 'var(--color-text-secondary)', fontSize: 10, fontWeight: 600 }}>{String(value)}</span>
      );
    }
    case 'multi_select':
    case 'tags': {
      const arr = value as string[];
      return (
        <span style={{ display: 'inline-flex', gap: 4, overflow: 'hidden' }}>
          {arr.slice(0, 3).map(t => {
            const opt = col.config.options?.find(o => o.label === t);
            const cfg = opt ? { color: opt.color, bg: `${opt.color}22` } : getTagConfig(t);
            return <span key={t} style={{ padding: '1px 7px', borderRadius: 20, background: cfg.bg, color: cfg.color, fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap' }}>{t}</span>;
          })}
          {arr.length > 3 && <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>+{arr.length - 3}</span>}
        </span>
      );
    }
    case 'date':
    case 'date_range': {
      const str = String(value);
      const overdue = isOverdue(str);
      return <span style={{ color: overdue ? 'var(--color-red)' : 'var(--color-text-secondary)' }}>{formatDate(str)}</span>;
    }
    case 'person': {
      const u = users.find(x => x.id === String(value));
      if (!u) return String(value);
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          {u.avatar_url
            ? <img src={u.avatar_url} alt={u.initials} style={{ width: 16, height: 16, borderRadius: '50%', objectFit: 'cover' }} />
            : <span style={{ width: 16, height: 16, borderRadius: '50%', background: u.color, color: '#fff', fontSize: 8, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{u.initials}</span>}
          {u.name}
        </span>
      );
    }
    case 'checkbox':
      return value ? <span style={{ color: 'var(--color-green)' }}>✓ Yes</span> : <span style={{ color: 'var(--color-text-muted)' }}>—</span>;
    case 'number': {
      const prefix = col.config.prefix ?? '';
      const suffix = col.config.suffix ?? '';
      return <span>{prefix}{Number(value).toLocaleString()}{suffix}</span>;
    }
    case 'url':
      return <span style={{ color: 'var(--color-accent)' }}>{String(value).replace(/^https?:\/\//, '')}</span>;
    case 'email':
    case 'phone':
      return <span style={{ color: 'var(--color-accent)' }}>{String(value)}</span>;
    case 'password':
      return <PasswordField value={String(value)} />;
    default:
      return <span>{String(value)}</span>;
  }
}

// ── Password field — reveals on hover, copy-to-clipboard button ───────────────
function PasswordField({ value }: { value: string }) {
  const [hovered, setHovered] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    }).catch(() => { /* ignore */ });
  };

  return (
    <span
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => e.stopPropagation()}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0, maxWidth: '100%' }}
    >
      <span style={{
        fontFamily: hovered ? 'var(--font-mono)' : 'var(--font-sans)',
        letterSpacing: hovered ? 0 : 1,
        color: hovered ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        minWidth: 0, flexShrink: 1,
      }}>
        {hovered ? value : '•'.repeat(Math.min(Math.max(value.length, 6), 12))}
      </span>
      <button
        onClick={copy}
        title={copied ? 'Copied!' : 'Copy password'}
        style={{
          flexShrink: 0, width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 5, border: 'none', background: 'none', cursor: 'pointer',
          color: copied ? 'var(--color-green)' : 'var(--color-text-muted)', transition: 'color 80ms',
        }}
        onMouseEnter={(e) => { if (!copied) e.currentTarget.style.color = 'var(--color-accent-bright)'; }}
        onMouseLeave={(e) => { if (!copied) e.currentTarget.style.color = 'var(--color-text-muted)'; }}
      >
        {copied ? <IconCheck size={13} /> : <IconCopy size={13} />}
      </button>
    </span>
  );
}
