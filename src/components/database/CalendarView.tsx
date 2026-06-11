'use client';

import { useState } from 'react';
import { Database, ViewConfig, Row } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { applyCellFilter, getStatusConfig } from '@/lib/utils';
import { IconChevronLeft, IconChevronRight, IconPlus, IconCalendarEvent, IconDownload, IconX } from '@tabler/icons-react';

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

interface CalendarViewProps {
  database: Database;
  view: ViewConfig;
}

// Absence title presets
const ABSENCE_PRESETS = ['Out of office', 'Sick leave', 'Vacation', 'Conference', 'Remote', 'Travel'];

export function CalendarView({ database, view }: CalendarViewProps) {
  const { openRow, addRow, updateCell, users, absences, addAbsence, deleteAbsence } = useAppStore();
  const today = new Date();

  const [current, setCurrent] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [absenceModal, setAbsenceModal] = useState<{ day: string } | null>(null);
  const [absenceTitle, setAbsenceTitle] = useState('Out of office');
  const [absenceEnd, setAbsenceEnd] = useState('');

  const nameCol = database.columns.find(c => c.position === 0);
  const dateCol = database.columns.find(c => c.type === 'date' || c.type === 'date_range');
  const statusCol = database.columns.find(c => c.type === 'status');

  if (!dateCol) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, color: 'var(--color-text-muted)' }}>
        <IconCalendarEvent size={32} style={{ opacity: 0.4 }} />
        <span style={{ fontSize: 'var(--text-sm)' }}>No date column in this database</span>
      </div>
    );
  }

  const year = current.getFullYear();
  const month = current.getMonth();

  const rows = database.rows.filter(row => {
    const filters = view.filters ?? [];
    return filters.every(f => applyCellFilter(row.cells[f.column_id] ?? null, f.operator, f.value));
  });

  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Monday-first: shift so Mon=0, Tue=1, …, Sun=6 (getDay returns Sun=0)
  const startPad = (firstDayOfMonth.getDay() + 6) % 7;

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
    }).sort((a, b) => String(a.cells[dateCol.id] ?? '').localeCompare(String(b.cells[dateCol.id] ?? '')));
  };

  const getAbsencesForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return absences.filter(a => a.date_start <= dateStr && a.date_end >= dateStr);
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
    return getStatusConfig(String(row.cells[statusCol.id] ?? '')).color;
  };

  const getEventBg = (row: Row): string => {
    if (!statusCol) return 'var(--color-accent)';
    return getStatusConfig(String(row.cells[statusCol.id] ?? '')).bg;
  };

  const handleSubscribe = () => {
    const webcalUrl = `webcal://${window.location.host}/api/meetings.ics`;
    window.location.href = webcalUrl;
  };

  const handleDownloadIcs = () => {
    const link = document.createElement('a');
    link.href = '/api/meetings.ics';
    link.download = 'appercept-meetings.ics';
    link.click();
  };

  const submitAbsence = () => {
    if (!absenceModal) return;
    const currentUser = useAppStore.getState().accounts.find(a => a.id === useAppStore.getState().sessionAccountId);
    const userId = currentUser?.id ?? useAppStore.getState().currentUserId;
    addAbsence({
      user_id: userId,
      title: absenceTitle || 'Out of office',
      date_start: absenceModal.day,
      date_end: absenceEnd || absenceModal.day,
    });
    setAbsenceModal(null);
    setAbsenceTitle('Out of office');
    setAbsenceEnd('');
  };

  const ABSENCE_COLORS = ['#a78bfa', '#fb923c', '#f472b6', '#2dd4bf', '#60a5fa', '#f5c518'];

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
        >Today</button>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          {rows.filter(r => r.cells[dateCol.id]).length} event{rows.filter(r => r.cells[dateCol.id]).length !== 1 ? 's' : ''}
        </span>
        {/* iCal subscription */}
        <button onClick={handleSubscribe} title="Subscribe in Apple Calendar / Google Calendar via webcal"
          style={{ ...navBtn, gap: 5, padding: '4px 10px', color: 'var(--color-accent)', border: '0.5px solid var(--color-accent)', fontSize: 'var(--text-xs)', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
          <IconCalendarEvent size={13} /> Subscribe
        </button>
        <button onClick={handleDownloadIcs} title="Download .ics file"
          style={{ ...navBtn, padding: '4px 8px', display: 'flex', alignItems: 'center' }}>
          <IconDownload size={14} />
        </button>
      </div>

      {/* Absence legend */}
      {absences.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 20px', borderBottom: '0.5px solid var(--color-border-subtle)', background: 'var(--color-bg-surface)', flexWrap: 'wrap', flexShrink: 0 }}>
          <span style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Availability</span>
          {users.map((u, i) => {
            const userAbsences = absences.filter(a => a.user_id === u.id);
            if (!userAbsences.length) return null;
            const color = ABSENCE_COLORS[i % ABSENCE_COLORS.length];
            return (
              <span key={u.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                {u.name} ({userAbsences.length} absence{userAbsences.length !== 1 ? 's' : ''})
              </span>
            );
          })}
        </div>
      )}

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
                const dayAbsences = day ? getAbsencesForDay(day) : [];
                const isCurrentDay = day ? isToday(day) : false;
                const isPast = day ? new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate()) : false;

                return (
                  <div
                    key={di}
                    style={{
                      borderRight: di < 6 ? '0.5px solid var(--color-border-subtle)' : 'none',
                      padding: '6px', minHeight: 100,
                      background: isCurrentDay ? 'var(--color-accent-subtle)' : 'transparent',
                      opacity: day === null ? 0.3 : 1,
                      position: 'relative',
                    }}
                    onMouseEnter={e => { if (day) (e.currentTarget.querySelector('[data-add]') as HTMLElement)?.style.setProperty('opacity', '1'); }}
                    onMouseLeave={e => { if (day) (e.currentTarget.querySelector('[data-add]') as HTMLElement)?.style.setProperty('opacity', '0'); }}
                  >
                    {day && (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <div style={{
                            width: 24, height: 24, borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: isCurrentDay ? 'var(--color-accent)' : 'transparent',
                            color: isCurrentDay ? '#fff' : isPast ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
                            fontSize: 'var(--text-xs)', fontWeight: isCurrentDay ? 700 : 400,
                          }}>{day}</div>
                          <div style={{ display: 'flex', gap: 2 }}>
                            <button
                              data-add="1"
                              onClick={() => handleAddEvent(day)}
                              style={{ ...addEventBtn, opacity: 0 }}
                              title="Add event"
                            ><IconPlus size={10} /></button>
                            <button
                              onClick={() => {
                                const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                setAbsenceModal({ day: ds });
                                setAbsenceEnd(ds);
                              }}
                              style={{ ...addEventBtn, opacity: 0, color: '#a78bfa' }}
                              title="Mark absence / out of office"
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/><line x1="17" y1="3" x2="22" y2="8"/><line x1="22" y1="3" x2="17" y2="8"/></svg>
                            </button>
                          </div>
                        </div>

                        {/* Absence indicators */}
                        {dayAbsences.map((ab, ai) => {
                          const u = users.find(u => u.id === ab.user_id);
                          const color = ABSENCE_COLORS[users.findIndex(u => u.id === ab.user_id) % ABSENCE_COLORS.length];
                          return (
                            <div key={ab.id} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 5px', borderRadius: 4, background: `${color}22`, borderLeft: `3px solid ${color}`, marginBottom: 2, fontSize: 10, color, fontWeight: 500 }}>
                              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u?.name?.split(' ')[0] ?? '?'} — {ab.title}</span>
                              <button onClick={() => deleteAbsence(ab.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color, opacity: 0.7, display: 'flex' }}><IconX size={9} /></button>
                            </div>
                          );
                        })}

                        {/* Events */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {events.slice(0, 3).map(row => {
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
                                }}
                                onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                              >
                                {time && <span style={{ opacity: 0.75, marginRight: 4 }}>{time}</span>}
                                {name}
                              </div>
                            );
                          })}
                          {events.length > 3 && (
                            <div style={{ fontSize: 10, color: 'var(--color-accent)', paddingLeft: 6, cursor: 'pointer', fontWeight: 500 }}>
                              +{events.length - 3} more
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

      {/* Absence modal */}
      {absenceModal && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.5)' }} onClick={() => setAbsenceModal(null)} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1000, width: 340, background: 'var(--color-bg-surface)', border: '0.5px solid var(--color-border-default)', borderRadius: 'var(--card-radius)', padding: 22, boxShadow: '0 16px 64px rgba(0,0,0,0.55)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>Mark absence</h3>
              <button onClick={() => setAbsenceModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex' }}><IconX size={16} /></button>
            </div>

            <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Type</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {ABSENCE_PRESETS.map((p) => (
                <button key={p} onClick={() => setAbsenceTitle(p)} style={{ padding: '4px 10px', borderRadius: 20, border: `1px solid ${absenceTitle === p ? '#a78bfa' : 'var(--color-border-default)'}`, background: absenceTitle === p ? 'rgba(167,139,250,0.15)' : 'none', color: absenceTitle === p ? '#a78bfa' : 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', cursor: 'pointer', fontWeight: absenceTitle === p ? 600 : 400 }}>{p}</button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>From</label>
                <input type="date" value={absenceModal.day} readOnly style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '0.5px solid var(--color-border-default)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', outline: 'none', colorScheme: 'dark', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>To</label>
                <input type="date" value={absenceEnd} min={absenceModal.day} onChange={(e) => setAbsenceEnd(e.target.value)} style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '0.5px solid var(--color-border-default)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', outline: 'none', colorScheme: 'dark', boxSizing: 'border-box' }} />
              </div>
            </div>

            <button onClick={submitAbsence} style={{ width: '100%', padding: '9px 0', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', color: '#fff', fontWeight: 700, fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
              Save absence
            </button>
          </div>
        </>
      )}
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
