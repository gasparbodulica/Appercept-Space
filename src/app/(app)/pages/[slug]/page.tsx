'use client';

import { useAppStore } from '@/lib/store';
import { DatabasePage } from '@/components/database/DatabasePage';
import { Topbar } from '@/components/layout/Topbar';
import { PageIcon } from '@/lib/icons';
import { IconTablePlus } from '@tabler/icons-react';

interface PageProps {
  params: { slug: string };
}

export default function SlugPage({ params }: PageProps) {
  const { slug } = params;
  const { pages, databases, currentUserId } = useAppStore();

  const page = pages.find((p) => p.slug === slug);
  // Private pages are only visible to their owner
  if (page && page.owner_id && page.owner_id !== currentUserId) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Topbar breadcrumb={['Private']} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
          <span style={{ fontSize: 32 }}>🔒</span>
          <span style={{ fontSize: 'var(--text-md)', color: 'var(--color-text-muted)' }}>This is a private page.</span>
        </div>
      </div>
    );
  }
  if (!page) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Topbar breadcrumb={['Not found']} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
          <span style={{ fontSize: 32 }}>🔍</span>
          <span style={{ fontSize: 'var(--text-md)', color: 'var(--color-text-muted)' }}>Page not found: {slug}</span>
        </div>
      </div>
    );
  }

  const database = Object.values(databases).find((db) => db.page_id === page.id);
  if (!database) {
    return <EmptyPage pageId={page.id} title={page.title} icon={page.icon} iconColor={page.iconColor} />;
  }

  return (
    <DatabasePage
      database={database}
      pageTitle={page.title}
      pageIcon={page.icon}
      pageIconColor={page.iconColor}
      pageId={page.id}
    />
  );
}

function EmptyPage({ pageId, title, icon, iconColor }: { pageId: string; title: string; icon: string; iconColor?: string }) {
  const { createDatabaseForPage } = useAppStore();
  const color = iconColor ?? '#1c75bc';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Topbar breadcrumb={["Appercept's Space HQ", title]} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 0, padding: 24 }}>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
          padding: '40px 48px', borderRadius: 16, maxWidth: 440, textAlign: 'center',
          background: 'var(--color-bg-elevated)',
          border: '0.5px solid var(--color-border-default)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `${color}1a`, color,
          }}>
            <PageIcon name={icon} size={34} />
          </div>
          <div>
            <h1 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 6 }}>{title}</h1>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>
              This page is empty. Create a table to start adding rows, columns and properties — then edit everything inline.
            </p>
          </div>
          <button
            onClick={() => createDatabaseForPage(pageId)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 8, border: 'none',
              background: 'var(--gradient-accent)', color: '#fff',
              fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(0,210,255,0.25)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(0,210,255,0.4)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,210,255,0.25)'; }}
          >
            <IconTablePlus size={16} /> Create a table
          </button>
        </div>
      </div>
    </div>
  );
}
