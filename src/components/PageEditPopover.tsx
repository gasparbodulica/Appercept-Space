'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { IconSearch, IconCheck } from '@tabler/icons-react';
import { ICON_MAP, ICON_CATEGORIES, PageIcon, PAGE_COLORS } from '@/lib/icons';

interface PageEditPopoverProps {
  name: string;
  icon: string;
  iconColor: string;
  anchorRect: DOMRect;
  onChangeName: (name: string) => void;
  onChangeIcon: (icon: string) => void;
  onChangeColor: (color: string) => void;
  onClose: () => void;
}

export function PageEditPopover({
  name, icon, iconColor, anchorRect,
  onChangeName, onChangeIcon, onChangeColor, onClose,
}: PageEditPopoverProps) {
  const [localName, setLocalName] = useState(name);
  const [iconQuery, setIconQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(ICON_CATEGORIES[0].label);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const commitName = () => {
    if (localName.trim() && localName.trim() !== name) onChangeName(localName.trim());
  };

  const allIcons = Object.keys(ICON_MAP);
  const filtered = iconQuery
    ? allIcons.filter((n) => n.toLowerCase().includes(iconQuery.toLowerCase().replace(/\s/g, '')))
    : null;
  const displayCategories = filtered
    ? [{ label: `Results (${filtered.length})`, icons: filtered }]
    : ICON_CATEGORIES;

  // Position: open to the right of the anchor, clamped to viewport
  const POPOVER_W = 296;
  const POPOVER_H = 440;
  let left = anchorRect.right + 8;
  let top = anchorRect.top;
  if (left + POPOVER_W > window.innerWidth - 8) left = anchorRect.left - POPOVER_W - 8;
  if (top + POPOVER_H > window.innerHeight - 8) top = window.innerHeight - POPOVER_H - 8;
  if (top < 8) top = 8;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={ref}
      style={{
        position: 'fixed', top, left, width: POPOVER_W, zIndex: 3000,
        background: 'var(--color-bg-popover)',
        border: '0.5px solid var(--color-border-default)',
        borderRadius: 10, boxShadow: '0 24px 64px rgba(0,0,0,0.75)',
        overflow: 'hidden',
      }}
    >
      {/* Name input */}
      <div style={{ padding: '12px 12px 8px' }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
          Name
        </div>
        <input
          autoFocus
          value={localName}
          onChange={(e) => setLocalName(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => { if (e.key === 'Enter') { commitName(); } }}
          style={{
            width: '100%', padding: '7px 10px', borderRadius: 7, boxSizing: 'border-box',
            border: '0.5px solid var(--color-border-default)',
            background: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)',
            fontSize: 'var(--text-sm)', outline: 'none', fontFamily: 'var(--font-sans)',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
        />
      </div>

      {/* Color picker */}
      <div style={{ padding: '2px 12px 10px', borderBottom: '0.5px solid var(--color-border-subtle)' }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
          Icon colour
        </div>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {PAGE_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => onChangeColor(c)}
              title={c}
              style={{
                width: 22, height: 22, borderRadius: '50%', background: c, border: 'none',
                cursor: 'pointer', transition: 'transform 80ms, outline 80ms',
                outline: iconColor === c ? `2.5px solid ${c}` : '2.5px solid transparent',
                outlineOffset: 2,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transform: iconColor === c ? 'scale(1.15)' : 'scale(1)',
              }}
              onMouseEnter={(e) => { if (iconColor !== c) e.currentTarget.style.transform = 'scale(1.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = iconColor === c ? 'scale(1.15)' : 'scale(1)'; }}
            >
              {iconColor === c && <IconCheck size={12} style={{ color: '#fff', strokeWidth: 3 }} />}
            </button>
          ))}
        </div>
      </div>

      {/* Icon search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 12px 4px', borderBottom: filteredIcons(iconQuery) ? '0.5px solid var(--color-border-subtle)' : 'none' }}>
        <IconSearch size={12} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
        <input
          value={iconQuery}
          onChange={(e) => setIconQuery(e.target.value)}
          placeholder="Search icons…"
          style={{
            flex: 1, background: 'none', border: 'none', outline: 'none',
            fontSize: 'var(--text-xs)', color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-sans)',
          }}
        />
      </div>

      {/* Category tabs */}
      {!filtered && (
        <div style={{ display: 'flex', gap: 2, padding: '3px 8px 5px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {ICON_CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              onClick={() => setActiveCategory(cat.label)}
              style={{
                padding: '2px 7px', borderRadius: 4, border: 'none', cursor: 'pointer',
                fontSize: 10, fontWeight: 500, whiteSpace: 'nowrap',
                background: activeCategory === cat.label ? iconColor : 'none',
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
      <div style={{ maxHeight: 168, overflowY: 'auto', padding: '4px 8px 8px' }}>
        {displayCategories
          .filter((cat) => filtered || cat.label === activeCategory)
          .map((cat) => (
            <div key={cat.label}>
              {filtered && (
                <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '6px 2px 4px' }}>
                  {cat.label}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 2 }}>
                {cat.icons.map((n) => {
                  const selected = icon === n;
                  return (
                    <button
                      key={n}
                      onClick={() => onChangeIcon(n)}
                      title={n.replace('Icon', '')}
                      style={{
                        width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: 5, border: 'none', cursor: 'pointer', transition: 'all 80ms',
                        background: selected ? iconColor : 'none',
                        color: selected ? '#fff' : iconColor,
                      }}
                      onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
                      onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = 'none'; }}
                    >
                      <PageIcon name={n} size={14} />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        {filtered && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            No icons for &quot;{iconQuery}&quot;
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

function filteredIcons(q: string) {
  return q.trim().length > 0;
}
