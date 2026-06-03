'use client';

import { useState } from 'react';
import { Database, ViewConfig, Row } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { applyCellFilter, getStatusConfig } from '@/lib/utils';
import { IconChevronLeft, IconChevronRight, IconPlus } from '@tabler/icons-react';

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

interface CalendarViewProps {
  database: Database;
  view: ViewConfig;
}

export function CalendarView({ database, view }: CalendarViewProps) {
  const { openRow, addRow, updateCell } = useAppStore();
  const today = new Date();

  const [current, setCurrent] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const nameCol = database.columns.find(c => c.position === 0);
  const dateCol = database.columns.find(c => c.type === 'date' || c.type === 'date_range');
  const statusCol = database.columns.find(c => c.type === 'status');

  if (!dateCol) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, color: 'var(--color-text-muted)' }}>
        <span style={{ fontSize: 28 }}>📅</span>
        <span style={{ fontSize: 'var(--text-sm)' }}>No date column in this database</span>
      </div>
    );
  }

  const year = current.getFullYear();
  const month = current.getMonth();

  // Apply filters
  const rows = database.rows.filter(row => {
    const filters = view.filters ?? [];
    return filters.every(f => applyCellFilter(row.cells[f.column_id] ?? null, f.operator, f.value));
  });

  // Build calendar grid
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startPad = firstDayOfMonth.getDay(); // 0=Sun

  const cells: (number | null)[] = [
    ...Array(startPad).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const isToday = (d: number) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const getEventsForDay = (day: number): Row[] => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return rows.filter(row => {
      const val = row.cells[dateCol.id];
      if (!val) return false;
      const rowDate = String(val).split('T')[0].split('|')[0];
      return rowDate === dateStr;
    }).sort((a, b) => {
      const av = String(a.cells[dateCol.id] ?? '');
      const bv = String(b.cells[dateCol.id] ?? '');
      return av.localeCompare(bv);
    });
  };

  const getTimeStr = (row: Row): string => {
    const val = String(row.cells[dateCol.id] ?? '');
    const timePart = val.split('T')[1];
    if (!timePart) return '';
    return timePart.slice(0, 5);
  };

  const handleAddEvent = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const row = addRow(database.id);
    updateCell(database.id, row.id, dateCol.id, dateStr);
    openRow(row.id, database.id);
  };

  const getEventColor = (row: Row): string => {
    if (!statusCol) return 'var(--color-accent)';
    const status = String(row.cells[statusCol.id] ?? '');
    const cfg = getStatusConfig(status);
    return cfg.color;
  };

  const getEventBg = (row: Row): string => {
    if (!statusCol) return 'var(--color-accent)';
    const status = String(row.cells[statusCol.id] ?? '');
    const cfg = getStatusConfig(status);
    return cfg.bg;
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--color-bg-base)' }}>
      {/* Calendar header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px 10px', borderBottom: '0.5px solid var(--color-border-subtle)', flexShrink: 0 }}>
        <h2 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          {MONTH_NAMES[month]} {year}
        </h2>
        <button onClick={() => setCurrent(new Date(year, month - 1, 1))} style={navBtn}>
          <IconChevronLeft size={16} />
        </button>
        <button onClick={() => setCurrent(new Date(year, month + 1, 1))} style={navBtn}>
          <IconChevronRight size={16} />
        </button>
        <button
          onClick={() => setCurrent(new Date(today.getFullYear(), today.getMonth(), 1))}
          style={{ ...navBtn, padding: '4px 12px', fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--color-accent)', border: '0.5px solid var(--color-accent)' }}
        >
          Today
        </button>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          {rows.filter(r => r.cells[dateCol.id]).length} event{rows.filter(r => r.cells[dateCol.id]).length !== 1 ? 's' : ''} this month
        </span>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '0.5px solid var(--color-border-subtle)', flexShrink: 0 }}>
        {DAY_HEADERS.map(d => (
          <div key={d} style={{ padding: '8px 0', textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', borderRight: '0.5px solid var(--color-border-subtle)' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateRows: `repeat(${weeks.length}, minmax(100px, 1fr))`, height: '100%' }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '0.5px solid var(--color-border-subtle)' }}>
              {week.map((day, di) => {
                const events = day ? getEventsForDay(day) : [];
                const isCurrentDay = day ? isToday(day) : false;
                const isPast = day ? new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate()) : false;
                const isOtherMonth = day === null;

                return (
                  <div
                    key={di}
                    style={{
                      borderRight: di < 6 ? '0.5px solid var(--color-border-subtle)' : 'none',
                      padding: '6px', minHeight: 100,
                      background: isCurrentDay ? 'var(--color-accent-subtle)' : 'transparent',
                      opacity: isOtherMonth ? 0.3 : 1,
                      position: 'relative',
                    }}
                    onMouseEnter={e => { if (day) (e.currentTarget.querySelector('[data-add]') as HTMLElement)?.style.setProperty('opacity', '1'); }}
                    onMouseLeave={e => { if (day) (e.currentTarget.querySelector('[data-add]') as HTMLElement)?.style.setProperty('opacity', '0'); }}
                  >
                    {day && (
                      <>
                        {/* Day number */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <div style={{
                            width: 24, height: 24, borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: isCurrentDay ? 'var(--color-accent)' : 'transparent',
                            color: isCurrentDay ? '#fff' : isPast ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
                            fontSize: 'var(--text-xs)', fontWeight: isCurrentDay ? 700 : 400,
                          }}>
                            {day}
                          </div>
                          <button
                            data-add="1"
                            onClick={() => handleAddEvent(day)}
                            style={{ ...addEventBtn, opacity: 0 }}
                            title="Add event"
                          >
                            <IconPlus size={10} />
                          </button>
                        </div>

                        {/* Events */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {events.slice(0, 4).map(row => {
                            const name = nameCol ? String(row.cells[nameCol.id] ?? 'Untitled') : 'Untitled';
                            const time = getTimeStr(row);
                            const color = getEventColor(row);
                            const bg = getEventBg(row);

                            return (
                              <div
                                key={row.id}
                                onClick={() => openRow(row.id, database.id)}
                                title={time ? `${time} — ${name}` : name}
                                style={{
                                  padding: '2px 6px', borderRadius: 4, cursor: 'pointer',
                                  background: bg, color, borderLeft: `3px solid ${color}`,
                                  fontSize: 10, fontWeight: 500, lineHeight: 1.5,
                                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                  transition: 'opacity 80ms',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                              >
                                {time && <span style={{ opacity: 0.75, marginRight: 4 }}>{time}</span>}
                                {name}
                              </div>
                            );
                          })}
                          {events.length > 4 && (
                            <div
                              onClick={() => openRow(events[4].id, database.id)}
                              style={{ fontSize: 10, color: 'var(--color-accent)', paddingLeft: 6, cursor: 'pointer', fontWeight: 500 }}
                            >
                              +{events.length - 4} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const navBtn: React.CSSProperties = {
  padding: '4px 6px', borderRadius: 5,
  border: '0.5px solid var(--color-border-default)',
  background: 'none', color: 'var(--color-text-muted)',
  cursor: 'pointer', display: 'flex', alignItems: 'center',
  transition: 'all 80ms',
};

const addEventBtn: React.CSSProperties = {
  width: 18, height: 18, borderRadius: 4, border: 'none',
  background: 'var(--color-bg-active)', color: 'var(--color-text-muted)',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'opacity 100ms, background 80ms',
};
