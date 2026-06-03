'use client';

import { useState, useRef } from 'react';
import { Database, Row, Column, ViewConfig } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { applyCellFilter } from '@/lib/utils';
import { CellRenderer } from './CellRenderer';
import { ColumnMenu } from './ColumnMenu';
import { NewColumnPopover } from './NewColumnPopover';
import { getTypeMeta } from '@/lib/columnTypes';
import {
  IconPlus, IconGripVertical, IconChevronDown, IconCopy, IconTrash,
  IconLayoutSidebarRight, IconArrowUp,
} from '@tabler/icons-react';

interface TableViewProps {
  database: Database;
  view: ViewConfig;
  onOpenFilter: () => void;
}

const ROW_HEIGHT = 36;

export function TableView({ database, view, onOpenFilter }: TableViewProps) {
  const { addRow, deleteRow, duplicateRow, openRow, resizeColumn, addColumn } = useAppStore();
  const [editingCell, setEditingCell] = useState<{ rowId: string; colId: string } | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ rowId: string; x: number; y: number } | null>(null);
  const [columnMenu, setColumnMenu] = useState<{ col: Column; x: number; y: number } | null>(null);
  const [newColAnchor, setNewColAnchor] = useState<DOMRect | null>(null);
  const resizeRef = useRef<{ colId: string; startX: number; startWidth: number } | null>(null);

  // Columns: filter by view hidden_cols
  const visibleCols = database.columns
    .filter(c => !c.hidden && !(view.hidden_cols ?? []).includes(c.id))
    .sort((a, b) => a.position - b.position);

  // Apply view filters
  const filtered = database.rows.filter(row => {
    const filters = view.filters ?? [];
    if (filters.length === 0) return true;
    return filters.every(f => applyCellFilter(row.cells[f.column_id] ?? null, f.operator, f.value));
  });

  // Apply view sorts
  const rows = [...filtered].sort((a, b) => {
    const sorts = view.sorts ?? [];
    for (const sort of sorts) {
      const av = a.cells[sort.column_id];
      const bv = b.cells[sort.column_id];
      const as = av !== null && av !== undefined ? String(av) : '';
      const bs = bv !== null && bv !== undefined ? String(bv) : '';
      const cmp = as.localeCompare(bs, undefined, { numeric: true, sensitivity: 'base' });
      if (cmp !== 0) return sort.direction === 'asc' ? cmp : -cmp;
    }
    return a.position - b.position;
  });

  const startEdit = (rowId: string, colId: string) => setEditingCell({ rowId, colId });
  const endEdit = () => setEditingCell(null);

  const handleTab = (rowId: string, colId: string, shift: boolean) => {
    const ci = visibleCols.findIndex(c => c.id === colId);
    const ri = rows.findIndex(r => r.id === rowId);
    if (!shift) {
      if (ci < visibleCols.length - 1) setEditingCell({ rowId, colId: visibleCols[ci + 1].id });
      else if (ri < rows.length - 1) setEditingCell({ rowId: rows[ri + 1].id, colId: visibleCols[0].id });
    } else {
      if (ci > 0) setEditingCell({ rowId, colId: visibleCols[ci - 1].id });
      else if (ri > 0) setEditingCell({ rowId: rows[ri - 1].id, colId: visibleCols[visibleCols.length - 1].id });
    }
  };

  const handleResizeStart = (colId: string, startX: number, startWidth: number) => {
    resizeRef.current = { colId, startX, startWidth };
    const onMove = (e: MouseEvent) => {
      if (!resizeRef.current) return;
      resizeColumn(database.id, resizeRef.current.colId,
        Math.max(80, Math.min(400, resizeRef.current.startWidth + e.clientX - resizeRef.current.startX)));
    };
    const onUp = () => {
      resizeRef.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const handleColHeaderClick = (e: React.MouseEvent, col: Column) => {
    if ((e.target as HTMLElement).closest('[data-resize]')) return;
    e.stopPropagation(); // don't let the root onClick close the menu we're opening
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setColumnMenu(columnMenu?.col.id === col.id ? null : { col, x: rect.left, y: rect.bottom + 2 });
  };


  return (
    <div
      style={{ flex: 1, overflow: 'auto', position: 'relative' }}
      onClick={() => { setContextMenu(null); setColumnMenu(null); }}
    >
      {/* Column menu */}
      {columnMenu && (
        <ColumnMenu
          column={columnMenu.col}
          databaseId={database.id}
          view={view}
          position={{ x: columnMenu.x, y: columnMenu.y }}
          onClose={() => setColumnMenu(null)}
          onOpenFilter={onOpenFilter}
        />
      )}

      {/* New column popover */}
      {newColAnchor && (
        <NewColumnPopover
          databaseId={database.id}
          nextPosition={database.columns.length}
          anchorRect={newColAnchor}
          onClose={() => setNewColAnchor(null)}
        />
      )}

      {/* Row menu */}
      {contextMenu && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 1400 }} onMouseDown={() => setContextMenu(null)} />
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'fixed',
              left: Math.min(contextMenu.x, (typeof window !== 'undefined' ? window.innerWidth : 9999) - 210),
              top: Math.min(contextMenu.y, (typeof window !== 'undefined' ? window.innerHeight : 9999) - 170),
              zIndex: 1401,
              background: 'var(--color-bg-popover)', border: '0.5px solid var(--color-border-default)',
              borderRadius: 8, boxShadow: '0 16px 56px rgba(0,0,0,0.7)', minWidth: 190, overflow: 'hidden', padding: 4,
            }}
          >
            <RowMenuItem
              icon={<IconLayoutSidebarRight size={15} />}
              label="Open & edit row"
              onClick={() => { openRow(contextMenu.rowId, database.id); setContextMenu(null); }}
            />
            <RowMenuItem
              icon={<IconCopy size={15} />}
              label="Duplicate row"
              onClick={() => { duplicateRow(database.id, contextMenu.rowId); setContextMenu(null); }}
            />
            <RowMenuItem
              icon={<IconArrowUp size={15} />}
              label="Insert row above"
              onClick={() => { const nr = addRow(database.id); startEdit(nr.id, visibleCols[0]?.id ?? ''); setContextMenu(null); }}
            />
            <div style={{ height: '0.5px', background: 'var(--color-border-subtle)', margin: '4px 0' }} />
            <button
              onClick={() => { deleteRow(database.id, contextMenu.rowId); setContextMenu(null); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 5, border: 'none', background: 'none', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', cursor: 'pointer', textAlign: 'left' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-red-bg)'; e.currentTarget.style.color = 'var(--color-red)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
            >
              <span style={{ color: 'var(--color-red)', display: 'flex' }}><IconTrash size={15} /></span>
              Delete row
            </button>
          </div>
        </>
      )}

      <table style={{
        width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed',
        minWidth: visibleCols.reduce((s, c) => s + (c.width || 160), 72) + 'px',
      }}>
        <colgroup>
          <col style={{ width: 32 }} />
          {visibleCols.map(col => <col key={col.id} style={{ width: col.width || 160 }} />)}
          <col style={{ width: 40 }} />
        </colgroup>

        <thead>
          <tr style={{ height: 32, background: 'var(--color-bg-surface)', position: 'sticky', top: 0, zIndex: 10 }}>
            <th style={{ borderBottom: '0.5px solid var(--color-border-default)', borderRight: '0.5px solid var(--color-border-subtle)', width: 32 }} />

            {visibleCols.map(col => (
              <th
                key={col.id}
                onClick={e => handleColHeaderClick(e, col)}
                title="Click to rename, change type, sort, hide or delete"
                style={{
                  borderBottom: '0.5px solid var(--color-border-default)',
                  borderRight: '0.5px solid var(--color-border-subtle)',
                  textAlign: 'left', padding: '0 8px', fontWeight: 500,
                  fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.04em',
                  position: 'relative', cursor: 'pointer', userSelect: 'none',
                  background: columnMenu?.col.id === col.id ? 'var(--color-bg-active)' : undefined,
                  transition: 'background 80ms',
                }}
                onMouseEnter={e => {
                  if (columnMenu?.col.id !== col.id) e.currentTarget.style.background = 'var(--color-bg-hover)';
                  const ch = e.currentTarget.querySelector('[data-colchev]') as HTMLElement | null;
                  if (ch) ch.style.opacity = '1';
                }}
                onMouseLeave={e => {
                  if (columnMenu?.col.id !== col.id) e.currentTarget.style.background = '';
                  const ch = e.currentTarget.querySelector('[data-colchev]') as HTMLElement | null;
                  if (ch) ch.style.opacity = '0';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, overflow: 'hidden' }}>
                  <span style={{ color: 'var(--color-text-muted)', display: 'flex', flexShrink: 0, opacity: 0.7 }}>
                    {getTypeMeta(col.type).icon}
                  </span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {col.name}
                  </span>
                  {(view.sorts ?? []).find(s => s.column_id === col.id) && (
                    <span style={{ color: 'var(--color-accent-bright)', flexShrink: 0 }}>
                      {(view.sorts ?? []).find(s => s.column_id === col.id)?.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                  <span data-colchev style={{ display: 'flex', flexShrink: 0, opacity: columnMenu?.col.id === col.id ? 1 : 0, transition: 'opacity 80ms', color: 'var(--color-text-secondary)' }}>
                    <IconChevronDown size={12} />
                  </span>
                </div>

                <div
                  data-resize="1"
                  onMouseDown={e => { e.stopPropagation(); handleResizeStart(col.id, e.clientX, col.width || 160); }}
                  style={{
                    position: 'absolute', right: 0, top: 0, bottom: 0, width: 5,
                    cursor: 'col-resize', zIndex: 1,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-accent)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                />
              </th>
            ))}

            <th style={{ borderBottom: '0.5px solid var(--color-border-default)', width: 40 }}>
              <button
                onClick={e => { e.stopPropagation(); const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); setNewColAnchor(newColAnchor ? null : r); }}
                style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, border: 'none', background: newColAnchor ? 'var(--color-bg-active)' : 'none', cursor: 'pointer', color: 'var(--color-text-muted)', margin: '0 auto' }}
                title="Add column"
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-bg-hover)'; e.currentTarget.style.color = 'var(--color-text-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = newColAnchor ? 'var(--color-bg-active)' : 'none'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
              >
                <IconPlus size={14} />
              </button>
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map(row => (
            <tr
              key={row.id}
              style={{ height: ROW_HEIGHT, background: hoveredRow === row.id ? 'var(--color-bg-hover)' : 'transparent', transition: 'background 80ms' }}
              onMouseEnter={() => setHoveredRow(row.id)}
              onMouseLeave={() => setHoveredRow(null)}
              onContextMenu={e => { e.preventDefault(); setContextMenu({ rowId: row.id, x: e.clientX, y: e.clientY }); }}
            >
              {/* Row handle — click to open the row menu */}
              <td style={{ width: 32, borderBottom: '0.5px solid var(--color-border-subtle)', textAlign: 'center', padding: 0 }}>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    setContextMenu(contextMenu?.rowId === row.id ? null : { rowId: row.id, x: r.right + 4, y: r.top });
                  }}
                  title="Edit, duplicate or delete row"
                  style={{
                    width: 24, height: 24, margin: '0 auto', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 5,
                    background: contextMenu?.rowId === row.id ? 'var(--color-bg-active)' : 'transparent',
                    color: 'var(--color-text-muted)',
                    opacity: hoveredRow === row.id || contextMenu?.rowId === row.id ? 1 : 0,
                    transition: 'opacity 80ms, background 80ms',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-active)')}
                  onMouseLeave={e => (e.currentTarget.style.background = contextMenu?.rowId === row.id ? 'var(--color-bg-active)' : 'transparent')}
                >
                  <IconGripVertical size={14} />
                </button>
              </td>

              {visibleCols.map((col, ci) => {
                const isFirst = ci === 0;
                const isEditing = editingCell?.rowId === row.id && editingCell?.colId === col.id;
                return (
                  <td
                    key={col.id}
                    style={{
                      borderBottom: '0.5px solid var(--color-border-subtle)',
                      borderRight: '0.5px solid var(--color-border-subtle)',
                      padding: 0, position: 'relative', overflow: 'visible',
                      background: isEditing ? 'var(--color-bg-input)' : 'transparent',
                      outline: isEditing ? '2px solid var(--color-accent)' : 'none',
                      outlineOffset: -1,
                    }}
                  >
                    {isFirst ? (
                      <div style={{ display: 'flex', alignItems: 'center', height: ROW_HEIGHT, overflow: 'hidden' }}>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <CellRenderer column={col} row={row} databaseId={database.id} isEditing={isEditing}
                            onStartEdit={() => startEdit(row.id, col.id)} onEndEdit={endEdit}
                            onTab={shift => handleTab(row.id, col.id, shift)} />
                        </div>
                        {hoveredRow === row.id && !isEditing && (
                          <button
                            onClick={e => { e.stopPropagation(); openRow(row.id, database.id); }}
                            style={{ flexShrink: 0, padding: '2px 4px', marginRight: 4, borderRadius: 4, border: '0.5px solid var(--color-border-default)', background: 'var(--color-bg-surface)', cursor: 'pointer', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}
                            title="Open detail"
                          >↗</button>
                        )}
                      </div>
                    ) : (
                      <div style={{ height: ROW_HEIGHT, overflow: 'hidden', position: 'relative' }}>
                        <CellRenderer column={col} row={row} databaseId={database.id} isEditing={isEditing}
                          onStartEdit={() => startEdit(row.id, col.id)} onEndEdit={endEdit}
                          onTab={shift => handleTab(row.id, col.id, shift)} />
                      </div>
                    )}
                  </td>
                );
              })}
              <td style={{ borderBottom: '0.5px solid var(--color-border-subtle)' }} />
            </tr>
          ))}
        </tbody>

        <tfoot>
          <tr>
            <td colSpan={visibleCols.length + 2} style={{ padding: 0 }}>
              <button
                onClick={() => { const row = addRow(database.id); startEdit(row.id, visibleCols[0]?.id ?? ''); }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-text-primary)'; e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.background = 'none'; }}
              >
                <IconPlus size={14} /> New
              </button>
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Empty state when all rows filtered out */}
      {rows.length === 0 && database.rows.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', color: 'var(--color-text-muted)', gap: 8 }}>
          <span style={{ fontSize: 28 }}>🔍</span>
          <span style={{ fontSize: 'var(--text-sm)' }}>No rows match the current filters</span>
        </div>
      )}
    </div>
  );
}

function RowMenuItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
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
