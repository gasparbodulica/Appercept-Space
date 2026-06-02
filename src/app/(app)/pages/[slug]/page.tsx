'use client';

import { use } from 'react';
import { useAppStore } from '@/lib/store';
import { DatabasePage } from '@/components/database/DatabasePage';
import { Topbar } from '@/components/layout/Topbar';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function SlugPage({ params }: PageProps) {
  const { slug } = use(params);
  const { pages, databases } = useAppStore();

  const page = pages.find((p) => p.slug === slug);
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
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Topbar breadcrumb={["Appercept's Space HQ", page.title]} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
          <span style={{ fontSize: 32 }}>{page.icon}</span>
          <span style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--color-text-primary)' }}>{page.title}</span>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>No database configured for this page.</span>
        </div>
      </div>
    );
  }

  return (
    <DatabasePage
      database={database}
      pageTitle={page.title}
      pageIcon={page.icon}
    />
  );
}
