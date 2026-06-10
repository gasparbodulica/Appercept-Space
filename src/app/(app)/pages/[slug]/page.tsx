'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore, useCurrentAccount } from '@/lib/store';
import { DatabasePage } from '@/components/database/DatabasePage';
import { Topbar } from '@/components/layout/Topbar';
import { PageIcon } from '@/lib/icons';
import { PageEditPopover } from '@/components/PageEditPopover';
import { FinancialStatementView } from '@/components/FinancialStatementView';
import { ForecastView } from '@/components/ForecastView';
import { formatDate, getStatusConfig, getPriorityConfig, isOverdue } from '@/lib/utils';
import {
  IconTablePlus, IconLock, IconSearch, IconFileTypePdf, IconPresentation,
  IconFileText, IconTable, IconPhoto, IconVideo, IconFileZip, IconFile,
  IconPlus, IconExternalLink, IconMapPin, IconMusic, IconBrandStripe,
  IconCoinEuro, IconArmchair, IconReceipt, IconBolt, IconCircleCheck,
  IconCalendar, IconChevronLeft, IconChevronRight, IconAlarm, IconTrash,
} from '@tabler/icons-react';

interface PageProps {
  params: { slug: string };
}

// ── File type config ──────────────────────────────────────────────────────────
const FILE_TYPES: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  PDF:     { icon: <IconFileTypePdf size={28} />,  color: '#ff5c5c', bg: 'rgba(255,92,92,0.12)' },
  PPTX:    { icon: <IconPresentation size={28} />, color: '#fb923c', bg: 'rgba(251,146,60,0.12)' },
  DOCX:    { icon: <IconFileText size={28} />,     color: '#4f6fff', bg: 'rgba(79,111,255,0.12)' },
  XLSX:    { icon: <IconTable size={28} />,         color: '#3ecf8e', bg: 'rgba(62,207,142,0.12)' },
  Image:   { icon: <IconPhoto size={28} />,         color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  Video:   { icon: <IconVideo size={28} />,         color: '#2dd4bf', bg: 'rgba(45,212,191,0.12)' },
  Archive: { icon: <IconFileZip size={28} />,       color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
  Other:   { icon: <IconFile size={28} />,          color: '#f5c518', bg: 'rgba(245,197,24,0.12)' },
};

const ALL_TYPES = ['All', 'PDF', 'PPTX', 'DOCX', 'XLSX', 'Image', 'Video', 'Archive', 'Other'];

// ── FilesBrowser ──────────────────────────────────────────────────────────────
function FilesBrowser({ pageTitle, pageIcon, pageIconColor, pageId }: { pageTitle: string; pageIcon: string; pageIconColor?: string; pageId: string }) {
  const { databases, addRow, updateCell, openRow } = useAppStore();
  const filesDb = Object.values(databases).find(d => d.page_id === pageId);
  const [activeType, setActiveType] = useState('All');
  const [search, setSearch] = useState('');

  const nameCol  = filesDb?.columns.find(c => c.position === 0);
  const typeCol  = filesDb?.columns.find(c => c.name === 'Type');
  const sizeCol  = filesDb?.columns.find(c => c.name === 'Size (MB)');
  const dateCol  = filesDb?.columns.find(c => c.type === 'date');
  const urlCol   = filesDb?.columns.find(c => c.type === 'url');
  const notesCol = filesDb?.columns.find(c => c.name === 'Notes');

  const files = useMemo(() => {
    const rows = filesDb?.rows ?? [];
    return rows.map(r => ({
      id: r.id,
      name:  nameCol  ? String(r.cells[nameCol.id]  ?? '') : 'Untitled',
      type:  typeCol  ? String(r.cells[typeCol.id]  ?? 'Other') : 'Other',
      size:  sizeCol  ? Number(r.cells[sizeCol.id]  ?? 0) : 0,
      date:  dateCol  ? String(r.cells[dateCol.id]  ?? '') : '',
      url:   urlCol   ? String(r.cells[urlCol.id]   ?? '') : '',
      notes: notesCol ? String(r.cells[notesCol.id] ?? '') : '',
    })).sort((a, b) => b.date.localeCompare(a.date));
  }, [filesDb, nameCol, typeCol, sizeCol, dateCol, urlCol, notesCol]);

  const filtered = useMemo(() => files.filter(f => {
    const matchType = activeType === 'All' || f.type === activeType;
    const matchSearch = !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.notes.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  }), [files, activeType, search]);

  // Count per type for badges
  const counts = useMemo(() => {
    const c: Record<string, number> = { All: files.length };
    for (const f of files) c[f.type] = (c[f.type] ?? 0) + 1;
    return c;
  }, [files]);

  const handleAdd = () => {
    if (!filesDb) return;
    const row = addRow(filesDb.id);
    openRow(row.id, filesDb.id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Topbar breadcrumb={[pageTitle]} />

      {/* Type filter tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderBottom: '0.5px solid var(--color-border-subtle)', background: 'var(--color-bg-surface)', overflowX: 'auto', flexShrink: 0 }}>
        {ALL_TYPES.map(t => {
          const active = activeType === t;
          const cfg = t !== 'All' ? FILE_TYPES[t] : null;
          return (
            <button key={t} onClick={() => setActiveType(t)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20,
              border: `1px solid ${active ? (cfg?.color ?? 'var(--color-accent)') : 'var(--color-border-subtle)'}`,
              background: active ? `${cfg?.color ?? 'rgba(0,210,255,1)'}18` : 'transparent',
              color: active ? (cfg?.color ?? 'var(--color-accent-bright)') : 'var(--color-text-muted)',
              fontWeight: active ? 700 : 400, fontSize: 'var(--text-xs)', cursor: 'pointer', flexShrink: 0,
              transition: 'all 80ms',
            }}>
              {t}
              {counts[t] > 0 && <span style={{ fontSize: 9, fontWeight: 800, opacity: 0.8 }}>{counts[t]}</span>}
            </button>
          );
        })}

        {/* Search + Add */}
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 20, background: 'var(--color-bg-active)', border: '0.5px solid var(--color-border-subtle)', flexShrink: 0 }}>
          <IconSearch size={12} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search files…"
            style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--color-text-primary)', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-sans)', width: 140 }} />
        </div>
        <button onClick={handleAdd} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 20, border: 'none', background: 'var(--gradient-accent)', color: '#fff', fontSize: 'var(--text-xs)', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
          <IconPlus size={12} /> Add file
        </button>
      </div>

      {/* File grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: 'var(--color-bg-base)' }}>
        {filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, height: 240, color: 'var(--color-text-muted)' }}>
            <IconFile size={36} style={{ opacity: 0.3 }} />
            <span style={{ fontSize: 'var(--text-sm)' }}>{search ? 'No files match your search.' : `No ${activeType === 'All' ? '' : activeType + ' '}files yet.`}</span>
            <button onClick={handleAdd} style={{ marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 7, border: 'none', background: 'var(--gradient-accent)', color: '#fff', fontSize: 'var(--text-xs)', fontWeight: 600, cursor: 'pointer' }}>
              <IconPlus size={12} /> Add first file
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {filtered.map(f => {
              const cfg = FILE_TYPES[f.type] ?? FILE_TYPES.Other;
              return (
                <div key={f.id}
                  onClick={() => filesDb && openRow(f.id, filesDb.id)}
                  style={{
                    background: 'var(--color-bg-elevated)', border: '0.5px solid var(--color-border-default)',
                    borderRadius: 12, padding: '18px 16px', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', gap: 10,
                    transition: 'border-color 100ms, box-shadow 100ms, transform 100ms',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = cfg.color; e.currentTarget.style.boxShadow = `0 6px 24px ${cfg.color}28`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border-default)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {/* File type icon */}
                  <div style={{ width: 52, height: 52, borderRadius: 12, background: cfg.bg, color: cfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {cfg.icon}
                  </div>
                  {/* Name */}
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {f.name}
                  </div>
                  {/* Meta */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 20, background: cfg.bg, color: cfg.color, fontSize: 10, fontWeight: 700 }}>{f.type}</span>
                      <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                        {f.date ? formatDate(f.date) : ''}
                        {f.size > 0 ? ` · ${f.size} MB` : ''}
                      </span>
                    </div>
                    {f.url && (
                      <a href={f.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                        style={{ color: 'var(--color-accent-bright)', display: 'flex', padding: 4 }}>
                        <IconExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── ClubCrowd Revenue Dashboard ───────────────────────────────────────────────

const STRIPE_CONFIG: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  Connected:    { color: '#635bff', label: 'Stripe connected', icon: <IconCircleCheck size={11} /> },
  Pending:      { color: '#f5a623', label: 'Stripe pending',    icon: <IconBolt size={11} /> },
  Onboarding:   { color: '#f5a623', label: 'Onboarding',        icon: <IconBolt size={11} /> },
  Disconnected: { color: '#ff5c5c', label: 'Not connected',     icon: <IconBrandStripe size={11} /> },
};

function fmtEur(n: number) { return `€${Math.round(n).toLocaleString('de-DE')}`; }

// Pipeline stages — order matters (lead → past)
const STAGES = ['Lead', 'Onboarding', 'Active', 'Past'];
const STAGE_COLORS: Record<string, string> = {
  Lead: '#60a5fa', Onboarding: '#f5a623', Active: '#3ecf8e', Past: '#6b7280',
};

// Operating season → active months per year (parses "9 months", "Summer (3mo)", "Year-round")
function seasonMonths(label: string): number {
  if (!label) return 12;
  if (/year|12/i.test(label)) return 12;
  const m = label.match(/(\d+)/);
  return m ? Number(m[1]) : 12;
}
const SEASON_COLORS: Record<string, string> = {
  'Year-round': '#3ecf8e', '9 months': '#60a5fa', '6 months': '#f5a623', 'Summer (3mo)': '#f472b6',
};

function ClubCrowdDashboard({ pageId, pageTitle, pageIcon, pageIconColor }: { pageId: string; pageTitle: string; pageIcon: string; pageIconColor?: string }) {
  const { databases, addRow, updateCell, openRow, updatePage } = useAppStore();
  const isAdmin = useCurrentAccount()?.role === 'admin';
  const db = Object.values(databases).find(d => d.page_id === pageId);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [connecting, setConnecting] = useState<string | null>(null);
  const [stripeNotice, setStripeNotice] = useState('');
  const [editAnchor, setEditAnchor] = useState<DOMRect | null>(null);
  const iconColor = pageIconColor ?? '#a78bfa';

  const venueCol  = db?.columns.find(c => c.name === 'Venue name');
  const cityCol   = db?.columns.find(c => c.name === 'City');
  const feeCol    = db?.columns.find(c => c.name === 'Fee / reservation (€)');
  const resCol    = db?.columns.find(c => c.name === 'Monthly reservations');
  const spendCol  = db?.columns.find(c => c.name === 'Avg table spend (€)');
  const seasonCol = db?.columns.find(c => c.name === 'Operating season');
  const stripeIdCol = db?.columns.find(c => c.name === 'Stripe Account ID');
  const stripeStCol = db?.columns.find(c => c.name === 'Stripe status');
  const joinedCol = db?.columns.find(c => c.name === 'Platform joined');
  const statusCol = db?.columns.find(c => c.name === 'Status');

  const venues = useMemo(() => (db?.rows ?? []).map(r => {
    const fee = feeCol ? Number(r.cells[feeCol.id] ?? 0) : 0;
    const reservations = resCol ? Number(r.cells[resCol.id] ?? 0) : 0;
    const avgSpend = spendCol ? Number(r.cells[spendCol.id] ?? 0) : 0;
    const season = seasonCol ? String(r.cells[seasonCol.id] ?? 'Year-round') : 'Year-round';
    const months = seasonMonths(season);
    const revenue = fee * reservations;             // Appercept's monthly revenue from this venue
    return {
      id:           r.id,
      name:         venueCol  ? String(r.cells[venueCol.id]  ?? '') : '',
      city:         cityCol   ? String(r.cells[cityCol.id]   ?? '') : '',
      fee, reservations, avgSpend, season, months,
      revenue,
      yearlyRevenue: revenue * months,              // real yearly revenue, season-adjusted
      gmv:          avgSpend * reservations,        // total table spend flowing through the venue
      stripeId:     stripeIdCol ? String(r.cells[stripeIdCol.id] ?? '') : '',
      stripeStatus: stripeStCol ? String(r.cells[stripeStCol.id] ?? '') : 'Disconnected',
      joined:       joinedCol ? String(r.cells[joinedCol.id] ?? '') : '',
      status:       statusCol ? String(r.cells[statusCol.id] ?? '') : '',
    };
  }), [db, venueCol, cityCol, feeCol, resCol, spendCol, seasonCol, stripeIdCol, stripeStCol, joinedCol, statusCol]);

  const filtered = useMemo(() => venues.filter(v => {
    const matchFilter = filter === 'All' ? true : v.status === filter;
    const matchSearch = !search || v.name.toLowerCase().includes(search.toLowerCase()) || v.city.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  }).sort((a, b) => b.revenue - a.revenue), [venues, filter, search]);

  const countByStage = (stage: string) => venues.filter(v => v.status === stage).length;

  // Aggregate stats
  const totalRevenue   = venues.reduce((s, v) => s + v.revenue, 0);        // peak monthly (all in-season)
  const totalYearly    = venues.reduce((s, v) => s + v.yearlyRevenue, 0);  // real season-adjusted yearly
  const totalGMV       = venues.reduce((s, v) => s + v.gmv, 0);
  const totalRes       = venues.reduce((s, v) => s + v.reservations, 0);
  const connectedCount = venues.filter(v => v.stripeStatus === 'Connected').length;
  const maxRevenue     = Math.max(1, ...venues.map(v => v.revenue));

  const FILTERS = ['All', ...STAGES];

  const handleAdd = () => {
    if (!db) return;
    const row = addRow(db.id);
    openRow(row.id, db.id);
  };

  const handleConnectStripe = async (venueId: string, venueName: string) => {
    setConnecting(venueId);
    setStripeNotice('');
    try {
      const res = await fetch('/api/stripe-connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create-link', venue: venueName }),
      });
      const data = await res.json();
      if (data.ok && data.url) {
        // Save the account id and mark pending, then redirect to Stripe onboarding
        if (db && stripeIdCol) updateCell(db.id, venueId, stripeIdCol.id, data.accountId);
        if (db && stripeStCol) updateCell(db.id, venueId, stripeStCol.id, 'Pending');
        window.open(data.url, '_blank');
      } else {
        setStripeNotice(data.error ?? 'Could not start Stripe onboarding.');
      }
    } catch {
      setStripeNotice('Could not reach the Stripe service.');
    } finally {
      setConnecting(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99,91,255,0.28) 0%, rgba(167,139,250,0.16) 45%, rgba(10,20,38,0) 100%), var(--color-bg-surface)',
        borderBottom: '0.5px solid var(--color-border-subtle)',
        padding: '20px 28px 16px',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
            <button
              onClick={(e) => { if (!isAdmin) return; setEditAnchor(editAnchor ? null : (e.currentTarget as HTMLElement).getBoundingClientRect()); }}
              title={isAdmin ? 'Edit icon, colour & name' : undefined}
              style={{ width: 40, height: 40, borderRadius: 11, background: `linear-gradient(135deg, ${iconColor}, ${iconColor}99)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: `0 4px 16px ${iconColor}55`, border: 'none', cursor: isAdmin ? 'pointer' : 'default', flexShrink: 0 }}
            >
              <PageIcon name={pageIcon} size={20} />
            </button>
            {isAdmin && editAnchor && (
              <PageEditPopover
                name={pageTitle}
                icon={pageIcon}
                iconColor={iconColor}
                anchorRect={editAnchor}
                onChangeName={(t) => updatePage(pageId, { title: t })}
                onChangeIcon={(i) => updatePage(pageId, { icon: i })}
                onChangeColor={(c) => updatePage(pageId, { iconColor: c })}
                onClose={() => setEditAnchor(null)}
              />
            )}
            <div>
              <h1 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>{pageTitle}</h1>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: 0, marginTop: 2 }}>{venues.length} venues · we earn a fee on every table reservation</p>
            </div>
          </div>
          <button onClick={handleAdd} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #635bff, #a78bfa)', color: '#fff', fontWeight: 700, fontSize: 'var(--text-sm)', cursor: 'pointer', boxShadow: '0 3px 14px rgba(99,91,255,0.4)' }}>
            <IconPlus size={14} /> Add venue
          </button>
        </div>

        {/* Revenue stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: 'Real yearly revenue',  value: fmtEur(totalYearly),        color: '#3ecf8e', icon: <IconCoinEuro size={14} />, hint: 'season-adjusted, all clubs', highlight: true },
            { label: 'Peak monthly revenue', value: fmtEur(totalRevenue),       color: '#635bff', icon: <IconReceipt size={14} />,  hint: 'when all clubs in-season' },
            { label: 'Reservations / mo',    value: totalRes.toLocaleString(),  color: '#a78bfa', icon: <IconArmchair size={14} />, hint: 'across all clubs' },
            { label: 'Stripe connected',     value: `${connectedCount}/${venues.length}`, color: '#f472b6', icon: <IconBrandStripe size={14} />, hint: 'venues paying out' },
          ].map(s => (
            <div key={s.label} style={{
              background: s.highlight ? 'rgba(46,232,154,0.10)' : 'rgba(10,20,38,0.4)',
              border: `0.5px solid ${s.highlight ? 'rgba(46,232,154,0.35)' : 'rgba(99,91,255,0.2)'}`,
              borderRadius: 10, padding: '12px 14px', backdropFilter: 'blur(4px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: s.color }}>{s.icon}<span style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{s.label}</span></div>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 9, color: 'var(--color-text-muted)', marginTop: 3 }}>{s.hint}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stripe notice */}
      {stripeNotice && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 28px', background: 'rgba(245,166,35,0.1)', borderBottom: '0.5px solid rgba(245,166,35,0.25)', fontSize: 'var(--text-xs)', color: 'var(--color-amber)' }}>
          <IconBrandStripe size={14} style={{ flexShrink: 0 }} /> {stripeNotice}
          <button onClick={() => setStripeNotice('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--color-amber)', cursor: 'pointer', fontSize: 11 }}>Dismiss</button>
        </div>
      )}

      {/* Filters + search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 28px', borderBottom: '0.5px solid var(--color-border-subtle)', background: 'var(--color-bg-base)', flexShrink: 0, flexWrap: 'wrap' }}>
        {FILTERS.map(f => {
          const active = filter === f;
          const stageColor = STAGE_COLORS[f] ?? '#635bff';
          const count = f === 'All' ? venues.length : countByStage(f);
          return (
            <button key={f} onClick={() => setFilter(f)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20,
              border: `1px solid ${active ? stageColor : 'var(--color-border-subtle)'}`,
              background: active ? `${stageColor}22` : 'transparent',
              color: active ? stageColor : 'var(--color-text-muted)',
              fontWeight: active ? 700 : 400, fontSize: 'var(--text-xs)', cursor: 'pointer', transition: 'all 80ms',
            }}>
              {f !== 'All' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: stageColor }} />}
              {f}
              <span style={{ fontSize: 9, fontWeight: 700, opacity: 0.75 }}>{count}</span>
            </button>
          );
        })}
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 20, background: 'var(--color-bg-elevated)', border: '0.5px solid var(--color-border-subtle)' }}>
          <IconSearch size={12} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search venues or cities…"
            style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--color-text-primary)', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-sans)', width: 160 }} />
        </div>
      </div>

      {/* Venue cards */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', background: 'var(--color-bg-base)' }}>
        {filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, height: 260, color: 'var(--color-text-muted)' }}>
            <IconMusic size={36} style={{ opacity: 0.25 }} />
            <span style={{ fontSize: 'var(--text-sm)' }}>{search ? 'No venues match your search.' : 'No venues yet.'}</span>
            <button onClick={handleAdd} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#635bff,#a78bfa)', color: '#fff', fontWeight: 600, fontSize: 'var(--text-xs)', cursor: 'pointer' }}>
              <IconPlus size={12} /> Add first venue
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {filtered.map(v => {
              const stripeCfg = STRIPE_CONFIG[v.stripeStatus] ?? STRIPE_CONFIG.Disconnected;
              const statusColor = STAGE_COLORS[v.status] ?? '#6b7280';
              const initial = v.name.trim().charAt(0).toUpperCase() || '?';
              const revPct = (v.revenue / maxRevenue) * 100;
              const isConnected = v.stripeStatus === 'Connected';
              return (
                <div key={v.id}
                  style={{
                    background: 'var(--color-bg-elevated)',
                    border: '0.5px solid var(--color-border-default)',
                    borderRadius: 14, overflow: 'hidden',
                    transition: 'border-color 120ms, box-shadow 120ms, transform 120ms',
                    boxShadow: '0 4px 18px rgba(0,0,0,0.28)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#635bff'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(99,91,255,0.22)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border-default)'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,0.28)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {/* Revenue strip — width reflects share of top venue */}
                  <div style={{ height: 5, background: 'rgba(99,91,255,0.15)' }}>
                    <div style={{ height: '100%', width: `${revPct}%`, background: 'linear-gradient(90deg, #635bff, #a78bfa)', transition: 'width 500ms' }} />
                  </div>

                  <div style={{ padding: '16px 18px', cursor: 'pointer' }} onClick={() => db && openRow(v.id, db.id)}>
                    {/* Header row */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                      <div style={{ width: 46, height: 46, borderRadius: 12, background: 'linear-gradient(135deg, rgba(99,91,255,0.4), rgba(167,139,250,0.2))', border: '1.5px solid rgba(99,91,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 20, color: '#7c75ff', flexShrink: 0 }}>{initial}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 'var(--text-md)', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.name}</div>
                        {v.city && <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 2 }}><IconMapPin size={11} />{v.city}</div>}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, background: `${statusColor}18`, color: statusColor, fontSize: 10, fontWeight: 600 }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusColor }} />{v.status || '—'}
                        </span>
                        {v.season && (() => { const sc = SEASON_COLORS[v.season] ?? '#6b7280'; return (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, background: `${sc}18`, color: sc, fontSize: 10, fontWeight: 600 }}>
                            <IconCalendar size={9} />{v.season}
                          </span>
                        ); })()}
                      </div>
                    </div>

                    {/* Big revenue number */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                      <div style={{ fontSize: 28, fontWeight: 900, color: '#7c75ff', lineHeight: 1 }}>{fmtEur(v.revenue)}</div>
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>/ mo to us</span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 14 }}>
                      {fmtEur(v.fee)} fee × {v.reservations.toLocaleString()} reservations
                    </div>

                    {/* Mini stats */}
                    <div style={{ display: 'flex', gap: 14, paddingTop: 12, borderTop: '0.5px solid var(--color-border-subtle)' }}>
                      <div>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: '#3ecf8e', lineHeight: 1 }}>{fmtEur(v.yearlyRevenue)}</div>
                        <div style={{ fontSize: 9, color: 'var(--color-text-muted)', marginTop: 2 }}>yearly · {v.months}mo</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1 }}>{v.reservations.toLocaleString()}</div>
                        <div style={{ fontSize: 9, color: 'var(--color-text-muted)', marginTop: 2 }}>reservations</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1 }}>{fmtEur(v.gmv)}</div>
                        <div style={{ fontSize: 9, color: 'var(--color-text-muted)', marginTop: 2 }}>table volume</div>
                      </div>
                    </div>
                  </div>

                  {/* Stripe footer */}
                  <div style={{ padding: '10px 18px', borderTop: '0.5px solid var(--color-border-subtle)', background: isConnected ? 'rgba(99,91,255,0.06)' : 'transparent', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 600, color: stripeCfg.color }}>
                      {stripeCfg.icon}{stripeCfg.label}
                    </span>
                    <div style={{ flex: 1 }} />
                    {isConnected ? (
                      <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{v.stripeId.slice(0, 14)}…</span>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleConnectStripe(v.id, v.name); }}
                        disabled={connecting === v.id}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 11px', borderRadius: 7, border: 'none', background: '#635bff', color: '#fff', fontSize: 10, fontWeight: 700, cursor: connecting === v.id ? 'default' : 'pointer', opacity: connecting === v.id ? 0.6 : 1 }}>
                        <IconBrandStripe size={11} /> {connecting === v.id ? 'Connecting…' : 'Connect Stripe'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── To-Do Timetable — a weekly planner view of tasks by due date ──────────────

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function mondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  d.setDate(d.getDate() - ((day === 0 ? 7 : day) - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function TodoTimetable({ pageId, pageTitle, pageIcon, pageIconColor }: { pageId: string; pageTitle: string; pageIcon: string; pageIconColor?: string }) {
  const { databases, users, addRow, updateCell, openRow, deleteRow } = useAppStore();
  const isAdmin = useCurrentAccount()?.role === 'admin';
  const db = Object.values(databases).find(d => d.page_id === pageId);
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [editAnchor, setEditAnchor] = useState<DOMRect | null>(null);
  const [view, setView] = useState<'week' | 'all'>('week');
  const { updatePage } = useAppStore();
  const iconColor = pageIconColor ?? '#1c75bc';

  const nameCol     = db?.columns.find(c => c.position === 0);
  const statusCol   = db?.columns.find(c => c.type === 'status');
  const assigneeCol = db?.columns.find(c => c.type === 'person');
  const dueCol      = db?.columns.find(c => c.type === 'date' || c.type === 'date_range');
  const priorityCol = db?.columns.find(c => c.type === 'priority');

  const todayStr = ymd(new Date());
  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); return d; }), [weekStart]);
  const weekKeys = weekDates.map(ymd);

  type Task = { id: string; name: string; status: string; assignee: string; priority: string; due: string };
  const tasks = useMemo<Task[]>(() => (db?.rows ?? []).map(r => ({
    id: r.id,
    name:     nameCol ? String(r.cells[nameCol.id] ?? 'Untitled') : 'Untitled',
    status:   statusCol ? String(r.cells[statusCol.id] ?? '') : '',
    assignee: assigneeCol ? String(r.cells[assigneeCol.id] ?? '') : '',
    priority: priorityCol ? String(r.cells[priorityCol.id] ?? '') : '',
    due:      dueCol ? String(r.cells[dueCol.id] ?? '').split('|')[0].split('T')[0] : '',
  })), [db, nameCol, statusCol, assigneeCol, priorityCol, dueCol]);

  const isDone = (s: string) => s === 'Done' || s === 'Completed';
  const byDay = (key: string) => tasks.filter(t => t.due === key);
  // Due strip — unfinished tasks due today or within the next 7 days (no overdue)
  const daysFromToday = (due: string) => Math.round((new Date(due).getTime() - new Date(todayStr).getTime()) / 86400000);
  const dueSoon = tasks
    .filter(t => t.due && !isDone(t.status) && daysFromToday(t.due) >= 0 && daysFromToday(t.due) <= 7)
    .sort((a, b) => a.due.localeCompare(b.due));

  const addOnDay = (key: string) => {
    if (!db) return;
    const row = addRow(db.id);
    if (dueCol) updateCell(db.id, row.id, dueCol.id, key);
    openRow(row.id, db.id);
  };

  const shiftWeek = (n: number) => { const d = new Date(weekStart); d.setDate(weekStart.getDate() + n * 7); setWeekStart(d); };

  const weekLabel = `${weekDates[0].toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${weekDates[6].toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  const TaskCard = ({ t }: { t: Task }) => {
    const scfg = t.status ? getStatusConfig(t.status) : null;
    const pcfg = t.priority ? getPriorityConfig(t.priority) : null;
    const u = users.find(x => x.id === t.assignee);
    const done = isDone(t.status);
    return (
      <div onClick={() => db && openRow(t.id, db.id)}
        style={{
          position: 'relative',
          background: 'var(--color-bg-elevated)', border: '0.5px solid var(--color-border-default)',
          borderLeft: `2.5px solid ${scfg?.color ?? 'var(--color-border-strong)'}`,
          borderRadius: 7, padding: '7px 9px', cursor: 'pointer', marginBottom: 6,
          opacity: done ? 0.6 : 1, transition: 'border-color 100ms, transform 100ms',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.borderColor = scfg?.color ?? 'var(--color-accent)'; const del = e.currentTarget.querySelector('.task-del') as HTMLElement | null; if (del) del.style.opacity = '1'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--color-border-default)'; e.currentTarget.style.borderLeftColor = scfg?.color ?? 'var(--color-border-strong)'; const del = e.currentTarget.querySelector('.task-del') as HTMLElement | null; if (del) del.style.opacity = '0'; }}
      >
        {/* Delete button — appears on hover */}
        <button
          className="task-del"
          onClick={(e) => { e.stopPropagation(); if (db) deleteRow(db.id, t.id); }}
          title="Delete task"
          style={{ position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: 4, border: 'none', background: 'var(--color-bg-active)', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 80ms, color 80ms', zIndex: 2 }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-red)'; e.currentTarget.style.background = 'rgba(255,79,106,0.15)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.background = 'var(--color-bg-active)'; }}
        >
          <IconTrash size={11} />
        </button>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.3, textDecoration: done ? 'line-through' : 'none', marginBottom: 5, paddingRight: 16 }}>{t.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          {scfg && <span style={{ width: 7, height: 7, borderRadius: '50%', background: scfg.color, flexShrink: 0 }} title={t.status} />}
          {pcfg && <span style={{ fontSize: 9, fontWeight: 700, color: pcfg.color }}>{t.priority}</span>}
          <div style={{ flex: 1 }} />
          {u && (u.avatar_url
            ? <img src={u.avatar_url} alt={u.initials} style={{ width: 16, height: 16, borderRadius: '50%', objectFit: 'cover' }} />
            : <span style={{ width: 16, height: 16, borderRadius: '50%', background: u.color, color: '#fff', fontSize: 7, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} title={u.name}>{u.initials}</span>)}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Topbar breadcrumb={[pageTitle]} />

      {/* Header: title + week nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 24px', borderBottom: '0.5px solid var(--color-border-subtle)', background: 'var(--color-bg-surface)', flexShrink: 0, position: 'relative' }}>
        <button
          onClick={(e) => { if (!isAdmin) return; setEditAnchor(editAnchor ? null : (e.currentTarget as HTMLElement).getBoundingClientRect()); }}
          title={isAdmin ? 'Edit icon, colour & name' : undefined}
          style={{ width: 34, height: 34, borderRadius: 9, background: `${iconColor}22`, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: isAdmin ? 'pointer' : 'default', flexShrink: 0 }}
        >
          <PageIcon name={pageIcon} size={18} />
        </button>
        {isAdmin && editAnchor && (
          <PageEditPopover name={pageTitle} icon={pageIcon} iconColor={iconColor} anchorRect={editAnchor}
            onChangeName={(t) => updatePage(pageId, { title: t })}
            onChangeIcon={(i) => updatePage(pageId, { icon: i })}
            onChangeColor={(c) => updatePage(pageId, { iconColor: c })}
            onClose={() => setEditAnchor(null)} />
        )}
        <h1 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>{pageTitle}</h1>

        {/* View toggle */}
        <div style={{ display: 'flex', gap: 2, padding: 2, background: 'var(--color-bg-active)', borderRadius: 8, marginLeft: 12 }}>
          {(['week', 'all'] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
              fontSize: 'var(--text-xs)', fontWeight: 600,
              background: view === v ? 'var(--color-bg-elevated)' : 'transparent',
              color: view === v ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              boxShadow: view === v ? '0 1px 4px rgba(0,0,0,0.25)' : 'none',
            }}>{v === 'week' ? 'Week' : 'All tasks'}</button>
          ))}
        </div>

        <div style={{ flex: 1 }} />
        {view === 'week' && (
          <>
            <button onClick={() => shiftWeek(-1)} style={navBtnStyle}><IconChevronLeft size={16} /></button>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-secondary)', minWidth: 170, textAlign: 'center' }}>{weekLabel}</span>
            <button onClick={() => shiftWeek(1)} style={navBtnStyle}><IconChevronRight size={16} /></button>
            <button onClick={() => setWeekStart(mondayOf(new Date()))} style={{ ...navBtnStyle, width: 'auto', padding: '0 12px', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-accent)', border: '0.5px solid var(--color-accent)' }}>This week</button>
          </>
        )}
        {view === 'all' && (
          <button onClick={() => { if (!db) return; const row = addRow(db.id); openRow(row.id, db.id); }} style={{ ...navBtnStyle, width: 'auto', padding: '0 12px', gap: 5, fontSize: 'var(--text-xs)', fontWeight: 600, color: '#fff', background: 'var(--gradient-accent)', border: 'none' }}>
            <IconPlus size={13} /> Add task
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--color-bg-base)' }}>
        {view === 'all' ? (
          <AllTasksList tasks={tasks} users={users} todayStr={todayStr} dbId={db?.id ?? ''} onOpen={(id) => db && openRow(id, db.id)} onDelete={(id) => db && deleteRow(db.id, id)} />
        ) : (
        <>
        {/* Due today & soon strip */}
        <div style={{ padding: '12px 24px', borderBottom: '0.5px solid var(--color-border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: dueSoon.length > 0 ? 8 : 0, color: 'var(--color-amber)' }}>
            <IconAlarm size={14} /><span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Due today &amp; soon{dueSoon.length > 0 ? ` · ${dueSoon.length}` : ''}</span>
          </div>
          {dueSoon.length === 0 ? (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 6 }}>No Tasks Due Soon.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
              {dueSoon.map(t => {
                const d = daysFromToday(t.due);
                const tag = d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : `In ${d} days`;
                const tagColor = d === 0 ? 'var(--color-amber)' : 'var(--color-accent-bright)';
                return (
                  <div key={t.id} style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', top: 6, right: 22, zIndex: 2, fontSize: 8, fontWeight: 700, color: tagColor, pointerEvents: 'none' }}>{tag}</span>
                    <TaskCard t={t} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Week grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(140px, 1fr))', gap: 0, minHeight: 320 }}>
          {weekDates.map((d, i) => {
            const key = weekKeys[i];
            const isToday = key === todayStr;
            const dayTasks = byDay(key);
            return (
              <div key={key} style={{ borderRight: i < 6 ? '0.5px solid var(--color-border-subtle)' : 'none', display: 'flex', flexDirection: 'column', background: isToday ? 'var(--color-accent-subtle)' : 'transparent' }}>
                {/* Day header */}
                <div style={{ padding: '10px 10px 8px', borderBottom: '0.5px solid var(--color-border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: isToday ? 'var(--color-accent-subtle)' : 'var(--color-bg-base)', zIndex: 1 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: isToday ? 'var(--color-accent-bright)' : 'var(--color-text-muted)' }}>{DAY_NAMES[i]}</div>
                    <div style={{ fontSize: 'var(--text-md)', fontWeight: 800, color: isToday ? 'var(--color-accent-bright)' : 'var(--color-text-secondary)', lineHeight: 1 }}>{d.getDate()}</div>
                  </div>
                  <button onClick={() => addOnDay(key)} title="Add task" className="day-add"
                    style={{ width: 20, height: 20, borderRadius: 5, border: 'none', background: 'var(--color-bg-active)', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--color-accent-bright)'; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '0.5'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}>
                    <IconPlus size={12} />
                  </button>
                </div>
                {/* Day tasks */}
                <div style={{ flex: 1, padding: '8px', overflowY: 'auto' }}>
                  {dayTasks.length === 0
                    ? <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textAlign: 'center', padding: '12px 0', opacity: 0.5 }}>—</div>
                    : dayTasks.map(t => <TaskCard key={t.id} t={t} />)}
                </div>
              </div>
            );
          })}
        </div>
        </>
        )}
      </div>
    </div>
  );
}

// ── All-tasks list — grouped by urgency, editable & deletable ─────────────────
function AllTasksList({ tasks, users, todayStr, dbId, onOpen, onDelete }: {
  tasks: { id: string; name: string; status: string; assignee: string; priority: string; due: string }[];
  users: { id: string; name: string; initials: string; color: string; avatar_url?: string }[];
  todayStr: string;
  dbId: string;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const isDone = (s: string) => s === 'Done' || s === 'Completed';
  const daysBetween = (a: string, b: string) => Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);

  // Relative due text + colour
  const dueInfo = (due: string, done: boolean): { text: string; color: string } => {
    if (!due) return { text: 'No date', color: 'var(--color-text-muted)' };
    if (done) return { text: new Date(due).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), color: 'var(--color-text-muted)' };
    const d = daysBetween(todayStr, due);
    if (d < 0) return { text: `${Math.abs(d)}d late`, color: 'var(--color-red)' };
    if (d === 0) return { text: 'Today', color: 'var(--color-amber)' };
    if (d === 1) return { text: 'Tomorrow', color: 'var(--color-amber)' };
    if (d <= 7) return { text: `In ${d} days`, color: 'var(--color-accent-bright)' };
    return { text: new Date(due).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), color: 'var(--color-text-secondary)' };
  };

  // Build urgency buckets
  const active = tasks.filter(t => !isDone(t.status));
  const done = tasks.filter(t => isDone(t.status));
  const groups: { key: string; label: string; color: string; items: typeof tasks }[] = [
    { key: 'late',   label: 'Late',        color: 'var(--color-red)',           items: active.filter(t => t.due && t.due < todayStr) },
    { key: 'today',  label: 'Due today',   color: 'var(--color-amber)',         items: active.filter(t => t.due === todayStr) },
    { key: 'soon',   label: 'Due soon (7 days)', color: 'var(--color-accent-bright)', items: active.filter(t => t.due && t.due > todayStr && daysBetween(todayStr, t.due) <= 7) },
    { key: 'later',  label: 'Later',       color: 'var(--color-text-secondary)', items: active.filter(t => t.due && daysBetween(todayStr, t.due) > 7) },
    { key: 'nodate', label: 'No due date', color: 'var(--color-text-muted)',    items: active.filter(t => !t.due) },
    { key: 'done',   label: 'Completed',   color: 'var(--color-green)',         items: done },
  ].filter(g => g.items.length > 0);

  const Row = ({ t }: { t: typeof tasks[number] }) => {
    const scfg = t.status ? getStatusConfig(t.status) : null;
    const pcfg = t.priority ? getPriorityConfig(t.priority) : null;
    const u = users.find(x => x.id === t.assignee);
    const done = isDone(t.status);
    const di = dueInfo(t.due, done);
    return (
      <div onClick={() => onOpen(t.id)}
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, cursor: 'pointer', background: 'var(--color-bg-elevated)', border: '0.5px solid var(--color-border-default)', marginBottom: 6, opacity: done ? 0.6 : 1, transition: 'border-color 100ms' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = scfg?.color ?? 'var(--color-accent)'; const del = e.currentTarget.querySelector('.row-del') as HTMLElement | null; if (del) del.style.opacity = '1'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border-default)'; const del = e.currentTarget.querySelector('.row-del') as HTMLElement | null; if (del) del.style.opacity = '0'; }}
      >
        {scfg && <span style={{ width: 9, height: 9, borderRadius: '50%', background: scfg.color, flexShrink: 0 }} title={t.status} />}
        <span style={{ flex: 1, minWidth: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: done ? 'line-through' : 'none' }}>{t.name}</span>
        {pcfg && <span style={{ fontSize: 10, fontWeight: 700, color: pcfg.color, flexShrink: 0 }}>{t.priority}</span>}
        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: di.color, flexShrink: 0, minWidth: 64, textAlign: 'right' }}>{di.text}</span>
        {u && (u.avatar_url
          ? <img src={u.avatar_url} alt={u.initials} style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          : <span style={{ width: 22, height: 22, borderRadius: '50%', background: u.color, color: '#fff', fontSize: 8, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} title={u.name}>{u.initials}</span>)}
        <button className="row-del" onClick={(e) => { e.stopPropagation(); onDelete(t.id); }} title="Delete task"
          style={{ width: 22, height: 22, borderRadius: 5, border: 'none', background: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, flexShrink: 0, transition: 'opacity 80ms, color 80ms' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-red)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; }}>
          <IconTrash size={13} />
        </button>
      </div>
    );
  };

  if (tasks.length === 0) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>No tasks yet.</div>;
  }

  return (
    <div style={{ padding: '20px 24px', maxWidth: 820, margin: '0 auto' }}>
      {groups.map(g => (
        <div key={g.key} style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: g.color }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: g.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{g.label}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)' }}>{g.items.length}</span>
          </div>
          {g.items.map(t => <Row key={t.id} t={t} />)}
        </div>
      ))}
    </div>
  );
}

const navBtnStyle: React.CSSProperties = {
  width: 30, height: 30, borderRadius: 7, border: '0.5px solid var(--color-border-default)',
  background: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
};

// ── Main slug page ────────────────────────────────────────────────────────────
export default function SlugPage({ params }: PageProps) {
  const { slug } = params;
  const router = useRouter();
  const { pages, databases, currentUserId } = useAppStore();

  // Team & Roles is now merged into the Team & Revenue page (Revenue Split)
  useEffect(() => {
    if (slug === 'team') router.replace('/revenue-split');
  }, [slug, router]);

  const page = pages.find((p) => p.slug === slug);

  if (slug === 'team') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Topbar breadcrumb={['Team & Revenue']} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
          Opening Team &amp; Revenue…
        </div>
      </div>
    );
  }

  if (page && page.owner_id && page.owner_id !== currentUserId) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Topbar breadcrumb={['Private']} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
          <IconLock size={32} style={{ opacity: 0.4 }} />
          <span style={{ fontSize: 'var(--text-md)', color: 'var(--color-text-muted)' }}>This is a private page.</span>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Topbar breadcrumb={['Not found']} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
          <IconSearch size={32} style={{ opacity: 0.3 }} />
          <span style={{ fontSize: 'var(--text-md)', color: 'var(--color-text-muted)' }}>Page not found: {slug}</span>
        </div>
      </div>
    );
  }

  // Forecast is computed (no database) — render before the DB lookup
  if (slug === 'forecast') {
    return <ForecastView pageId={page.id} pageTitle={page.title} pageIcon={page.icon} pageIconColor={page.iconColor} />;
  }

  const database = Object.values(databases).find((db) => db.page_id === page.id);
  if (!database) {
    return <EmptyPage pageId={page.id} title={page.title} icon={page.icon} iconColor={page.iconColor} />;
  }

  // To-Do pages (main + private) get a weekly timetable planner
  if (page.type === 'todo') {
    return <TodoTimetable pageId={page.id} pageTitle={page.title} pageIcon={page.icon} pageIconColor={page.iconColor} />;
  }

  // Files page gets a custom visual browser
  if (slug === 'files') {
    return (
      <FilesBrowser
        pageTitle={page.title}
        pageIcon={page.icon}
        pageIconColor={page.iconColor}
        pageId={page.id}
      />
    );
  }

  // ClubCrowd gets a venue dashboard
  if (slug === 'clubcrowd') {
    return <ClubCrowdDashboard pageId={page.id} pageTitle={page.title} pageIcon={page.icon} pageIconColor={page.iconColor} />;
  }

  // Financial statements render as real statements + editable records
  if (slug === 'costs' || slug === 'cashflow' || slug === 'balance-sheet') {
    const kind = slug === 'costs' ? 'pl' : slug === 'cashflow' ? 'cashflow' : 'balance';
    return <FinancialStatementView kind={kind} pageId={page.id} pageTitle={page.title} pageIcon={page.icon} pageIconColor={page.iconColor} />;
  }

  return (
    <DatabasePage
      database={database}
      pageTitle={page.title}
      pageIcon={page.icon}
      pageIconColor={page.iconColor}
      pageId={page.id}
    />
  );
}

function EmptyPage({ pageId, title, icon, iconColor }: { pageId: string; title: string; icon: string; iconColor?: string }) {
  const { createDatabaseForPage } = useAppStore();
  const color = iconColor ?? '#1c75bc';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Topbar breadcrumb={["Appercept's Space HQ", title]} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 0, padding: 24 }}>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
          padding: '40px 48px', borderRadius: 16, maxWidth: 440, textAlign: 'center',
          background: 'var(--color-bg-elevated)',
          border: '0.5px solid var(--color-border-default)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
        }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${color}1a`, color }}>
            <PageIcon name={icon} size={34} />
          </div>
          <div>
            <h1 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 6 }}>{title}</h1>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>
              This page is empty. Create a table to start adding rows, columns and properties.
            </p>
          </div>
          <button onClick={() => createDatabaseForPage(pageId)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 8, border: 'none',
            background: 'var(--gradient-accent)', color: '#fff', fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(0,210,255,0.25)',
          }}>
            <IconTablePlus size={16} /> Create a table
          </button>
        </div>
      </div>
    </div>
  );
}
