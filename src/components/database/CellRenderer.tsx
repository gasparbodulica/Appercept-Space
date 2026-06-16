'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Column, Row, CellValue } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { formatDate, getStatusConfig, getPriorityConfig, getTagConfig, isOverdue } from '@/lib/utils';
import { findCostsDb, companyMonthlyExpenses, findClientsDb, companyRevenue } from '@/lib/finance';
import { IconSearch, IconX, IconPlus, IconEye, IconEyeOff, IconCopy, IconCheck, IconUpload, IconDownload } from '@tabler/icons-react';

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

  // Formula columns are computed & read-only; file cells manage their own
  // upload/download UI — neither enters the text edit mode.
  const editable = column.type !== 'formula' && column.type !== 'file';

  return (
    <div ref={containerRef} style={{ height: '100%', width: '100%' }}>
      {isEditing && editable ? (
        <EditCell column={column} value={value} onChange={handleChange} onBlur={onEndEdit} onTab={onTab} anchorRect={anchorRectRef.current} />
      ) : (
        <DisplayCell column={column} row={row} databaseId={databaseId} value={value} onClick={editable ? handleStartEdit : () => {}} />
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
      const custom = column.config.options?.find(o => o.label === String(value));
      const cfg = custom ? { color: custom.color, bg: `${custom.color}22` } : getStatusConfig(String(value));
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
      const customP = column.config.options?.find(o => o.label === String(value));
      const cfg = customP ? { color: customP.color, bg: `${customP.color}22` } : getPriorityConfig(String(value));
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
            // Prefer the column's own option colours; fall back to built-in tag colours
            const opt = column.config.options?.find(o => o.label === tag);
            const cfg = opt ? { color: opt.color, bg: `${opt.color}22` } : getTagConfig(tag);
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
    case 'file':
      return <FileCell column={column} row={row} databaseId={databaseId} value={value} />;
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
    case 'password': {
      return <PasswordCell value={value === null || value === undefined ? '' : String(value)} onClick={onClick} />;
    }
    case 'formula': {
      const databases = useAppStore.getState().databases;
      const db = databases[databaseId];
      const nameCol = db?.columns.find(c => c.position === 0);
      const companyName = nameCol ? String(row.cells[nameCol.id] ?? '') : '';
      const prefix = column.config.prefix ?? '';
      const projectsDb = Object.values(databases).find(d => d.id === 'db-projects');
      const revenue = companyRevenue(findClientsDb(databases), companyName, projectsDb);
      const expenses = companyMonthlyExpenses(findCostsDb(databases), companyName);

      // Monthly revenue (from clients, frequency-aware)
      if (column.config.formula === 'company_revenue') {
        if (revenue === 0) return <div style={{ ...style, justifyContent: 'flex-end', color: 'var(--color-text-muted)' }}><span style={{ fontSize: 'var(--text-xs)' }}>—</span></div>;
        return (
          <div style={{ ...style, justifyContent: 'flex-end', cursor: 'default', color: 'var(--color-teal)' }} title="Computed from clients (frequency-aware)">
            <span style={{ fontWeight: 700 }}>{prefix}{revenue.toLocaleString()}</span>
          </div>
        );
      }

      // Monthly profit = revenue − expenses
      if (column.config.formula === 'company_profit') {
        if (revenue === 0 && expenses === 0) {
          return <div style={{ ...style, justifyContent: 'flex-end', color: 'var(--color-text-muted)' }}><span style={{ fontSize: 'var(--text-xs)' }}>—</span></div>;
        }
        const profit = revenue - expenses;
        const color = profit >= 0 ? 'var(--color-green)' : 'var(--color-red)';
        return (
          <div style={{ ...style, justifyContent: 'flex-end', cursor: 'default' }} title={`Revenue ${prefix}${revenue.toLocaleString()} − costs ${prefix}${expenses.toLocaleString()}`}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 9px', borderRadius: 20, background: `${profit >= 0 ? 'rgba(46,232,154,0.12)' : 'rgba(255,79,106,0.12)'}`, color, fontSize: 'var(--text-xs)', fontWeight: 700 }}>
              {prefix}{profit.toLocaleString()}
            </span>
          </div>
        );
      }
      return <div style={{ ...style, color: 'var(--color-text-muted)' }}><span style={{ fontSize: 'var(--text-xs)' }}>—</span></div>;
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

// ─── Password cell (masked, with eye toggle) ─────────────────────────────────

function PasswordCell({ value, onClick }: { value: string; onClick: () => void }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const masked = '•'.repeat(Math.min(Math.max(value.length, 8), 14));

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', width: '100%', height: '100%',
      padding: '0 6px 0 10px', overflow: 'hidden', cursor: 'pointer',
    }}>
      <span
        onClick={onClick}
        style={{
          flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          fontSize: 'var(--text-sm)',
          color: value ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
          fontFamily: revealed ? 'var(--font-mono)' : 'var(--font-sans)',
          letterSpacing: revealed ? 0 : 1,
        }}
      >
        {value ? (revealed ? value : masked) : ''}
      </span>
      {value && (
        <>
          <button
            onClick={handleCopy}
            title="Copy password"
            style={{ flexShrink: 0, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 5, border: 'none', background: 'none', cursor: 'pointer', color: copied ? 'var(--color-green)' : 'var(--color-text-muted)', transition: 'color 80ms' }}
            onMouseEnter={(e) => { if (!copied) e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
            onMouseLeave={(e) => { if (!copied) e.currentTarget.style.color = 'var(--color-text-muted)'; }}
          >
            {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setRevealed(r => !r); }}
            title={revealed ? 'Hide password' : 'Show password'}
            style={{ flexShrink: 0, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 5, border: 'none', background: 'none', cursor: 'pointer', color: revealed ? 'var(--color-accent-bright)' : 'var(--color-text-muted)', transition: 'color 80ms' }}
            onMouseEnter={(e) => { if (!revealed) e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
            onMouseLeave={(e) => { if (!revealed) e.currentTarget.style.color = 'var(--color-text-muted)'; }}
          >
            {revealed ? <IconEyeOff size={15} /> : <IconEye size={15} />}
          </button>
        </>
      )}
    </div>
  );
}

// ─── File upload/download cell ────────────────────────────────────────────────
// Stores the file as JSON { name, url(dataURL), size, mime }. On upload it also
// auto-fills the row's "Size (MB)" column and the name column (if empty).

interface StoredFile { name: string; url: string; size: number; mime?: string }

function FileCell({ column, row, databaseId, value }: { column: Column; row: Row; databaseId: string; value: CellValue }) {
  const { updateCell, databases } = useAppStore();
  const inputRef = useRef<HTMLInputElement>(null);

  let file: StoredFile | null = null;
  if (value) {
    const s = String(value);
    try {
      const p = JSON.parse(s);
      if (p && typeof p === 'object' && p.url) file = p as StoredFile;
    } catch {
      // Legacy plain URL/link value → treat as a downloadable link.
      if (/^https?:|^data:/.test(s)) file = { name: s.split('/').pop() || 'file', url: s, size: 0 };
    }
  }

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) { alert('File is too large — max 8 MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      updateCell(databaseId, row.id, column.id, JSON.stringify({ name: f.name, url: reader.result, size: f.size, mime: f.type }));
      const db = databases[databaseId];
      const sizeCol = db?.columns.find((c) => /size/i.test(c.name) && c.type === 'number');
      if (sizeCol) updateCell(databaseId, row.id, sizeCol.id, Math.round((f.size / 1024 / 1024) * 100) / 100);
      const nameCol = db?.columns.find((c) => c.name === 'File name') ?? db?.columns.find((c) => c.position === 0);
      if (nameCol && !row.cells[nameCol.id]) updateCell(databaseId, row.id, nameCol.id, f.name);
    };
    reader.readAsDataURL(f);
  };

  const download = () => {
    if (!file) return;
    const a = document.createElement('a');
    a.href = file.url; a.download = file.name; a.target = '_blank'; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
  };

  const linkStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 5, minWidth: 0, flex: 1,
    border: 'none', background: 'none', cursor: 'pointer', padding: 0,
    color: 'var(--color-accent-bright)', fontSize: 'var(--text-xs)', fontWeight: 500,
  };
  const iconBtn: React.CSSProperties = {
    width: 22, height: 22, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', borderRadius: 5,
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: '100%', width: '100%', padding: '0 8px', overflow: 'hidden' }}>
      <input ref={inputRef} type="file" style={{ display: 'none' }} onChange={onPick} />
      {file ? (
        <>
          <button onClick={download} title={`Download ${file.name}`} style={linkStyle}>
            <IconDownload size={13} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
          </button>
          <button onClick={() => inputRef.current?.click()} title="Replace file" style={iconBtn}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}>
            <IconUpload size={12} />
          </button>
        </>
      ) : (
        <button onClick={() => inputRef.current?.click()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, border: '0.5px dashed var(--color-border-default)', background: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-accent-bright)'; e.currentTarget.style.borderColor = 'var(--color-accent-bright)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.borderColor = 'var(--color-border-default)'; }}>
          <IconUpload size={13} /> Upload
        </button>
      )}
    </div>
  );
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

  const addOpt = (label: string) => useAppStore.getState().addColumnOption(column.database_id, column.id, label);
  const delOpt = (label: string) => {
    const opt = column.config.options?.find(o => o.label === label);
    if (opt) useAppStore.getState().deleteColumnOption(column.database_id, column.id, opt.id);
  };

  if (column.type === 'status') {
    // If custom options are defined (e.g. Costs = Active/Past), show ONLY those.
    // Otherwise fall back to the built-in workflow statuses.
    const builtIn = ['Not started','In progress','Started','Done','Completed','Blocked'];
    const customOpts = (column.config.options ?? []).map(o => o.label);
    const options = customOpts.length > 0 ? customOpts : builtIn;
    return <SelectDropdown options={options} value={String(value ?? '')} onChange={onChange} onClose={onBlur} anchorRect={anchorRect} getColor={getStatusConfig} getColorFromOptions={column.config.options} onCreate={addOpt} onDelete={delOpt} />;
  }
  if (column.type === 'priority') {
    const builtIn = ['High','Medium','Low'];
    const customOpts = (column.config.options ?? []).map(o => o.label);
    const options = customOpts.length > 0 ? customOpts : builtIn;
    return <SelectDropdown options={options} value={String(value ?? '')} onChange={onChange} onClose={onBlur} anchorRect={anchorRect} getColor={getPriorityConfig} getColorFromOptions={column.config.options} onCreate={addOpt} onDelete={delOpt} />;
  }
  if (column.type === 'select') {
    return <SelectDropdown options={(column.config.options ?? []).map(o => o.label)} value={String(value ?? '')} onChange={onChange} onClose={onBlur} anchorRect={anchorRect}
      getColorFromOptions={column.config.options} onCreate={addOpt} onDelete={delOpt} />;
  }
  if (column.type === 'multi_select' || column.type === 'tags') {
    const tagBuiltIn = ['IG','TT','LIN','Dev','Contract','Call','Info','PPTX'];
    const customLabels = (column.config.options ?? []).map(o => o.label);
    const tagOpts = column.type === 'tags'
      ? [...tagBuiltIn, ...customLabels.filter(l => !tagBuiltIn.includes(l))]
      : customLabels;
    const selected = Array.isArray(value) ? (value as string[]) : [];
    return <MultiSelectDropdown options={tagOpts} selected={selected} onChange={onChange} onClose={onBlur} anchorRect={anchorRect}
      getColor={column.type === 'tags' ? getTagConfig : undefined}
      getColorFromOptions={column.config.options} onCreate={addOpt} />;
  }
  if (column.type === 'person') {
    return <PersonDropdown value={String(value ?? '')} onChange={onChange} onClose={onBlur} anchorRect={anchorRect} />;
  }
  if (column.type === 'checkbox') {
    onChange(!value); onBlur(); return null;
  }
  if (column.type === 'date' || column.type === 'date_range') {
    return <DateEditCell value={value} onChange={onChange} onBlur={onBlur} onTab={onTab} />;
  }
  if (column.type === 'number') {
    return <input ref={inputRef} type="number" defaultValue={value !== null && value !== undefined ? String(value) : ''} onKeyDown={keyDown} onBlur={e => { onChange(e.target.value !== '' ? Number(e.target.value) : null); onBlur(); }} style={inputStyle} />;
  }
  // Text columns named "Client" or "Company" get client autocomplete
  if (column.type === 'text' && /client|company/i.test(column.name)) {
    return <ClientAutocomplete value={String(value ?? '')} onChange={onChange} onBlur={onBlur} onTab={onTab} anchorRect={anchorRect} />;
  }
  return <input ref={inputRef} type={column.type === 'email' ? 'email' : column.type === 'phone' ? 'tel' : column.type === 'url' ? 'url' : 'text'} defaultValue={value !== null && value !== undefined ? String(value) : ''} onKeyDown={keyDown} onBlur={e => { onChange(e.target.value || null); onBlur(); }} style={inputStyle} />;
}

// ─── Date edit cell — DD/MM/YYYY text input ───────────────────────────────────
// Uses a plain text input so users always type in European day-first format.
// Stores values as ISO YYYY-MM-DD to keep the rest of the system consistent.

function isoToDMY(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

function dmyToISO(dmy: string): string {
  const t = dmy.trim();
  const full = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (full) return `${full[3]}-${full[2].padStart(2, '0')}-${full[1].padStart(2, '0')}`;
  const short = t.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (short) {
    const y = new Date().getFullYear();
    return `${y}-${short[2].padStart(2, '0')}-${short[1].padStart(2, '0')}`;
  }
  return t;
}

function todayDMY(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function DateEditCell({ value, onChange, onBlur, onTab }: {
  value: CellValue;
  onChange: (v: CellValue) => void;
  onBlur: () => void;
  onTab: (shift: boolean) => void;
}) {
  const rawISO = value ? String(value).split('|')[0] : '';
  const isRange = value ? String(value).includes('|') : false;
  const rangeEnd = isRange ? isoToDMY(String(value).split('|')[1] ?? '') : '';

  // Auto-fill today when no existing value — user can clear or change before saving
  const [fromVal, setFromVal] = useState(rawISO ? isoToDMY(rawISO) : todayDMY());
  const [toVal,   setToVal]   = useState(rangeEnd);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);

  const save = () => {
    const from = fromVal.trim();
    if (!from) { onChange(null); onBlur(); return; }
    const fromISO = dmyToISO(from);
    if (isRange && toVal.trim()) {
      onChange(`${fromISO}|${dmyToISO(toVal.trim())}`);
    } else {
      onChange(fromISO);
    }
    onBlur();
  };

  const keyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onBlur();
    if (e.key === 'Tab') { e.preventDefault(); save(); onTab(e.shiftKey); }
    if (e.key === 'Enter') save();
  };

  const inputStyle: React.CSSProperties = {
    flex: 1, height: '100%', padding: '0 4px 0 10px',
    background: 'var(--color-bg-input)', border: 'none', outline: 'none',
    color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-sans)',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%', height: '100%', gap: 2 }}>
      <input
        ref={inputRef}
        type="text"
        value={fromVal}
        onChange={e => setFromVal(e.target.value)}
        onBlur={save}
        onKeyDown={keyDown}
        placeholder="DD/MM/YYYY"
        style={inputStyle}
      />
      {isRange && (
        <>
          <span style={{ fontSize: 10, color: 'var(--color-text-muted)', flexShrink: 0 }}>→</span>
          <input
            type="text"
            value={toVal}
            onChange={e => setToVal(e.target.value)}
            onBlur={save}
            onKeyDown={keyDown}
            placeholder="DD/MM/YYYY"
            style={{ ...inputStyle, flex: 1 }}
          />
        </>
      )}
      {fromVal && (
        <button
          onMouseDown={e => { e.preventDefault(); setFromVal(''); setToVal(''); onChange(null); onBlur(); }}
          title="Clear date"
          style={{ flexShrink: 0, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', marginRight: 4 }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-red)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
        >
          <IconX size={12} />
        </button>
      )}
    </div>
  );
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

function SelectDropdown({ options, value, onChange, onClose, anchorRect, getColor, getColorFromOptions, onCreate, onDelete }: {
  options: string[];
  value: string;
  onChange: (v: CellValue) => void;
  onClose: () => void;
  anchorRect: DOMRect | null;
  getColor?: (v: string) => ColorConfig;
  getColorFromOptions?: { id: string; label: string; color: string }[];
  onCreate?: (label: string) => void;
  onDelete?: (label: string) => void;
}) {
  const [q, setQ] = useState('');
  const filtered = q ? options.filter(o => o.toLowerCase().includes(q.toLowerCase())) : options;
  const exactMatch = options.some(o => o.toLowerCase() === q.trim().toLowerCase());
  const canCreate = !!onCreate && q.trim().length > 0 && !exactMatch;

  // Custom options (config.options) take priority for colours, then built-ins.
  const getOptColor = (opt: string): ColorConfig | undefined => {
    const found = getColorFromOptions?.find(o => o.label === opt);
    if (found) return { color: found.color, bg: `${found.color}22` };
    if (getColor) return getColor(opt);
    return undefined;
  };

  return (
    <DropdownPanel onClose={onClose} anchorRect={anchorRect}>
      <SearchInput value={q} onChange={setQ} placeholder="Search or create…" />
      <div style={{ maxHeight: 240, overflowY: 'auto' }}>
        {filtered.map(opt => {
          const cfg = getOptColor(opt);
          const active = opt === value;
          // Deletable only if this option is a real custom option (in config.options).
          const deletable = !!onDelete && !!getColorFromOptions?.some(o => o.label === opt);
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
              <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {active && <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>✓</span>}
                {deletable && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete!(opt); }}
                    title={`Delete "${opt}" option`}
                    style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', borderRadius: 4 }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-red)'; e.currentTarget.style.background = 'var(--color-bg-active)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.background = 'none'; }}
                  >
                    <IconX size={12} />
                  </button>
                )}
              </span>
            </div>
          );
        })}
        {filtered.length === 0 && !canCreate && <div style={{ padding: '14px', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textAlign: 'center' }}>No options</div>}
      </div>
      {canCreate && (
        <div onClick={() => { onCreate!(q.trim()); onChange(q.trim()); onClose(); }}
          style={{ padding: '8px 12px', cursor: 'pointer', borderTop: '0.5px solid var(--color-border-subtle)', display: 'flex', alignItems: 'center', gap: 7, fontSize: 'var(--text-sm)', color: 'var(--color-accent-bright)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <IconPlus size={13} />
          <span>Create <b style={{ color: 'var(--color-text-primary)' }}>&ldquo;{q.trim()}&rdquo;</b></span>
        </div>
      )}
      <div onClick={() => { onChange(null); onClose(); }}
        style={{ padding: '8px 12px', cursor: 'pointer', borderTop: '0.5px solid var(--color-border-subtle)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >Clear</div>
    </DropdownPanel>
  );
}

// ─── Multi-select dropdown ────────────────────────────────────────────────────

function MultiSelectDropdown({ options, selected, onChange, onClose, anchorRect, getColor, getColorFromOptions, onCreate }: {
  options: string[];
  selected: string[];
  onChange: (v: CellValue) => void;
  onClose: () => void;
  anchorRect: DOMRect | null;
  getColor?: (v: string) => { color: string; bg: string };
  getColorFromOptions?: { id: string; label: string; color: string }[];
  onCreate?: (label: string) => void;
}) {
  const [q, setQ] = useState('');
  const filtered = q ? options.filter(o => o.toLowerCase().includes(q.toLowerCase())) : options;
  const exactMatch = options.some(o => o.toLowerCase() === q.trim().toLowerCase());
  const canCreate = !!onCreate && q.trim().length > 0 && !exactMatch;

  const toggle = (opt: string) => {
    const next = selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt];
    onChange(next.length > 0 ? next : null);
  };

  const getOptColor = (opt: string) => {
    const found = getColorFromOptions?.find(o => o.label === opt);
    if (found) return { color: found.color, bg: `${found.color}22` };
    if (getColor) return getColor(opt);
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
      {canCreate && (
        <div onClick={() => { onCreate!(q.trim()); toggle(q.trim()); setQ(''); }}
          style={{ padding: '8px 12px', cursor: 'pointer', borderTop: '0.5px solid var(--color-border-subtle)', display: 'flex', alignItems: 'center', gap: 7, fontSize: 'var(--text-sm)', color: 'var(--color-accent-bright)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <IconPlus size={13} />
          <span>Create <b style={{ color: 'var(--color-text-primary)' }}>&ldquo;{q.trim()}&rdquo;</b></span>
        </div>
      )}
    </DropdownPanel>
  );
}

// ─── Person dropdown ──────────────────────────────────────────────────────────

function ClientAutocomplete({ value, onChange, onBlur, onTab, anchorRect }: {
  value: string;
  onChange: (v: CellValue) => void;
  onBlur: () => void;
  onTab: (shift: boolean) => void;
  anchorRect: DOMRect | null;
}) {
  const [q, setQ] = useState(value);
  const databases = useAppStore(s => s.databases);
  const clientsDb = Object.values(databases).find(d => d.id === 'db-clients');
  const nameCol = clientsDb?.columns.find(c => c.position === 0);
  const companyCol = clientsDb?.columns.find(c => c.name === 'Company');

  const clientNames: string[] = [];
  if (clientsDb && companyCol) {
    clientsDb.rows.forEach(r => {
      const company = String(r.cells[companyCol.id] ?? '').trim();
      if (company && !clientNames.includes(company)) clientNames.push(company);
    });
  } else if (clientsDb && nameCol) {
    clientsDb.rows.forEach(r => {
      const name = String(r.cells[nameCol.id] ?? '').trim();
      if (name && !clientNames.includes(name)) clientNames.push(name);
    });
  }

  const filtered = q ? clientNames.filter(n => n.toLowerCase().includes(q.toLowerCase())) : clientNames;
  const keyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onBlur();
    if (e.key === 'Tab') { e.preventDefault(); onTab(e.shiftKey); }
    if (e.key === 'Enter') { onChange(q || null); onBlur(); }
  };

  return (
    <DropdownPanel onClose={() => { onChange(q || null); onBlur(); }} anchorRect={anchorRect} minWidth={230}>
      <div style={{ padding: '6px 8px', borderBottom: '0.5px solid var(--color-border-subtle)' }}>
        <input
          autoFocus
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={keyDown}
          placeholder="Type or pick a client…"
          style={{ width: '100%', background: 'none', border: 'none', outline: 'none', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)' }}
        />
      </div>
      <div style={{ maxHeight: 240, overflowY: 'auto' }}>
        {filtered.length === 0 && q && (
          <div onClick={() => { onChange(q); onBlur(); }} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            Use &ldquo;{q}&rdquo;
          </div>
        )}
        {filtered.map(name => (
          <div key={name} onClick={() => { onChange(name); onBlur(); }}
            style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 'var(--text-sm)', color: value === name ? 'var(--color-accent-bright)' : 'var(--color-text-primary)', background: value === name ? 'var(--color-bg-active)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            onMouseEnter={e => { if (value !== name) e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = value === name ? 'var(--color-bg-active)' : 'transparent'; }}>
            {name}
            {value === name && <span style={{ color: 'var(--color-accent)', fontSize: 12 }}>✓</span>}
          </div>
        ))}
      </div>
      {value && (
        <div onClick={() => { onChange(null); onBlur(); }} style={{ padding: '8px 12px', cursor: 'pointer', borderTop: '0.5px solid var(--color-border-subtle)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          Clear
        </div>
      )}
    </DropdownPanel>
  );
}

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
