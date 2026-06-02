'use client';

import { useState } from 'react';
import { Database, ViewType, ViewConfig } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { Topbar } from '@/components/layout/Topbar';
import { TableView } from './TableView';
import { BoardView } from './BoardView';
import { IconTable, IconLayoutKanban, IconCalendar, IconList, IconLayoutGrid, IconPlus, IconFilter, IconSortAscending } from '@tabler/icons-react';

const VIEW_ICONS: Record<ViewType, React.ReactNode> = {
  table: <IconTable size={13} />,
  board: <IconLayoutKanban size={13} />,
  calendar: <IconCalendar size={13} />,
  list: <IconList size={13} />,
  gallery: <IconLayoutGrid size={13} />,
};

interface DatabasePageProps {
  database: Database;
  pageTitle: string;
  pageIcon: string;
}

export function DatabasePage({ database, pageTitle, pageIcon }: DatabasePageProps) {
  const { addRow } = useAppStore();
  const [activeViewId, setActiveViewId] = useState(database.views[0]?.id ?? '');

  const activeView = database.views.find((v) => v.id === activeViewId) ?? database.views[0];
  const hasFilters = (activeView?.filters?.length ?? 0) > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Topbar breadcrumb={["Appercept's Space HQ", pageTitle]} />

      {/* Page header */}
      <div style={{ padding: '20px 24px 0', background: 'var(--color-bg-base)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 24 }}>{pageIcon}</span>
          <h1 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)' }}>{pageTitle}</h1>
        </div>

        {/* View tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, borderBottom: '0.5px solid var(--color-border-subtle)' }}>
          {database.views.map((view) => (
            <ViewTab
              key={view.id}
              view={view}
              active={view.id === activeViewId}
              onClick={() => setActiveViewId(view.id)}
            />
          ))}

          <button style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px',
            border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)',
            borderRadius: '6px 6px 0 0',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)'; e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.background = 'none'; }}
          >
            <IconPlus size={12} /> Add view
          </button>

          {/* Spacer + filter/sort */}
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: 2, marginBottom: 1 }}>
            <ToolButton icon={<IconFilter size={13} />} label="Filter" active={hasFilters} />
            <ToolButton icon={<IconSortAscending size={13} />} label="Sort" />
          </div>
        </div>
      </div>

      {/* View content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeView?.type === 'table' && <TableView database={database} />}
        {activeView?.type === 'board' && <BoardView database={database} />}
        {(activeView?.type === 'list' || activeView?.type === 'gallery' || activeView?.type === 'calendar') && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'var(--color-text-muted)' }}>
            {VIEW_ICONS[activeView.type]}
            <span style={{ fontSize: 'var(--text-sm)' }}>{activeView.type.charAt(0).toUpperCase() + activeView.type.slice(1)} view coming soon</span>
            <button onClick={() => setActiveViewId(database.views[0]?.id ?? '')}
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
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
        border: 'none', background: 'none', cursor: 'pointer',
        fontSize: 'var(--text-xs)', fontWeight: active ? 500 : 400,
        color: active ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
        borderBottom: active ? '2px solid var(--color-accent)' : '2px solid transparent',
        borderRadius: '6px 6px 0 0',
        marginBottom: -0.5,
        transition: 'all 100ms',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = 'var(--color-text-muted)'; }}
    >
      <span style={{ color: active ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>{VIEW_ICONS[view.type]}</span>
      {view.name}
    </button>
  );
}

function ToolButton({ icon, label, active }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <button style={{
      display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px',
      border: 'none', background: active ? 'var(--color-accent-subtle)' : 'none',
      cursor: 'pointer', fontSize: 'var(--text-xs)', borderRadius: 4,
      color: active ? 'var(--color-accent)' : 'var(--color-text-muted)',
      transition: 'all 100ms',
    }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-hover)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = active ? 'var(--color-accent-subtle)' : 'none'; e.currentTarget.style.color = active ? 'var(--color-accent)' : 'var(--color-text-muted)'; }}
    >
      {icon} {label}
    </button>
  );
}
