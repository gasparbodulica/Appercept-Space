'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '@/lib/store';
import { COLUMN_TYPES, getTypeMeta, defaultConfigForType } from '@/lib/columnTypes';

import { ColumnType } from '@/lib/types';
import {
  IconX, IconPlus, IconTrash, IconChevronRight, IconChevronLeft, IconCheck,
} from '@tabler/icons-react';

interface SchemaPanelProps {
  databaseId: string;
  onClose: () => void;
}

const OPTION_COLORS = [
  '#1c75bc','#00d2ff','#2ee89a','#3ecf8e','#a78bfa','#f472b6',
  '#fb923c','#f5c518','#ff4f6a','#60a5fa','#2dd4bf','#94a3b8',
];
const OPTION_TYPES = new Set(['select','multi_select','status','priority','tags']);

export function SchemaPanel({ databaseId, onClose }: SchemaPanelProps) {
  const { databases, updateColumn, deleteColumn, addColumn, addColumnOption, updateColumnOption, deleteColumnOption } = useAppStore();
  const db = databases[databaseId];
  const columns = db?.columns ?? [];

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [typePanelId, setTypePanelId] = useState<string | null>(null);
  const [optionsPanelId, setOptionsPanelId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [newColName, setNewColName] = useState('');
  const [newColType, setNewColType] = useState<ColumnType>('text');
  const [colorPickerId, setColorPickerId] = useState<string | null>(null);
  const [editingOptId, setEditingOptId] = useState<string | null>(null);
  const [editingOptLabel, setEditingOptLabel] = useState('');
  const [newOptLabel, setNewOptLabel] = useState('');

  if (!db || typeof document === 'undefined') return null;

  const optsPanelCol = columns.find(c => c.id === optionsPanelId);
  const typesPanelCol = columns.find(c => c.id === typePanelId);

  const commitName = (colId: string) => {
    if (editingName.trim()) updateColumn(databaseId, colId, { name: editingName.trim() });
    setEditingId(null);
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1400, background: 'rgba(0,0,0,0.3)' }} />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 1401,
        width: 320, background: 'var(--color-bg-popover)',
        borderLeft: '0.5px solid var(--color-border-default)',
        boxShadow: '-16px 0 48px rgba(0,0,0,0.5)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '0.5px solid var(--color-border-subtle)', flexShrink: 0 }}>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)' }}>Properties</span>
          <button onClick={onClose} style={{ display: 'flex', padding: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', borderRadius: 5 }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
            <IconX size={15} />
          </button>
        </div>

        {/* Sub-panel: type picker */}
        {typePanelId && typesPanelCol && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '0.5px solid var(--color-border-subtle)' }}>
              <button onClick={() => setTypePanelId(null)} style={{ display: 'flex', padding: 4, background: 'var(--color-bg-active)', border: 'none', borderRadius: 5, cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                <IconChevronLeft size={13} />
              </button>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Property type — {typesPanelCol.name}
              </span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 6 }}>
              {COLUMN_TYPES.map(t => {
                const active = t.type === typesPanelCol.type;
                return (
                  <button key={t.type} onClick={() => { updateColumn(databaseId, typesPanelCol.id, { type: t.type, config: defaultConfigForType(t.type) }); setTypePanelId(null); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 6, border: 'none', background: active ? 'var(--color-bg-active)' : 'none', color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', cursor: 'pointer', textAlign: 'left' }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'none'; }}>
                    <span style={{ color: active ? 'var(--color-accent-bright)' : 'var(--color-text-muted)', display: 'flex' }}>{t.icon}</span>
                    <span style={{ flex: 1 }}>{t.label}</span>
                    {active && <IconCheck size={13} style={{ color: 'var(--color-accent-bright)' }} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Sub-panel: options editor */}
        {optionsPanelId && optsPanelCol && !typePanelId && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '0.5px solid var(--color-border-subtle)' }}>
              <button onClick={() => { setOptionsPanelId(null); setColorPickerId(null); setEditingOptId(null); }} style={{ display: 'flex', padding: 4, background: 'var(--color-bg-active)', border: 'none', borderRadius: 5, cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                <IconChevronLeft size={13} />
              </button>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Options — {optsPanelCol.name}
              </span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {(optsPanelCol.config?.options ?? []).map(opt => (
                <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', borderRadius: 6, position: 'relative' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <button onClick={() => setColorPickerId(colorPickerId === opt.id ? null : opt.id)}
                    style={{ width: 18, height: 18, borderRadius: 5, background: opt.color, border: 'none', cursor: 'pointer', flexShrink: 0 }} />
                  {colorPickerId === opt.id && (
                    <div style={{ position: 'absolute', left: 32, top: 0, zIndex: 10, background: 'var(--color-bg-popover)', border: '0.5px solid var(--color-border-default)', borderRadius: 8, padding: 8, display: 'flex', flexWrap: 'wrap', gap: 5, width: 148, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                      {OPTION_COLORS.map(c => (
                        <button key={c} onClick={() => { updateColumnOption(databaseId, optsPanelCol.id, opt.id, { color: c }); setColorPickerId(null); }}
                          style={{ width: 22, height: 22, borderRadius: 5, background: c, border: c === opt.color ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer' }} />
                      ))}
                    </div>
                  )}
                  {editingOptId === opt.id ? (
                    <input autoFocus value={editingOptLabel} onChange={e => setEditingOptLabel(e.target.value)}
                      onBlur={() => { if (editingOptLabel.trim()) updateColumnOption(databaseId, optsPanelCol.id, opt.id, { label: editingOptLabel.trim() }); setEditingOptId(null); }}
                      onKeyDown={e => { if (e.key === 'Enter') { if (editingOptLabel.trim()) updateColumnOption(databaseId, optsPanelCol.id, opt.id, { label: editingOptLabel.trim() }); setEditingOptId(null); } if (e.key === 'Escape') setEditingOptId(null); }}
                      style={{ flex: 1, background: 'var(--color-bg-elevated)', border: '0.5px solid var(--color-accent)', borderRadius: 5, padding: '3px 8px', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', outline: 'none', fontFamily: 'var(--font-sans)' }} />
                  ) : (
                    <span onClick={() => { setEditingOptId(opt.id); setEditingOptLabel(opt.label); }}
                      style={{ flex: 1, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', cursor: 'text', padding: '3px 4px', borderRadius: 4 }}>
                      {opt.label}
                    </span>
                  )}
                  <button onClick={() => deleteColumnOption(databaseId, optsPanelCol.id, opt.id)}
                    style={{ display: 'flex', padding: 3, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', borderRadius: 4, flexShrink: 0 }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-red)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}>
                    <IconTrash size={13} />
                  </button>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, padding: '4px 6px' }}>
                <IconPlus size={13} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                <input value={newOptLabel} onChange={e => setNewOptLabel(e.target.value)} placeholder="Add option…"
                  onKeyDown={e => { if (e.key === 'Enter' && newOptLabel.trim()) { addColumnOption(databaseId, optsPanelCol.id, newOptLabel.trim()); setNewOptLabel(''); } }}
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)' }} />
              </div>
            </div>
          </div>
        )}

        {/* Main column list */}
        {!typePanelId && !optionsPanelId && (
          <>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
              {columns.map(col => {
                const meta = getTypeMeta(col.type);
                const hasOpts = OPTION_TYPES.has(col.type);
                return (
                  <div key={col.id} style={{ borderBottom: '0.5px solid var(--color-border-subtle)' }}>
                    {/* Column row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px' }}>
                      <span style={{ color: 'var(--color-text-muted)', display: 'flex', flexShrink: 0 }}>{meta.icon}</span>
                      {editingId === col.id ? (
                        <input autoFocus value={editingName} onChange={e => setEditingName(e.target.value)}
                          onBlur={() => commitName(col.id)}
                          onKeyDown={e => { if (e.key === 'Enter') commitName(col.id); if (e.key === 'Escape') setEditingId(null); }}
                          style={{ flex: 1, background: 'var(--color-bg-elevated)', border: '0.5px solid var(--color-accent)', borderRadius: 5, padding: '3px 8px', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', outline: 'none', fontFamily: 'var(--font-sans)' }} />
                      ) : (
                        <span onClick={() => { setEditingId(col.id); setEditingName(col.name); }}
                          style={{ flex: 1, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', cursor: 'text' }}>
                          {col.name}
                        </span>
                      )}
                      {col.position !== 0 && (
                        <button onClick={() => { if (confirmDeleteId === col.id) { deleteColumn(databaseId, col.id); setConfirmDeleteId(null); } else setConfirmDeleteId(col.id); }}
                          style={{ display: 'flex', padding: 3, background: 'none', border: 'none', cursor: 'pointer', color: confirmDeleteId === col.id ? 'var(--color-red)' : 'var(--color-text-muted)', borderRadius: 4, flexShrink: 0, fontSize: 'var(--text-xs)', gap: 3, alignItems: 'center' }}
                          title={confirmDeleteId === col.id ? 'Click again to confirm' : 'Delete property'}>
                          <IconTrash size={13} />
                          {confirmDeleteId === col.id && <span>Confirm</span>}
                        </button>
                      )}
                    </div>
                    {/* Sub-actions */}
                    <div style={{ display: 'flex', gap: 4, padding: '0 14px 8px 38px' }}>
                      <button onClick={() => setTypePanelId(col.id)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 5, border: '0.5px solid var(--color-border-subtle)', background: 'none', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                        {meta.icon} {meta.label} <IconChevronRight size={11} />
                      </button>
                      {hasOpts && (
                        <button onClick={() => setOptionsPanelId(col.id)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 5, border: '0.5px solid var(--color-border-subtle)', background: 'none', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', cursor: 'pointer' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                          Options ({(col.config?.options ?? []).length}) <IconChevronRight size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add new column */}
            <div style={{ padding: '12px 14px', borderTop: '0.5px solid var(--color-border-subtle)', flexShrink: 0 }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Add property</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input value={newColName} onChange={e => setNewColName(e.target.value)} placeholder="Property name"
                  onKeyDown={e => { if (e.key === 'Enter' && newColName.trim()) { addColumn(databaseId, { database_id: databaseId, name: newColName.trim(), type: newColType, position: columns.length, config: defaultConfigForType(newColType), hidden: false, width: 160 }); setNewColName(''); } }}
                  style={{ flex: 1, background: 'var(--color-bg-input)', border: '0.5px solid var(--color-border-default)', borderRadius: 6, padding: '6px 10px', fontSize: 'var(--text-xs)', color: 'var(--color-text-primary)', outline: 'none', fontFamily: 'var(--font-sans)' }} />
                <select value={newColType} onChange={e => setNewColType(e.target.value as ColumnType)}
                  style={{ background: 'var(--color-bg-input)', border: '0.5px solid var(--color-border-default)', borderRadius: 6, padding: '6px 8px', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', outline: 'none', cursor: 'pointer' }}>
                  {COLUMN_TYPES.map(t => <option key={t.type} value={t.type}>{t.label}</option>)}
                </select>
              </div>
              <button onClick={() => { if (newColName.trim()) { addColumn(databaseId, { name: newColName.trim(), type: newColType }); setNewColName(''); } }}
                disabled={!newColName.trim()}
                style={{ marginTop: 8, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 0', borderRadius: 7, border: 'none', background: newColName.trim() ? 'var(--gradient-accent)' : 'var(--color-bg-active)', color: newColName.trim() ? '#fff' : 'var(--color-text-muted)', fontSize: 'var(--text-sm)', fontWeight: 600, cursor: newColName.trim() ? 'pointer' : 'default' }}
                onClick={() => { if (newColName.trim()) { addColumn(databaseId, { database_id: databaseId, name: newColName.trim(), type: newColType, position: columns.length, config: defaultConfigForType(newColType), hidden: false, width: 160 }); setNewColName(''); } }}>
                <IconPlus size={14} /> Add property
              </button>
            </div>
          </>
        )}
      </div>
    </>,
    document.body
  );
}
