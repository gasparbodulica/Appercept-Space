'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { USERS } from '@/lib/seed';
import { cn } from '@/lib/utils';
import {
  IconHome, IconPlus, IconBuildingStore, IconUsers, IconFolderOpen,
  IconUserCircle, IconCalendar, IconBuildingFactory2, IconCurrencyEuro,
  IconFolder, IconLock, IconMusic, IconChevronDown, IconSearch,
  IconPencil, IconGripVertical, IconChevronRight
} from '@tabler/icons-react';

const PAGE_ICONS: Record<string, React.ReactNode> = {
  'p-todo':       <IconBuildingStore size={15} />,
  'p-clients':    <IconUsers size={15} />,
  'p-projects':   <IconFolderOpen size={15} />,
  'p-team':       <IconUserCircle size={15} />,
  'p-meetings':   <IconCalendar size={15} />,
  'p-companies':  <IconBuildingFactory2 size={15} />,
  'p-costs':      <IconCurrencyEuro size={15} />,
  'p-files':      <IconFolder size={15} />,
  'p-passwords':  <IconLock size={15} />,
  'p-clubcrowd':  <IconMusic size={15} />,
};

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { pages, currentPageSlug, sidebarCollapsed, toggleSidebar, setCurrentPage } = useAppStore();
  const currentUser = USERS[0];

  const navigate = (slug: string) => {
    setCurrentPage(slug);
    router.push(`/pages/${slug}`);
  };

  const isActive = (slug: string) => pathname === `/pages/${slug}` || currentPageSlug === slug;

  if (sidebarCollapsed) {
    return (
      <aside style={{
        width: 52, minWidth: 52, height: '100vh', background: 'var(--color-bg-surface)',
        borderRight: '0.5px solid var(--color-border-subtle)', display: 'flex',
        flexDirection: 'column', alignItems: 'center', paddingTop: 12, gap: 4,
        transition: 'all 200ms ease', flexShrink: 0,
      }}>
        {/* Logo */}
        <div
          onClick={() => navigate('dashboard')}
          style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--gradient-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer', marginBottom: 8 }}
        >A</div>

        {/* Expand button */}
        <button onClick={toggleSidebar} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: 'none', background: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
          <IconChevronRight size={16} />
        </button>

        <div style={{ width: 1, height: 1, flexGrow: 1 }} />

        {/* Page icons */}
        {pages.map((page) => (
          <button key={page.id} onClick={() => navigate(page.slug)}
            title={page.title}
            style={{
              width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 6, border: 'none', background: isActive(page.slug) ? 'var(--color-bg-active)' : 'none',
              color: isActive(page.slug) ? 'var(--color-accent)' : 'var(--color-text-muted)',
              cursor: 'pointer', fontSize: 16, transition: 'all 100ms ease',
            }}>
            {page.icon}
          </button>
        ))}
      </aside>
    );
  }

  return (
    <aside style={{
      width: 'var(--sidebar-width)', minWidth: 'var(--sidebar-width)', height: '100vh',
      background: 'var(--color-bg-surface)', borderRight: '0.5px solid var(--color-border-subtle)',
      display: 'flex', flexDirection: 'column', transition: 'all 200ms ease', flexShrink: 0, overflow: 'hidden',
    }}>
      {/* Workspace Header */}
      <div style={{ padding: '12px 12px 0', borderBottom: '0.5px solid var(--color-border-subtle)', paddingBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '6px 8px', borderRadius: 6, transition: 'background 100ms ease' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          {/* Logo */}
          <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--gradient-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>A</div>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Appercept&apos;s Space
          </span>
          <IconChevronDown size={13} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
        </div>

        {/* Quick actions */}
        <div style={{ display: 'flex', gap: 4, padding: '6px 0 0' }}>
          <button
            onClick={() => navigate('dashboard')}
            style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', borderRadius: 6, border: 'none', background: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 'var(--text-xs)', transition: 'all 100ms ease' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-hover)'; e.currentTarget.style.color = 'var(--color-text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
          >
            <IconSearch size={13} /> Search
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', borderRadius: 6, border: 'none', background: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 'var(--text-xs)', transition: 'all 100ms ease' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
          >
            <IconPencil size={13} />
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 8px', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {/* Home */}
        <NavItem icon={<IconHome size={15} />} label="Home" active={isActive('dashboard')} onClick={() => navigate('dashboard')} />

        {/* Add new */}
        <NavItem icon={<IconPlus size={15} />} label="Add new" onClick={() => {}} />

        {/* Teamspaces */}
        <div className="section-header" style={{ marginTop: 16 }}>Teamspaces</div>

        {/* Workspace group */}
        <div style={{ marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 500 }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <span style={{ fontSize: 14 }}>🏢</span>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Appercept&apos;s Space HQ</span>
            <IconChevronDown size={12} />
          </div>

          {/* Pages */}
          <div style={{ paddingLeft: 8 }}>
            {pages.map((page) => {
              const active = isActive(page.slug);
              return (
                <div key={page.id}
                  onClick={() => navigate(page.slug)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px',
                    borderRadius: 6, cursor: 'pointer', fontSize: 'var(--text-sm)',
                    color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    background: active ? 'var(--color-bg-active)' : 'transparent',
                    borderLeft: active ? '2px solid var(--color-accent)' : '2px solid transparent',
                    transition: 'all 100ms ease', userSelect: 'none',
                  }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                >
                  {/* Active indicator dot */}
                  {page.is_active && (
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-green)', flexShrink: 0 }} />
                  )}
                  {!page.is_active && (
                    <span style={{ fontSize: 14, lineHeight: 1 }}>{page.icon}</span>
                  )}
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{page.title}</span>
                  {page.badge && (
                    <span style={{
                      background: 'var(--color-accent)', color: '#fff', fontSize: 10,
                      fontWeight: 600, padding: '1px 5px', borderRadius: 9999, lineHeight: 1.6
                    }}>{page.badge}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Notion Apps */}
        <div className="section-header">Notion Apps</div>
        <NavItem icon={<span style={{ fontSize: 14 }}>✉️</span>} label="Notion Mail" onClick={() => {}} />

        {/* Private */}
        <div className="section-header">Private</div>
        <NavItem icon={<IconPlus size={15} />} label="Add new" onClick={() => {}} />
      </nav>

      {/* User footer */}
      <div style={{ borderTop: '0.5px solid var(--color-border-subtle)', padding: '10px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '6px 8px', borderRadius: 6, transition: 'background 100ms ease' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          {/* Avatar */}
          <div style={{
            width: 26, height: 26, borderRadius: '50%', background: currentUser.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 11, flexShrink: 0
          }}>{currentUser.initials}</div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.name}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.email}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px',
        borderRadius: 6, cursor: 'pointer', fontSize: 'var(--text-sm)',
        color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
        background: active ? 'var(--color-bg-active)' : 'transparent',
        borderLeft: active ? '2px solid var(--color-accent)' : '2px solid transparent',
        transition: 'all 100ms ease', userSelect: 'none',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={{ color: 'var(--color-text-muted)', display: 'flex' }}>{icon}</span>
      <span>{label}</span>
    </div>
  );
}
