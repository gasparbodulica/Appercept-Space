'use client';

import { useState, useRef, useEffect } from 'react';
import { IconSearch } from '@tabler/icons-react';
import { ICON_MAP, ICON_CATEGORIES, PageIcon } from '@/lib/icons';

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
  onClose: () => void;
}

export function IconPicker({ value, onChange, onClose }: IconPickerProps) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(ICON_CATEGORIES[0].label);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const allIcons = Object.keys(ICON_MAP);
  const filtered = query
    ? allIcons.filter((n) => n.toLowerCase().includes(query.toLowerCase().replace(/\s/g, '')))
    : null;

  const displayCategories = filtered
    ? [{ label: `Results (${filtered.length})`, icons: filtered }]
    : ICON_CATEGORIES;

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute', zIndex: 200, top: '100%', left: 0, marginTop: 6,
        width: 320, background: 'var(--color-bg-surface)',
        border: '0.5px solid var(--color-border-default)',
        borderRadius: 10, boxShadow: '0 12px 48px rgba(0,0,0,0.6)',
        overflow: 'hidden',
      }}
    >
      {/* Search */}
      <div style={{ padding: '10px 12px', borderBottom: '0.5px solid var(--color-border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <IconSearch size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search icons…"
          style={{
            flex: 1, background: 'none', border: 'none', outline: 'none',
            fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-sans)',
          }}
        />
      </div>

      {/* Category tabs */}
      {!filtered && (
        <div style={{ display: 'flex', gap: 2, padding: '6px 8px', borderBottom: '0.5px solid var(--color-border-subtle)', overflowX: 'auto' }}>
          {ICON_CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              onClick={() => setActiveCategory(cat.label)}
              style={{
                padding: '3px 8px', borderRadius: 5, border: 'none', cursor: 'pointer',
                fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap',
                background: activeCategory === cat.label ? 'var(--color-accent)' : 'none',
                color: activeCategory === cat.label ? '#fff' : 'var(--color-text-muted)',
                transition: 'all 80ms',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Icon grid */}
      <div style={{ maxHeight: 240, overflowY: 'auto', padding: 10 }}>
        {displayCategories
          .filter((cat) => filtered || cat.label === activeCategory)
          .map((cat) => (
            <div key={cat.label}>
              {filtered && cat.icons.length > 0 && (
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                  {cat.label}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 2, marginBottom: 12 }}>
                {cat.icons.map((iconName) => (
                  <button
                    key={iconName}
                    onClick={() => { onChange(iconName); onClose(); }}
                    title={iconName.replace('Icon', '')}
                    style={{
                      width: 32, height: 32, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', borderRadius: 6, border: 'none',
                      cursor: 'pointer', transition: 'all 80ms',
                      background: value === iconName ? 'var(--color-accent)' : 'none',
                      color: value === iconName ? '#fff' : 'var(--color-text-secondary)',
                    }}
                    onMouseEnter={(e) => {
                      if (value !== iconName) {
                        e.currentTarget.style.background = 'var(--color-bg-hover)';
                        e.currentTarget.style.color = 'var(--color-text-primary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (value !== iconName) {
                        e.currentTarget.style.background = 'none';
                        e.currentTarget.style.color = 'var(--color-text-secondary)';
                      }
                    }}
                  >
                    <PageIcon name={iconName} size={16} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        {filtered && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            No icons found for &quot;{query}&quot;
          </div>
        )}
      </div>
    </div>
  );
}
