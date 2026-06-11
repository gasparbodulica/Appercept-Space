'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Column, ViewConfig, ColumnType } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { COLUMN_TYPES, getTypeMeta, defaultConfigForType } from '@/lib/columnTypes';
import {
  IconSortAscending, IconSortDescending, IconFilter,
  IconEyeOff, IconEye, IconTrash, IconChevronRight, IconChevronLeft, IconCheck,
  IconPlus, IconPalette,
} from '@tabler/icons-react';

const OPTION_COLORS = [
  '#1c75bc','#00d2ff','#2ee89a','#3ecf8e','#a78bfa','#f472b6',
  '#fb923c','#f5c518','#ff4f6a','#60a5fa','#2dd4bf','#94a3b8',
];

const OPTION_TYPES = new Set(['select','multi_select','status','priority','tags']);

interface ColumnMenuProps {
  column: Column;
  databaseId: string;
  view: ViewConfig;
  position: { x: number; y: number };
  onClose: () => void;
  onOpenFilter: () => void;
}

export function ColumnMenu({ column, databaseId, view, position, onClose, onOpenFilter }: ColumnMenuProps) {
  const { updateColumn, deleteColumn, updateView, setSort, setFilter, addColumnOption, updateColumnOption, deleteColumnOption } = useAppStore();
  const [name, setName] = useState(column.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [editingOptId, setEditingOptId] = useState<string | null>(null);
  const [editingOptLabel, setEditingOptLabel] = useState('');
  const [colorPickerId, setColorPickerId] = useState<string | null>(null);
  const [newOptLabel, setNewOptLabel] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const currentType = getTypeMeta(column.type);
  const hasOptions = OPTION_TYPES.has(column.type);
  const options = column.config?.options ?? [];

  const handleChangeType = (newType: ColumnType) => {
    if (newType !== column.type) {
      updateColumn(databaseId, column.id, { type: newType, config: defaultConfigForType(newType) });
    }
    setTypeMenuOpen(false);
    onClose();
  };

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    setTimeout(() => document.addEventListener('mousedown', h), 0);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const commitName = () => {
    if (name.trim() && name !== column.name) updateColumn(databaseId, column.id, { name: name.trim() });
  };

  const handleSort = (dir: 'asc' | 'desc') => {
    const sorts = view.sorts ?? [];
    setSort(databaseId, view.id, [
      { column_id: column.id, direction: dir },
      ...sorts.filter(s => s.column_id !== column.id),
    ]);
    onClose();
  };

  const handleFilter = () => {
    const filters = view.filters ?? [];
    if (!filters.find(f => f.column_id === column.id)) {
      setFilter(databaseId, view.id, [
        ...filters,
        { id: `fcol-${Date.now()}`, column_id: column.id, operator: 'contains', value: null },
      ]);
    }
    onOpenFilter();
    onClose();
  };

  const isHidden = view.hidden_cols?.includes(column.id);
  const handleHide = () => {
    const hidden = view.hidden_cols ?? [];
    updateView(databaseId, view.id, {
      hidden_cols: isHidden ? hidden.filter(id => id !== column.id) : [...hidden, column.id],
    });
    onClose();
  };

  const handleDelete = () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    deleteColumn(databaseId, column.id);
    onClose();
  };

  // Clamp to viewport
  const W = 240, H = optionsOpen ? 420 : 320;
  const left = Math.min(position.x, window.innerWidth - W - 8);
  const top = Math.min(position.y, window.innerHeight - H - 8);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={ref}
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
      style={{
        position: 'fixed', top, left, zIndex: 1500, width: W,
        background: 'var(--color-bg-popover)', border: '0.5px solid var(--color-border-default)',
        borderRadius: 8, boxShadow: '0 16px 56px rgba(0,0,0,0.7)', overflow: 'hidden',
      }}
    >
      {optionsOpen ? (
        /* ── Options management view ──────────────────────── */
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 10px 8px', borderBottom: '0.5px solid var(--color-border-subtle)' }}>
            <button onClick={() => { setOptionsOpen(false); setColorPickerId(null); setEditingOptId(null); }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 5, border: 'none', background: 'var(--color-bg-active)', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
              <IconChevronLeft size={14} />
            </button>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Options</span>
          </div>
          <div style={{ padding: '6px 8px', maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {options.map(opt => (
              <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 4px', borderRadius: 5, position: 'relative' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                {/* Color swatch */}
                <button onClick={() => setColorPickerId(colorPickerId === opt.id ? null : opt.id)}
                  style={{ width: 16, height: 16, borderRadius: 4, background: opt.color, border: 'none', cursor: 'pointer', flexShrink: 0 }} />
                {/* Color picker popover */}
                {colorPickerId === opt.id && (
                  <div style={{ position: 'absolute', left: 26, top: 0, zIndex: 10, background: 'var(--color-bg-popover)', border: '0.5px solid var(--color-border-default)', borderRadius: 8, padding: 8, display: 'flex', flexWrap: 'wrap', gap: 5, width: 148, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                    {OPTION_COLORS.map(c => (
                      <button key={c} onClick={() => { updateColumnOption(databaseId, column.id, opt.id, { color: c }); setColorPickerId(null); }}
                        style={{ width: 20, height: 20, borderRadius: 5, background: c, border: c === opt.color ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer' }} />
                    ))}
                  </div>
                )}
                {/* Label */}
                {editingOptId === opt.id ? (
                  <input autoFocus value={editingOptLabel}
                    onChange={e => setEditingOptLabel(e.target.value)}
                    onBlur={() => { if (editingOptLabel.trim()) updateColumnOption(databaseId, column.id, opt.id, { label: editingOptLabel.trim() }); setEditingOptId(null); }}
                    onKeyDown={e => { if (e.key === 'Enter') { if (editingOptLabel.trim()) updateColumnOption(databaseId, column.id, opt.id, { label: editingOptLabel.trim() }); setEditingOptId(null); } if (e.key === 'Escape') setEditingOptId(null); }}
                    style={{ flex: 1, background: 'var(--color-bg-elevated)', border: '0.5px solid var(--color-accent)', borderRadius: 4, padding: '2px 6px', fontSize: 'var(--text-xs)', color: 'var(--color-text-primary)', outline: 'none', fontFamily: 'var(--font-sans)' }} />
                ) : (
                  <span onClick={() => { setEditingOptId(opt.id); setEditingOptLabel(opt.label); }}
                    style={{ flex: 1, fontSize: 'var(--text-xs)', color: 'var(--color-text-primary)', cursor: 'text', padding: '2px 4px', borderRadius: 4 }}>
                    {opt.label}
                  </span>
                )}
                {/* Delete */}
                <button onClick={() => deleteColumnOption(databaseId, column.id, opt.id)}
                  style={{ display: 'flex', padding: 2, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', borderRadius: 3, flexShrink: 0 }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-red)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}>
                  <IconTrash size={12} />
                </button>
              </div>
            ))}
            {/* Add new option */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, padding: '2px 4px' }}>
              <IconPlus size={12} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
              <input value={newOptLabel} onChange={e => setNewOptLabel(e.target.value)}
                placeholder="Add option…"
                onKeyDown={e => { if (e.key === 'Enter' && newOptLabel.trim()) { addColumnOption(databaseId, column.id, newOptLabel.trim()); setNewOptLabel(''); } }}
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 'var(--text-xs)', color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)', padding: '2px 0' }} />
            </div>
          </div>
        </>
      ) : typeMenuOpen ? (
        /* ── Type picker view ─────────────────────────────── */
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 10px 8px', borderBottom: '0.5px solid var(--color-border-subtle)' }}>
            <button
              onClick={() => setTypeMenuOpen(false)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 5, border: 'none', background: 'var(--color-bg-active)', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
              title="Back"
            >
              <IconChevronLeft size={14} />
            </button>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Property type
            </span>
          </div>
          <div style={{ padding: 4, maxHeight: 300, overflowY: 'auto' }}>
            {COLUMN_TYPES.map(t => {
              const active = t.type === column.type;
              return (
                <button key={t.type} onClick={() => handleChangeType(t.type)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                    padding: '7px 10px', borderRadius: 5, border: 'none',
                    background: active ? 'var(--color-bg-active)' : 'none',
                    color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    fontSize: 'var(--text-sm)', cursor: 'pointer', textAlign: 'left',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'none'; }}
                >
                  <span style={{ color: active ? 'var(--color-accent-bright)' : 'var(--color-text-muted)', display: 'flex' }}>{t.icon}</span>
                  <span style={{ flex: 1 }}>{t.label}</span>
                  {active && <IconCheck size={14} style={{ color: 'var(--color-accent-bright)' }} />}
                </button>
              );
            })}
          </div>
        </>
      ) : (
        /* ── Main menu view ───────────────────────────────── */
        <>
          {/* Rename input */}
          <div style={{ padding: '10px 12px', borderBottom: '0.5px solid var(--color-border-subtle)' }}>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={commitName}
              onKeyDown={e => {
                if (e.key === 'Enter') { commitName(); onClose(); }
                if (e.key === 'Escape') onClose();
              }}
              style={{
                width: '100%', background: 'var(--color-bg-elevated)',
                border: '0.5px solid var(--color-border-default)',
                borderRadius: 5, padding: '5px 8px',
                fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)',
                outline: 'none', fontFamily: 'var(--font-sans)', boxSizing: 'border-box',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
            />
          </div>

          <div style={{ padding: '4px' }}>
            {/* Type row — switches to the type picker view */}
            <button
              onClick={() => setTypeMenuOpen(true)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 10px', borderRadius: 5, border: 'none', background: 'none',
                color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)',
                cursor: 'pointer', textAlign: 'left',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <span style={{ color: 'var(--color-accent-bright)', display: 'flex' }}>{currentType.icon}</span>
              <span style={{ flex: 1 }}>Edit type</span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{currentType.label}</span>
              <IconChevronRight size={13} style={{ color: 'var(--color-text-muted)' }} />
            </button>

            <div style={{ height: '0.5px', background: 'var(--color-border-subtle)', margin: '4px 0' }} />

            <MenuItem icon={<IconSortAscending size={14} />} label="Sort ascending"  onClick={() => handleSort('asc')} />
            <MenuItem icon={<IconSortDescending size={14} />} label="Sort descending" onClick={() => handleSort('desc')} />
            <MenuItem icon={<IconFilter size={14} />}          label="Filter by this"  onClick={handleFilter} />
            <MenuItem
              icon={isHidden ? <IconEye size={14} /> : <IconEyeOff size={14} />}
              label={isHidden ? 'Show in view' : 'Hide in view'}
              onClick={handleHide}
            />

            {hasOptions && (
              <>
                <div style={{ height: '0.5px', background: 'var(--color-border-subtle)', margin: '4px 0' }} />
                <button onClick={() => setOptionsOpen(true)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 5, border: 'none', background: 'none', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', cursor: 'pointer', textAlign: 'left' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                  <span style={{ color: 'var(--color-text-muted)', display: 'flex' }}><IconPalette size={14} /></span>
                  <span style={{ flex: 1 }}>Edit options</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{options.length}</span>
                  <IconChevronRight size={13} style={{ color: 'var(--color-text-muted)' }} />
                </button>
              </>
            )}

            {column.position !== 0 && (
              <>
                <div style={{ height: '0.5px', background: 'var(--color-border-subtle)', margin: '4px 0' }} />
                <button
                  onClick={handleDelete}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                    padding: '7px 10px', borderRadius: 5, border: 'none', background: 'none',
                    color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-red-bg)'; e.currentTarget.style.color = 'var(--color-red)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
                >
                  <span style={{ color: 'var(--color-red)', display: 'flex' }}><IconTrash size={14} /></span>
                  {confirmDelete ? 'Click again to confirm' : 'Delete property'}
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>,
    document.body
  );
}

function MenuItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 8,
        padding: '7px 10px', borderRadius: 5, border: 'none', background: 'none',
        color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)',
        cursor: 'pointer', textAlign: 'left', transition: 'background 80ms',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
    >
      <span style={{ color: 'var(--color-text-muted)', display: 'flex' }}>{icon}</span>
      {label}
    </button>
  );
}
