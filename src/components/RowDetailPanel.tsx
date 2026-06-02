'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { USERS } from '@/lib/seed';
import { formatDate, getStatusConfig, getPriorityConfig, getTagConfig, isOverdue } from '@/lib/utils';
import { Column, CellValue } from '@/lib/types';
import {
  IconX, IconDots, IconPlus, IconMessageCircle, IconHistory,
  IconPaperclip, IconSend,
} from '@tabler/icons-react';

export function RowDetailPanel() {
  const { openRowId, openDatabaseId, databases, closeRow, updateCell, comments, addComment, activities } = useAppStore();
  const [commentText, setCommentText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const db = openDatabaseId ? databases[openDatabaseId] : null;
  const row = db?.rows.find((r) => r.id === openRowId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments.length]);

  if (!db || !row) return null;

  const nameCol = db.columns.find((c) => c.position === 0);
  const otherCols = db.columns
    .filter((c) => !c.hidden && c.position !== 0)
    .sort((a, b) => a.position - b.position);

  const rowName = nameCol ? String(row.cells[nameCol.id] ?? 'Untitled') : 'Untitled';
  const rowComments = comments.filter((c) => c.row_id === openRowId);
  const rowActivities = activities.filter((a) => a.row_id === openRowId).slice(0, 10);

  const handleSendComment = () => {
    if (!commentText.trim()) return;
    addComment(openRowId!, commentText.trim());
    setCommentText('');
  };

  return (
    <>
      {/* Backdrop (mobile) */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 49, background: 'rgba(0,0,0,0.4)', display: 'none' }} onClick={closeRow} />

      {/* Panel */}
      <div style={{
        width: 'var(--panel-width)', minWidth: 'var(--panel-width)',
        height: '100%', background: 'var(--color-bg-surface)',
        borderLeft: '0.5px solid var(--color-border-default)',
        display: 'flex', flexDirection: 'column',
        animation: 'slideIn 200ms ease-out',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {/* Header */}
        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--color-border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 4 }}>
              Appercept&apos;s Space HQ / {db.name}
            </div>
            <input
              defaultValue={rowName}
              onBlur={(e) => nameCol && updateCell(db.id, row.id, nameCol.id, e.target.value)}
              style={{
                width: '100%', background: 'none', border: 'none', outline: 'none',
                fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-sans)',
              }}
            />
          </div>
          <button onClick={closeRow} style={{ padding: 4, borderRadius: 4, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            <IconX size={16} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 80px' }}>
          {/* Properties */}
          <Section title="Properties">
            {otherCols.map((col) => (
              <PropertyRow key={col.id} column={col} value={row.cells[col.id] ?? null} onChange={(v) => updateCell(db.id, row.id, col.id, v)} />
            ))}
          </Section>

          {/* Comments */}
          <Section title={`Comments (${rowComments.length})`}>
            {rowComments.length === 0 && (
              <div style={{ padding: '12px 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textAlign: 'center' }}>No comments yet</div>
            )}
            {rowComments.map((comment) => {
              const user = USERS.find((u) => u.id === comment.user_id) ?? USERS[0];
              return (
                <div key={comment.id} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '0.5px solid var(--color-border-subtle)' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: user.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 9, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>{user.initials}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-primary)' }}>{user.name}</span>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{new Date(comment.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{comment.body}</div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </Section>

          {/* Activity */}
          {rowActivities.length > 0 && (
            <Section title="Activity">
              {rowActivities.map((act) => {
                const user = USERS.find((u) => u.id === act.user_id) ?? USERS[0];
                return (
                  <div key={act.id} style={{ display: 'flex', gap: 8, padding: '6px 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: user.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 8, fontWeight: 700, flexShrink: 0 }}>{user.initials}</div>
                    <span><span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>{user.name}</span> {act.action} this row</span>
                  </div>
                );
              })}
            </Section>
          )}
        </div>

        {/* Comment input */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px', background: 'var(--color-bg-surface)', borderTop: '0.5px solid var(--color-border-subtle)' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ flex: 1, background: 'var(--color-bg-input)', border: '0.5px solid var(--color-border-default)', borderRadius: 8, padding: '8px 12px' }}>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendComment(); } }}
                placeholder="Add a comment…"
                rows={1}
                style={{
                  width: '100%', background: 'none', border: 'none', outline: 'none', resize: 'none',
                  fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)',
                  lineHeight: 1.5,
                }}
              />
            </div>
            <button onClick={handleSendComment} style={{
              width: 34, height: 34, borderRadius: 8, border: 'none',
              background: commentText.trim() ? 'var(--color-accent)' : 'var(--color-bg-active)',
              color: '#fff', cursor: commentText.trim() ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 150ms',
              flexShrink: 0,
            }}>
              <IconSend size={15} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '16px', borderBottom: '0.5px solid var(--color-border-subtle)' }}>
      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}

function PropertyRow({ column, value, onChange }: { column: Column; value: CellValue; onChange: (v: CellValue) => void }) {
  const [editing, setEditing] = useState(false);

  const renderValue = () => {
    switch (column.type) {
      case 'status': {
        if (!value) return <EmptyValue />;
        const cfg = getStatusConfig(String(value));
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 4, background: cfg.bg, color: cfg.color, fontSize: 'var(--text-xs)', fontWeight: 500 }}>
            <span style={{ fontSize: 10 }}>{cfg.icon}</span>{String(value)}
          </span>
        );
      }
      case 'priority': {
        if (!value) return <EmptyValue />;
        const cfg = getPriorityConfig(String(value));
        return <span style={{ padding: '2px 8px', borderRadius: 4, background: cfg.bg, color: cfg.color, fontSize: 'var(--text-xs)', fontWeight: 500 }}>{String(value)}</span>;
      }
      case 'person': {
        if (!value) return <EmptyValue />;
        const user = USERS.find((u) => u.id === String(value));
        if (!user) return <EmptyValue />;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: user.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 9, fontWeight: 700 }}>{user.initials}</div>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{user.name}</span>
          </div>
        );
      }
      case 'date':
      case 'date_range': {
        if (!value) return <EmptyValue />;
        const str = String(value);
        const overdue = isOverdue(str);
        return <span style={{ fontSize: 'var(--text-xs)', color: overdue ? 'var(--color-red)' : 'var(--color-text-secondary)' }}>{formatDate(str)}</span>;
      }
      case 'multi_select':
      case 'tags': {
        if (!value || !Array.isArray(value) || value.length === 0) return <EmptyValue />;
        return (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {(value as string[]).map((tag) => {
              const tc = getTagConfig(tag);
              return <span key={tag} style={{ padding: '1px 6px', borderRadius: 4, background: tc.bg, color: tc.color, fontSize: 10, fontWeight: 500 }}>{tag}</span>;
            })}
          </div>
        );
      }
      case 'checkbox':
        return (
          <div style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${value ? 'var(--color-accent)' : 'var(--color-border-strong)'}`, background: value ? 'var(--color-accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            onClick={() => onChange(!value)}
          >
            {value && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>✓</span>}
          </div>
        );
      default:
        if (!value || value === '') return <EmptyValue />;
        return <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{String(value)}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '6px 0', borderRadius: 4 }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-hover)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ width: 120, flexShrink: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', paddingTop: 3 }}>{column.name}</div>
      <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setEditing(!editing)}>
        {renderValue()}
      </div>
    </div>
  );
}

function EmptyValue() {
  return <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Empty</span>;
}
