'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Column, Row, CellValue } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { formatDate, getStatusConfig, getPriorityConfig, getTagConfig, isOverdue } from '@/lib/utils';
import { IconSearch, IconX } from '@tabler/icons-react';

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
  const containerRef = useRef<HTMLDivElement>(null);
  // Captured synchronously in handleStartEdit so it's ready when isEditing renders
  const anchorRectRef = useRef<DOMRect | null>(null);

  const handleChange = useCallback((newValue: CellValue) => {
    updateCell(databaseId, row.id, column.id, newValue);
  }, [updateCell, databaseId, row.id, column.id]);

  const handleStartEdit = useCallback(() => {
    anchorRectRef.current = containerRef.current?.getBoundingClientRect() ?? null;
    onStartEdit();
  }, [onStartEdit]);

  return (
    <div ref={containerRef} style={{ height: '100%', width: '100%' }}>
      {isEditing ? (
        <EditCell column={column} value={value} onChange={handleChange} onBlur={onEndEdit} onTab={onTab} anchorRect={anchorRectRef.current} />
      ) : (
        <DisplayCell column={column} row={row} databaseId={databaseId} value={value} onClick={handleStartEdit} />
      )}
    </div>
  );
}

// ─── Display ──────────────────────────────────────────────────────────────────

function DisplayCell({ column, row, databaseId, value, onClick }: { column: Column; row: Row; databaseId: string; value: CellValue; onClick: () => void }) {
  const style: React.CSSProperties = {
    display: 'flex', alignItems: 'center', width: '100%', height: '100%',
    padding: '0 10px', cursor: 'pointer', userSelect: 'none', overflow: 'hidden',
    fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)',
  };

  switch (column.type) {
    case 'status': {
      if (!value) return <div style={{ ...style, color: 'var(--color-text-muted)' }} onClick={onClick}><span style={{ fontSize: 'var(--text-xs)' }}>—</span></div>;
      const cfg = getStatusConfig(String(value));
      return (
        <div style={style} onClick={onClick}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color, fontSize: 'var(--text-xs)', fontWeight: 500, whiteSpace: 'nowrap' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color, flexShrink: 0, display: 'block' }} />
            {String(value)}
          </span>
        </div>
      );
    }
    case 'priority': {
      if (!value) return <div style={{ ...style, color: 'var(--color-text-muted)' }} onClick={onClick}><span style={{ fontSize: 'var(--text-xs)' }}>—</span></div>;
      const cfg = getPriorityConfig(String(value));
      return (
        <div style={style} onClick={onClick}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color, fontSize: 'var(--text-xs)', fontWeight: 500 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color, flexShrink: 0, display: 'block' }} />
            {String(value)}
          </span>
        </div>
      );
    }
    case 'select': {
      if (!value) return <div style={style} onClick={onClick} />;
      const opt = column.config.options?.find(o => o.label === String(value));
      return (
        <div style={style} onClick={onClick}>
          <span style={{ padding: '3px 10px', borderRadius: 20, background: opt?.color ? `${opt.color}22` : 'var(--color-bg-active)', color: opt?.color ?? 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', fontWeight: 500 }}>
            {String(value)}
          </span>
        </div>
      );
    }
    case 'multi_select':
    case 'tags': {
      if (!value || !Array.isArray(value) || value.length === 0) return <div style={style} onClick={onClick} />;
      return (
        <div style={{ ...style, gap: 4, flexWrap: 'nowrap', overflow: 'hidden' }} onClick={onClick}>
          {(value as string[]).map(tag => {
            const cfg = getTagConfig(tag);
            return <span key={tag} style={{ padding: '2px 7px', borderRadius: 20, background: cfg.bg, color: cfg.color, fontSize: 'var(--text-xs)', fontWeight: 500, flexShrink: 0 }}>{tag}</span>;
          })}
        </div>
      );
    }
    case 'date':
    case 'date_range': {
      if (!value) return <div style={style} onClick={onClick} />;
      const str = String(value);
      const overdue = isOverdue(str);
      return <div style={{ ...style, color: overdue ? 'var(--color-red)' : 'var(--color-text-secondary)' }} onClick={onClick}>{formatDate(str)}</div>;
    }
    case 'person': {
      if (!value) return <div style={style} onClick={onClick} />;
      const users = useAppStore.getState().users;
      const user = users.find(u => u.id === String(value));
      if (!user) return <div style={style} onClick={onClick}><span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>{String(value)}</span></div>;
      return (
        <div style={{ ...style, gap: 6 }} onClick={onClick}>
          {user.avatar_url
            ? <img src={user.avatar_url} style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            : <div style={{ width: 20, height: 20, borderRadius: '50%', background: user.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{user.initials}</div>
          }
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</span>
        </div>
      );
    }
    case 'checkbox': {
      return (
        <div style={{ ...style, justifyContent: 'center', cursor: 'pointer' }} onClick={() => {
          useAppStore.getState().updateCell(databaseId, row.id, column.id, !value);
        }}>
          <div style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${value ? 'var(--color-accent)' : 'var(--color-border-strong)'}`, background: value ? 'var(--color-accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {value && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>✓</span>}
          </div>
        </div>
      );
    }
    case 'number': {
      if (value === null || value === undefined || value === '') return <div style={style} onClick={onClick} />;
      const prefix = column.config.prefix ?? '';
      const suffix = column.config.suffix ?? '';
      return <div style={{ ...style, justifyContent: 'flex-end', color: 'var(--color-text-secondary)' }} onClick={onClick}>{prefix}{Number(value).toLocaleString()}{suffix}</div>;
    }
    case 'url': {
      if (!value) return <div style={style} onClick={onClick} />;
      const url = String(value);
      return (
        <div style={style} onClick={onClick}>
          <a href={url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
            style={{ color: 'var(--color-accent)', fontSize: 'var(--text-xs)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {url.replace(/^https?:\/\//, '')}
          </a>
        </div>
      );
    }
    case 'email': {
      if (!value) return <div style={style} onClick={onClick} />;
      return <div style={style} onClick={onClick}><a href={`mailto:${value}`} onClick={e => e.stopPropagation()} style={{ color: 'var(--color-accent)', fontSize: 'var(--text-xs)', textDecoration: 'none' }}>{String(value)}</a></div>;
    }
    case 'phone': {
      if (!value) return <div style={style} onClick={onClick} />;
      return <div style={style} onClick={onClick}><a href={`tel:${value}`} onClick={e => e.stopPropagation()} style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', textDecoration: 'none' }}>{String(value)}</a></div>;
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

// ─── Edit cell ────────────────────────────────────────────────────────────────

function EditCell({ column, value, onChange, onBlur, onTab, anchorRect }: {
  column: Column;
  value: CellValue;
  onChange: (v: CellValue) => void;
  onBlur: () => void;
  onTab: (shift: boolean) => void;
  anchorRect: DOMRect | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);

  const keyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onBlur();
    if (e.key === 'Tab') { e.preventDefault(); onTab(e.shiftKey); }
    if (e.key === 'Enter') onBlur();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', height: '100%', padding: '0 10px',
    background: 'var(--color-bg-input)', border: 'none', outline: 'none',
    color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-sans)',
  };

  if (column.type === 'status') {
    const opts = ['Not started','In progress','Started','Done','Completed','Blocked'];
    return <SelectDropdown options={opts} value={String(value ?? '')} onChange={onChange} onClose={onBlur} anchorRect={anchorRect} getColor={getStatusConfig} />;
  }
  if (column.type === 'priority') {
    const opts = ['High','Medium','Low'];
    return <SelectDropdown options={opts} value={String(value ?? '')} onChange={onChange} onClose={onBlur} anchorRect={anchorRect} getColor={getPriorityConfig} />;
  }
  if (column.type === 'select' && column.config.options) {
    return <SelectDropdown options={column.config.options.map(o => o.label)} value={String(value ?? '')} onChange={onChange} onClose={onBlur} anchorRect={anchorRect}
      getColorFromOptions={column.config.options} />;
  }
  if (column.type === 'multi_select' || column.type === 'tags') {
    const tagOpts = column.type === 'tags'
      ? ['IG','TT','LIN','Dev','Contract','Call','Info','PPTX']
      : (column.config.options?.map(o => o.label) ?? []);
    const selected = Array.isArray(value) ? (value as string[]) : [];
    return <MultiSelectDropdown options={tagOpts} selected={selected} onChange={onChange} onClose={onBlur} anchorRect={anchorRect}
      getColor={column.type === 'tags' ? getTagConfig : undefined}
      getColorFromOptions={column.type !== 'tags' ? column.config.options : undefined} />;
  }
  if (column.type === 'person') {
    return <PersonDropdown value={String(value ?? '')} onChange={onChange} onClose={onBlur} anchorRect={anchorRect} />;
  }
  if (column.type === 'checkbox') {
    onChange(!value); onBlur(); return null;
  }
  if (column.type === 'date' || column.type === 'date_range') {
    const dateVal = value ? String(value).split('|')[0] : '';
    return <input ref={inputRef} type="date" defaultValue={dateVal} onKeyDown={keyDown} onBlur={e => { onChange(e.target.value || null); onBlur(); }} onChange={e => onChange(e.target.value || null)} style={{ ...inputStyle, colorScheme: 'dark' }} />;
  }
  if (column.type === 'number') {
    return <input ref={inputRef} type="number" defaultValue={value !== null && value !== undefined ? String(value) : ''} onKeyDown={keyDown} onBlur={e => { onChange(e.target.value !== '' ? Number(e.target.value) : null); onBlur(); }} style={inputStyle} />;
  }
  return <input ref={inputRef} type={column.type === 'email' ? 'email' : column.type === 'phone' ? 'tel' : column.type === 'url' ? 'url' : 'text'} defaultValue={value !== null && value !== undefined ? String(value) : ''} onKeyDown={keyDown} onBlur={e => { onChange(e.target.value || null); onBlur(); }} style={inputStyle} />;
}

// ─── Dropdown with fixed positioning ─────────────────────────────────────────

function DropdownPanel({ children, onClose, anchorRect, minWidth = 220 }: {
  children: React.ReactNode;
  onClose: () => void;
  anchorRect: DOMRect | null;
  minWidth?: number;
}) {
  const W = Math.max(minWidth, anchorRect?.width ?? 0);
  const H = 320;
  let top = (anchorRect?.bottom ?? 100) + 4;
  let left = anchorRect?.left ?? 0;
  if (typeof window !== 'undefined') {
    if (left + W > window.innerWidth - 8) left = window.innerWidth - W - 8;
    if (top + H > window.innerHeight - 8) top = (anchorRect?.top ?? 0) - H - 4;
  }

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={onClose} />
      <div style={{
        position: 'fixed', top, left, width: W, zIndex: 1000,
        background: 'var(--color-bg-surface)', border: '0.5px solid var(--color-border-default)',
        borderRadius: 8, boxShadow: '0 8px 40px rgba(0,0,0,0.55)', overflow: 'hidden',
      }}>
        {children}
      </div>
    </>
  );
}

function SearchInput({ value, onChange, placeholder = 'Search…' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', borderBottom: '0.5px solid var(--color-border-subtle)' }}>
      <IconSearch size={12} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
      <input autoFocus value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 'var(--text-xs)', color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)' }} />
      {value && <button onClick={() => onChange('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', padding: 0 }}><IconX size={11} /></button>}
    </div>
  );
}

// ─── Select dropdown ──────────────────────────────────────────────────────────

type ColorConfig = { color: string; bg: string; icon?: string };

function SelectDropdown({ options, value, onChange, onClose, anchorRect, getColor, getColorFromOptions }: {
  options: string[];
  value: string;
  onChange: (v: CellValue) => void;
  onClose: () => void;
  anchorRect: DOMRect | null;
  getColor?: (v: string) => ColorConfig;
  getColorFromOptions?: { id: string; label: string; color: string }[];
}) {
  const [q, setQ] = useState('');
  const filtered = q ? options.filter(o => o.toLowerCase().includes(q.toLowerCase())) : options;

  const getOptColor = (opt: string): ColorConfig | undefined => {
    if (getColor) return getColor(opt);
    const found = getColorFromOptions?.find(o => o.label === opt);
    if (found) return { color: found.color, bg: `${found.color}22` };
    return undefined;
  };

  return (
    <DropdownPanel onClose={onClose} anchorRect={anchorRect}>
      <SearchInput value={q} onChange={setQ} />
      <div style={{ maxHeight: 240, overflowY: 'auto' }}>
        {filtered.map(opt => {
          const cfg = getOptColor(opt);
          const active = opt === value;
          return (
            <div key={opt} onClick={() => { onChange(opt); onClose(); }}
              style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, background: active ? 'var(--color-bg-active)' : 'transparent', transition: 'background 60ms' }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              {cfg
                ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color, fontSize: 'var(--text-xs)', fontWeight: 500 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color, flexShrink: 0, display: 'block' }} />
                    {opt}
                  </span>
                : <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>{opt}</span>
              }
              {active && <span style={{ marginLeft: 'auto', color: 'var(--color-accent)', fontWeight: 700 }}>✓</span>}
            </div>
          );
        })}
        {filtered.length === 0 && <div style={{ padding: '14px', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textAlign: 'center' }}>No options</div>}
      </div>
      <div onClick={() => { onChange(null); onClose(); }}
        style={{ padding: '8px 12px', cursor: 'pointer', borderTop: '0.5px solid var(--color-border-subtle)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >Clear</div>
    </DropdownPanel>
  );
}

// ─── Multi-select dropdown ────────────────────────────────────────────────────

function MultiSelectDropdown({ options, selected, onChange, onClose, anchorRect, getColor, getColorFromOptions }: {
  options: string[];
  selected: string[];
  onChange: (v: CellValue) => void;
  onClose: () => void;
  anchorRect: DOMRect | null;
  getColor?: (v: string) => { color: string; bg: string };
  getColorFromOptions?: { id: string; label: string; color: string }[];
}) {
  const [q, setQ] = useState('');
  const filtered = q ? options.filter(o => o.toLowerCase().includes(q.toLowerCase())) : options;

  const toggle = (opt: string) => {
    const next = selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt];
    onChange(next.length > 0 ? next : null);
  };

  const getOptColor = (opt: string) => {
    if (getColor) return getColor(opt);
    const found = getColorFromOptions?.find(o => o.label === opt);
    if (found) return { color: found.color, bg: `${found.color}22` };
    return null;
  };

  return (
    <DropdownPanel onClose={onClose} anchorRect={anchorRect} minWidth={240}>
      {/* Chips of selected */}
      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '8px 10px 4px', borderBottom: '0.5px solid var(--color-border-subtle)' }}>
          {selected.map(s => {
            const cfg = getOptColor(s);
            return (
              <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 20, background: cfg?.bg ?? 'var(--color-bg-active)', color: cfg?.color ?? 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', fontWeight: 500 }}>
                {s}
                <button onClick={e => { e.stopPropagation(); toggle(s); }} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0, color: 'inherit', opacity: 0.7 }}><IconX size={10} /></button>
              </span>
            );
          })}
        </div>
      )}
      <SearchInput value={q} onChange={setQ} placeholder="Search options…" />
      <div style={{ maxHeight: 200, overflowY: 'auto' }}>
        {filtered.map(opt => {
          const cfg = getOptColor(opt);
          const active = selected.includes(opt);
          return (
            <div key={opt} onClick={() => toggle(opt)}
              style={{ padding: '7px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, background: active ? 'var(--color-bg-active)' : 'transparent' }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? 'var(--color-bg-active)' : 'transparent'; }}
            >
              <div style={{ width: 14, height: 14, borderRadius: 3, border: `1.5px solid ${active ? 'var(--color-accent)' : 'var(--color-border-strong)'}`, background: active ? 'var(--color-accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {active && <span style={{ color: '#fff', fontSize: 9, fontWeight: 700 }}>✓</span>}
              </div>
              {cfg
                ? <span style={{ padding: '2px 7px', borderRadius: 20, background: cfg.bg, color: cfg.color, fontSize: 'var(--text-xs)', fontWeight: 500 }}>{opt}</span>
                : <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>{opt}</span>
              }
            </div>
          );
        })}
      </div>
    </DropdownPanel>
  );
}

// ─── Person dropdown ──────────────────────────────────────────────────────────

function PersonDropdown({ value, onChange, onClose, anchorRect }: {
  value: string;
  onChange: (v: CellValue) => void;
  onClose: () => void;
  anchorRect: DOMRect | null;
}) {
  const [q, setQ] = useState('');
  const users = useAppStore(s => s.users);
  const filtered = q ? users.filter(u => u.name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase())) : users;

  return (
    <DropdownPanel onClose={onClose} anchorRect={anchorRect} minWidth={230}>
      <SearchInput value={q} onChange={setQ} placeholder="Search members…" />
      <div style={{ maxHeight: 240, overflowY: 'auto' }}>
        {filtered.map(user => {
          const active = user.id === value;
          return (
            <div key={user.id} onClick={() => { onChange(user.id); onClose(); }}
              style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, background: active ? 'var(--color-bg-active)' : 'transparent' }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? 'var(--color-bg-active)' : 'transparent'; }}
            >
              {user.avatar_url
                ? <img src={user.avatar_url} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                : <div style={{ width: 24, height: 24, borderRadius: '50%', background: user.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{user.initials}</div>
              }
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
              </div>
              {active && <span style={{ color: 'var(--color-accent)', fontWeight: 700, fontSize: 12 }}>✓</span>}
            </div>
          );
        })}
      </div>
      <div onClick={() => { onChange(null); onClose(); }}
        style={{ padding: '8px 12px', cursor: 'pointer', borderTop: '0.5px solid var(--color-border-subtle)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >Clear</div>
    </DropdownPanel>
  );
}
