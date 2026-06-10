'use client';

import { useState } from 'react';
import { useAppStore, useCurrentAccount } from '@/lib/store';
import { Topbar } from '@/components/layout/Topbar';
import { PageIcon } from '@/lib/icons';
import { PageEditPopover } from '@/components/PageEditPopover';
import { GalleryView } from '@/components/database/GalleryView';
import { computePL, computeCashFlow, computeBalanceSheet } from '@/lib/statements';
import { ViewConfig } from '@/lib/types';
import { IconTrendingUp, IconTrendingDown, IconCircleCheck, IconAlertTriangle } from '@tabler/icons-react';

function fmt(n: number) { return `€${Math.round(n).toLocaleString('de-DE')}`; }

type Kind = 'pl' | 'cashflow' | 'balance';

export function FinancialStatementView({ kind, pageId, pageTitle, pageIcon, pageIconColor }: {
  kind: Kind; pageId: string; pageTitle: string; pageIcon: string; pageIconColor?: string;
}) {
  const { databases, pages, updatePage } = useAppStore();
  const isAdmin = useCurrentAccount()?.role === 'admin';
  const db = Object.values(databases).find((d) => d.page_id === pageId);
  const [editAnchor, setEditAnchor] = useState<DOMRect | null>(null);
  const iconColor = pageIconColor ?? '#f5c518';

  const galleryView: ViewConfig = { id: `${db?.id}-rows`, database_id: db?.id ?? '', name: 'Records', type: 'gallery', icon: 'IconLayoutGrid', filters: [], sorts: [], hidden_cols: [], is_default: true };

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

      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--color-bg-base)' }}>
        {/* The computed statement */}
        <div style={{ padding: '24px 28px 8px' }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            {kind === 'pl' && <PLBody />}
            {kind === 'cashflow' && <CashFlowBody />}
            {kind === 'balance' && <BalanceBody />}
          </div>
        </div>

        {/* Editable underlying records */}
        {db && (
          <div>
            <div style={{ maxWidth: 760, margin: '0 auto', padding: '8px 28px 0' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {kind === 'pl' ? 'Cost records (edit to update the statement)' : kind === 'cashflow' ? 'Investing & financing movements' : 'Balance sheet items'}
              </div>
            </div>
            <GalleryView database={db} view={galleryView} />
          </div>
        )}
      </div>
    </div>
  );

  // ── P&L ──
  function PLBody() {
    const s = computePL(databases, pages);
    return (
      <Card>
        <StatementHeader title={`Profit & Loss · ${s.monthLabel}`} sub="Revenue minus costs, calculated from your live data" />
        <Section label="Revenue">
          {s.revenueLines.length === 0 ? <Empty>No revenue recorded</Empty> : s.revenueLines.map((l) => <Line key={l.label} label={l.label} value={fmt(l.amount)} color={l.color} />)}
          <Total label="Total revenue" value={fmt(s.totalRevenue)} color="var(--color-teal)" />
        </Section>
        <Section label="Costs">
          {s.costLines.length === 0 ? <Empty>No costs this month</Empty> : s.costLines.map((l) => <Line key={l.label} label={l.label} value={`− ${fmt(l.amount)}`} color={l.color} />)}
          <Total label="Total costs" value={`− ${fmt(s.totalCosts)}`} color="var(--color-red)" />
        </Section>
        <BigResult
          label="Net profit"
          value={fmt(s.netProfit)}
          positive={s.netProfit >= 0}
          note={`${s.margin}% margin`}
        />
      </Card>
    );
  }

  // ── Cash Flow ──
  function CashFlowBody() {
    const s = computeCashFlow(databases, pages);
    const block = (label: string, b: { in: number; out: number; net: number }, hint: string) => (
      <Section label={label}>
        <Line label="Cash in" value={fmt(b.in)} color="var(--color-green)" />
        <Line label="Cash out" value={`− ${fmt(b.out)}`} color="var(--color-red)" />
        <Total label={`Net ${label.toLowerCase()}`} value={`${b.net >= 0 ? '' : '−'}${fmt(Math.abs(b.net))}`} color={b.net >= 0 ? 'var(--color-green)' : 'var(--color-red)'} />
        <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>{hint}</div>
      </Section>
    );
    return (
      <Card>
        <StatementHeader title={`Cash Flow · ${s.monthLabel}`} sub="Operating flow is derived from real revenue & costs; investing/financing from your records" />
        {block('Operating', s.operating, 'Revenue received − costs paid (matches the P&L)')}
        {block('Investing', s.investing, 'Equipment & asset purchases/sales')}
        {block('Financing', s.financing, 'Owner draws, loans, capital')}
        <BigResult label="Net change in cash" value={`${s.netChange >= 0 ? '+' : '−'}${fmt(Math.abs(s.netChange))}`} positive={s.netChange >= 0} note="this month" />
      </Card>
    );
  }

  // ── Balance Sheet ──
  function BalanceBody() {
    const s = computeBalanceSheet(databases, pages);
    return (
      <Card>
        <StatementHeader title="Balance Sheet" sub="What you own vs what you owe, right now" />
        <Section label="Assets">
          {s.assets.items.map((i, idx) => <Line key={idx} label={`${i.name}${i.type ? ` · ${i.type}` : ''}`} value={fmt(i.amount)} color="var(--color-green)" />)}
          <Total label="Total assets" value={fmt(s.assets.total)} color="var(--color-green)" />
        </Section>
        <Section label="Liabilities">
          {s.liabilities.items.length === 0 ? <Empty>None</Empty> : s.liabilities.items.map((i, idx) => <Line key={idx} label={`${i.name}${i.type ? ` · ${i.type}` : ''}`} value={`− ${fmt(i.amount)}`} color="var(--color-red)" />)}
          <Total label="Total liabilities" value={`− ${fmt(s.liabilities.total)}`} color="var(--color-red)" />
        </Section>
        <Section label="Equity">
          {s.equity.items.map((i, idx) => <Line key={idx} label={i.name} value={fmt(i.amount)} color="#60a5fa" />)}
          <Total label="Total equity" value={fmt(s.equity.total)} color="#60a5fa" />
        </Section>
        {/* Balance check */}
        <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8,
          background: s.balanced ? 'rgba(46,232,154,0.1)' : 'rgba(245,166,35,0.1)',
          border: `0.5px solid ${s.balanced ? 'rgba(46,232,154,0.3)' : 'rgba(245,166,35,0.3)'}` }}>
          {s.balanced ? <IconCircleCheck size={16} style={{ color: 'var(--color-green)' }} /> : <IconAlertTriangle size={16} style={{ color: 'var(--color-amber)' }} />}
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: s.balanced ? 'var(--color-green)' : 'var(--color-amber)' }}>
            {s.balanced
              ? `Balanced — Assets ${fmt(s.assets.total)} = Liabilities + Equity ${fmt(s.liabPlusEquity)}`
              : `Off by ${fmt(Math.abs(s.difference))} — Assets ${fmt(s.assets.total)} vs Liabilities + Equity ${fmt(s.liabPlusEquity)}`}
          </span>
        </div>
      </Card>
    );
  }
}

// ── Small presentational helpers ──────────────────────────────────────────────
function Card({ children }: { children: React.ReactNode }) {
  return <div style={{ background: 'var(--color-bg-elevated)', border: '0.5px solid var(--color-border-default)', borderRadius: 'var(--card-radius)', padding: '22px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}>{children}</div>;
}
function StatementHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>{title}</h2>
      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>{sub}</p>
    </div>
  );
}
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}
function Line({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '5px 0' }}>
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{label}</span>
      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color }}>{value}</span>
    </div>
  );
}
function Total({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '8px 0 2px', marginTop: 4, borderTop: '0.5px solid var(--color-border-default)' }}>
      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)' }}>{label}</span>
      <span style={{ fontSize: 'var(--text-md)', fontWeight: 800, color }}>{value}</span>
    </div>
  );
}
function BigResult({ label, value, positive, note }: { label: string; value: string; positive: boolean; note: string }) {
  const color = positive ? 'var(--color-green)' : 'var(--color-red)';
  return (
    <div style={{ marginTop: 18, paddingTop: 16, borderTop: '0.5px solid var(--color-border-strong)' }}>
      <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
        {positive ? <IconTrendingUp size={13} style={{ color }} /> : <IconTrendingDown size={13} style={{ color }} />}{label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontSize: 34, fontWeight: 900, color, lineHeight: 1 }}>{value}</span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{note}</span>
      </div>
    </div>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', padding: '4px 0' }}>{children}</div>;
}
