'use client';

import { useState, useRef, useCallback } from 'react';
import { Database, Row, Column } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { CellRenderer } from './CellRenderer';
import { IconPlus, IconGripVertical, IconDots, IconTrash, IconCopy } from '@tabler/icons-react';

interface TableViewProps {
  database: Database;
}

const ROW_HEIGHT = 36;
const MIN_COL_WIDTH = 80;
const MAX_COL_WIDTH = 400;

export function TableView({ database }: TableViewProps) {
  const { addRow, deleteRow, duplicateRow, openRow, resizeColumn } = useAppStore();
  const [editingCell, setEditingCell] = useState<{ rowId: string; colId: string } | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ rowId: string; x: number; y: number } | null>(null);
  const resizeRef = useRef<{ colId: string; startX: number; startWidth: number } | null>(null);

  const visibleCols = database.columns
    .filter((c) => !c.hidden)
    .sort((a, b) => a.position - b.position);

  const rows = [...database.rows].sort((a, b) => a.position - b.position);

  const startEdit = (rowId: string, colId: string) => setEditingCell({ rowId, colId });
  const endEdit = () => setEditingCell(null);

  const handleTab = (rowId: string, colId: string, shift: boolean) => {
    const colIdx = visibleCols.findIndex((c) => c.id === colId);
    const rowIdx = rows.findIndex((r) => r.id === rowId);

    if (!shift) {
      if (colIdx < visibleCols.length - 1) {
        setEditingCell({ rowId, colId: visibleCols[colIdx + 1].id });
      } else if (rowIdx < rows.length - 1) {
        setEditingCell({ rowId: rows[rowIdx + 1].id, colId: visibleCols[0].id });
      }
    } else {
      if (colIdx > 0) {
        setEditingCell({ rowId, colId: visibleCols[colIdx - 1].id });
      } else if (rowIdx > 0) {
        setEditingCell({ rowId: rows[rowIdx - 1].id, colId: visibleCols[visibleCols.length - 1].id });
      }
    }
  };

  const handleResizeStart = (colId: string, startX: number, startWidth: number) => {
    resizeRef.current = { colId, startX, startWidth };
    const handleMove = (e: MouseEvent) => {
      if (!resizeRef.current) return;
      const delta = e.clientX - resizeRef.current.startX;
      const newWidth = Math.max(MIN_COL_WIDTH, Math.min(MAX_COL_WIDTH, resizeRef.current.startWidth + delta));
      resizeColumn(database.id, resizeRef.current.colId, newWidth);
    };
    const handleUp = () => {
      resizeRef.current = null;
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  };

  const handleContextMenu = (e: React.MouseEvent, rowId: string) => {
    e.preventDefault();
    setContextMenu({ rowId, x: e.clientX, y: e.clientY });
  };

  return (
    <div style={{ flex: 1, overflow: 'auto', position: 'relative' }} onClick={() => { setContextMenu(null); }}>
      {/* Context menu */}
      {contextMenu && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 200 }} onClick={() => setContextMenu(null)} />
          <div style={{
            position: 'fixed', left: contextMenu.x, top: contextMenu.y, zIndex: 201,
            background: 'var(--color-bg-surface)', border: '0.5px solid var(--color-border-default)',
            borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', minWidth: 180, overflow: 'hidden',
          }}>
            {[
              { icon: '↗', label: 'Open in panel', action: () => { openRow(contextMenu.rowId, database.id); setContextMenu(null); } },
              { icon: '⧉', label: 'Duplicate row', action: () => { duplicateRow(database.id, contextMenu.rowId); setContextMenu(null); } },
            ].map((item) => (
              <div key={item.label} onClick={item.action} style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ width: 16, textAlign: 'center', color: 'var(--color-text-muted)' }}>{item.icon}</span>
                {item.label}
              </div>
            ))}
            <div style={{ height: 1, background: 'var(--color-border-subtle)', margin: '4px 0' }} />
            <div onClick={() => { deleteRow(database.id, contextMenu.rowId); setContextMenu(null); }}
              style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-sm)', color: 'var(--color-red)' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-red-bg)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ width: 16, textAlign: 'center' }}>✕</span>
              Delete row
            </div>
          </div>
        </>
      )}

      <table style={{
        width: '100%', borderCollapse: 'collapse',
        tableLayout: 'fixed', minWidth: visibleCols.reduce((sum, c) => sum + (c.width || 160), 32) + 'px',
      }}>
        {/* Column group for widths */}
        <colgroup>
          <col style={{ width: 32 }} />
          {visibleCols.map((col) => <col key={col.id} style={{ width: col.width || 160 }} />)}
          <col style={{ width: 40 }} />
        </colgroup>

        {/* Header */}
        <thead>
          <tr style={{ height: 32, background: 'var(--color-bg-surface)', position: 'sticky', top: 0, zIndex: 10 }}>
            {/* Drag handle col */}
            <th style={{ borderBottom: '0.5px solid var(--color-border-default)', borderRight: '0.5px solid var(--color-border-subtle)', width: 32 }} />

            {visibleCols.map((col) => (
              <th key={col.id} style={{
                borderBottom: '0.5px solid var(--color-border-default)',
                borderRight: '0.5px solid var(--color-border-subtle)',
                textAlign: 'left', padding: '0 10px', fontWeight: 500,
                fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.04em',
                position: 'relative', cursor: 'pointer', userSelect: 'none',
              }}>
                {col.name}
                {/* Resize handle */}
                <div
                  onMouseDown={(e) => { e.stopPropagation(); handleResizeStart(col.id, e.clientX, col.width || 160); }}
                  style={{
                    position: 'absolute', right: 0, top: 0, bottom: 0, width: 4,
                    cursor: 'col-resize', zIndex: 1,
                    borderRight: '2px solid transparent',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderRightColor = 'var(--color-accent)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderRightColor = 'transparent'}
                />
              </th>
            ))}

            {/* Extra col for + */}
            <th style={{ borderBottom: '0.5px solid var(--color-border-default)', width: 40 }}>
              <button style={{
                width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 4, border: 'none', background: 'none', cursor: 'pointer',
                color: 'var(--color-text-muted)', margin: '0 auto',
              }}
                title="Add column"
              >
                <IconPlus size={14} />
              </button>
            </th>
          </tr>
        </thead>

        {/* Rows */}
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={row.id}
              style={{
                height: ROW_HEIGHT,
                background: hoveredRow === row.id ? 'var(--color-bg-hover)' : 'transparent',
                transition: 'background 80ms',
                cursor: 'default',
              }}
              onMouseEnter={() => setHoveredRow(row.id)}
              onMouseLeave={() => setHoveredRow(null)}
              onContextMenu={(e) => handleContextMenu(e, row.id)}
            >
              {/* Drag handle */}
              <td style={{ width: 32, borderBottom: '0.5px solid var(--color-border-subtle)', textAlign: 'center' }}>
                <span style={{ color: 'var(--color-text-muted)', opacity: hoveredRow === row.id ? 0.5 : 0, cursor: 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconGripVertical size={13} />
                </span>
              </td>

              {visibleCols.map((col, colIdx) => {
                const isFirst = colIdx === 0;
                const isEditing = editingCell?.rowId === row.id && editingCell?.colId === col.id;

                return (
                  <td key={col.id} style={{
                    borderBottom: '0.5px solid var(--color-border-subtle)',
                    borderRight: '0.5px solid var(--color-border-subtle)',
                    padding: 0, position: 'relative', overflow: 'visible',
                    background: isEditing ? 'var(--color-bg-input)' : 'transparent',
                    outline: isEditing ? '1.5px solid var(--color-accent)' : 'none',
                    outlineOffset: -1,
                  }}>
                    {/* First column: click to open panel + row-expand icon */}
                    {isFirst && (
                      <div style={{ display: 'flex', alignItems: 'center', height: ROW_HEIGHT, overflow: 'hidden' }}>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <CellRenderer
                            column={col}
                            row={row}
                            databaseId={database.id}
                            isEditing={isEditing}
                            onStartEdit={() => startEdit(row.id, col.id)}
                            onEndEdit={endEdit}
                            onTab={(shift) => handleTab(row.id, col.id, shift)}
                          />
                        </div>
                        {hoveredRow === row.id && !isEditing && (
                          <button
                            onClick={(e) => { e.stopPropagation(); openRow(row.id, database.id); }}
                            style={{
                              flexShrink: 0, padding: '2px 4px', marginRight: 4,
                              borderRadius: 4, border: '0.5px solid var(--color-border-default)',
                              background: 'var(--color-bg-surface)', cursor: 'pointer',
                              fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)',
                              display: 'flex', alignItems: 'center',
                            }}
                            title="Open detail"
                          >↗</button>
                        )}
                      </div>
                    )}

                    {!isFirst && (
                      <div style={{ height: ROW_HEIGHT, overflow: 'hidden', position: 'relative' }}>
                        <CellRenderer
                          column={col}
                          row={row}
                          databaseId={database.id}
                          isEditing={isEditing}
                          onStartEdit={() => startEdit(row.id, col.id)}
                          onEndEdit={endEdit}
                          onTab={(shift) => handleTab(row.id, col.id, shift)}
                        />
                      </div>
                    )}
                  </td>
                );
              })}

              {/* Empty last col */}
              <td style={{ borderBottom: '0.5px solid var(--color-border-subtle)' }} />
            </tr>
          ))}
        </tbody>

        {/* Footer: add row */}
        <tfoot>
          <tr>
            <td colSpan={visibleCols.length + 2} style={{ padding: 0 }}>
              <button
                onClick={() => { const row = addRow(database.id); startEdit(row.id, visibleCols[0]?.id ?? ''); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, width: '100%',
                  padding: '8px 12px', border: 'none', background: 'none',
                  cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)',
                  transition: 'all 100ms',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-text-primary)'; e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.background = 'none'; }}
              >
                <IconPlus size={14} /> New
              </button>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
