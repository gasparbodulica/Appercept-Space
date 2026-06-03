'use client';

import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { USERS } from '@/lib/seed';
import { Topbar } from '@/components/layout/Topbar';
import { WeatherWidget } from '@/components/WeatherWidget';
import { computeCompanyFinance, computeClientRevenue, type CompanyFinance } from '@/lib/finance';
import { IconCircleCheck, IconCircleFilled, IconCalendar, IconFileText, IconCurrencyEuro, IconSun, IconSunset, IconMoon, IconTrendingUp, IconTrendingDown, IconBuildingFactory2 } from '@tabler/icons-react';
import { getStatusConfig, getPriorityConfig, formatDate, formatDateTime, isOverdue } from '@/lib/utils';

const GreetingIcon = () => {
  const h = new Date().getHours();
  if (h < 12) return <IconSun size={22} style={{ color: '#f5c518' }} />;
  if (h < 18) return <IconSunset size={22} style={{ color: '#fb923c' }} />;
  return <IconMoon size={22} style={{ color: '#a78bfa' }} />;
};

const TODAY = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

export default function DashboardPage() {
  const router = useRouter();
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
  const companiesDb = Object.values(databases).find((db) => {
    const page = pages.find((p) => p.id === db.page_id);
    return page?.slug === 'companies';
  });

  // ── Appercept finances: client revenue − expenses = profit (all auto) ──
  const { revenue: clientRevenue, activeCount: clientCount } = computeClientRevenue(clientsDb);
  const finance = computeCompanyFinance(costsDb, 'Appercept', clientRevenue);

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
        <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {currentUser.name.split(' ')[0]}
              <GreetingIcon />
            </h1>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>{TODAY}</p>
          </div>
          <WeatherWidget />
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 40 }}>
          {[
            { label: 'Active clients', value: activeClients, color: 'var(--color-green)' },
            { label: 'Open projects', value: openProjects, color: 'var(--color-accent)' },
            { label: `Profit ${finance.monthLabel.slice(0,3)}`, value: `€${(finance.profit / 1000).toFixed(1)}k`, color: finance.profit >= 0 ? 'var(--color-green)' : 'var(--color-red)' },
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

        {/* Appercept finances — revenue minus costs = monthly profit */}
        <ApperceptFinanceBox f={finance} clientCount={clientCount} onOpenCosts={() => router.push('/pages/costs')} />

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
                    <button
                      onClick={() => router.push('/pages/meetings')}
                      style={{
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
              { icon: <IconCircleCheck size={14} style={{ color: 'var(--color-green)' }} />, text: 'Invoice paid · Medikal Lux', time: '2h ago' },
              { icon: <IconCircleFilled size={14} style={{ color: 'var(--color-accent)' }} />, text: 'ClubCrowd FINAL milestone completed', time: '5h ago' },
              { icon: <IconCircleFilled size={14} style={{ color: 'var(--color-amber)' }} />, text: 'Proposal sent · GymBros', time: 'Yesterday' },
              { icon: <IconCalendar size={14} style={{ color: 'var(--color-teal)' }} />, text: 'Meeting: Brand strategy review', time: 'Yesterday' },
              { icon: <IconFileText size={14} style={{ color: 'var(--color-text-muted)' }} />, text: 'Appercept Invoice Template updated', time: '2d ago' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '0.5px solid var(--color-border-subtle)' }}>
                <span style={{ display: 'flex', flexShrink: 0 }}>{item.icon}</span>
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

function fmt(n: number) {
  return `€${Math.round(n).toLocaleString('en-US')}`;
}

function ApperceptFinanceBox({ f, clientCount, onOpenCosts }: { f: CompanyFinance; clientCount: number; onOpenCosts: () => void }) {
  const profitPositive = f.profit >= 0;
  const profitColor = profitPositive ? 'var(--color-green)' : 'var(--color-red)';

  // Revenue / Costs / Profit comparison bars
  const scaleMax = Math.max(1, f.revenue, f.expenses, Math.abs(f.profit));
  const bars = [
    { label: 'Revenue', value: f.revenue, color: 'var(--color-teal)', solid: 'rgba(0,210,255,0.55)' },
    { label: 'Costs', value: f.expenses, color: 'var(--color-red)', solid: 'rgba(255,79,106,0.55)' },
    { label: 'Profit', value: f.profit, color: profitColor, gradient: true },
  ];

  return (
    <div style={{
      background: 'linear-gradient(180deg, rgba(28,117,188,0.10) 0%, rgba(16,33,56,0) 30%), var(--color-bg-elevated)',
      border: '0.5px solid var(--color-border-strong)',
      borderRadius: 'var(--card-radius)',
      padding: '22px 24px', marginBottom: 40,
      boxShadow: '0 8px 32px rgba(0,0,0,0.35), 0 0 0 0.5px rgba(0,210,255,0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--gradient-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 2px 10px rgba(0,210,255,0.3)' }}>
          <IconBuildingFactory2 size={18} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--color-text-primary)' }}>Appercept · {f.monthLabel} finances</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Monthly revenue minus all {f.expenseCount} costs this month, calculated automatically</div>
        </div>
        <button onClick={onOpenCosts}
          style={{ padding: '6px 12px', borderRadius: 7, border: '0.5px solid var(--color-border-strong)', background: 'var(--color-bg-active)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', fontWeight: 600, cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-accent-bright)'; e.currentTarget.style.color = 'var(--color-text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border-strong)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
        >Open Costs →</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 28, alignItems: 'stretch' }}>
        {/* Left: figures */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, justifyContent: 'center' }}>
          <FinanceRow label="Revenue from clients" value={fmt(f.revenue)} color="var(--color-teal)" sub={`${clientCount} paying client${clientCount !== 1 ? 's' : ''}`} />
          <FinanceRow label="Costs taken out" value={`− ${fmt(f.expenses)}`} color="var(--color-red)" sub={`${f.expenseCount} cost${f.expenseCount !== 1 ? 's' : ''} this month`} />
          <div style={{ height: '0.5px', background: 'var(--color-border-default)' }} />
          <div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
              {profitPositive ? <IconTrendingUp size={13} style={{ color: profitColor }} /> : <IconTrendingDown size={13} style={{ color: profitColor }} />}
              Monthly profit
            </div>
            <div style={{ fontSize: 34, fontWeight: 800, color: profitColor, lineHeight: 1 }}>{fmt(f.profit)}</div>
          </div>
        </div>

        {/* Right: Revenue / Costs / Profit bars + category breakdown */}
        <div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Revenue vs costs</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, height: 110, marginBottom: 14 }}>
            {bars.map(b => {
              const h = Math.max(4, (Math.abs(b.value) / scaleMax) * 100);
              return (
                <div key={b.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ fontSize: 11, color: b.color, fontWeight: 700 }}>{fmt(b.value)}</div>
                  <div style={{
                    width: '100%', maxWidth: 54, height: `${h}%`, borderRadius: '7px 7px 3px 3px',
                    background: b.gradient ? 'var(--gradient-accent)' : b.solid,
                    boxShadow: b.gradient ? '0 0 16px rgba(0,210,255,0.3)' : 'none',
                    transition: 'height 400ms ease',
                  }} />
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontWeight: 500 }}>{b.label}</div>
                </div>
              );
            })}
          </div>

          {/* Expense breakdown by category */}
          {f.byCategory.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {f.byCategory.map(c => (
                <span key={c.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 20, background: `${c.color}1f`, color: c.color, fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.color }} />
                  {c.label} · {fmt(c.amount)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FinanceRow({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
      <div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{sub}</div>}
      </div>
      <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color }}>{value}</div>
    </div>
  );
}
