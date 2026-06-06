'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { DatabasePage } from '@/components/database/DatabasePage';
import { Topbar } from '@/components/layout/Topbar';
import { PageIcon } from '@/lib/icons';
import { formatDate } from '@/lib/utils';
import {
  IconTablePlus, IconLock, IconSearch, IconFileTypePdf, IconPresentation,
  IconFileText, IconTable, IconPhoto, IconVideo, IconFileZip, IconFile,
  IconPlus, IconExternalLink, IconMapPin, IconMusic, IconBrandStripe,
  IconCoinEuro, IconArmchair, IconReceipt, IconBolt, IconCircleCheck,
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

function ClubCrowdDashboard({ pageId, pageTitle }: { pageId: string; pageTitle: string }) {
  const { databases, addRow, updateCell, openRow } = useAppStore();
  const db = Object.values(databases).find(d => d.page_id === pageId);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [connecting, setConnecting] = useState<string | null>(null);
  const [stripeNotice, setStripeNotice] = useState('');

  const venueCol  = db?.columns.find(c => c.name === 'Venue name');
  const cityCol   = db?.columns.find(c => c.name === 'City');
  const feeCol    = db?.columns.find(c => c.name === 'Fee / reservation (€)');
  const resCol    = db?.columns.find(c => c.name === 'Monthly reservations');
  const spendCol  = db?.columns.find(c => c.name === 'Avg table spend (€)');
  const stripeIdCol = db?.columns.find(c => c.name === 'Stripe Account ID');
  const stripeStCol = db?.columns.find(c => c.name === 'Stripe status');
  const joinedCol = db?.columns.find(c => c.name === 'Platform joined');
  const statusCol = db?.columns.find(c => c.name === 'Status');

  const venues = useMemo(() => (db?.rows ?? []).map(r => {
    const fee = feeCol ? Number(r.cells[feeCol.id] ?? 0) : 0;
    const reservations = resCol ? Number(r.cells[resCol.id] ?? 0) : 0;
    const avgSpend = spendCol ? Number(r.cells[spendCol.id] ?? 0) : 0;
    return {
      id:           r.id,
      name:         venueCol  ? String(r.cells[venueCol.id]  ?? '') : '',
      city:         cityCol   ? String(r.cells[cityCol.id]   ?? '') : '',
      fee, reservations, avgSpend,
      revenue:      fee * reservations,            // Appercept's monthly revenue from this venue
      gmv:          avgSpend * reservations,        // total table spend flowing through the venue
      stripeId:     stripeIdCol ? String(r.cells[stripeIdCol.id] ?? '') : '',
      stripeStatus: stripeStCol ? String(r.cells[stripeStCol.id] ?? '') : 'Disconnected',
      joined:       joinedCol ? String(r.cells[joinedCol.id] ?? '') : '',
      status:       statusCol ? String(r.cells[statusCol.id] ?? '') : '',
    };
  }), [db, venueCol, cityCol, feeCol, resCol, spendCol, stripeIdCol, stripeStCol, joinedCol, statusCol]);

  const filtered = useMemo(() => venues.filter(v => {
    const matchFilter = filter === 'All' ? true : v.status === filter;
    const matchSearch = !search || v.name.toLowerCase().includes(search.toLowerCase()) || v.city.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  }).sort((a, b) => b.revenue - a.revenue), [venues, filter, search]);

  const countByStage = (stage: string) => venues.filter(v => v.status === stage).length;

  // Aggregate stats
  const totalRevenue   = venues.reduce((s, v) => s + v.revenue, 0);
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: 'linear-gradient(135deg, #635bff, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 16px rgba(99,91,255,0.4)' }}>
              <IconMusic size={20} />
            </div>
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
            { label: 'Our monthly revenue', value: fmtEur(totalRevenue),       color: '#635bff', icon: <IconCoinEuro size={14} />, hint: 'fees from all venues' },
            { label: 'Reservations / mo',    value: totalRes.toLocaleString(),  color: '#a78bfa', icon: <IconArmchair size={14} />, hint: 'across all clubs' },
            { label: 'Total table volume',   value: fmtEur(totalGMV),           color: '#f472b6', icon: <IconReceipt size={14} />, hint: 'GMV through platform' },
            { label: 'Stripe connected',     value: `${connectedCount}/${venues.length}`, color: '#3ecf8e', icon: <IconBrandStripe size={14} />, hint: 'venues paying out' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(10,20,38,0.4)', border: '0.5px solid rgba(99,91,255,0.2)', borderRadius: 10, padding: '12px 14px', backdropFilter: 'blur(4px)' }}>
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
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, background: `${statusColor}18`, color: statusColor, fontSize: 10, fontWeight: 600, flexShrink: 0 }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusColor }} />{v.status || '—'}
                      </span>
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
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1 }}>{v.reservations.toLocaleString()}</div>
                        <div style={{ fontSize: 9, color: 'var(--color-text-muted)', marginTop: 2 }}>reservations</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1 }}>{fmtEur(v.gmv)}</div>
                        <div style={{ fontSize: 9, color: 'var(--color-text-muted)', marginTop: 2 }}>table volume</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1 }}>{fmtEur(v.avgSpend)}</div>
                        <div style={{ fontSize: 9, color: 'var(--color-text-muted)', marginTop: 2 }}>avg / table</div>
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

// ── Main slug page ────────────────────────────────────────────────────────────
export default function SlugPage({ params }: PageProps) {
  const { slug } = params;
  const { pages, databases, currentUserId } = useAppStore();

  const page = pages.find((p) => p.slug === slug);

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

  const database = Object.values(databases).find((db) => db.page_id === page.id);
  if (!database) {
    return <EmptyPage pageId={page.id} title={page.title} icon={page.icon} iconColor={page.iconColor} />;
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
    return <ClubCrowdDashboard pageId={page.id} pageTitle={page.title} />;
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
