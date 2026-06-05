'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/lib/store';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

function getThisWeekDates(): string[] {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day === 0 ? 7 : day) - 1));
  monday.setHours(0, 0, 0, 0);
  return DAYS.map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split('T')[0];
  });
}

export function TeamCapacityHeatmap() {
  const { users, databases, pages } = useAppStore();

  const weekDates = useMemo(() => getThisWeekDates(), []);

  const dbBySlug = (slug: string) =>
    Object.values(databases).find((d) => pages.some((p) => p.id === d.page_id && p.slug === slug));

  const projectsDb = dbBySlug('projects');
  const todoDb     = dbBySlug('todo');
  const meetingsDb = dbBySlug('meetings');

  // Per-user metrics
  const userStats = useMemo(() => {
    return users.map((u) => {
      // Active projects
      const projPersonCol = projectsDb?.columns.find((c) => c.type === 'person');
      const projStatCol   = projectsDb?.columns.find((c) => c.type === 'status');
      const projNameCol   = projectsDb?.columns.find((c) => c.position === 0);
      const activeProjects = (projectsDb?.rows ?? []).filter((r) => {
        const assigned = projPersonCol ? String(r.cells[projPersonCol.id] ?? '') : '';
        const status   = projStatCol   ? String(r.cells[projStatCol.id] ?? '')   : '';
        return assigned === u.id && status !== 'Done' && status !== 'Completed';
      });

      // Open tasks
      const taskPersonCol = todoDb?.columns.find((c) => c.type === 'person');
      const taskStatCol   = todoDb?.columns.find((c) => c.type === 'status');
      const openTasks = (todoDb?.rows ?? []).filter((r) => {
        const assigned = taskPersonCol ? String(r.cells[taskPersonCol.id] ?? '') : '';
        const status   = taskStatCol   ? String(r.cells[taskStatCol.id] ?? '')   : '';
        return assigned === u.id && status !== 'Done' && status !== 'Completed';
      });

      // Meetings this week
      const mtgPersonCol = meetingsDb?.columns.find((c) => c.type === 'person' || c.name === 'Attendees');
      const mtgDateCol   = meetingsDb?.columns.find((c) => c.type === 'date');
      const weekMeetings = (meetingsDb?.rows ?? []).filter((r) => {
        const date = mtgDateCol ? String(r.cells[mtgDateCol.id] ?? '').split('T')[0] : '';
        const inWeek = weekDates.includes(date);
        if (!inWeek) return false;
        if (mtgPersonCol) {
          return String(r.cells[mtgPersonCol.id] ?? '') === u.id;
        }
        return true; // if no attendee column, count all meetings
      });

      // Utilisation: each active project = 20%, each open task = 4%, capped at 100%
      const util = Math.min(100, activeProjects.length * 20 + openTasks.length * 4);

      // Daily meeting load this week (meetings per day)
      const dailyMeetings = weekDates.map((d) =>
        (meetingsDb?.rows ?? []).filter((r) => {
          const date = mtgDateCol ? String(r.cells[mtgDateCol.id] ?? '').split('T')[0] : '';
          return date === d;
        }).length
      );

      return {
        user: u,
        activeProjects: activeProjects.map((r) => projNameCol ? String(r.cells[projNameCol.id] ?? 'Project') : 'Project'),
        openTaskCount: openTasks.length,
        weekMeetingCount: weekMeetings.length,
        utilisation: util,
        dailyMeetings,
      };
    });
  }, [users, databases, pages, weekDates]);

  const utilColor = (pct: number) => {
    if (pct >= 85) return 'var(--color-red)';
    if (pct >= 60) return 'var(--color-amber)';
    if (pct >= 30) return 'var(--color-green)';
    return 'var(--color-text-muted)';
  };

  const today = new Date().toISOString().split('T')[0];
  const todayIdx = weekDates.indexOf(today);

  return (
    <div style={{
      background: 'var(--color-bg-elevated)',
      border: '0.5px solid var(--color-border-default)',
      borderRadius: 'var(--card-radius)',
      padding: '20px 22px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Team capacity</h2>
          <p style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 3 }}>This week · projects + tasks load per person</p>
        </div>
        <div style={{ display: 'flex', gap: 14, fontSize: 10, color: 'var(--color-text-muted)' }}>
          {[['var(--color-green)', 'Available'], ['var(--color-amber)', 'Busy'], ['var(--color-red)', 'Overloaded']].map(([c, l]) => (
            <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />{l}
            </span>
          ))}
        </div>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '160px repeat(5, 1fr)', gap: 6, marginBottom: 8 }}>
        <div />
        {DAYS.map((d, i) => (
          <div key={d} style={{
            textAlign: 'center', fontSize: 10, fontWeight: 700,
            color: i === todayIdx ? 'var(--color-accent-bright)' : 'var(--color-text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.05em',
            background: i === todayIdx ? 'var(--color-accent-subtle)' : 'transparent',
            borderRadius: 5, padding: '3px 0',
          }}>{d}{i === todayIdx ? ' ·' : ''}</div>
        ))}
      </div>

      {/* Rows per user */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {userStats.map(({ user, activeProjects, openTaskCount, weekMeetingCount, utilisation, dailyMeetings }) => (
          <div key={user.id} style={{ display: 'grid', gridTemplateColumns: '160px repeat(5, 1fr)', gap: 6, alignItems: 'center' }}>
            {/* Name + util bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              {user.avatar_url
                ? <img src={user.avatar_url} style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                : <div style={{ width: 26, height: 26, borderRadius: '50%', background: user.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{user.initials}</div>
              }
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name.split(' ')[0]}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <div style={{ flex: 1, height: 4, background: 'var(--color-bg-active)', borderRadius: 9999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${utilisation}%`, background: utilColor(utilisation), borderRadius: 9999, transition: 'width 400ms' }} />
                  </div>
                  <span style={{ fontSize: 9, color: utilColor(utilisation), fontWeight: 700, flexShrink: 0 }}>{utilisation}%</span>
                </div>
              </div>
            </div>

            {/* Daily meeting dots */}
            {dailyMeetings.map((count, i) => {
              const isToday = i === todayIdx;
              return (
                <div key={i} title={`${count} meeting${count !== 1 ? 's' : ''}`} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  height: 36, borderRadius: 6,
                  background: isToday ? 'var(--color-accent-subtle)' : count > 0 ? 'var(--color-bg-active)' : 'transparent',
                  border: `0.5px solid ${isToday ? 'rgba(0,210,255,0.2)' : count > 0 ? 'var(--color-border-subtle)' : 'transparent'}`,
                  gap: 3,
                }}>
                  {count > 0 ? (
                    <>
                      <div style={{ display: 'flex', gap: 2 }}>
                        {Array.from({ length: Math.min(count, 3) }).map((_, j) => (
                          <div key={j} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--color-accent)' }} />
                        ))}
                        {count > 3 && <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--color-text-muted)', opacity: 0.6 }} />}
                      </div>
                      <span style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>{count} mtg</span>
                    </>
                  ) : (
                    <div style={{ width: 16, height: 1, background: 'var(--color-border-subtle)', borderRadius: 9999 }} />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Summary row */}
      <div style={{ marginTop: 14, paddingTop: 12, borderTop: '0.5px solid var(--color-border-subtle)', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {userStats.map(({ user, activeProjects, openTaskCount }) => (
          <div key={user.id} style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
            <span style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>{user.name.split(' ')[0]}</span>
            {' '}· {activeProjects.length} project{activeProjects.length !== 1 ? 's' : ''}{openTaskCount > 0 ? `, ${openTaskCount} task${openTaskCount !== 1 ? 's' : ''}` : ''}
          </div>
        ))}
      </div>
    </div>
  );
}
