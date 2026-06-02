'use client';

import { useAppStore } from '@/lib/store';
import { USERS } from '@/lib/seed';
import { Topbar } from '@/components/layout/Topbar';
import { getStatusConfig, getPriorityConfig, formatDate, formatDateTime, isOverdue } from '@/lib/utils';

const GREETING_ICON = () => {
  const h = new Date().getHours();
  if (h < 12) return '☀️';
  if (h < 18) return '🌤️';
  return '🌙';
};

const TODAY = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

export default function DashboardPage() {
  const { databases, pages } = useAppStore();
  const currentUser = USERS[0];

  // Derive data from databases
  const todoDb = Object.values(databases).find((db) => {
    const page = pages.find((p) => p.id === db.page_id);
    return page?.slug === 'todo';
  });
  const clientsDb = Object.values(databases).find((db) => {
    const page = pages.find((p) => p.id === db.page_id);
    return page?.slug === 'clients';
  });
  const projectsDb = Object.values(databases).find((db) => {
    const page = pages.find((p) => p.id === db.page_id);
    return page?.slug === 'projects';
  });
  const meetingsDb = Object.values(databases).find((db) => {
    const page = pages.find((p) => p.id === db.page_id);
    return page?.slug === 'meetings';
  });
  const costsDb = Object.values(databases).find((db) => {
    const page = pages.find((p) => p.id === db.page_id);
    return page?.slug === 'costs';
  });

  const todoRows = todoDb?.rows ?? [];
  const clientRows = clientsDb?.rows ?? [];
  const projectRows = projectsDb?.rows ?? [];
  const meetingRows = meetingsDb?.rows ?? [];
  const costRows = costsDb?.rows ?? [];

  // Stats
  const activeClients = clientRows.filter((r) => r.cells['col-clients-status'] === 'Active').length;
  const openProjects = projectRows.filter((r) => {
    const status = r.cells['col-projects-status'];
    return status === 'In progress' || status === 'Not started';
  }).length;

  const revenueThisMonth = costRows
    .filter((r) => r.cells['col-costs-type'] === 'Income')
    .reduce((sum, r) => sum + (Number(r.cells['col-costs-amount']) || 0), 0);

  const nameColTodo = todoDb?.columns.find((c) => c.position === 0);
  const statusColTodo = todoDb?.columns.find((c) => c.type === 'status');
  const assigneeColTodo = todoDb?.columns.find((c) => c.type === 'person');
  const priorityColTodo = todoDb?.columns.find((c) => c.type === 'priority');
  const dateColTodo = todoDb?.columns.find((c) => c.type === 'date' || c.type === 'date_range');

  const overdueTasks = todoRows.filter((r) => {
    const status = statusColTodo ? r.cells[statusColTodo.id] : null;
    if (status === 'Done' || status === 'Blocked') return false;
    const date = dateColTodo ? r.cells[dateColTodo.id] : null;
    return date ? isOverdue(String(date)) : false;
  }).length;

  const myTasks = todoRows.filter((r) => {
    const assignee = assigneeColTodo ? r.cells[assigneeColTodo.id] : null;
    const status = statusColTodo ? r.cells[statusColTodo.id] : null;
    return assignee === 'u-1' && status !== 'Done';
  }).slice(0, 5);

  // Today's meetings
  const nameColMeeting = meetingsDb?.columns.find((c) => c.position === 0);
  const dateColMeeting = meetingsDb?.columns.find((c) => c.type === 'date' || c.name === 'Date & time');
  const clientColMeeting = meetingsDb?.columns.find((c) => c.type === 'relation');
  const durationColMeeting = meetingsDb?.columns.find((c) => c.name === 'Duration (min)');

  const todayMeetings = meetingRows.slice(0, 3);

  // Active projects
  const nameColProject = projectsDb?.columns.find((c) => c.position === 0);
  const progressColProject = projectsDb?.columns.find((c) => c.name === 'Progress (%)' || c.type === 'number');
  const statusColProject = projectsDb?.columns.find((c) => c.type === 'status');

  const activeProjects = projectRows.filter((r) => {
    const status = statusColProject ? r.cells[statusColProject.id] : null;
    return status === 'In progress';
  }).slice(0, 4);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Topbar breadcrumb={['Dashboard']} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', background: 'var(--color-bg-base)' }}>
        {/* Greeting */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {currentUser.name.split(' ')[0]} {GREETING_ICON()}
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>{TODAY}</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 40 }}>
          {[
            { label: 'Active clients', value: activeClients, color: 'var(--color-green)' },
            { label: 'Open projects', value: openProjects, color: 'var(--color-accent)' },
            { label: 'Revenue Jun', value: `€${(revenueThisMonth / 1000).toFixed(1)}k`, color: 'var(--color-teal)' },
            { label: 'Tasks overdue', value: overdueTasks, color: overdueTasks > 0 ? 'var(--color-red)' : 'var(--color-gray)' },
          ].map((stat) => (
            <div key={stat.label} style={{
              background: 'var(--color-bg-elevated)',
              border: '0.5px solid var(--color-border-default)',
              borderRadius: 'var(--card-radius)',
              padding: '20px 24px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
            }}>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Today's meetings */}
          <Section title="Today's meetings">
            {todayMeetings.length === 0 ? (
              <Empty>No meetings today</Empty>
            ) : (
              todayMeetings.map((row) => {
                const title = nameColMeeting ? String(row.cells[nameColMeeting.id] ?? 'Untitled') : 'Untitled';
                const time = dateColMeeting ? String(row.cells[dateColMeeting.id] ?? '') : '';
                const duration = durationColMeeting ? row.cells[durationColMeeting.id] : null;
                return (
                  <div key={row.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '0.5px solid var(--color-border-subtle)' }}>
                    <div style={{ width: 3, height: 36, borderRadius: 9999, background: 'var(--color-accent)', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-primary)' }}>{title}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                        {time || '—'}{duration ? ` · ${duration} min` : ''}
                      </div>
                    </div>
                    <button style={{
                      padding: '4px 10px', borderRadius: 6, border: '0.5px solid var(--color-border-default)',
                      background: 'none', color: 'var(--color-accent)', fontSize: 'var(--text-xs)', cursor: 'pointer', fontWeight: 500,
                    }}>Join</button>
                  </div>
                );
              })
            )}
          </Section>

          {/* My tasks */}
          <Section title="My tasks">
            {myTasks.length === 0 ? (
              <Empty>All caught up!</Empty>
            ) : (
              myTasks.map((row) => {
                const name = nameColTodo ? String(row.cells[nameColTodo.id] ?? 'Untitled') : 'Untitled';
                const status = statusColTodo ? String(row.cells[statusColTodo.id] ?? '') : '';
                const priority = priorityColTodo ? String(row.cells[priorityColTodo.id] ?? '') : '';
                const date = dateColTodo ? row.cells[dateColTodo.id] : null;
                const cfg = getStatusConfig(status);
                const pcfg = getPriorityConfig(priority);
                const overdue = date ? isOverdue(String(date)) : false;

                return (
                  <div key={row.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '0.5px solid var(--color-border-subtle)' }}>
                    <span style={{ fontSize: 12, color: cfg.color, flexShrink: 0 }}>{cfg.icon}</span>
                    <span style={{ flex: 1, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                    {date && (
                      <span style={{ fontSize: 'var(--text-xs)', color: overdue ? 'var(--color-red)' : 'var(--color-text-muted)', flexShrink: 0 }}>
                        {overdue && '⚠ '}{formatDate(String(date))}
                      </span>
                    )}
                    {priority && (
                      <span style={{ fontSize: 'var(--text-xs)', color: pcfg.color, fontWeight: 600, flexShrink: 0 }}>{priority}</span>
                    )}
                  </div>
                );
              })
            )}
          </Section>

          {/* Active projects */}
          <Section title="Active projects">
            {activeProjects.length === 0 ? (
              <Empty>No active projects</Empty>
            ) : (
              activeProjects.map((row) => {
                const name = nameColProject ? String(row.cells[nameColProject.id] ?? 'Untitled') : 'Untitled';
                const progress = progressColProject ? Number(row.cells[progressColProject.id] ?? 0) : 0;
                return (
                  <div key={row.id} style={{ padding: '10px 0', borderBottom: '0.5px solid var(--color-border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>{name}</span>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{progress}%</span>
                    </div>
                    <div style={{ height: 4, background: 'var(--color-bg-active)', borderRadius: 9999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${progress}%`, background: 'var(--gradient-accent)', borderRadius: 9999, transition: 'width 600ms ease' }} />
                    </div>
                  </div>
                );
              })
            )}
          </Section>

          {/* Recent activity */}
          <Section title="Recent activity">
            {[
              { icon: '✅', text: 'Invoice paid · Medikal Lux', time: '2h ago' },
              { icon: '🔵', text: 'ClubCrowd FINAL milestone completed', time: '5h ago' },
              { icon: '🟡', text: 'Proposal sent · GymBros', time: 'Yesterday' },
              { icon: '📅', text: 'Meeting: Brand strategy review', time: 'Yesterday' },
              { icon: '📝', text: 'Appercept Invoice Template updated', time: '2d ago' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '0.5px solid var(--color-border-subtle)' }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>{item.icon}</span>
                <span style={{ flex: 1, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{item.text}</span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', flexShrink: 0 }}>{item.time}</span>
              </div>
            ))}
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--color-bg-elevated)',
      border: '0.5px solid var(--color-border-default)',
      borderRadius: 'var(--card-radius)',
      padding: 20,
    }}>
      <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h2>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>{children}</div>
  );
}
