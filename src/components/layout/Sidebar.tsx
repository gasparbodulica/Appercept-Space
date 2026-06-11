'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, usePathname } from 'next/navigation';
import { useAppStore, useCurrentAccount } from '@/lib/store';
import { Workspace, User, Page } from '@/lib/types';
import { PageIcon } from '@/lib/icons';
import { PageEditPopover } from '@/components/PageEditPopover';
import {
  IconHome, IconPlus, IconChevronDown, IconSearch,
  IconPencil, IconChevronRight, IconSettings, IconBuilding,
  IconUsers, IconShield, IconUserPlus, IconExternalLink, IconLogout,
  IconBriefcase, IconUpload, IconStar, IconStarFilled, IconLock, IconMessage, IconPercentage,
} from '@tabler/icons-react';

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { pages, sidebarCollapsed, toggleSidebar, setCurrentPage, setCommandPaletteOpen, setNewPageModalOpen, updatePage, toggleFavorite, movePage, currentUserId, users, workspace, sidebarNavOrder, setSidebarNavOrder } = useAppStore();
  // Pages the current user can see: shared (no owner) + their own private pages
  const visiblePages = pages.filter((p) => !p.owner_id || p.owner_id === currentUserId);
  // Consulting & ClubCrowd are separate ventures — pulled out of the HQ teamspace flow.
  const VENTURE_SLUGS = ['consulting', 'clubcrowd'];
  // P&L, Cash Flow & Balance Sheet form the Financial Statements section.
  const FINANCIAL_SLUGS = ['costs', 'cashflow', 'balance-sheet', 'forecast'];
  const hqPages = visiblePages.filter((p) => !p.owner_id && !VENTURE_SLUGS.includes(p.slug) && !FINANCIAL_SLUGS.includes(p.slug));
  const venturePages = visiblePages.filter((p) => !p.owner_id && VENTURE_SLUGS.includes(p.slug));
  // Keep Financial Statements in a fixed, logical order (P&L → Cash Flow → Balance Sheet)
  const financialPages = FINANCIAL_SLUGS
    .map((s) => visiblePages.find((p) => !p.owner_id && p.slug === s))
    .filter((p): p is NonNullable<typeof p> => !!p);
  const privatePages = visiblePages.filter((p) => p.owner_id === currentUserId);
  const favoritePages = visiblePages.filter((p) => p.favorite);
  const account = useCurrentAccount();
  const signOut = useAppStore((s) => s.signOut);
  // The signed-in account is the current person; fall back to a workspace user.
  const currentUser = account ?? users[0];
  const [editPageId, setEditPageId] = useState<string | null>(null);
  const [editAnchor, setEditAnchor] = useState<DOMRect | null>(null);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [workspaceAnchor, setWorkspaceAnchor] = useState<DOMRect | null>(null);
  const [hqExpanded, setHqExpanded] = useState(true);
  const [draggedPageId, setDraggedPageId] = useState<string | null>(null);
  const [dragOverPageId, setDragOverPageId] = useState<string | null>(null);
  const [draggedNavKey, setDraggedNavKey] = useState<string | null>(null);
  const [dragOverNavKey, setDragOverNavKey] = useState<string | null>(null);
  const wsHeaderRef = useRef<HTMLDivElement>(null);

  const NAV_ITEMS: Record<string, { label: string; icon: React.ReactNode; path: string }> = {
    'home':           { label: 'Home',          icon: <IconHome size={15} />,       path: '/dashboard' },
    'messages':       { label: 'Messages',      icon: <IconMessage size={15} />,    path: '/messages' },
    'client-portal':  { label: 'Client Portal', icon: <IconBriefcase size={15} />,  path: '/client-portal' },
    'revenue-split':  { label: 'Team & Revenue', icon: <IconPercentage size={15} />, path: '/revenue-split' },
  };

  // Drag-and-drop reorder: drop `draggedKey` onto the slot of `targetKey`
  const reorderNavItem = (draggedKey: string, targetKey: string) => {
    if (draggedKey === targetKey) return;
    const order = sidebarNavOrder.filter((k) => k !== draggedKey);
    const targetIdx = order.indexOf(targetKey);
    if (targetIdx === -1) return;
    order.splice(targetIdx, 0, draggedKey);
    setSidebarNavOrder(order);
  };

  const navigate = (slug: string) => {
    setCurrentPage(slug);
    router.push(`/pages/${slug}`);
  };

  const isActive = (slug: string) => pathname === `/pages/${slug}`;
  const isHome = pathname === '/dashboard';
  const isSettings = pathname === '/settings';
  const isAdmin = account?.role === 'admin';
  const pendingCount = useAppStore((s) => s.accounts.filter((a) => !a.approved).length);

  const openEdit = (e: React.MouseEvent, pageId: string) => {
    e.stopPropagation();
    // Only admins can edit a page's icon / colour / name. Others just navigate.
    if (!isAdmin) {
      const pg = pages.find((p) => p.id === pageId);
      if (pg) navigate(pg.slug);
      return;
    }
    if (editPageId === pageId) { setEditPageId(null); return; }
    setEditAnchor((e.currentTarget as HTMLElement).getBoundingClientRect());
    setEditPageId(pageId);
  };

  // One sidebar page row (icon + title + badge + favourite star), drag-reorderable.
  const renderPageRow = (page: Page) => {
    const active = isActive(page.slug);
    const color = page.iconColor ?? '#4f6fff';
    const isDragOver = dragOverPageId === page.id && draggedPageId !== page.id;
    return (
      <div
        key={page.id}
        style={{ position: 'relative', borderTop: isDragOver ? '2px solid var(--color-accent-bright)' : '2px solid transparent', opacity: draggedPageId === page.id ? 0.4 : 1 }}
        draggable
        onDragStart={(e) => { setDraggedPageId(page.id); e.dataTransfer.effectAllowed = 'move'; }}
        onDragOver={(e) => { e.preventDefault(); if (draggedPageId && draggedPageId !== page.id) setDragOverPageId(page.id); }}
        onDragLeave={() => setDragOverPageId((cur) => (cur === page.id ? null : cur))}
        onDrop={(e) => { e.preventDefault(); if (draggedPageId && draggedPageId !== page.id) movePage(draggedPageId, page.id); setDraggedPageId(null); setDragOverPageId(null); }}
        onDragEnd={() => { setDraggedPageId(null); setDragOverPageId(null); }}
      >
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px 3px 4px',
            borderRadius: 6, fontSize: 'var(--text-sm)', userSelect: 'none',
            background: active ? 'var(--color-bg-active)' : 'transparent',
            borderLeft: active ? `2px solid ${color}` : '2px solid transparent',
            transition: 'background 100ms ease',
          }}
          onMouseEnter={(e) => {
            if (!active) e.currentTarget.style.background = 'var(--color-bg-hover)';
            const star = e.currentTarget.querySelector('.page-star') as HTMLElement | null;
            if (star) star.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            if (!active) e.currentTarget.style.background = 'transparent';
            const star = e.currentTarget.querySelector('.page-star') as HTMLElement | null;
            if (star && !page.favorite) star.style.opacity = '0';
          }}
        >
          {/* Icon button — opens edit popover */}
          <button
            onClick={(e) => openEdit(e, page.id)}
            title="Edit icon, colour & name"
            style={{
              width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 5, border: 'none', background: 'none',
              cursor: 'pointer', flexShrink: 0, transition: 'background 80ms',
              color,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-active)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
          >
            {page.is_active
              ? <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-green)', display: 'block' }} />
              : <PageIcon name={page.icon} size={14} />
            }
          </button>

          {/* Title — navigates */}
          <span
            onClick={() => navigate(page.slug)}
            style={{
              flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              cursor: 'pointer', color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              fontSize: 'var(--text-sm)',
            }}
          >
            {page.title}
          </span>

          {page.badge && (
            <span style={{
              background: color, color: '#fff', fontSize: 10,
              fontWeight: 600, padding: '1px 5px', borderRadius: 9999, lineHeight: 1.6, flexShrink: 0,
            }}>{page.badge}</span>
          )}

          {/* Star — favourite toggle */}
          <button
            onClick={(e) => { e.stopPropagation(); toggleFavorite(page.id); }}
            title={page.favorite ? 'Remove from Favorites' : 'Add to Favorites'}
            className="page-star"
            style={{
              width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 4, border: 'none', background: 'none', cursor: 'pointer', flexShrink: 0,
              color: page.favorite ? '#f5c518' : 'var(--color-text-muted)',
              opacity: page.favorite ? 1 : 0, transition: 'opacity 80ms, color 80ms',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#f5c518'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = page.favorite ? '#f5c518' : 'var(--color-text-muted)'; }}
          >
            {page.favorite ? <IconStarFilled size={12} /> : <IconStar size={12} />}
          </button>
        </div>

        {editPageId === page.id && editAnchor && (
          <PageEditPopover
            name={page.title}
            icon={page.icon}
            iconColor={color}
            anchorRect={editAnchor}
            onChangeName={(t) => updatePage(page.id, { title: t })}
            onChangeIcon={(i) => updatePage(page.id, { icon: i })}
            onChangeColor={(c) => updatePage(page.id, { iconColor: c })}
            onClose={() => setEditPageId(null)}
          />
        )}
      </div>
    );
  };

  if (sidebarCollapsed) {
    return (
      <aside style={{
        width: 52, minWidth: 52, height: '100vh', background: 'var(--color-bg-surface)',
        borderRight: '0.5px solid var(--color-border-subtle)', display: 'flex',
        flexDirection: 'column', alignItems: 'center', paddingTop: 12, gap: 4,
        transition: 'all 200ms ease', flexShrink: 0,
      }}>
        {/* Logo icon */}
        <div
          onClick={() => router.push('/dashboard')}
          style={{ width: 32, height: 32, cursor: 'pointer', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Go to Dashboard"
        >
          {workspace.logo_url ? (
            <img src={workspace.logo_url} alt={workspace.name} style={{ width: 30, height: 30, borderRadius: 7, objectFit: 'cover' }} />
          ) : (
            <div style={{
              width: 30, height: 30, borderRadius: 8, background: 'var(--gradient-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 15,
              boxShadow: '0 2px 8px rgba(0,210,255,0.25)',
            }}>
              {(workspace.name?.trim()?.charAt(0) || 'A').toUpperCase()}
            </div>
          )}
        </div>

        {/* Expand button */}
        <button onClick={toggleSidebar} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: 'none', background: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', marginBottom: 4 }}>
          <IconChevronRight size={16} />
        </button>

        <div style={{ width: 28, height: '0.5px', background: 'var(--color-border-subtle)', marginBottom: 6, flexShrink: 0 }} />

        {/* Nav icons in order, then page icons — centered, scrollable */}
        <div style={{ flex: 1, width: '100%', overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          {sidebarNavOrder.map((key) => {
            const item = NAV_ITEMS[key];
            if (!item) return null;
            const activePaths: Record<string, boolean> = {
              'home': isHome,
              'messages': pathname === '/messages',
              'client-portal': pathname === '/client-portal',
              'revenue-split': pathname === '/revenue-split',
            };
            const active = activePaths[key] ?? false;
            return (
              <button key={key} onClick={() => router.push(item.path)}
                title={item.label}
                style={{
                  width: 36, height: 36, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 8, border: 'none',
                  background: active ? 'var(--color-bg-active)' : 'none',
                  color: active ? 'var(--color-accent-bright)' : 'var(--color-text-muted)',
                  cursor: 'pointer', transition: 'all 100ms ease',
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'none'; }}
              >
                {item.icon}
              </button>
            );
          })}
          <div style={{ width: 28, height: '0.5px', background: 'var(--color-border-subtle)', margin: '2px 0', flexShrink: 0 }} />
          {visiblePages.map((page) => {
            const color = page.iconColor ?? '#4f6fff';
            return (
              <button key={page.id} onClick={() => navigate(page.slug)}
                title={page.title}
                style={{
                  width: 36, height: 36, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 8, border: 'none',
                  background: isActive(page.slug) ? `${color}22` : 'none',
                  color,
                  cursor: 'pointer', transition: 'all 100ms ease',
                }}
                onMouseEnter={(e) => { if (!isActive(page.slug)) e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
                onMouseLeave={(e) => { if (!isActive(page.slug)) e.currentTarget.style.background = 'none'; }}
              >
                <PageIcon name={page.icon} size={17} />
              </button>
            );
          })}
        </div>

        {/* Settings + profile pinned at the bottom */}
        <div style={{ width: 28, height: '0.5px', background: 'var(--color-border-subtle)', margin: '6px 0', flexShrink: 0 }} />
        <button onClick={() => router.push('/settings?tab=access')} title={isAdmin && pendingCount > 0 ? `Settings · ${pendingCount} pending` : 'Settings'}
          style={{ position: 'relative', width: 36, height: 36, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: 'none', background: isSettings ? 'var(--color-bg-active)' : 'none', color: isSettings ? 'var(--color-accent-bright)' : 'var(--color-text-muted)', cursor: 'pointer', marginBottom: 8 }}
          onMouseEnter={(e) => { if (!isSettings) e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
          onMouseLeave={(e) => { if (!isSettings) e.currentTarget.style.background = 'none'; }}
        >
          <IconSettings size={17} />
          {isAdmin && pendingCount > 0 && (
            <span style={{ position: 'absolute', top: 3, right: 3, width: 8, height: 8, borderRadius: '50%', background: 'var(--color-red)', border: '1.5px solid var(--color-bg-surface)' }} />
          )}
        </button>
        <div title={currentUser.name} style={{ marginBottom: 12, flexShrink: 0 }}>
          {currentUser.avatar_url ? (
            <img src={currentUser.avatar_url} alt={currentUser.initials} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: currentUser.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 11 }}>{currentUser.initials}</div>
          )}
        </div>
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
      <div style={{ padding: '12px 12px 0', borderBottom: '0.5px solid var(--color-border-subtle)', paddingBottom: 12, position: 'relative' }}>
        <div
          ref={wsHeaderRef}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            if (workspaceMenuOpen) {
              setWorkspaceMenuOpen(false);
            } else {
              const rect = wsHeaderRef.current?.getBoundingClientRect() ?? null;
              setWorkspaceAnchor(rect);
              setWorkspaceMenuOpen(true);
            }
          }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '6px 8px', borderRadius: 6, transition: 'background 100ms ease', background: workspaceMenuOpen ? 'var(--color-bg-active)' : 'transparent' }}
          onMouseEnter={(e) => { if (!workspaceMenuOpen) e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
          onMouseLeave={(e) => { if (!workspaceMenuOpen) e.currentTarget.style.background = 'transparent'; }}
        >
          {/* Logo — custom workspace logo (image) or a gradient initial tile, always with the name */}
          {workspace.logo_url ? (
            <img
              src={workspace.logo_url}
              alt={workspace.name}
              style={{ width: 26, height: 26, borderRadius: 7, objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <div style={{
              width: 26, height: 26, borderRadius: 7, flexShrink: 0,
              background: 'var(--gradient-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 13,
              boxShadow: '0 2px 8px rgba(0,210,255,0.25)',
            }}>
              {(workspace.name?.trim()?.charAt(0) || 'A').toUpperCase()}
            </div>
          )}
          <span style={{ flex: 1, fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {workspace.name}
          </span>
          <IconChevronDown size={13} style={{ color: 'var(--color-text-muted)', flexShrink: 0, transform: workspaceMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
        </div>

        {/* Workspace dropdown */}
        {workspaceMenuOpen && workspaceAnchor && (
          <WorkspaceDropdown
            workspace={workspace}
            users={users}
            anchor={workspaceAnchor}
            headerRef={wsHeaderRef}
            onClose={() => setWorkspaceMenuOpen(false)}
            onNavigate={(path) => { setWorkspaceMenuOpen(false); router.push(path); }}
            onSignOut={() => { setWorkspaceMenuOpen(false); signOut(); }}
          />
        )}


        {/* Back to appercept.net */}
        <a
          href="https://appercept.net"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, margin: '6px 8px 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textDecoration: 'none', opacity: 0.7, transition: 'opacity 150ms' }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7'; }}
        >
          ← appercept.net
        </a>

        {/* Quick actions */}
        <div style={{ display: 'flex', gap: 4, padding: '6px 0 0' }}>
          <button
            onClick={() => setCommandPaletteOpen(true)}
            style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', borderRadius: 6, border: 'none', background: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 'var(--text-xs)', transition: 'all 100ms ease' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-hover)'; e.currentTarget.style.color = 'var(--color-text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
          >
            <IconSearch size={13} /> Search
          </button>
          <button
            onClick={() => setCommandPaletteOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', borderRadius: 6, border: 'none', background: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 'var(--text-xs)', transition: 'all 100ms ease' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
          >
            <IconPencil size={13} />
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 8px', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {/* Reorderable fixed nav items */}
        {sidebarNavOrder.map((key) => {
          const item = NAV_ITEMS[key];
          if (!item) return null;
          const activePaths: Record<string, boolean> = {
            'home': isHome,
            'messages': pathname === '/messages',
            'client-portal': pathname === '/client-portal',
            'revenue-split': pathname === '/revenue-split',
          };
          const active = activePaths[key] ?? false;
          const isDragOver = dragOverNavKey === key && draggedNavKey !== key;
          const isDragging = draggedNavKey === key;
          return (
            <div
              key={key}
              draggable
              onDragStart={(e) => { setDraggedNavKey(key); e.dataTransfer.effectAllowed = 'move'; }}
              onDragOver={(e) => { e.preventDefault(); if (draggedNavKey && draggedNavKey !== key) setDragOverNavKey(key); }}
              onDragLeave={() => { if (dragOverNavKey === key) setDragOverNavKey(null); }}
              onDrop={(e) => { e.preventDefault(); if (draggedNavKey && draggedNavKey !== key) reorderNavItem(draggedNavKey, key); setDraggedNavKey(null); setDragOverNavKey(null); }}
              onDragEnd={() => { setDraggedNavKey(null); setDragOverNavKey(null); }}
              style={{
                position: 'relative',
                borderTop: isDragOver ? '2px solid var(--color-accent-bright)' : '2px solid transparent',
                opacity: isDragging ? 0.4 : 1,
                cursor: 'grab',
              }}
            >
              <NavItem icon={item.icon} label={item.label} active={active} onClick={() => router.push(item.path)} />
            </div>
          );
        })}

        {/* Add new */}
        <NavItem icon={<IconPlus size={15} />} label="Add new" onClick={() => setNewPageModalOpen(true)} />

        {/* Favorites */}
        {favoritePages.length > 0 && (
          <>
            <div className="section-header" style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 5 }}>
              <IconStarFilled size={10} style={{ color: '#f5c518' }} /> Favorites
            </div>
            <div style={{ paddingLeft: 4 }}>
              {favoritePages.map((page) => {
                const active = isActive(page.slug);
                const color = page.iconColor ?? '#4f6fff';
                return (
                  <div key={`fav-${page.id}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px 4px 6px',
                      borderRadius: 6, fontSize: 'var(--text-sm)', userSelect: 'none', cursor: 'pointer',
                      background: active ? 'var(--color-bg-active)' : 'transparent',
                      borderLeft: active ? `2px solid ${color}` : '2px solid transparent',
                      transition: 'background 100ms ease',
                    }}
                    onClick={() => navigate(page.slug)}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{ display: 'flex', color, flexShrink: 0 }}>
                      <PageIcon name={page.icon} size={14} />
                    </span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                      {page.title}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(page.id); }}
                      title="Remove from Favorites"
                      style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, border: 'none', background: 'none', cursor: 'pointer', flexShrink: 0, color: '#f5c518' }}
                    >
                      <IconStarFilled size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Teamspaces */}
        <div className="section-header" style={{ marginTop: 16 }}>Teamspaces</div>

        {/* Workspace group */}
        <div style={{ marginBottom: 4 }}>
          <div
            onClick={() => setHqExpanded(e => !e)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 500, transition: 'background 80ms' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <IconBuilding size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{workspace.name} HQ</span>
            <IconChevronDown size={12} style={{ color: 'var(--color-text-muted)', transition: 'transform 200ms', transform: hqExpanded ? 'none' : 'rotate(-90deg)' }} />
          </div>

          {/* Pages */}
          {hqExpanded && <div style={{ paddingLeft: 4 }}>
            {hqPages.map(renderPageRow)}
          </div>}
        </div>

        {/* Financial Statements — P&L, Cash Flow & Balance Sheet */}
        {financialPages.length > 0 && (
          <div style={{ marginBottom: 4 }}>
            <div className="section-header" style={{ marginTop: 16 }}>Financial Statements</div>
            <div style={{ paddingLeft: 4 }}>
              {financialPages.map(renderPageRow)}
            </div>
          </div>
        )}

        {/* Ventures — Consulting & ClubCrowd live outside the HQ teamspace flow */}
        {venturePages.length > 0 && (
          <div style={{ marginBottom: 4 }}>
            <div className="section-header" style={{ marginTop: 16 }}>Ventures</div>
            <div style={{ paddingLeft: 4 }}>
              {venturePages.map(renderPageRow)}
            </div>
          </div>
        )}

        {/* Private — the current user's private pages (only they can see these) */}
        <div className="section-header" style={{ marginTop: 16 }}>Private</div>
        {privatePages.map((page) => {
          const active = isActive(page.slug);
          const color = page.iconColor ?? '#4f6fff';
          return (
            <div key={page.id}
              onClick={() => navigate(page.slug)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px 4px 6px',
                borderRadius: 6, fontSize: 'var(--text-sm)', userSelect: 'none', cursor: 'pointer',
                background: active ? 'var(--color-bg-active)' : 'transparent',
                borderLeft: active ? `2px solid ${color}` : '2px solid transparent',
                transition: 'background 100ms ease',
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ display: 'flex', color, flexShrink: 0 }}><PageIcon name={page.icon} size={14} /></span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>{page.title}</span>
              <IconLock size={11} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
            </div>
          );
        })}
        <NavItem icon={<IconPlus size={15} />} label="Add new" onClick={() => setNewPageModalOpen(true)} />
      </nav>

      {/* Pinned footer — Settings + profile (never scrolls) */}
      <div style={{ borderTop: '0.5px solid var(--color-border-subtle)', padding: '8px 8px 4px', flexShrink: 0 }}>
        <div
          onClick={() => router.push(isAdmin && pendingCount > 0 ? '/settings?tab=access' : '/settings')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px',
            borderRadius: 6, cursor: 'pointer', fontSize: 'var(--text-sm)',
            color: isSettings ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            background: isSettings ? 'var(--color-bg-active)' : 'transparent',
            borderLeft: isSettings ? '2px solid var(--color-accent)' : '2px solid transparent',
            transition: 'all 100ms ease',
          }}
          onMouseEnter={(e) => { if (!isSettings) { e.currentTarget.style.background = 'var(--color-bg-hover)'; e.currentTarget.style.color = 'var(--color-text-primary)'; } }}
          onMouseLeave={(e) => { if (!isSettings) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-secondary)'; } }}
        >
          <span style={{ display: 'flex', flexShrink: 0 }}><IconSettings size={15} /></span>
          <span style={{ flex: 1 }}>Settings</span>
          {isAdmin && pendingCount > 0 && (
            <span style={{
              minWidth: 18, height: 18, borderRadius: 9, padding: '0 5px',
              background: 'var(--color-red)', color: '#fff',
              fontSize: 10, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{pendingCount > 9 ? '9+' : pendingCount}</span>
          )}
        </div>
      </div>
      <div style={{ borderTop: '0.5px solid var(--color-border-subtle)', padding: '10px 12px', flexShrink: 0 }}>
        <div
          onClick={() => router.push('/settings')}
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '6px 8px', borderRadius: 6, transition: 'background 100ms ease' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          {/* Avatar */}
          {currentUser.avatar_url ? (
            <img src={currentUser.avatar_url} alt={currentUser.initials} style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div style={{
              width: 26, height: 26, borderRadius: '50%', background: currentUser.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 11, flexShrink: 0
            }}>{currentUser.initials}</div>
          )}
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

// ─── Workspace dropdown ───────────────────────────────────────────────────────

interface WorkspaceDropdownProps {
  workspace: Workspace;
  users: User[];
  anchor: DOMRect;
  headerRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onNavigate: (path: string) => void;
  onSignOut: () => void;
}

const ROLE_COLOR: Record<string, { color: string; bg: string }> = {
  admin:  { color: '#4f6fff', bg: '#4f6fff22' },
  member: { color: '#3ecf8e', bg: '#3ecf8e22' },
  viewer: { color: '#6b7280', bg: '#6b728022' },
};

function WorkspaceDropdown({ workspace, users, anchor, headerRef, onClose, onNavigate, onSignOut }: WorkspaceDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedHeader = headerRef.current?.contains(target) ?? false;
      const clickedSelf = ref.current?.contains(target) ?? false;
      if (!clickedSelf && !clickedHeader) onClose();
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose, headerRef]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const W = 280, H = 500;
  let left = anchor.left;
  let top = anchor.bottom + 4;
  if (typeof window !== 'undefined') {
    if (left + W > window.innerWidth - 8) left = window.innerWidth - W - 8;
    if (top + H > window.innerHeight - 8) top = window.innerHeight - H - 8;
  }

  const adminCount = users.filter(u => u.role === 'admin').length;
  const memberCount = users.length;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div ref={ref} style={{
      position: 'fixed', top, left, width: W, zIndex: 3000,
      background: 'var(--color-bg-popover)',
      border: '0.5px solid rgba(28,117,188,0.28)',
      borderRadius: 12,
      boxShadow: '0 24px 64px rgba(0,0,0,0.8), 0 0 0 0.5px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.06)',
      overflow: 'hidden',
    }}>
      {/* Workspace header — prominent logo */}
      <div style={{
        padding: '18px 16px 14px',
        borderBottom: '0.5px solid rgba(28,117,188,0.15)',
        background: 'linear-gradient(135deg, rgba(28,117,188,0.12) 0%, rgba(0,210,255,0.06) 100%)',
      }}>
        {workspace.logo_url ? (
          /* Custom uploaded logo + name */
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <img src={workspace.logo_url} alt={workspace.name} style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
            <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{workspace.name}</div>
          </div>
        ) : (
          /* Placeholder — clickable to upload a logo */
          <button
            onClick={() => onNavigate('/settings?tab=general')}
            title="Add a workspace logo"
            style={{
              display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10,
              background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', width: '100%',
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 10, flexShrink: 0,
              background: 'var(--gradient-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 22,
              boxShadow: '0 2px 12px rgba(0,210,255,0.3)',
            }}>
              {(workspace.name?.trim()?.charAt(0) || 'A').toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{workspace.name}</div>
              <div style={{ fontSize: 10, color: 'var(--color-accent-bright)', display: 'flex', alignItems: 'center', gap: 3 }}>
                <IconUpload size={10} /> Add a logo
              </div>
            </div>
          </button>
        )}
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
          {memberCount} member{memberCount !== 1 ? 's' : ''} · {adminCount} admin{adminCount !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Members section */}
      <div style={{ padding: '10px 0' }}>
        <div style={{ padding: '0 16px 8px', fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Members</div>
        {users.slice(0, 5).map(u => {
          const rc = ROLE_COLOR[u.role] ?? ROLE_COLOR.member;
          return (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 16px' }}>
              {u.avatar_url
                ? <img src={u.avatar_url} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                : <div style={{ width: 28, height: 28, borderRadius: '50%', background: u.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{u.initials}</div>
              }
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 9999, background: rc.bg, color: rc.color, flexShrink: 0 }}>
                {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
              </span>
            </div>
          );
        })}
        {users.length > 5 && (
          <div style={{ padding: '4px 16px', fontSize: 'var(--text-xs)', color: 'var(--color-accent)', cursor: 'pointer' }}
            onClick={() => onNavigate('/settings')}>
            +{users.length - 5} more members
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ borderTop: '0.5px solid var(--color-border-subtle)', padding: '6px 4px' }}>
        {[
          { icon: <IconSettings size={15} />, label: 'Workspace settings', desc: 'Name, logo, billing', path: '/settings?tab=general' },
          { icon: <IconUsers size={15} />, label: 'Members & access', desc: 'Manage who has access', path: '/settings?tab=members' },
          { icon: <IconShield size={15} />, label: 'Roles & permissions', desc: 'Admin, Member, Viewer', path: '/settings?tab=roles' },
          { icon: <IconUserPlus size={15} />, label: 'Invite members', desc: 'Add new team members', path: '/settings?tab=members' },
        ].map(item => (
          <button key={item.label} onClick={() => onNavigate(item.path)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <span style={{ color: 'var(--color-text-muted)', display: 'flex', flexShrink: 0 }}>{item.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', fontWeight: 500 }}>{item.label}</div>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{item.desc}</div>
            </div>
            <IconExternalLink size={12} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          </button>
        ))}
      </div>

      {/* Footer */}
      <div style={{ borderTop: '0.5px solid var(--color-border-subtle)', padding: '6px 4px' }}>
        <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          onClick={onSignOut}
        >
          <span style={{ color: 'var(--color-text-muted)', display: 'flex' }}><IconLogout size={15} /></span>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Log out</span>
        </button>
      </div>
    </div>,
    document.body
  );
}
