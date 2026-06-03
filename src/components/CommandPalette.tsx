'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { PageIcon } from '@/lib/icons';
import { IconSearch, IconX } from '@tabler/icons-react';

interface SearchResult {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  action: () => void;
}

export function CommandPalette() {
  const router = useRouter();
  const { commandPaletteOpen, setCommandPaletteOpen, databases, pages, setCurrentPage } = useAppStore();
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('');
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commandPaletteOpen]);

  const navigate = (slug: string) => {
    setCurrentPage(slug);
    router.push(`/pages/${slug}`);
    setCommandPaletteOpen(false);
  };

  // Build results
  const results: SearchResult[] = [];

  if (!query) {
    // Quick actions
    results.push(
      { id: 'dashboard', icon: 'IconHome', title: 'Go to Dashboard', subtitle: 'Home', action: () => { router.push('/dashboard'); setCommandPaletteOpen(false); } },
      ...pages.map((p) => ({ id: p.id, icon: p.icon, title: p.title, subtitle: 'Page', action: () => navigate(p.slug) })),
    );
  } else {
    const q = query.toLowerCase();

    // Search pages
    pages.filter((p) => p.title.toLowerCase().includes(q)).forEach((p) => {
      results.push({ id: `page-${p.id}`, icon: p.icon, title: p.title, subtitle: 'Page', action: () => navigate(p.slug) });
    });

    // Search rows in all databases
    Object.values(databases).forEach((db) => {
      const nameCol = db.columns.find((c) => c.position === 0);
      const page = pages.find((p) => p.id === db.page_id);
      if (!nameCol || !page) return;

      db.rows.forEach((row) => {
        const name = String(row.cells[nameCol.id] ?? '');
        if (name.toLowerCase().includes(q)) {
          results.push({
            id: `row-${row.id}`,
            icon: page.icon,
            title: name,
            subtitle: page.title,
            action: () => {
              navigate(page.slug);
              setTimeout(() => useAppStore.getState().openRow(row.id, db.id), 100);
            },
          });
        }
      });
    });
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setCommandPaletteOpen(false); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx((i) => Math.min(i + 1, results.length - 1)); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx((i) => Math.max(i - 1, 0)); return; }
    if (e.key === 'Enter' && results[selectedIdx]) { results[selectedIdx].action(); return; }
  };

  if (!commandPaletteOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 998, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={() => setCommandPaletteOpen(false)}
      />

      {/* Palette */}
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 560, maxWidth: 'calc(100vw - 32px)', zIndex: 999,
        background: 'var(--color-bg-surface)',
        border: '0.5px solid var(--color-border-default)',
        borderRadius: 12, boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
        overflow: 'hidden',
        animation: 'pop 150ms cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '0.5px solid var(--color-border-subtle)', gap: 10 }}>
          <IconSearch size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIdx(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, tasks, clients…"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              fontSize: 'var(--text-base)', color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-sans)',
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ padding: 2, borderRadius: 4, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}>
              <IconX size={14} />
            </button>
          )}
          <kbd style={{ padding: '2px 6px', borderRadius: 4, border: '0.5px solid var(--color-border-default)', background: 'var(--color-bg-active)', color: 'var(--color-text-muted)', fontSize: 11 }}>Esc</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 360, overflowY: 'auto' }}>
          {results.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
              No results for &quot;{query}&quot;
            </div>
          ) : (
            <>
              {!query && <GroupLabel>Quick access</GroupLabel>}
              {query && <GroupLabel>Search results</GroupLabel>}
              {results.slice(0, 12).map((result, i) => (
                <div key={result.id}
                  onClick={result.action}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                    cursor: 'pointer',
                    background: i === selectedIdx ? 'var(--color-bg-active)' : 'transparent',
                    transition: 'background 80ms',
                  }}
                  onMouseEnter={() => setSelectedIdx(i)}
                >
                  <span style={{ display: 'flex', flexShrink: 0, color: 'var(--color-text-muted)' }}>
                    <PageIcon name={result.icon} size={16} />
                  </span>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{result.title}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{result.subtitle}</div>
                  </div>
                  {i === selectedIdx && (
                    <kbd style={{ padding: '2px 6px', borderRadius: 4, border: '0.5px solid var(--color-border-default)', background: 'var(--color-bg-active)', color: 'var(--color-text-muted)', fontSize: 10 }}>↵</kbd>
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '8px 16px', borderTop: '0.5px solid var(--color-border-subtle)', display: 'flex', gap: 12 }}>
          {[['↑↓', 'Navigate'], ['↵', 'Open'], ['Esc', 'Close']].map(([key, label]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <kbd style={{ padding: '1px 5px', borderRadius: 3, border: '0.5px solid var(--color-border-default)', background: 'var(--color-bg-active)', color: 'var(--color-text-muted)', fontSize: 10 }}>{key}</kbd>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '8px 16px 4px', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {children}
    </div>
  );
}
