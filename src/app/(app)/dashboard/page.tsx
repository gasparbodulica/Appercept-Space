'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAppStore, useCurrentAccount } from '@/lib/store';
import { USERS } from '@/lib/seed';
import { Topbar } from '@/components/layout/Topbar';
import { WeatherWidget } from '@/components/WeatherWidget';
import { computeCompanyFinance, computeClientRevenue, computeConsultingRevenue, computeClubRevenue, computeProjectRevenue, computeClubCurrentMonth, type CompanyFinance } from '@/lib/finance';
import { TeamCapacityHeatmap } from '@/components/TeamCapacityHeatmap';
import { WorldClocks } from '@/components/WorldClocks';
import { IconCircleCheck, IconCircleFilled, IconCalendar, IconFileText, IconCurrencyEuro, IconSun, IconSunset, IconMoon, IconTrendingUp, IconTrendingDown, IconBuildingFactory2, IconAlertTriangle, IconMusic, IconChevronRight, IconBrandStripe, IconWallet, IconScale, IconArrowsExchange, IconClockHour4 } from '@tabler/icons-react';
import { getStatusConfig, getPriorityConfig, formatDate, formatDateTime, isOverdue } from '@/lib/utils';

const GreetingIcon = () => {
  const h = new Date().getHours();
  if (h < 12) return <IconSun size={22} style={{ color: '#f5c518' }} />;
  if (h < 18) return <IconSunset size={22} style={{ color: '#fb923c' }} />;
  return <IconMoon size={22} style={{ color: '#a78bfa' }} />;
};

const TODAY = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export default function DashboardPage() {
  const router = useRouter();
  const { databases, pages, users, activities, comments, saveRevenueSnapshot, revenueSnapshots } = useAppStore();
  // The greeting follows the signed-in person (real account), not a seed constant.
  const account = useCurrentAccount();
  const currentUser = account ?? users[0] ?? USERS[0];

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
  const consultingDb = Object.values(databases).find((db) => {
    const page = pages.find((p) => p.id === db.page_id);
    return page?.slug === 'consulting';
  });
  const clubcrowdDb = Object.values(databases).find((db) => {
    const page = pages.find((p) => p.id === db.page_id);
    return page?.slug === 'clubcrowd';
  });
  const balanceDb = Object.values(databases).find((db) => {
    const page = pages.find((p) => p.id === db.page_id);
    return page?.slug === 'balance-sheet';
  });
  const cashflowDb = Object.values(databases).find((db) => {
    const page = pages.find((p) => p.id === db.page_id);
    return page?.slug === 'cashflow';
  });

  // ── Appercept finances: project upfront (this month) + recurring + consulting + club − expenses = profit ──
  const { upfrontThisMonth, monthlyRecurring } = computeProjectRevenue(projectsDb, clientsDb);
  const { activeCount: clientCount } = computeClientRevenue(clientsDb);
  const clientRevenue = monthlyRecurring;
  const { revenue: consultingRevenue, count: consultingCount } = computeConsultingRevenue(consultingDb);
  const { monthlyAvg: clubMonthlyAvg } = computeClubRevenue(clubcrowdDb);
  // Season-aware: only in-season Active/Onboarding venues count toward current profit.
  const { active: clubRevenueActual } = computeClubCurrentMonth(clubcrowdDb);

  // For current-month profit: use actual monthly revenue, not season-averaged.
  const finance = computeCompanyFinance(costsDb, 'Appercept', upfrontThisMonth + monthlyRecurring, consultingRevenue, clubRevenueActual);

  // Save a monthly snapshot once per month so history chart builds up over time.
  const curYM = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  useEffect(() => {
    saveRevenueSnapshot({
      ym: curYM,
      label: finance.monthLabel + ' ' + new Date().getFullYear(),
      upfront: upfrontThisMonth,
      monthly: monthlyRecurring,
      clubs: clubRevenueActual,
      consulting: consultingRevenue,
      costs: finance.expenses,
      profit: finance.profit,
      forecastRevenue: 0,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curYM]);

  // Diagnostic: what the finance engine sees in the Projects DB
  const projDiag = (() => {
    if (!projectsDb) return { found: false, rows: 0, upfrontCol: '', monthlyCol: '', sampleUpfront: 0, sampleMonthly: 0, rowDetails: [] as Array<{ name: string; status: string; startDate: string; endDate: string; upfront: number; monthly: number }> };
    const uc = projectsDb.columns.find(c => c.id === 'pc-upfront' || c.name === 'Upfront (€)' || c.name === 'Upfront');
    const mc = projectsDb.columns.find(c => c.id === 'pc-monthly' || c.name === 'Monthly (€)' || c.name === 'Monthly');
    const sc = projectsDb.columns.find(c => c.type === 'status');
    const startC = projectsDb.columns.find(c => c.id === 'pc-start' || c.name === 'Start date');
    const endC   = projectsDb.columns.find(c => c.id === 'pc-end'   || c.name === 'End date');
    const nameC  = projectsDb.columns.find(c => c.position === 0);
    const su = uc ? projectsDb.rows.reduce((s, r) => s + (Number(r.cells[uc.id]) || 0), 0) : 0;
    const sm = mc ? projectsDb.rows.reduce((s, r) => s + (Number(r.cells[mc.id]) || 0), 0) : 0;
    const rowDetails = projectsDb.rows.slice(0, 5).map(r => ({
      name: nameC ? String(r.cells[nameC.id] ?? '—') : '—',
      status: sc ? String(r.cells[sc.id] ?? '(empty)') : '(no status col)',
      startDate: startC ? String(r.cells[startC.id] ?? '(empty)') : '(no start col)',
      endDate: endC ? String(r.cells[endC.id] ?? '(empty)') : '(no end col)',
      upfront: uc ? (Number(r.cells[uc.id]) || 0) : 0,
      monthly: mc ? (Number(r.cells[mc.id]) || 0) : 0,
    }));
    return { found: true, rows: projectsDb.rows.length, upfrontCol: uc?.id ?? '(not found)', monthlyCol: mc?.id ?? '(not found)', sampleUpfront: su, sampleMonthly: sm, rowDetails };
  })();

  // ── ClubCrowd snapshot: season-adjusted yearly revenue + pipeline counts ──
  const clubSeasonMonths = (label: string): number => {
    if (!label) return 12;
    if (/year|12/i.test(label)) return 12;
    const m = label.match(/(\d+)/);
    return m ? Number(m[1]) : 12;
  };
  const ccFeeCol    = clubcrowdDb?.columns.find((c) => c.name === 'Fee / reservation (€)');
  const ccResCol    = clubcrowdDb?.columns.find((c) => c.name === 'Monthly reservations');
  const ccSeasonCol = clubcrowdDb?.columns.find((c) => c.name === 'Operating season');
  const ccStatusCol = clubcrowdDb?.columns.find((c) => c.name === 'Status');
  const ccStripeCol = clubcrowdDb?.columns.find((c) => c.name === 'Stripe status');
  const clubRows = clubcrowdDb?.rows ?? [];
  let clubYearly = 0, clubMonthly = 0;
  const clubStages: Record<string, number> = { Lead: 0, Onboarding: 0, Active: 0, Past: 0 };
  let clubConnected = 0;
  for (const r of clubRows) {
    const fee = ccFeeCol ? Number(r.cells[ccFeeCol.id]) || 0 : 0;
    const res = ccResCol ? Number(r.cells[ccResCol.id]) || 0 : 0;
    const months = ccSeasonCol ? clubSeasonMonths(String(r.cells[ccSeasonCol.id] ?? '')) : 12;
    const monthly = fee * res;
    clubMonthly += monthly;
    clubYearly += monthly * months;
    const stage = ccStatusCol ? String(r.cells[ccStatusCol.id] ?? '') : '';
    if (stage in clubStages) clubStages[stage]++;
    if (ccStripeCol && String(r.cells[ccStripeCol.id] ?? '') === 'Connected') clubConnected++;
  }

  // ── Financial Overview: synthesise Balance Sheet + Cash Flow ──
  const bsItemCol   = balanceDb?.columns.find((c) => c.position === 0);
  const bsCatCol    = balanceDb?.columns.find((c) => c.name === 'Category');
  const bsAmountCol = balanceDb?.columns.find((c) => c.name === 'Amount');
  let totalAssets = 0, totalLiabilities = 0, cashOnHand = 0, accountsReceivable = 0;
  for (const r of balanceDb?.rows ?? []) {
    const cat = bsCatCol ? String(r.cells[bsCatCol.id] ?? '') : '';
    const amt = bsAmountCol ? Number(r.cells[bsAmountCol.id]) || 0 : 0;
    const name = (bsItemCol ? String(r.cells[bsItemCol.id] ?? '') : '').toLowerCase();
    if (cat === 'Asset') {
      totalAssets += amt;
      if (/bank|cash/.test(name)) cashOnHand += amt;
      if (/receivable/.test(name)) accountsReceivable += amt;
    } else if (cat === 'Liability') {
      totalLiabilities += amt;
    }
  }
  const netWorth = totalAssets - totalLiabilities;

  // ── Cash flow this month — CONNECTED to real revenue & costs ──
  // Operating cash flow is DERIVED from your actual revenue (retainers + consulting
  // + clubs) and actual costs (Costs DB), so it always matches the P&L. The manual
  // Cash Flow statement only adds non-operating movements (Investing / Financing,
  // e.g. equipment purchases, owner draws, loans).
  const cfDirCol      = cashflowDb?.columns.find((c) => c.name === 'Direction');
  const cfAmountCol   = cashflowDb?.columns.find((c) => c.name === 'Amount');
  const cfDateCol     = cashflowDb?.columns.find((c) => c.type === 'date');
  const cfActivityCol = cashflowDb?.columns.find((c) => c.name === 'Activity');

  const operatingIn = finance.totalRevenue;   // real revenue this month
  const operatingOut = finance.expenses;      // real costs this month
  let investFinIn = 0, investFinOut = 0;
  for (const r of cashflowDb?.rows ?? []) {
    const d = cfDateCol ? String(r.cells[cfDateCol.id] ?? '').slice(0, 7) : '';
    if (d && d !== curYM) continue;
    const activity = cfActivityCol ? String(r.cells[cfActivityCol.id] ?? '') : '';
    if (activity === 'Operating' || activity === '') continue; // operating already covered by revenue/costs
    const dir = cfDirCol ? String(r.cells[cfDirCol.id] ?? '') : '';
    const amt = cfAmountCol ? Number(r.cells[cfAmountCol.id]) || 0 : 0;
    if (dir === 'Inflow') investFinIn += amt;
    else if (dir === 'Outflow') investFinOut += amt;
  }
  const cashIn = operatingIn + investFinIn;
  const cashOut = operatingOut + investFinOut;
  const netCashFlow = cashIn - cashOut;
  // Runway = months of cash left at the current burn (only meaningful when burning)
  const runwayMonths = cashOut > cashIn && cashOnHand > 0 ? cashOnHand / (cashOut - cashIn) : Infinity;
  const hasFinancials = (balanceDb?.rows.length ?? 0) > 0 || (cashflowDb?.rows.length ?? 0) > 0 || finance.totalRevenue > 0 || finance.expenses > 0;

  const todoRows = todoDb?.rows ?? [];
  const clientRows = clientsDb?.rows ?? [];
  const projectRows = projectsDb?.rows ?? [];
  const meetingRows = meetingsDb?.rows ?? [];
  const costRows = costsDb?.rows ?? [];

  // Stats — find column dynamically so hardcoded IDs don't break.
  // Active clients = active rows in the Clients DB + active clubs in ClubCrowd
  // (the two databases stay separate; this just totals them for the snapshot).
  const statusColClients = clientsDb?.columns.find((c) => c.name === 'Status');
  const activeClientRows = clientRows.filter((r) => statusColClients ? r.cells[statusColClients.id] === 'Active' : false).length;
  const activeClients = activeClientRows + clubStages.Active;
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
          {/* World clocks, inline (no box) */}
          <WorldClocks />
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 40 }}>
          {[
            { label: 'Active clients', value: activeClients, color: 'var(--color-green)', sub: clubStages.Active > 0 ? `${activeClientRows} clients · ${clubStages.Active} clubs` : undefined },
            { label: 'Open projects', value: openProjects, color: 'var(--color-accent)', sub: undefined },
            { label: `Profit ${finance.monthLabel.slice(0,3)}`, value: `€${(finance.profit / 1000).toFixed(1)}k`, color: finance.profit >= 0 ? 'var(--color-green)' : 'var(--color-red)', sub: undefined },
            { label: 'Tasks overdue', value: overdueTasks, color: overdueTasks > 0 ? 'var(--color-red)' : 'var(--color-gray)', sub: undefined },
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
              {stat.sub && <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 3 }}>{stat.sub}</div>}
            </div>
          ))}
        </div>

        {/* Appercept finances — revenue minus costs = monthly profit */}
        <ApperceptFinanceBox f={finance} upfront={upfrontThisMonth} recurring={monthlyRecurring} clientCount={clientCount} consultingCount={consultingCount} onOpenCosts={() => router.push('/pages/costs')} projDiag={projDiag} />

        {/* Revenue history chart — current month always shown; builds month by month */}
        <RevenueHistoryChart
          snapshots={revenueSnapshots}
          liveEntry={{
            ym: curYM,
            label: finance.monthLabel + ' ' + new Date().getFullYear(),
            upfront: upfrontThisMonth,
            monthly: monthlyRecurring,
            clubs: clubRevenueActual,
            consulting: consultingRevenue,
            costs: finance.expenses,
            profit: finance.profit,
            forecastRevenue: 0,
          }}
        />

        {/* Financial Overview — synthesised from Balance Sheet + Cash Flow + real costs/revenue */}
        {hasFinancials && (
          <FinancialOverview
            cashOnHand={cashOnHand}
            netWorth={netWorth}
            totalAssets={totalAssets}
            totalLiabilities={totalLiabilities}
            accountsReceivable={accountsReceivable}
            cashIn={cashIn}
            cashOut={cashOut}
            netCashFlow={netCashFlow}
            runwayMonths={runwayMonths}
            revenueStreams={[
              { label: 'Project upfronts (this month)', amount: upfrontThisMonth, color: 'var(--color-accent-bright)' },
              { label: 'Project recurring', amount: monthlyRecurring, color: 'var(--color-teal)' },
              { label: 'Consulting', amount: finance.consultingRevenue, color: '#a78bfa' },
              { label: 'Clubs', amount: finance.clubRevenue, color: '#635bff' },
            ].filter((s) => s.amount > 0)}
            totalRevenue={finance.totalRevenue}
            costsByCategory={finance.byCategory}
            totalCosts={finance.expenses}
            onOpenBalance={() => router.push('/pages/balance-sheet')}
            onOpenCashflow={() => router.push('/pages/cashflow')}
            onOpenCosts={() => router.push('/pages/costs')}
          />
        )}

        {/* ClubCrowd snapshot */}
        {clubRows.length > 0 && (
          <ClubCrowdSnapshot
            yearly={clubYearly}
            monthly={clubMonthly}
            stages={clubStages}
            connected={clubConnected}
            total={clubRows.length}
            onOpen={() => router.push('/pages/clubcrowd')}
          />
        )}

        {/* Team Capacity Heatmap */}
        <div style={{ marginBottom: 40 }}>
          <TeamCapacityHeatmap />
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
                      <span style={{ fontSize: 'var(--text-xs)', color: overdue ? 'var(--color-red)' : 'var(--color-text-muted)', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        {overdue && <IconAlertTriangle size={11} />}{formatDate(String(date))}
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
            {(() => {
              // Merge activities + comments, sort newest first, take top 8
              const allDbs = Object.values(databases);
              const actItems = [...activities]
                .sort((a, b) => b.created_at.localeCompare(a.created_at))
                .slice(0, 8)
                .map(act => {
                  const db = allDbs.find(d => d.rows.some(r => r.id === act.row_id));
                  const row = db?.rows.find(r => r.id === act.row_id);
                  const nameCol = db?.columns.find(c => c.position === 0);
                  const rowName = nameCol && row ? String(row.cells[nameCol.id] ?? 'record') : 'record';
                  const user = users.find(u => u.id === act.user_id);
                  const who = user?.name.split(' ')[0] ?? 'Someone';
                  const text = act.action === 'commented'
                    ? `${who} commented on ${rowName}`
                    : `${who} updated ${rowName}`;
                  const timeAgo = (() => {
                    const diff = Date.now() - new Date(act.created_at).getTime();
                    const m = Math.floor(diff / 60000);
                    if (m < 60) return `${m}m ago`;
                    const h = Math.floor(m / 60);
                    if (h < 24) return `${h}h ago`;
                    return `${Math.floor(h / 24)}d ago`;
                  })();
                  return { icon: <IconCircleFilled size={13} style={{ color: 'var(--color-accent)' }} />, text, time: timeAgo };
                });

              const cmtItems = [...comments]
                .sort((a, b) => b.created_at.localeCompare(a.created_at))
                .slice(0, 4)
                .map(c => {
                  const db = allDbs.find(d => d.rows.some(r => r.id === c.row_id));
                  const row = db?.rows.find(r => r.id === c.row_id);
                  const nameCol = db?.columns.find(col => col.position === 0);
                  const rowName = nameCol && row ? String(row.cells[nameCol.id] ?? 'record') : 'record';
                  const user = users.find(u => u.id === c.user_id);
                  const who = user?.name.split(' ')[0] ?? 'Someone';
                  const timeAgo = (() => {
                    const diff = Date.now() - new Date(c.created_at).getTime();
                    const m = Math.floor(diff / 60000);
                    if (m < 60) return `${m}m ago`;
                    const h = Math.floor(m / 60);
                    if (h < 24) return `${h}h ago`;
                    return `${Math.floor(h / 24)}d ago`;
                  })();
                  return { icon: <IconFileText size={13} style={{ color: 'var(--color-text-muted)' }} />, text: `${who} commented on ${rowName}`, time: timeAgo };
                });

              const merged = [...actItems, ...cmtItems]
                .sort((a, b) => a.time.localeCompare(b.time))
                .slice(0, 8);

              if (merged.length === 0) {
                return <Empty>No activity yet — start adding records to see updates here.</Empty>;
              }

              return merged.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < merged.length - 1 ? '0.5px solid var(--color-border-subtle)' : 'none' }}>
                  <span style={{ display: 'flex', flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ flex: 1, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{item.text}</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', flexShrink: 0 }}>{item.time}</span>
                </div>
              ));
            })()}
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

const STAGE_COLORS: Record<string, string> = {
  Lead: '#60a5fa', Onboarding: '#f5a623', Active: '#3ecf8e', Past: '#6b7280',
};

function FinancialOverview({ cashOnHand, netWorth, totalAssets, totalLiabilities, accountsReceivable, cashIn, cashOut, netCashFlow, runwayMonths, revenueStreams, totalRevenue, costsByCategory, totalCosts, onOpenBalance, onOpenCashflow, onOpenCosts }: {
  cashOnHand: number; netWorth: number; totalAssets: number; totalLiabilities: number;
  accountsReceivable: number; cashIn: number; cashOut: number; netCashFlow: number; runwayMonths: number;
  revenueStreams: { label: string; amount: number; color: string }[]; totalRevenue: number;
  costsByCategory: { label: string; amount: number; color: string }[]; totalCosts: number;
  onOpenBalance: () => void; onOpenCashflow: () => void; onOpenCosts: () => void;
}) {
  const runwayText = !isFinite(runwayMonths)
    ? 'Healthy'
    : runwayMonths >= 24 ? '24+ mo' : `${runwayMonths.toFixed(1)} mo`;
  const runwayColor = !isFinite(runwayMonths) ? 'var(--color-green)' : runwayMonths >= 6 ? 'var(--color-green)' : runwayMonths >= 3 ? 'var(--color-amber)' : 'var(--color-red)';
  const netCashColor = netCashFlow >= 0 ? 'var(--color-green)' : 'var(--color-red)';
  const netWorthColor = netWorth >= 0 ? 'var(--color-teal)' : 'var(--color-red)';

  const cards = [
    { label: 'Cash on hand', value: fmt(cashOnHand), color: 'var(--color-teal)', icon: <IconWallet size={15} />, sub: 'in the bank', onClick: onOpenBalance },
    { label: 'Net cash flow', value: `${netCashFlow >= 0 ? '+' : ''}${fmt(netCashFlow)}`, color: netCashColor, icon: <IconArrowsExchange size={15} />, sub: `${fmt(cashIn)} in · ${fmt(cashOut)} out`, onClick: onOpenCashflow },
    { label: 'Cash runway', value: runwayText, color: runwayColor, icon: <IconClockHour4 size={15} />, sub: isFinite(runwayMonths) ? 'at current burn' : 'inflow ≥ outflow', onClick: onOpenCashflow },
    { label: 'Net worth', value: fmt(netWorth), color: netWorthColor, icon: <IconScale size={15} />, sub: `${fmt(totalAssets)} − ${fmt(totalLiabilities)}`, onClick: onOpenBalance },
    { label: 'Owed to you', value: fmt(accountsReceivable), color: accountsReceivable > 0 ? 'var(--color-amber)' : 'var(--color-gray)', icon: <IconCurrencyEuro size={15} />, sub: 'receivables', onClick: onOpenBalance },
  ];

  return (
    <div style={{
      background: 'var(--color-bg-elevated)',
      border: '0.5px solid var(--color-border-default)',
      borderRadius: 'var(--card-radius)',
      padding: '20px 24px', marginBottom: 40,
      boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, #2dd4bf, #60a5fa)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
          <IconScale size={17} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--color-text-primary)' }}>Financial overview</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Live from your Balance Sheet &amp; Cash Flow statements</div>
        </div>
        <button onClick={onOpenBalance} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '6px 12px', borderRadius: 7, border: '0.5px solid var(--color-border-strong)', background: 'var(--color-bg-active)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', fontWeight: 600, cursor: 'pointer' }}>
          Balance sheet →
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        {cards.map((c) => (
          <div key={c.label} onClick={c.onClick}
            style={{ background: 'var(--color-bg-surface)', border: '0.5px solid var(--color-border-subtle)', borderRadius: 10, padding: '14px 16px', cursor: 'pointer', transition: 'border-color 100ms' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.color; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border-subtle)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: c.color }}>
              {c.icon}
              <span style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{c.label}</span>
            </div>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: c.color, lineHeight: 1 }}>{c.value}</div>
            <div style={{ fontSize: 9, color: 'var(--color-text-muted)', marginTop: 4 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Where money comes from & goes — straight from your revenue + Costs database */}
      {(revenueStreams.length > 0 || costsByCategory.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 20, paddingTop: 18, borderTop: '0.5px solid var(--color-border-subtle)' }}>
          {/* Revenue streams */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Revenue in · by stream</span>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--color-teal)' }}>{fmt(totalRevenue)}/mo</span>
            </div>
            {revenueStreams.length === 0 ? (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>No revenue recorded.</div>
            ) : revenueStreams.map((s) => {
              const pct = totalRevenue > 0 ? (s.amount / totalRevenue) * 100 : 0;
              return (
                <div key={s.label} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', marginBottom: 3 }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>{s.label}</span>
                    <span style={{ color: s.color, fontWeight: 700 }}>{fmt(s.amount)}</span>
                  </div>
                  <div style={{ height: 5, background: 'var(--color-bg-active)', borderRadius: 9999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: s.color, borderRadius: 9999, transition: 'width 400ms' }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Costs by type — from the P&L / Costs database */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Costs out · by type</span>
              <button onClick={onOpenCosts} style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--color-red)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>{fmt(totalCosts)}/mo →</button>
            </div>
            {costsByCategory.length === 0 ? (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>No costs this month.</div>
            ) : costsByCategory.map((c) => {
              const pct = totalCosts > 0 ? (c.amount / totalCosts) * 100 : 0;
              return (
                <div key={c.label} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', marginBottom: 3 }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>{c.label}</span>
                    <span style={{ color: c.color, fontWeight: 700 }}>{fmt(c.amount)}</span>
                  </div>
                  <div style={{ height: 5, background: 'var(--color-bg-active)', borderRadius: 9999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: c.color, borderRadius: 9999, transition: 'width 400ms' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ClubCrowdSnapshot({ yearly, monthly, stages, connected, total, onOpen }: {
  yearly: number; monthly: number; stages: Record<string, number>; connected: number; total: number; onOpen: () => void;
}) {
  return (
    <div
      onClick={onOpen}
      style={{
        background: 'linear-gradient(135deg, rgba(99,91,255,0.14) 0%, rgba(167,139,250,0.06) 45%, var(--color-bg-elevated) 100%)',
        border: '0.5px solid rgba(99,91,255,0.3)',
        borderRadius: 'var(--card-radius)',
        padding: '20px 24px', marginBottom: 40, cursor: 'pointer',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        transition: 'border-color 120ms, box-shadow 120ms, transform 120ms',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#635bff'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(99,91,255,0.25)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(99,91,255,0.3)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.3)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, #635bff, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 2px 10px rgba(99,91,255,0.4)' }}>
          <IconMusic size={17} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--color-text-primary)' }}>ClubCrowd</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{total} venues · reservation-fee revenue at a glance</div>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 'var(--text-xs)', color: 'var(--color-accent-bright)', fontWeight: 600 }}>
          Open <IconChevronRight size={14} />
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, alignItems: 'center' }}>
        {/* Left: headline figures */}
        <div style={{ display: 'flex', gap: 28 }}>
          <div>
            <div style={{ fontSize: 30, fontWeight: 800, color: '#3ecf8e', lineHeight: 1 }}>{fmt(yearly)}</div>
            <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 5 }}>Real yearly revenue</div>
            <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>season-adjusted</div>
          </div>
          <div>
            <div style={{ fontSize: 30, fontWeight: 800, color: '#7c75ff', lineHeight: 1 }}>{fmt(monthly)}</div>
            <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 5 }}>Peak monthly</div>
            <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>all clubs in-season</div>
          </div>
        </div>

        {/* Right: pipeline + stripe */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {(['Active', 'Onboarding', 'Lead', 'Past'] as const).map((stage) => (
              stages[stage] > 0 && (
                <span key={stage} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: `${STAGE_COLORS[stage]}1a`, color: STAGE_COLORS[stage], fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: STAGE_COLORS[stage] }} />
                  {stages[stage]} {stage}
                </span>
              )
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', color: connected > 0 ? 'var(--color-green)' : 'var(--color-text-muted)' }}>
            <IconBrandStripe size={13} />
            {connected} / {total} venues connected to Stripe
          </div>
        </div>
      </div>
    </div>
  );
}

type ProjDiag = { found: boolean; rows: number; upfrontCol: string; monthlyCol: string; sampleUpfront: number; sampleMonthly: number; rowDetails: Array<{ name: string; status: string; startDate: string; endDate: string; upfront: number; monthly: number }> };
function ApperceptFinanceBox({ f, upfront, recurring, clientCount, consultingCount, onOpenCosts, projDiag }: { f: CompanyFinance; upfront: number; recurring: number; clientCount: number; consultingCount: number; onOpenCosts: () => void; projDiag: ProjDiag }) {
  const profitPositive = f.profit >= 0;
  const profitColor = profitPositive ? 'var(--color-green)' : 'var(--color-red)';

  // Bar chart: One-time / Recurring / Consulting / Clubs / Costs / Profit
  const scaleMax = Math.max(1, upfront, recurring, f.consultingRevenue, f.clubRevenue, f.expenses, Math.abs(f.profit));
  const bars = [
    { label: 'One-time', value: upfront, color: 'var(--color-accent-bright)', solid: 'rgba(0,210,255,0.7)' },
    { label: 'Recurring', value: recurring, color: 'var(--color-teal)', solid: 'rgba(45,212,191,0.55)' },
    { label: 'Consulting', value: f.consultingRevenue, color: '#a78bfa', solid: 'rgba(167,139,250,0.55)' },
    { label: 'Clubs', value: f.clubRevenue, color: '#635bff', solid: 'rgba(99,91,255,0.55)' },
    { label: 'Costs', value: f.expenses, color: 'var(--color-red)', solid: 'rgba(255,79,106,0.55)' },
    { label: 'Profit', value: f.profit, color: profitColor, gradient: true },
  ].filter(b => b.label === 'Profit' || b.label === 'Costs' || b.value > 0);

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
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>One-time payments this month + recurring + consulting + clubs − {f.expenseCount} costs</div>
        </div>
        <button onClick={onOpenCosts}
          style={{ padding: '6px 12px', borderRadius: 7, border: '0.5px solid var(--color-border-strong)', background: 'var(--color-bg-active)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', fontWeight: 600, cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-accent-bright)'; e.currentTarget.style.color = 'var(--color-text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border-strong)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
        >Open Costs →</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 28, alignItems: 'stretch' }}>
        {/* Left: figures */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center' }}>
          <FinanceRow label="One-time payments" value={fmt(upfront)} color="var(--color-accent-bright)" sub={`${f.monthLabel} project upfronts (counted once)`} />
          <FinanceRow label="Recurring (projects)" value={fmt(recurring)} color="var(--color-teal)" sub={`${clientCount} active client${clientCount !== 1 ? 's' : ''} · every month`} />
          {upfront === 0 && recurring === 0 && projDiag.rows > 0 && (
            <div style={{ fontSize: 10, color: 'var(--color-amber)', lineHeight: 1.6, padding: '8px 10px', background: 'rgba(245,158,11,0.08)', borderRadius: 7 }}>
              ⚠ {projDiag.rows} project row{projDiag.rows !== 1 ? 's' : ''} found but revenue = €0.<br />
              {projDiag.rowDetails.map((r, i) => (
                <span key={i} style={{ display: 'block', color: 'var(--color-text-secondary)', fontFamily: 'monospace', fontSize: 9 }}>
                  {r.name} | status=&quot;{r.status}&quot; | start=&quot;{r.startDate}&quot; | end=&quot;{r.endDate}&quot; | upfront={r.upfront} | monthly={r.monthly}
                </span>
              ))}
            </div>
          )}
          <FinanceRow label="Consulting fees" value={fmt(f.consultingRevenue)} color="#a78bfa" sub={`${consultingCount} engagement${consultingCount !== 1 ? 's' : ''} this month`} />
          <FinanceRow label="Club fees (ClubCrowd)" value={fmt(f.clubRevenue)} color="#7c75ff" sub="season-adjusted monthly avg" />
          <div style={{ height: '0.5px', background: 'var(--color-border-subtle)', margin: '2px 0' }} />
          <FinanceRow label="Total revenue" value={fmt(f.totalRevenue)} color="var(--color-accent-bright)" sub="one-time + recurring + consulting + clubs" />
          <FinanceRow label="Costs taken out" value={`− ${fmt(f.expenses)}`} color="var(--color-red)" sub={`${f.expenseCount} cost${f.expenseCount !== 1 ? 's' : ''} this month`} />
          <div style={{ height: '0.5px', background: 'var(--color-border-default)' }} />
          <div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
              {profitPositive ? <IconTrendingUp size={13} style={{ color: profitColor }} /> : <IconTrendingDown size={13} style={{ color: profitColor }} />}
              Real monthly profit
            </div>
            <div style={{ fontSize: 34, fontWeight: 800, color: profitColor, lineHeight: 1 }}>{fmt(f.profit)}</div>
          </div>
        </div>

        {/* Right: 4-bar chart + category breakdown */}
        <div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Revenue breakdown vs costs</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 110, marginBottom: 14 }}>
            {bars.map(b => {
              const h = Math.max(4, (Math.abs(b.value) / scaleMax) * 100);
              return (
                <div key={b.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ fontSize: 10, color: b.color, fontWeight: 700 }}>{fmt(b.value)}</div>
                  <div style={{
                    width: '100%', maxWidth: 46, height: `${h}%`, borderRadius: '7px 7px 3px 3px',
                    background: b.gradient ? 'var(--gradient-accent)' : b.solid,
                    boxShadow: b.gradient ? '0 0 16px rgba(0,210,255,0.3)' : 'none',
                    transition: 'height 400ms ease',
                  }} />
                  <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', fontWeight: 500, textAlign: 'center' }}>{b.label}</div>
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

type Snapshot = { ym: string; label: string; upfront: number; monthly: number; clubs: number; consulting: number; costs: number; profit: number; forecastRevenue: number };

function RevenueHistoryChart({ snapshots, liveEntry }: { snapshots: Snapshot[]; liveEntry: Snapshot }) {
  const [hoveredYM, setHoveredYM] = useState<string | null>(null);

  const all = [...snapshots.filter(s => s.ym !== liveEntry.ym), liveEntry]
    .sort((a, b) => a.ym.localeCompare(b.ym))
    .slice(-12);

  const CHART_H = 120; // px — fixed bar area height
  // Scale everything against the largest combined revenue + cost value
  const maxVal = Math.max(1, ...all.map(s =>
    s.upfront + s.monthly + s.clubs + s.consulting + s.costs
  ));
  const px = (v: number) => `${Math.max(4, Math.round((v / maxVal) * CHART_H))}px`;

  return (
    <div style={{
      background: 'var(--color-bg-elevated)', border: '0.5px solid var(--color-border-default)',
      borderRadius: 'var(--card-radius)', padding: '20px 24px', marginBottom: 40,
      boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--color-text-primary)' }}>Revenue history</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Monthly performance · hover a bar to see breakdown</div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { c: 'rgba(0,210,255,0.85)', l: 'One-time' },
            { c: 'rgba(45,212,191,0.85)', l: 'Recurring' },
            { c: 'rgba(99,91,255,0.85)', l: 'Clubs' },
            { c: 'rgba(255,79,106,0.8)', l: 'Costs' },
          ].map(({ c, l }) => (
            <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--color-text-muted)' }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: c }} />{l}
            </span>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
        {all.map((s) => {
          const rev    = s.upfront + s.monthly + s.clubs + s.consulting;
          const pColor = s.profit >= 0 ? 'var(--color-green)' : 'var(--color-red)';
          const isCur  = s.ym === liveEntry.ym;
          const isHov  = hoveredYM === s.ym;

          // Stacked bar segments bottom→top with absolute heights in px
          const pxNum = (v: number) => Math.max(4, Math.round((v / maxVal) * CHART_H));
          const stack = [
            { v: s.upfront,    bg: 'rgba(0,210,255,0.85)' },
            { v: s.monthly,    bg: 'rgba(45,212,191,0.85)' },
            { v: s.clubs,      bg: 'rgba(99,91,255,0.85)' },
            { v: s.consulting, bg: 'rgba(167,139,250,0.85)' },
          ].filter(seg => seg.v > 0);

          return (
            <div
              key={s.ym}
              onMouseEnter={() => setHoveredYM(s.ym)}
              onMouseLeave={() => setHoveredYM(null)}
              style={{
                flex: '0 0 auto', minWidth: 54, display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 5, cursor: 'default', position: 'relative',
              }}
            >
              {/* Tooltip */}
              {isHov && (
                <div style={{
                  position: 'absolute', bottom: '100%', left: '50%',
                  transform: 'translateX(-50%)', marginBottom: 10, zIndex: 300,
                  background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-strong)',
                  borderRadius: 10, padding: '10px 14px',
                  boxShadow: '0 -3px 14px rgba(0,0,0,0.28)',
                  minWidth: 155, pointerEvents: 'none', whiteSpace: 'nowrap',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 7 }}>{s.label}</div>
                  {s.upfront > 0    && <Row label="One-time"   val={fmt(s.upfront)}        color="var(--color-accent-bright)" />}
                  {s.monthly > 0    && <Row label="Recurring"  val={fmt(s.monthly)}        color="var(--color-teal)" />}
                  {s.clubs > 0      && <Row label="Clubs"      val={fmt(s.clubs)}          color="#7c75ff" />}
                  {s.consulting > 0 && <Row label="Consulting" val={fmt(s.consulting)}     color="#a78bfa" />}
                  {rev > 0          && <Row label="Revenue"    val={fmt(rev)}              color="var(--color-text-secondary)" />}
                  {s.costs > 0      && <Row label="Costs"      val={`− ${fmt(s.costs)}`}  color="var(--color-red)" />}
                  <div style={{ height: 1, background: 'var(--color-border-subtle)', margin: '5px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 800, color: pColor }}>
                    <span>Profit</span><span>{fmt(s.profit)}</span>
                  </div>
                </div>
              )}

              {/* Fixed-height bar canvas — position:relative so children use position:absolute */}
              <div style={{ position: 'relative', width: 36, height: CHART_H }}>
                {/* Revenue bar: stacked segments, anchored to bottom */}
                {stack.length === 0
                  ? <div style={{ position: 'absolute', bottom: 0, left: 0, width: 24, height: 4, background: 'var(--color-border-subtle)', borderRadius: '2px 2px 0 0' }} />
                  : (() => {
                      let bottom = 0;
                      return stack.map((seg, i) => {
                        const h = pxNum(seg.v);
                        const el = (
                          <div key={i} style={{
                            position: 'absolute', bottom, left: 0, width: 24, height: h,
                            background: seg.bg,
                            borderRadius: i === stack.length - 1 ? '3px 3px 0 0' : 0,
                          }} />
                        );
                        bottom += h;
                        return el;
                      });
                    })()
                }
                {/* Costs bar: always right side, anchored to bottom */}
                {s.costs > 0 && (
                  <div style={{
                    position: 'absolute', bottom: 0, right: 0, width: 10,
                    height: px(s.costs), background: 'rgba(255,79,106,0.8)',
                    borderRadius: '2px 2px 0 0',
                  }} />
                )}
              </div>

              {/* Profit — always shown */}
              <div style={{ fontSize: 9, fontWeight: 800, color: pColor, whiteSpace: 'nowrap' }}>{fmt(s.profit)}</div>

              {/* Month label */}
              <div style={{ fontSize: 9, lineHeight: 1.3, textAlign: 'center', color: isCur ? 'var(--color-accent-bright)' : 'var(--color-text-muted)', fontWeight: isCur ? 700 : 400 }}>
                {s.label.slice(0, 3)}<br />&apos;{s.ym.slice(2, 4)}
              </div>
              {isCur && <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--color-accent)', marginTop: -2 }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Row({ label, val, color }: { label: string; val: string; color: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 10, marginBottom: 2, color }}>
      <span>{label}</span><b>{val}</b>
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
