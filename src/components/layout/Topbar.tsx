'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore, useUnreadNotifications } from '@/lib/store';
import { formatRelativeTime } from '@/lib/utils';
import { IconShare, IconStar, IconDots, IconBell, IconBellFilled, IconPlus, IconLayoutSidebar } from '@tabler/icons-react';

interface TopbarProps {
  breadcrumb?: string[];
  pageTitle?: string;
}

export function Topbar({ breadcrumb = [], pageTitle }: TopbarProps) {
  const {
    sidebarCollapsed, toggleSidebar, setCommandPaletteOpen,
    notifications, markAllNotificationsRead, markNotificationRead,
  } = useAppStore();
  const unread = useUnreadNotifications();
  const [notifOpen, setNotifOpen] = useState(false);

  const crumbs = breadcrumb.length > 0 ? breadcrumb : ["Appercept's Space HQ", pageTitle ?? ''].filter(Boolean);

  return (
    <header style={{
      height: 'var(--topbar-height)', background: 'var(--color-bg-base)',
      borderBottom: '0.5px solid var(--color-border-subtle)', display: 'flex',
      alignItems: 'center', paddingLeft: 12, paddingRight: 16, gap: 8,
      position: 'relative', zIndex: 40, flexShrink: 0,
    }}>
      {/* Sidebar toggle */}
      <button onClick={toggleSidebar} className="btn-ghost" style={{ padding: '4px 6px' }} aria-label="Toggle sidebar">
        <IconLayoutSidebar size={16} style={{ color: 'var(--color-text-muted)' }} />
      </button>

      {/* Breadcrumb */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
        {crumbs.map((crumb, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {i > 0 && <span style={{ color: 'var(--color-text-muted)' }}>/</span>}
            <span style={{
              color: i === crumbs.length - 1 ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              fontWeight: i === crumbs.length - 1 ? 500 : 400,
              cursor: i < crumbs.length - 1 ? 'pointer' : 'default',
            }}>{crumb}</span>
          </span>
        ))}
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginRight: 4 }}>Edited Jun 2</span>

        <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: 'var(--text-xs)', gap: 4 }} aria-label="Share">
          <IconShare size={14} /> Share
        </button>

        <button className="btn-ghost" style={{ padding: '4px 6px' }} aria-label="Favorite">
          <IconStar size={15} />
        </button>

        <button className="btn-ghost" style={{ padding: '4px 6px' }} aria-label="More options">
          <IconDots size={15} />
        </button>

        {/* Notifications bell */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setNotifOpen(!notifOpen); if (notifOpen) markAllNotificationsRead(); }}
            className="btn-ghost"
            style={{ padding: '4px 6px', position: 'relative' }}
            aria-label="Notifications"
          >
            {unread > 0 ? <IconBellFilled size={16} style={{ color: 'var(--color-accent)' }} /> : <IconBell size={16} />}
            {unread > 0 && (
              <span style={{
                position: 'absolute', top: 2, right: 2, width: 8, height: 8,
                borderRadius: '50%', background: 'var(--color-red)', border: '1.5px solid var(--color-bg-base)',
              }} />
            )}
          </button>

          {notifOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setNotifOpen(false)} />
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 320, zIndex: 50,
                background: 'var(--color-bg-surface)', border: '0.5px solid var(--color-border-default)',
                borderRadius: 'var(--card-radius)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                overflow: 'hidden',
              }}>
                <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--color-border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>Notifications</span>
                  <button onClick={markAllNotificationsRead} style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer' }}>Mark all read</button>
                </div>
                <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                  {notifications.length === 0 && (
                    <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>All caught up!</div>
                  )}
                  {notifications.map((n) => (
                    <div key={n.id} onClick={() => markNotificationRead(n.id)} style={{
                      padding: '12px 16px', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'flex-start',
                      background: n.read ? 'transparent' : 'var(--color-accent-subtle)',
                      borderBottom: '0.5px solid var(--color-border-subtle)',
                      transition: 'background 100ms ease',
                    }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = n.read ? 'transparent' : 'var(--color-accent-subtle)')}
                    >
                      {!n.read && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-accent)', flexShrink: 0, marginTop: 5 }} />}
                      {n.read && <span style={{ width: 7, height: 7, flexShrink: 0 }} />}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 2 }}>{n.title}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{n.body}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 4 }}>{formatRelativeTime(n.created_at)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* New button */}
        <button
          onClick={() => {}}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px',
            borderRadius: 6, border: 'none', background: 'var(--gradient-accent)',
            color: '#fff', fontSize: 'var(--text-sm)', fontWeight: 500, cursor: 'pointer',
            marginLeft: 4, transition: 'all 150ms ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px var(--color-accent-glow)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
        >
          <IconPlus size={14} /> New
        </button>
      </div>
    </header>
  );
}
