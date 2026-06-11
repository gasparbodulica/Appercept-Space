'use client';

import { useState } from 'react';
import { useAppStore, useCurrentAccount } from '@/lib/store';
import { Topbar } from '@/components/layout/Topbar';
import { PageIcon } from '@/lib/icons';
import { PageEditPopover } from '@/components/PageEditPopover';
import { GalleryView } from '@/components/database/GalleryView';
import { computePL, computeCashFlow, computeBalanceSheet } from '@/lib/statements';
import { ViewConfig } from '@/lib/types';
import { IconTrendingUp, IconTrendingDown, IconCircleCheck, IconAlertTriangle, IconColumns } from '@tabler/icons-react';
import { SchemaPanel } from '@/components/database/SchemaPanel';

function fmt(n: number) { return `€${Math.round(n).toLocaleString('de-DE')}`; }

type Kind = 'pl' | 'cashflow' | 'balance';

export function FinancialStatementView({ kind, pageId, pageTitle, pageIcon, pageIconColor }: {
  kind: Kind; pageId: string; pageTitle: string; pageIcon: string; pageIconColor?: string;
}) {
  const { databases, pages, updatePage, addRow, openRow, deleteRow } = useAppStore();
  const isAdmin = useCurrentAccount()?.role === 'admin';
  const db = Object.values(databases).find((d) => d.page_id === pageId);
  const [editAnchor, setEditAnchor] = useState<DOMRect | null>(null);
  const [schemaOpen, setSchemaOpen] = useState(false);
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
        <div style={{ flex: 1 }} />
        {db && <button onClick={() => setSchemaOpen(true)} title="Manage properties"
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 7, border: '0.5px solid var(--color-border-subtle)', background: 'none', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', cursor: 'pointer' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
          <IconColumns size={13} /> Properties
        </button>}
        {schemaOpen && db && <SchemaPanel databaseId={db.id} onClose={() => setSchemaOpen(false)} />}
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
          <div style={{ padding: '0 28px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '24px 0 16px', borderTop: '0.5px solid var(--color-border-subtle)', paddingTop: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {kind === 'pl' ? 'Cost records' : kind === 'cashflow' ? 'Investing & financing movements' : 'Balance sheet items'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', opacity: 0.7 }}>
                {kind === 'pl' ? '— edit to update the statement' : kind === 'cashflow' ? '— non-operating cash movements' : '— assets, liabilities & equity'}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
              {db.rows.map(row => {
                const nameCol = db.columns.find(c => c.position === 0);
                const otherCols = db.columns.filter(c => c.position !== 0 && !c.hidden).slice(0, 4);
                const title = nameCol ? String(row.cells[nameCol.id] ?? 'Untitled') : 'Untitled';
                return (
                  <div
                    key={row.id}
                    onClick={() => openRow(row.id, db.id)}
                    style={{ background: 'var(--color-bg-elevated)', border: '0.5px solid var(--color-border-default)', borderRadius: 10, padding: '14px 16px', cursor: 'pointer', position: 'relative', transition: 'border-color 120ms, box-shadow 120ms, transform 120ms', boxShadow: '0 2px 10px rgba(0,0,0,0.18)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.boxShadow = '0 6px 22px rgba(0,210,255,0.15)'; e.currentTarget.style.transform = 'translateY(-1px)'; (e.currentTarget.querySelector('.rec-del') as HTMLElement | null)?.style.setProperty('opacity','1'); }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border-default)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.18)'; e.currentTarget.style.transform = 'translateY(0)'; (e.currentTarget.querySelector('.rec-del') as HTMLElement | null)?.style.setProperty('opacity','0'); }}
                  >
                    <button className="rec-del"
                      onClick={e => { e.stopPropagation(); deleteRow(db.id, row.id); }}
                      style={{ position: 'absolute', top: 10, right: 10, width: 24, height: 24, borderRadius: 5, border: 'none', background: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 120ms, color 120ms' }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-red)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 10, paddingRight: 20 }}>{title || 'Untitled'}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {otherCols.map(col => {
                        const v = row.cells[col.id];
                        if (v === null || v === undefined || v === '') return null;
                        return (
                          <div key={col.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 10, color: 'var(--color-text-muted)', minWidth: 80, flexShrink: 0 }}>{col.name}</span>
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {col.config?.prefix ?? ''}{String(v)}{col.config?.suffix ?? ''}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {/* Add record card */}
              <button
                onClick={() => { const row = addRow(db.id); openRow(row.id, db.id); }}
                style={{ background: 'none', border: '1.5px dashed var(--color-border-subtle)', borderRadius: 10, padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', minHeight: 80, transition: 'border-color 120ms, color 120ms' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-accent-bright)'; e.currentTarget.style.color = 'var(--color-accent-bright)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border-subtle)'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add record
              </button>
            </div>
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
