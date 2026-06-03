'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { PageIcon, PAGE_COLORS } from '@/lib/icons';
import { IconPicker } from './IconPicker';
import { IconX, IconCheck } from '@tabler/icons-react';

export function NewPageModal() {
  const router = useRouter();
  const { newPageModalOpen, setNewPageModalOpen, addPage, setCurrentPage } = useAppStore();
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('IconFile');
  const [color, setColor] = useState('#4f6fff');
  const [pickerOpen, setPickerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (newPageModalOpen) {
      setTitle('');
      setIcon('IconFile');
      setColor('#4f6fff');
      setPickerOpen(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [newPageModalOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNewPageModalOpen(false);
    };
    if (newPageModalOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [newPageModalOpen, setNewPageModalOpen]);

  const handleCreate = () => {
    if (!title.trim()) return;
    const page = addPage(title.trim(), icon, color);
    setNewPageModalOpen(false);
    setCurrentPage(page.slug);
    router.push(`/pages/${page.slug}`);
  };

  if (!newPageModalOpen) return null;

  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 998, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={() => setNewPageModalOpen(false)}
      />

      <div style={{
        position: 'fixed', top: '26%', left: '50%', transform: 'translateX(-50%)',
        width: 440, zIndex: 999,
        background: 'var(--color-bg-surface)',
        border: '0.5px solid var(--color-border-default)',
        borderRadius: 12, boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
        padding: 24,
        animation: 'pop 150ms cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--color-text-primary)' }}>New page</span>
          <button onClick={() => setNewPageModalOpen(false)} style={{ padding: 4, borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex' }}>
            <IconX size={16} />
          </button>
        </div>

        {/* Icon preview + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => setPickerOpen((o) => !o)}
              style={{
                width: 48, height: 48, borderRadius: 10,
                border: `1.5px solid ${color}44`,
                background: `${color}18`,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color, transition: 'all 100ms',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = `${color}28`)}
              onMouseLeave={(e) => (e.currentTarget.style.background = `${color}18`)}
            >
              <PageIcon name={icon} size={24} />
            </button>
            {pickerOpen && (
              <IconPicker value={icon} onChange={(n) => { setIcon(n); }} onClose={() => setPickerOpen(false)} />
            )}
          </div>

          <input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
            placeholder="Page name…"
            style={{
              flex: 1, padding: '10px 12px', borderRadius: 8,
              border: '0.5px solid var(--color-border-default)',
              background: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)',
              fontSize: 'var(--text-base)', fontWeight: 500, outline: 'none',
              fontFamily: 'var(--font-sans)',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = color)}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border-default)')}
          />
        </div>

        {/* Color picker */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Icon colour
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {PAGE_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                title={c}
                style={{
                  width: 26, height: 26, borderRadius: '50%', background: c, border: 'none',
                  cursor: 'pointer', transition: 'transform 80ms, outline 80ms',
                  outline: color === c ? `2.5px solid ${c}` : '2.5px solid transparent',
                  outlineOffset: 2,
                  transform: color === c ? 'scale(1.18)' : 'scale(1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                onMouseEnter={(e) => { if (color !== c) e.currentTarget.style.transform = 'scale(1.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = color === c ? 'scale(1.18)' : 'scale(1)'; }}
              >
                {color === c && <IconCheck size={13} style={{ color: '#fff', strokeWidth: 3 }} />}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={() => setNewPageModalOpen(false)}
            style={{ padding: '8px 16px', borderRadius: 6, border: '0.5px solid var(--color-border-default)', background: 'none', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!title.trim()}
            style={{
              padding: '8px 18px', borderRadius: 6, border: 'none',
              background: title.trim() ? color : 'var(--color-bg-active)',
              color: title.trim() ? '#fff' : 'var(--color-text-muted)',
              fontSize: 'var(--text-sm)', fontWeight: 600,
              cursor: title.trim() ? 'pointer' : 'default', transition: 'all 100ms',
            }}
          >
            Create page
          </button>
        </div>
      </div>
    </>
  );
}
