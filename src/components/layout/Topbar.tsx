'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppStore, useUnreadNotifications, useUnreadPortalCount } from '@/lib/store';
import { formatRelativeTime } from '@/lib/utils';
import { IconShare, IconStar, IconStarFilled, IconDots, IconBell, IconBellFilled, IconPlus, IconLayoutSidebar, IconLink, IconDownload, IconBriefcase } from '@tabler/icons-react';

interface TopbarProps {
  breadcrumb?: string[];
  pageTitle?: string;
  extra?: React.ReactNode;
}

export function Topbar({ breadcrumb = [], pageTitle, extra }: TopbarProps) {
  const {
    sidebarCollapsed, toggleSidebar, setCommandPaletteOpen, setNewPageModalOpen,
    notifications, markAllNotificationsRead, markNotificationRead,
  } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();
  const unread = useUnreadNotifications();
  const unreadPortal = useUnreadPortalCount();
  const [notifOpen, setNotifOpen] = useState(false);
  const [starred, setStarred] = useState(false);
  const [dotsOpen, setDotsOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const crumbs = breadcrumb.length > 0 ? breadcrumb : ["Appercept's Space HQ", pageTitle ?? ''].filter(Boolean);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    });
  };

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

      {/* Extra slot (passed by page) */}
      {extra && <div style={{ marginRight: 4 }}>{extra}</div>}

      {/* Portal message badge */}
      {unreadPortal > 0 && (
        <button
          onClick={() => router.push('/client-portal')}
          title={`${unreadPortal} unread message${unreadPortal !== 1 ? 's' : ''} from clients`}
          style={{
            position: 'relative', display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
            background: 'rgba(255,59,59,0.12)', color: 'var(--color-red)',
            fontSize: 'var(--text-xs)', fontWeight: 700, marginRight: 4,
            transition: 'background 100ms',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,59,59,0.22)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,59,59,0.12)'; }}
        >
          <span style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <IconBriefcase size={14} />
            <span style={{
              position: 'absolute', top: -5, right: -6,
              width: 14, height: 14, borderRadius: '50%',
              background: 'var(--color-red)', color: '#fff',
              fontSize: 9, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1.5px solid var(--color-bg-base)',
            }}>{unreadPortal > 9 ? '9+' : unreadPortal}</span>
          </span>
          Client portal
        </button>
      )}

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginRight: 4 }}>Edited Jun 2</span>

        <button
          onClick={handleShare}
          className="btn-ghost"
          style={{ padding: '4px 8px', fontSize: 'var(--text-xs)', gap: 4, color: shareCopied ? 'var(--color-green)' : undefined }}
          aria-label="Share"
        >
          <IconShare size={14} /> {shareCopied ? 'Copied!' : 'Share'}
        </button>

        <button
          onClick={() => setStarred((s) => !s)}
          className="btn-ghost"
          style={{ padding: '4px 6px', color: starred ? 'var(--color-yellow, #f5c518)' : undefined }}
          aria-label="Favorite"
        >
          {starred ? <IconStarFilled size={15} style={{ color: 'var(--color-yellow, #f5c518)' }} /> : <IconStar size={15} />}
        </button>

        {/* More options */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setDotsOpen((o) => !o)}
            className="btn-ghost"
            style={{ padding: '4px 6px' }}
            aria-label="More options"
          >
            <IconDots size={15} />
          </button>

          {dotsOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setDotsOpen(false)} />
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 200, zIndex: 50,
                background: 'var(--color-bg-surface)', border: '0.5px solid var(--color-border-default)',
                borderRadius: 'var(--card-radius)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                overflow: 'hidden', padding: '4px',
              }}>
                {[
                  { icon: <IconLink size={14} />, label: 'Copy link', action: handleShare },
                  { icon: <IconDownload size={14} />, label: 'Export as CSV', action: () => {} },
                ].map((item) => (
                  <button key={item.label} onClick={() => { item.action(); setDotsOpen(false); }} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                    borderRadius: 6, border: 'none', background: 'none', color: 'var(--color-text-secondary)',
                    fontSize: 'var(--text-sm)', cursor: 'pointer', textAlign: 'left',
                  }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <span style={{ color: 'var(--color-text-muted)' }}>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

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
          onClick={() => setNewPageModalOpen(true)}
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
