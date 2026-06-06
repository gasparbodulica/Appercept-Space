'use client';

import { useState, useMemo } from 'react';
import { Database, ViewType, ViewConfig } from '@/lib/types';
import { useAppStore, useCurrentAccount } from '@/lib/store';
import { PageIcon } from '@/lib/icons';
import { PageEditPopover } from '@/components/PageEditPopover';
import { Topbar } from '@/components/layout/Topbar';
import { TableView } from './TableView';
import { BoardView } from './BoardView';
import { CalendarView } from './CalendarView';
import { GalleryView } from './GalleryView';
import { ConsultingDashboard } from './ConsultingDashboard';
import { FilterPanel } from './FilterPanel';
import { SortPanel } from './SortPanel';
import {
  IconTable, IconLayoutKanban, IconCalendar, IconList, IconLayoutGrid,
  IconPlus, IconFilter, IconSortAscending, IconColumns, IconCheck, IconX,
  IconChartBar
} from '@tabler/icons-react';

const VIEW_ICONS: Record<ViewType, React.ReactNode> = {
  table:   <IconTable size={13} />,
  board:   <IconLayoutKanban size={13} />,
  calendar:<IconCalendar size={13} />,
  list:    <IconList size={13} />,
  gallery: <IconLayoutGrid size={13} />,
  dashboard: <IconChartBar size={13} />,
};

interface DatabasePageProps {
  database: Database;
  pageTitle: string;
  pageIcon: string;
  pageIconColor?: string;
  pageId: string;
}

let _vid = 2000;

export function DatabasePage({ database, pageTitle, pageIcon, pageIconColor, pageId }: DatabasePageProps) {
  const { updatePage, addView, updateView, updateColumn } = useAppStore();
  const isAdmin = useCurrentAccount()?.role === 'admin';

  // Block-first: if this DB leads with a plain table, inject a Gallery view as the
  // default so every database renders as cards. The table stays available as a tab.
  const views = useMemo<ViewConfig[]>(() => {
    if (database.views[0]?.type !== 'table') return database.views;
    const gallery: ViewConfig = {
      id: `${database.id}-gallery`, database_id: database.id, name: 'Gallery',
      type: 'gallery', icon: 'IconLayoutGrid', filters: [], sorts: [], hidden_cols: [], is_default: true,
    };
    return [gallery, ...database.views];
  }, [database.views, database.id]);

  const [activeViewId, setActiveViewId] = useState(views[0]?.id ?? '');
  const [editAnchor, setEditAnchor] = useState<DOMRect | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [propsOpen, setPropsOpen] = useState(false);
  const [addViewOpen, setAddViewOpen] = useState(false);

  const activeView = views.find(v => v.id === activeViewId) ?? views[0];
  const filterCount = activeView?.filters?.length ?? 0;
  const sortCount = activeView?.sorts?.length ?? 0;

  const handleAddView = (type: ViewType) => {
    const view = addView(database.id, {
      database_id: database.id,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} view`,
      type,
      icon: '⊞',
      filters: [],
      sorts: [],
      hidden_cols: [],
    });
    setActiveViewId(view.id);
    setAddViewOpen(false);
  };

  const visibleAllCols = database.columns.sort((a, b) => a.position - b.position);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Topbar breadcrumb={["Appercept's Space HQ", pageTitle]} />

      {/* Page header */}
      <div style={{ padding: '20px 24px 0', background: 'transparent' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={e => { if (!isAdmin) return; setEditAnchor(editAnchor ? null : (e.currentTarget as HTMLElement).getBoundingClientRect()); }}
              title={isAdmin ? 'Edit icon, colour & name' : ''}
              style={{
                width: 40, height: 40, borderRadius: 8, border: 'none', background: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: pageIconColor ?? '#4f6fff', cursor: isAdmin ? 'pointer' : 'default', transition: 'background 100ms',
              }}
              onMouseEnter={e => { if (isAdmin) e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <PageIcon name={pageIcon} size={26} />
            </button>
            {isAdmin && editAnchor && (
              <PageEditPopover
                name={pageTitle}
                icon={pageIcon}
                iconColor={pageIconColor ?? '#4f6fff'}
                anchorRect={editAnchor}
                onChangeName={t => updatePage(pageId, { title: t })}
                onChangeIcon={i => updatePage(pageId, { icon: i })}
                onChangeColor={c => updatePage(pageId, { iconColor: c })}
                onClose={() => setEditAnchor(null)}
              />
            )}
          </div>
          <h1 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)' }}>{pageTitle}</h1>
        </div>

        {/* Toolbar: view tabs + actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, borderBottom: '0.5px solid var(--color-border-subtle)' }}>
          {views.map(view => (
            <ViewTab key={view.id} view={view} active={view.id === activeViewId} onClick={() => setActiveViewId(view.id)} />
          ))}

          {/* Add view */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={e => { e.stopPropagation(); setAddViewOpen(o => !o); }}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', borderRadius: '6px 6px 0 0' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-text-secondary)'; e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.background = 'none'; }}
            >
              <IconPlus size={12} /> Add view
            </button>
            {addViewOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setAddViewOpen(false)} />
                <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 50, width: 160, background: 'var(--color-bg-surface)', border: '0.5px solid var(--color-border-default)', borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', overflow: 'hidden', padding: '4px' }}>
                  {(['table', 'board', 'calendar'] as ViewType[]).map(t => (
                    <button key={t} onClick={() => handleAddView(t)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 5, border: 'none', background: 'none', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', cursor: 'pointer', textAlign: 'left' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <span style={{ color: 'var(--color-text-muted)' }}>{VIEW_ICONS[t]}</span>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div style={{ flex: 1 }} />

          {/* Filter / Sort / Properties buttons */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 6, paddingRight: 2 }}>
            <ToolButton
              icon={<IconFilter size={13} />}
              label="Filter"
              active={filterOpen || filterCount > 0}
              badge={filterCount}
              onClick={() => { setFilterOpen(o => !o); setSortOpen(false); setPropsOpen(false); }}
            />
            <ToolButton
              icon={<IconSortAscending size={13} />}
              label="Sort"
              active={sortOpen || sortCount > 0}
              badge={sortCount}
              onClick={() => { setSortOpen(o => !o); setFilterOpen(false); setPropsOpen(false); }}
            />
            <ToolButton
              icon={<IconColumns size={13} />}
              label="Properties"
              active={propsOpen}
              onClick={() => { setPropsOpen(o => !o); setFilterOpen(false); setSortOpen(false); }}
            />
          </div>
        </div>
      </div>

      {/* Filter / Sort / Properties panels */}
      {activeView && filterOpen && (
        <FilterPanel database={database} view={activeView} />
      )}
      {activeView && sortOpen && (
        <SortPanel database={database} view={activeView} />
      )}
      {propsOpen && (
        <div style={{ borderBottom: '0.5px solid var(--color-border-subtle)', background: 'var(--color-bg-base)', padding: '10px 20px 14px' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            Properties in this view
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {visibleAllCols.map(col => {
              const hidden = activeView?.hidden_cols?.includes(col.id) ?? false;
              return (
                <div key={col.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
                  <div
                    onClick={() => {
                      if (!activeView) return;
                      const hc = activeView.hidden_cols ?? [];
                      updateView(database.id, activeView.id, {
                        hidden_cols: hidden ? hc.filter(id => id !== col.id) : [...hc, col.id],
                      });
                    }}
                    style={{
                      width: 32, height: 18, borderRadius: 9, cursor: col.position === 0 ? 'not-allowed' : 'pointer',
                      background: (!hidden && col.position !== 0) || col.position === 0 ? 'var(--color-accent)' : 'var(--color-bg-active)',
                      display: 'flex', alignItems: 'center', padding: 2,
                      transition: 'background 150ms', flexShrink: 0,
                      opacity: col.position === 0 ? 0.5 : 1,
                    }}
                  >
                    <div style={{
                      width: 14, height: 14, borderRadius: '50%', background: '#fff',
                      transform: (!hidden || col.position === 0) ? 'translateX(14px)' : 'translateX(0)',
                      transition: 'transform 150ms',
                    }} />
                  </div>
                  <span style={{ fontSize: 'var(--text-sm)', color: hidden ? 'var(--color-text-muted)' : 'var(--color-text-primary)' }}>{col.name}</span>
                  {col.position === 0 && <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>(always visible)</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View content — glossy panel so the table stands out against the lighter canvas */}
      <div style={{
        flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column',
        margin: '4px 16px 16px', borderRadius: 12,
        border: '0.5px solid var(--color-border-strong)',
        background: 'linear-gradient(180deg, rgba(28,117,188,0.06) 0%, rgba(11,26,48,0.0) 22%), var(--color-bg-surface)',
        boxShadow: '0 10px 40px rgba(0,0,0,0.45), 0 0 0 0.5px rgba(0,210,255,0.08), inset 0 1px 0 rgba(255,255,255,0.07)',
      }}>
        {activeView?.type === 'table' && activeView && (
          <TableView
            database={database}
            view={activeView}
            onOpenFilter={() => { setFilterOpen(true); setSortOpen(false); setPropsOpen(false); }}
          />
        )}
        {activeView?.type === 'board' && activeView && (
          <BoardView database={database} view={activeView} />
        )}
        {activeView?.type === 'calendar' && activeView && (
          <CalendarView database={database} view={activeView} />
        )}
        {activeView?.type === 'dashboard' && activeView && (
          <ConsultingDashboard database={database} />
        )}
        {(activeView?.type === 'gallery' || activeView?.type === 'list') && activeView && (
          <GalleryView database={database} view={activeView} />
        )}
        {activeView && !['table','board','calendar','dashboard','gallery','list'].includes(activeView.type) && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'var(--color-text-muted)' }}>
            {VIEW_ICONS[activeView.type]}
            <span style={{ fontSize: 'var(--text-sm)' }}>{activeView.type.charAt(0).toUpperCase() + activeView.type.slice(1)} view coming soon</span>
            <button onClick={() => setActiveViewId(database.views.find(v => v.type === 'table')?.id ?? database.views[0]?.id ?? '')}
              style={{ padding: '6px 14px', borderRadius: 6, border: '0.5px solid var(--color-border-default)', background: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 'var(--text-xs)' }}
            >Switch to Table view</button>
          </div>
        )}
      </div>
    </div>
  );
}

function ViewTab({ view, active, onClick }: { view: ViewConfig; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
      border: 'none', background: 'none', cursor: 'pointer',
      fontSize: 'var(--text-xs)', fontWeight: active ? 500 : 400,
      color: active ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
      borderBottom: active ? '2px solid var(--color-accent)' : '2px solid transparent',
      borderRadius: '6px 6px 0 0', marginBottom: -0.5, transition: 'all 100ms',
    }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--color-text-muted)'; }}
    >
      <span style={{ color: active ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>{VIEW_ICONS[view.type]}</span>
      {view.name}
    </button>
  );
}

function ToolButton({ icon, label, active, badge, onClick }: { icon: React.ReactNode; label: string; active?: boolean; badge?: number; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px',
        border: active ? '0.5px solid var(--color-accent-bright)' : '0.5px solid var(--color-border-strong)',
        background: active ? 'var(--color-accent-subtle)' : 'var(--color-bg-elevated)',
        cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 600, borderRadius: 7,
        color: active ? 'var(--color-accent-bright)' : 'var(--color-text-secondary)',
        transition: 'all 120ms', position: 'relative',
        boxShadow: active ? '0 0 12px rgba(0,210,255,0.18)' : 'none',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = active ? 'var(--color-accent-subtle)' : 'var(--color-bg-active)'; e.currentTarget.style.color = active ? 'var(--color-accent-bright)' : 'var(--color-text-primary)'; e.currentTarget.style.borderColor = 'var(--color-accent-bright)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = active ? 'var(--color-accent-subtle)' : 'var(--color-bg-elevated)'; e.currentTarget.style.color = active ? 'var(--color-accent-bright)' : 'var(--color-text-secondary)'; e.currentTarget.style.borderColor = active ? 'var(--color-accent-bright)' : 'var(--color-border-strong)'; }}
    >
      {icon} {label}
      {badge != null && badge > 0 && (
        <span style={{ marginLeft: 2, background: 'var(--gradient-accent)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '0 5px', borderRadius: 9999, lineHeight: '16px', height: 16, display: 'inline-flex', alignItems: 'center' }}>
          {badge}
        </span>
      )}
    </button>
  );
}
