'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ColumnType } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { COLUMN_TYPES, defaultConfigForType } from '@/lib/columnTypes';

interface NewColumnPopoverProps {
  databaseId: string;
  nextPosition: number;
  anchorRect: DOMRect;
  onClose: () => void;
}

export function NewColumnPopover({ databaseId, nextPosition, anchorRect, onClose }: NewColumnPopoverProps) {
  const { addColumn } = useAppStore();
  const [name, setName] = useState('');
  const [type, setType] = useState<ColumnType>('text');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 30); }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    setTimeout(() => document.addEventListener('mousedown', h), 0);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const create = () => {
    const label = name.trim() || COLUMN_TYPES.find(t => t.type === type)?.label || 'Column';
    addColumn(databaseId, {
      database_id: databaseId,
      name: label,
      type,
      position: nextPosition,
      config: defaultConfigForType(type),
      hidden: false,
      width: 160,
    });
    onClose();
  };

  // Position — clamp to viewport. Open below-left of the + button.
  const W = 240, H = 380;
  let left = anchorRect.right - W;
  let top = anchorRect.bottom + 4;
  if (typeof window !== 'undefined') {
    if (left < 8) left = 8;
    if (top + H > window.innerHeight - 8) top = Math.max(8, anchorRect.top - H - 4);
  }

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div ref={ref} style={{
      position: 'fixed', top, left, width: W, zIndex: 1500,
      background: 'var(--color-bg-popover)', border: '0.5px solid var(--color-border-default)',
      borderRadius: 10, boxShadow: '0 16px 56px rgba(0,0,0,0.7)', overflow: 'hidden',
    }}>
      <div style={{ padding: '10px 12px', borderBottom: '0.5px solid var(--color-border-subtle)' }}>
        <input
          ref={inputRef}
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') create(); }}
          placeholder="Property name…"
          style={{
            width: '100%', background: 'var(--color-bg-input)',
            border: '0.5px solid var(--color-border-default)', borderRadius: 6,
            padding: '7px 10px', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)',
            outline: 'none', fontFamily: 'var(--font-sans)', boxSizing: 'border-box',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-accent-bright)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-border-default)')}
        />
      </div>

      <div style={{ padding: '4px', maxHeight: 260, overflowY: 'auto' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '6px 8px 4px' }}>
          Type
        </div>
        {COLUMN_TYPES.map(t => {
          const active = t.type === type;
          return (
            <button key={t.type} onClick={() => setType(t.type)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 10px', borderRadius: 5, border: 'none',
                background: active ? 'var(--color-bg-active)' : 'none',
                color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                fontSize: 'var(--text-sm)', cursor: 'pointer', textAlign: 'left',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'none'; }}
            >
              <span style={{ color: active ? 'var(--color-accent-bright)' : 'var(--color-text-muted)', display: 'flex' }}>{t.icon}</span>
              {t.label}
            </button>
          );
        })}
      </div>

      <div style={{ padding: '8px 12px', borderTop: '0.5px solid var(--color-border-subtle)', display: 'flex', gap: 8 }}>
        <button onClick={onClose} style={{
          flex: 1, padding: '7px 0', borderRadius: 6, border: '0.5px solid var(--color-border-default)',
          background: 'none', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', cursor: 'pointer',
        }}>Cancel</button>
        <button onClick={create} style={{
          flex: 1, padding: '7px 0', borderRadius: 6, border: 'none',
          background: 'var(--gradient-accent)', color: '#fff', fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer',
        }}>Add</button>
      </div>
    </div>,
    document.body
  );
}
