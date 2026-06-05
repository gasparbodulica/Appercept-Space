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
  IconPlus, IconExternalLink,
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
