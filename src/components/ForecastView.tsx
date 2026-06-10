'use client';

import { useState } from 'react';
import { useAppStore, useCurrentAccount } from '@/lib/store';
import { Topbar } from '@/components/layout/Topbar';
import { PageIcon } from '@/lib/icons';
import { PageEditPopover } from '@/components/PageEditPopover';
import { computeForecast } from '@/lib/statements';
import { IconTrendingUp, IconTrendingDown, IconCoinEuro, IconReceipt, IconInfoCircle, IconPencil } from '@tabler/icons-react';

function fmt(n: number) { return `€${Math.round(n).toLocaleString('de-DE')}`; }

export function ForecastView({ pageId, pageTitle, pageIcon, pageIconColor }: {
  pageId: string; pageTitle: string; pageIcon: string; pageIconColor?: string;
}) {
  const { databases, pages, updatePage, forecastAssumptions, setForecastAssumptions } = useAppStore();
  const isAdmin = useCurrentAccount()?.role === 'admin';
  const [editAnchor, setEditAnchor] = useState<DOMRect | null>(null);
  const iconColor = pageIconColor ?? '#3ecf8e';

  const f = computeForecast(databases, pages, forecastAssumptions);
  const maxQ = Math.max(1, ...f.quarters.map((q) => Math.abs(q.revenue)));
  const targetPct = f.annualTarget > 0 ? Math.round((f.year.revenue / f.annualTarget) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Topbar breadcrumb={[pageTitle]} />

      {/* Editable header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 28px', borderBottom: '0.5px solid var(--color-border-subtle)', background: 'var(--color-bg-surface)', flexShrink: 0, position: 'relative' }}>
        <button
          onClick={(e) => { if (!isAdmin) return; setEditAnchor(editAnchor ? null : (e.currentTarget as HTMLElement).getBoundingClientRect()); }}
          title={isAdmin ? 'Edit icon, colour & name' : undefined}
          style={{ width: 36, height: 36, borderRadius: 10, background: `${iconColor}22`, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: isAdmin ? 'pointer' : 'default', flexShrink: 0 }}
        >
          <PageIcon name={pageIcon} size={19} />
        </button>
        {isAdmin && editAnchor && (
          <PageEditPopover name={pageTitle} icon={pageIcon} iconColor={iconColor} anchorRect={editAnchor}
            onChangeName={(t) => updatePage(pageId, { title: t })}
            onChangeIcon={(i) => updatePage(pageId, { icon: i })}
            onChangeColor={(c) => updatePage(pageId, { iconColor: c })}
            onClose={() => setEditAnchor(null)} />
        )}
        <h1 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>{pageTitle}</h1>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--color-bg-base)', padding: '24px 28px' }}>
        <div style={{ maxWidth: 880, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Monthly run-rate */}
          <div>
            <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Monthly run-rate</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              <RunCard label="Monthly revenue" value={fmt(f.monthlyRevenue)} color="var(--color-teal)" icon={<IconCoinEuro size={15} />} sub={`${fmt(f.baseRevenue)} recurring + ${fmt(forecastAssumptions.monthlyConsulting)} consulting`} />
              <RunCard label="Recurring costs" value={`− ${fmt(f.monthlyCosts)}`} color="var(--color-red)" icon={<IconReceipt size={15} />} sub="monthly + yearly costs / mo" />
              <RunCard label="Monthly profit" value={fmt(f.monthlyProfit)} color={f.monthlyProfit >= 0 ? 'var(--color-green)' : 'var(--color-red)'} icon={f.monthlyProfit >= 0 ? <IconTrendingUp size={15} /> : <IconTrendingDown size={15} />} sub="revenue − costs" highlight />
            </div>
          </div>

          {/* Editable assumptions */}
          <div style={{ background: 'var(--color-bg-elevated)', border: '0.5px solid var(--color-border-default)', borderRadius: 'var(--card-radius)', padding: '18px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
              <IconPencil size={14} style={{ color: 'var(--color-accent-bright)' }} />
              <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Your predictions</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
              <Field
                label="Expected consulting / mo"
                hint="Variable project income you expect to land"
                prefix="€"
                value={forecastAssumptions.monthlyConsulting}
                onChange={(v) => setForecastAssumptions({ monthlyConsulting: v })}
              />
              <Field
                label="Quarterly growth"
                hint="Expected growth from new clients each quarter"
                suffix="%"
                value={forecastAssumptions.quarterlyGrowthPct}
                onChange={(v) => setForecastAssumptions({ quarterlyGrowthPct: v })}
              />
              <Field
                label="Annual revenue target"
                hint="Your goal for the year"
                prefix="€"
                value={forecastAssumptions.annualTarget}
                onChange={(v) => setForecastAssumptions({ annualTarget: v })}
              />
            </div>
            {forecastAssumptions.monthlyConsulting === 0 && f.consultingThisMonth > 0 && (
              <button
                onClick={() => setForecastAssumptions({ monthlyConsulting: f.consultingThisMonth })}
                style={{ marginTop: 12, fontSize: 'var(--text-xs)', color: 'var(--color-accent-bright)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Use this month&apos;s consulting ({fmt(f.consultingThisMonth)}) as the estimate →
              </button>
            )}
          </div>

          {/* Quarterly forecast */}
          <div>
            <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Quarterly forecast</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              {f.quarters.map((q) => {
                const h = Math.max(6, (Math.abs(q.revenue) / maxQ) * 90);
                return (
                  <div key={q.label} style={{ background: 'var(--color-bg-elevated)', border: '0.5px solid var(--color-border-default)', borderRadius: 12, padding: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.22)' }}>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 10 }}>{q.label}</div>
                    {/* mini bar */}
                    <div style={{ height: 90, display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 10 }}>
                      <Bar label="Rev" value={q.revenue} max={maxQ} color="rgba(0,210,255,0.55)" />
                      <Bar label="Cost" value={q.costs} max={maxQ} color="rgba(255,79,106,0.55)" />
                      <Bar label="Profit" value={q.profit} max={maxQ} gradient />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 10 }}>
                      <Row label="Revenue" value={fmt(q.revenue)} color="var(--color-teal)" />
                      <Row label="Costs" value={`− ${fmt(q.costs)}`} color="var(--color-red)" />
                      <Row label="Profit" value={fmt(q.profit)} color={q.profit >= 0 ? 'var(--color-green)' : 'var(--color-red)'} bold />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Full year */}
          <div style={{ background: 'linear-gradient(135deg, rgba(46,232,154,0.10), rgba(16,33,56,0))', border: '0.5px solid rgba(46,232,154,0.3)', borderRadius: 'var(--card-radius)', padding: '20px 24px' }}>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>Full-year projection · {f.year.label}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              <YearFig label="Projected revenue" value={fmt(f.year.revenue)} color="var(--color-teal)" />
              <YearFig label="Projected costs" value={`− ${fmt(f.year.costs)}`} color="var(--color-red)" />
              <YearFig label="Projected profit" value={fmt(f.year.profit)} color={f.year.profit >= 0 ? 'var(--color-green)' : 'var(--color-red)'} big />
            </div>

            {/* Target progress */}
            {f.annualTarget > 0 && (
              <div style={{ marginTop: 18, paddingTop: 16, borderTop: '0.5px solid var(--color-border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                    Revenue target: <b style={{ color: 'var(--color-text-primary)' }}>{fmt(f.annualTarget)}</b>
                  </span>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: targetPct >= 100 ? 'var(--color-green)' : targetPct >= 75 ? 'var(--color-amber)' : 'var(--color-red)' }}>
                    {targetPct}% of target
                  </span>
                </div>
                <div style={{ height: 8, background: 'var(--color-bg-active)', borderRadius: 9999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, targetPct)}%`, background: targetPct >= 100 ? 'var(--color-green)' : 'var(--gradient-accent)', borderRadius: 9999, transition: 'width 500ms' }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 8 }}>
                  {targetPct >= 100
                    ? `On track to beat your target by ${fmt(f.year.revenue - f.annualTarget)} 🎯`
                    : `${fmt(f.annualTarget - f.year.revenue)} short of target — raise consulting or growth above to close the gap.`}
                </div>
              </div>
            )}
          </div>

          {/* Assumptions */}
          <div style={{ display: 'flex', gap: 8, padding: '12px 14px', borderRadius: 10, background: 'var(--color-bg-elevated)', border: '0.5px solid var(--color-border-subtle)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            <IconInfoCircle size={15} style={{ flexShrink: 0, marginTop: 1, color: 'var(--color-accent-bright)' }} />
            <div>
              This is a conservative <b style={{ color: 'var(--color-text-secondary)' }}>recurring run-rate</b>: monthly client retainers + season-adjusted club fees, minus monthly &amp; amortised yearly costs. One-off costs and{f.consultingThisMonth > 0 ? <> variable <b style={{ color: 'var(--color-text-secondary)' }}>consulting fees ({fmt(f.consultingThisMonth)} this month)</b></> : ' consulting fees'} are excluded — real results will typically be higher when you land projects. Edit clients, clubs and costs to update the forecast instantly.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RunCard({ label, value, color, icon, sub, highlight }: { label: string; value: string; color: string; icon: React.ReactNode; sub: string; highlight?: boolean }) {
  return (
    <div style={{ background: highlight ? `${color}14` : 'var(--color-bg-elevated)', border: `0.5px solid ${highlight ? `${color}44` : 'var(--color-border-default)'}`, borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color }}>{icon}<span style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</span></div>
      <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 9, color: 'var(--color-text-muted)', marginTop: 4 }}>{sub}</div>
    </div>
  );
}
function Bar({ value, max, color, gradient, label }: { value: number; max: number; color?: string; gradient?: boolean; label: string }) {
  const h = Math.max(4, (Math.abs(value) / max) * 100);
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
      <div style={{ width: '100%', height: `${h}%`, borderRadius: '4px 4px 1px 1px', background: gradient ? 'var(--gradient-accent)' : color }} />
      <span style={{ fontSize: 8, color: 'var(--color-text-muted)', marginTop: 3 }}>{label}</span>
    </div>
  );
}
function Row({ label, value, color, bold }: { label: string; value: string; color: string; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      <span style={{ color, fontWeight: bold ? 800 : 600 }}>{value}</span>
    </div>
  );
}
function YearFig({ label, value, color, big }: { label: string; value: string; color: string; big?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: big ? 32 : 'var(--text-2xl)', fontWeight: big ? 900 : 800, color, lineHeight: 1 }}>{value}</div>
    </div>
  );
}
function Field({ label, hint, prefix, suffix, value, onChange }: { label: string; hint: string; prefix?: string; suffix?: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, display: 'block', marginBottom: 6 }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px', borderRadius: 8, border: '0.5px solid var(--color-border-default)', background: 'var(--color-bg-input)' }}>
        {prefix && <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>{prefix}</span>}
        <input
          type="number" min={0}
          value={value === 0 ? '' : value}
          placeholder="0"
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          style={{ flex: 1, padding: '9px 0', background: 'none', border: 'none', outline: 'none', color: 'var(--color-text-primary)', fontSize: 'var(--text-md)', fontWeight: 700, fontFamily: 'var(--font-sans)', minWidth: 0 }}
        />
        {suffix && <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>{suffix}</span>}
      </div>
      <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 4 }}>{hint}</div>
    </div>
  );
}
