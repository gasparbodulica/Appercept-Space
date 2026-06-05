'use client';

import { Database, Row, ViewConfig } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { getStatusConfig, getPriorityConfig, getTagConfig, formatDate, isOverdue, applyCellFilter } from '@/lib/utils';
import { USERS } from '@/lib/seed';
import { IconPlus, IconAlertTriangle } from '@tabler/icons-react';

const STATUS_COLUMNS = ['Not started', 'In progress', 'Started', 'Done', 'Blocked'];

interface BoardViewProps {
  database: Database;
  view: ViewConfig;
}

export function BoardView({ database, view }: BoardViewProps) {
  const { addRow, updateCell, openRow } = useAppStore();

  const statusCol = database.columns.find((c) => c.type === 'status');
  const nameCol = database.columns.find((c) => c.position === 0);
  const priorityCol = database.columns.find((c) => c.type === 'priority');
  const assigneeCol = database.columns.find((c) => c.type === 'person');
  const dateCol = database.columns.find((c) => c.type === 'date' || c.type === 'date_range');
  const tagsCol = database.columns.find((c) => c.type === 'tags' || c.type === 'multi_select');

  // Apply view filters (excluding the status column filter since board is already grouped by it)
  const filteredRows = database.rows.filter(row => {
    const filters = (view.filters ?? []).filter(f => f.column_id !== statusCol?.id);
    return filters.every(f => applyCellFilter(row.cells[f.column_id] ?? null, f.operator, f.value));
  });

  const getRowsForStatus = (status: string): Row[] => {
    return filteredRows.filter((r) => {
      const val = statusCol ? r.cells[statusCol.id] : null;
      return (val ?? 'Not started') === status;
    });
  };

  const addCardToStatus = (status: string) => {
    const row = addRow(database.id);
    if (statusCol) updateCell(database.id, row.id, statusCol.id, status);
    openRow(row.id, database.id);
  };

  return (
    <div style={{ display: 'flex', gap: 12, padding: '16px 20px', overflowX: 'auto', height: '100%', alignItems: 'flex-start' }}>
      {STATUS_COLUMNS.map((status) => {
        const cfg = getStatusConfig(status);
        const rows = getRowsForStatus(status);

        return (
          <div key={status} style={{ minWidth: 260, maxWidth: 280, flex: '0 0 260px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Column header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px' }}>
              <span style={{ fontSize: 11, color: cfg.color }}>{cfg.icon}</span>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{status}</span>
              <span style={{
                marginLeft: 4, padding: '1px 6px', borderRadius: 9999,
                background: 'var(--color-bg-active)', color: 'var(--color-text-muted)',
                fontSize: 10, fontWeight: 600,
              }}>{rows.length}</span>
              <button onClick={() => addCardToStatus(status)}
                style={{ marginLeft: 'auto', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-hover)'; e.currentTarget.style.color = 'var(--color-text-primary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
              >
                <IconPlus size={14} />
              </button>
            </div>

            {/* Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {rows.map((row) => {
                const name = nameCol ? String(row.cells[nameCol.id] ?? 'Untitled') : 'Untitled';
                const priority = priorityCol ? String(row.cells[priorityCol.id] ?? '') : '';
                const assigneeId = assigneeCol ? String(row.cells[assigneeCol.id] ?? '') : '';
                const date = dateCol ? row.cells[dateCol.id] : null;
                const tags = tagsCol ? row.cells[tagsCol.id] : null;
                const user = USERS.find((u) => u.id === assigneeId);
                const pcfg = priority ? getPriorityConfig(priority) : null;
                const overdue = date ? isOverdue(String(date)) : false;

                return (
                  <div key={row.id}
                    onClick={() => openRow(row.id, database.id)}
                    style={{
                      background: 'var(--color-bg-elevated)',
                      border: '0.5px solid var(--color-border-default)',
                      borderRadius: 8,
                      padding: '12px 14px',
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--color-bg-hover)';
                      e.currentTarget.style.borderColor = 'var(--color-border-strong)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--color-bg-elevated)';
                      e.currentTarget.style.borderColor = 'var(--color-border-default)';
                      e.currentTarget.style.transform = '';
                      e.currentTarget.style.boxShadow = '';
                    }}
                  >
                    {/* Tags */}
                    {tags && Array.isArray(tags) && tags.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                        {(tags as string[]).map((tag) => {
                          const tc = getTagConfig(tag);
                          return (
                            <span key={tag} style={{ padding: '1px 6px', borderRadius: 4, background: tc.bg, color: tc.color, fontSize: 10, fontWeight: 500 }}>{tag}</span>
                          );
                        })}
                      </div>
                    )}

                    {/* Title */}
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 10, lineHeight: 1.4 }}>{name}</div>

                    {/* Footer */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {pcfg && (
                        <span style={{ padding: '1px 6px', borderRadius: 4, background: pcfg.bg, color: pcfg.color, fontSize: 10, fontWeight: 500 }}>{priority}</span>
                      )}
                      {date && (
                        <span style={{ fontSize: 10, color: overdue ? 'var(--color-red)' : 'var(--color-text-muted)', marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          {overdue && <IconAlertTriangle size={10} />}{formatDate(String(date))}
                        </span>
                      )}
                      {user && (
                        <div style={{
                          width: 20, height: 20, borderRadius: '50%', background: user.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: 9, fontWeight: 700, marginLeft: date ? 0 : 'auto', flexShrink: 0,
                        }}>{user.initials}</div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Add card */}
              <button onClick={() => addCardToStatus(status)} style={{
                width: '100%', padding: '8px 12px', borderRadius: 8,
                border: '0.5px dashed var(--color-border-subtle)',
                background: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)',
                transition: 'all 100ms',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-border-default)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border-subtle)'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
              >
                <IconPlus size={12} /> Add card
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
