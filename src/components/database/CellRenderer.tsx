'use client';

import { useState, useRef, useEffect } from 'react';
import { Column, Row, CellValue } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { USERS } from '@/lib/seed';
import { formatDate, getStatusConfig, getPriorityConfig, getTagConfig, isOverdue } from '@/lib/utils';

interface CellProps {
  column: Column;
  row: Row;
  databaseId: string;
  isEditing: boolean;
  onStartEdit: () => void;
  onEndEdit: () => void;
  onTab: (shift: boolean) => void;
}

export function CellRenderer({ column, row, databaseId, isEditing, onStartEdit, onEndEdit, onTab }: CellProps) {
  const { updateCell } = useAppStore();
  const value = row.cells[column.id] ?? null;

  const handleChange = (newValue: CellValue) => {
    updateCell(databaseId, row.id, column.id, newValue);
  };

  if (isEditing) {
    return (
      <EditCell
        column={column}
        value={value}
        onChange={handleChange}
        onBlur={onEndEdit}
        onTab={onTab}
      />
    );
  }

  return (
    <DisplayCell column={column} row={row} databaseId={databaseId} value={value} onClick={onStartEdit} />
  );
}

// ─── Display ───────────────────────────────────────────────────────────────────

function DisplayCell({ column, row, databaseId, value, onClick }: { column: Column; row: Row; databaseId: string; value: CellValue; onClick: () => void }) {
  const style: React.CSSProperties = {
    display: 'flex', alignItems: 'center', width: '100%', height: '100%',
    padding: '0 10px', cursor: 'text', userSelect: 'none', overflow: 'hidden',
    fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)',
  };

  switch (column.type) {
    case 'status': {
      if (!value) return <div style={style} onClick={onClick} />;
      const cfg = getStatusConfig(String(value));
      return (
        <div style={style} onClick={onClick}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '2px 8px', borderRadius: 4,
            background: cfg.bg, color: cfg.color,
            fontSize: 'var(--text-xs)', fontWeight: 500, whiteSpace: 'nowrap',
          }}>
            <span style={{ fontSize: 10 }}>{cfg.icon}</span> {String(value)}
          </span>
        </div>
      );
    }

    case 'priority': {
      if (!value) return <div style={style} onClick={onClick} />;
      const cfg = getPriorityConfig(String(value));
      return (
        <div style={style} onClick={onClick}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 8px', borderRadius: 4,
            background: cfg.bg, color: cfg.color,
            fontSize: 'var(--text-xs)', fontWeight: 500, whiteSpace: 'nowrap',
          }}>
            {String(value)}
          </span>
        </div>
      );
    }

    case 'select': {
      if (!value) return <div style={style} onClick={onClick} />;
      const opt = column.config.options?.find((o) => o.label === String(value));
      return (
        <div style={style} onClick={onClick}>
          <span style={{
            padding: '2px 8px', borderRadius: 4,
            background: opt?.color ? `${opt.color}22` : 'var(--color-bg-active)',
            color: opt?.color ?? 'var(--color-text-secondary)',
            fontSize: 'var(--text-xs)', fontWeight: 500,
          }}>{String(value)}</span>
        </div>
      );
    }

    case 'multi_select':
    case 'tags': {
      if (!value || !Array.isArray(value) || value.length === 0) return <div style={style} onClick={onClick} />;
      return (
        <div style={{ ...style, gap: 4, flexWrap: 'nowrap', overflow: 'hidden' }} onClick={onClick}>
          {(value as string[]).map((tag) => {
            const cfg = getTagConfig(tag);
            return (
              <span key={tag} style={{
                padding: '1px 6px', borderRadius: 4,
                background: cfg.bg, color: cfg.color,
                fontSize: 'var(--text-xs)', fontWeight: 500, flexShrink: 0,
              }}>{tag}</span>
            );
          })}
        </div>
      );
    }

    case 'date':
    case 'date_range': {
      if (!value) return <div style={style} onClick={onClick} />;
      const str = String(value);
      const overdue = isOverdue(str);
      return (
        <div style={{ ...style, color: overdue ? 'var(--color-red)' : 'var(--color-text-secondary)' }} onClick={onClick}>
          {formatDate(str)}
        </div>
      );
    }

    case 'person': {
      if (!value) return <div style={style} onClick={onClick} />;
      const user = USERS.find((u) => u.id === String(value));
      if (!user) return <div style={style} onClick={onClick}><span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>{String(value)}</span></div>;
      return (
        <div style={{ ...style, gap: 6 }} onClick={onClick}>
          <div style={{
            width: 20, height: 20, borderRadius: '50%', background: user.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 9, fontWeight: 700, flexShrink: 0,
          }}>{user.initials}</div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</span>
        </div>
      );
    }

    case 'checkbox': {
      return (
        <div style={{ ...style, justifyContent: 'center' }} onClick={() => {
          useAppStore.getState().updateCell(databaseId, row.id, column.id, !value);
        }}>
          <div style={{
            width: 16, height: 16, borderRadius: 4,
            border: `1.5px solid ${value ? 'var(--color-accent)' : 'var(--color-border-strong)'}`,
            background: value ? 'var(--color-accent)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {value && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>✓</span>}
          </div>
        </div>
      );
    }

    case 'number': {
      if (value === null || value === undefined || value === '') return <div style={style} onClick={onClick} />;
      const prefix = column.config.prefix ?? '';
      const suffix = column.config.suffix ?? '';
      return (
        <div style={{ ...style, justifyContent: 'flex-end', color: 'var(--color-text-secondary)' }} onClick={onClick}>
          {prefix}{Number(value).toLocaleString()}{suffix}
        </div>
      );
    }

    case 'url': {
      if (!value) return <div style={style} onClick={onClick} />;
      const url = String(value);
      return (
        <div style={style} onClick={onClick}>
          <a href={url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
            style={{ color: 'var(--color-accent)', fontSize: 'var(--text-xs)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {url.replace(/^https?:\/\//, '')}
          </a>
        </div>
      );
    }

    case 'email': {
      if (!value) return <div style={style} onClick={onClick} />;
      return (
        <div style={style} onClick={onClick}>
          <a href={`mailto:${value}`} onClick={(e) => e.stopPropagation()}
            style={{ color: 'var(--color-accent)', fontSize: 'var(--text-xs)', textDecoration: 'none' }}>
            {String(value)}
          </a>
        </div>
      );
    }

    case 'phone': {
      if (!value) return <div style={style} onClick={onClick} />;
      return (
        <div style={style} onClick={onClick}>
          <a href={`tel:${value}`} onClick={(e) => e.stopPropagation()}
            style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', textDecoration: 'none' }}>
            {String(value)}
          </a>
        </div>
      );
    }

    default: {
      return (
        <div style={{ ...style, color: value ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }} onClick={onClick}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {value !== null && value !== undefined && value !== '' ? String(value) : ''}
          </span>
        </div>
      );
    }
  }
}

// ─── Editable Cell ─────────────────────────────────────────────────────────────

function EditCell({ column, value, onChange, onBlur, onTab }: {
  column: Column;
  value: CellValue;
  onChange: (v: CellValue) => void;
  onBlur: () => void;
  onTab: (shift: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);

  const keyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onBlur(); }
    if (e.key === 'Tab') { e.preventDefault(); onTab(e.shiftKey); }
    if (e.key === 'Enter') { onBlur(); }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', height: '100%', padding: '0 10px',
    background: 'var(--color-bg-input)', border: 'none', outline: 'none',
    color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-sans)',
  };

  if (column.type === 'status') {
    const options = ['Not started', 'In progress', 'Started', 'Done', 'Blocked'];
    return <SelectDropdown options={options} value={String(value ?? '')} onChange={onChange} onClose={onBlur} getColor={getStatusConfig} />;
  }

  if (column.type === 'priority') {
    const options = ['High', 'Medium', 'Low'];
    return <SelectDropdown options={options} value={String(value ?? '')} onChange={onChange} onClose={onBlur} getColor={getPriorityConfig} />;
  }

  if (column.type === 'select' && column.config.options) {
    return <SelectDropdown
      options={column.config.options.map((o) => o.label)}
      value={String(value ?? '')}
      onChange={onChange}
      onClose={onBlur}
    />;
  }

  if (column.type === 'multi_select' || column.type === 'tags') {
    const tagOptions = column.type === 'tags'
      ? ['IG', 'TT', 'LIN', 'Dev', 'Contract', 'Call', 'Info', 'PPTX']
      : (column.config.options?.map((o) => o.label) ?? []);
    const selected = Array.isArray(value) ? (value as string[]) : [];
    return (
      <MultiSelectDropdown
        options={tagOptions}
        selected={selected}
        onChange={onChange}
        onClose={onBlur}
        getColor={getTagConfig}
      />
    );
  }

  if (column.type === 'person') {
    return (
      <PersonDropdown
        value={String(value ?? '')}
        onChange={onChange}
        onClose={onBlur}
      />
    );
  }

  if (column.type === 'checkbox') {
    onChange(!value);
    onBlur();
    return null;
  }

  if (column.type === 'date' || column.type === 'date_range') {
    const dateVal = value ? String(value).split('|')[0] : '';
    return (
      <input
        ref={inputRef}
        type="date"
        defaultValue={dateVal}
        onKeyDown={keyDown}
        onBlur={(e) => { onChange(e.target.value || null); onBlur(); }}
        onChange={(e) => onChange(e.target.value || null)}
        style={{ ...inputStyle, colorScheme: 'dark' }}
      />
    );
  }

  if (column.type === 'number') {
    return (
      <input
        ref={inputRef}
        type="number"
        defaultValue={value !== null && value !== undefined ? String(value) : ''}
        onKeyDown={keyDown}
        onBlur={(e) => { onChange(e.target.value !== '' ? Number(e.target.value) : null); onBlur(); }}
        style={inputStyle}
      />
    );
  }

  return (
    <input
      ref={inputRef}
      type={column.type === 'email' ? 'email' : column.type === 'phone' ? 'tel' : column.type === 'url' ? 'url' : 'text'}
      defaultValue={value !== null && value !== undefined ? String(value) : ''}
      onKeyDown={keyDown}
      onBlur={(e) => { onChange(e.target.value || null); onBlur(); }}
      style={inputStyle}
    />
  );
}

// ─── Dropdown helpers ──────────────────────────────────────────────────────────

function SelectDropdown({ options, value, onChange, onClose, getColor }: {
  options: string[];
  value: string;
  onChange: (v: CellValue) => void;
  onClose: () => void;
  getColor?: (v: string) => { color: string; bg: string; icon?: string };
}) {
  return (
    <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 100 }} onClick={onClose} />
      <div style={{
        position: 'absolute', top: '100%', left: 0, zIndex: 101,
        background: 'var(--color-bg-surface)', border: '0.5px solid var(--color-border-default)',
        borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', minWidth: 160, overflow: 'hidden',
      }}>
        {options.map((opt) => {
          const cfg = getColor?.(opt);
          const active = opt === value;
          return (
            <div key={opt}
              onClick={() => { onChange(opt); onClose(); }}
              style={{
                padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                background: active ? 'var(--color-bg-active)' : 'transparent',
                transition: 'background 80ms',
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              {cfg && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '2px 8px', borderRadius: 4,
                  background: cfg.bg, color: cfg.color, fontSize: 'var(--text-xs)', fontWeight: 500,
                }}>
                  {cfg.icon && <span style={{ fontSize: 10 }}>{cfg.icon}</span>}{opt}
                </span>
              )}
              {!cfg && <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>{opt}</span>}
              {active && <span style={{ marginLeft: 'auto', color: 'var(--color-accent)' }}>✓</span>}
            </div>
          );
        })}
        <div
          onClick={() => { onChange(null); onClose(); }}
          style={{ padding: '8px 12px', cursor: 'pointer', borderTop: '0.5px solid var(--color-border-subtle)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >Clear</div>
      </div>
    </div>
  );
}

function MultiSelectDropdown({ options, selected, onChange, onClose, getColor }: {
  options: string[];
  selected: string[];
  onChange: (v: CellValue) => void;
  onClose: () => void;
  getColor?: (v: string) => { color: string; bg: string };
}) {
  const toggle = (opt: string) => {
    const next = selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt];
    onChange(next.length > 0 ? next : null);
  };

  return (
    <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 100 }} onClick={onClose} />
      <div style={{
        position: 'absolute', top: '100%', left: 0, zIndex: 101,
        background: 'var(--color-bg-surface)', border: '0.5px solid var(--color-border-default)',
        borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', minWidth: 160, overflow: 'hidden',
      }}>
        {options.map((opt) => {
          const cfg = getColor?.(opt);
          const active = selected.includes(opt);
          return (
            <div key={opt}
              onClick={() => toggle(opt)}
              style={{
                padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                background: active ? 'var(--color-bg-active)' : 'transparent',
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = active ? 'var(--color-bg-active)' : 'transparent'; }}
            >
              <div style={{
                width: 14, height: 14, borderRadius: 3,
                border: `1.5px solid ${active ? 'var(--color-accent)' : 'var(--color-border-strong)'}`,
                background: active ? 'var(--color-accent)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {active && <span style={{ color: '#fff', fontSize: 9, fontWeight: 700 }}>✓</span>}
              </div>
              {cfg ? (
                <span style={{ padding: '1px 6px', borderRadius: 4, background: cfg.bg, color: cfg.color, fontSize: 'var(--text-xs)', fontWeight: 500 }}>{opt}</span>
              ) : (
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>{opt}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PersonDropdown({ value, onChange, onClose }: {
  value: string;
  onChange: (v: CellValue) => void;
  onClose: () => void;
}) {
  return (
    <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 100 }} onClick={onClose} />
      <div style={{
        position: 'absolute', top: '100%', left: 0, zIndex: 101,
        background: 'var(--color-bg-surface)', border: '0.5px solid var(--color-border-default)',
        borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', minWidth: 200, overflow: 'hidden',
      }}>
        {USERS.map((user) => {
          const active = user.id === value;
          return (
            <div key={user.id}
              onClick={() => { onChange(user.id); onClose(); }}
              style={{
                padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                background: active ? 'var(--color-bg-active)' : 'transparent',
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = active ? 'var(--color-bg-active)' : 'transparent'; }}
            >
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: user.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 9, fontWeight: 700 }}>{user.initials}</div>
              <div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>{user.name}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{user.email}</div>
              </div>
              {active && <span style={{ marginLeft: 'auto', color: 'var(--color-accent)' }}>✓</span>}
            </div>
          );
        })}
        <div
          onClick={() => { onChange(null); onClose(); }}
          style={{ padding: '8px 12px', cursor: 'pointer', borderTop: '0.5px solid var(--color-border-subtle)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >Clear</div>
      </div>
    </div>
  );
}
