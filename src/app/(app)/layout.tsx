'use client';

import { useEffect, useState } from 'react';
import { useAppStore, useCurrentAccount } from '@/lib/store';
import { Sidebar } from '@/components/layout/Sidebar';
import { CommandPalette } from '@/components/CommandPalette';
import { RowDetailPanel } from '@/components/RowDetailPanel';
import { NewPageModal } from '@/components/NewPageModal';
import { AuthScreen } from '@/components/AuthScreen';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { ClientPortalView } from '@/components/ClientPortalView';
import { AIAssistant } from '@/components/AIAssistant';
import { ClientPortalSync } from '@/components/ClientPortalSync';
import { SupabaseAuthSync } from '@/components/SupabaseAuthSync';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { toggleSidebar, setCommandPaletteOpen, openRowId } = useAppStore();
  const account = useCurrentAccount();
  const justSignedIn = useAppStore((s) => s.justSignedIn);
  const authChecked = useAppStore((s) => s.authChecked);

  // Wait for the persisted store to rehydrate so we don't flash the login
  // screen for an already-signed-in device.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const editing = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        toggleSidebar();
      }
      if (e.key === 'c' && !editing && !e.metaKey && !e.ctrlKey) {
        setCommandPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleSidebar, setCommandPaletteOpen]);

  // Before hydration (or while the real session resolves), render only the
  // auth-sync bridge so we never flash the login screen for a logged-in user.
  if (!hydrated || !authChecked) return <SupabaseAuthSync />;

  // Access gate: must be signed in AND approved by an admin
  if (!account || !account.approved) {
    return (
      <>
        <SupabaseAuthSync />
        <AuthScreen />
      </>
    );
  }

  // 3-second welcome screen right after signing in
  if (justSignedIn) {
    return <WelcomeScreen account={account} />;
  }

  // Client accounts see ONLY their assigned portal — nothing else
  if (account.role === 'client') {
    const company = account.client_company ?? '';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--color-bg-base)' }}>
        <div style={{ padding: '12px 20px', borderBottom: '0.5px solid var(--color-border-subtle)', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--color-bg-surface)' }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--gradient-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13 }}>A</div>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>Appercept Space</span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginLeft: 4 }}>— Client Portal</span>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{account.name}</span>
        </div>
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
          <ClientPortalView company={company} mode="client" />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'transparent' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', background: 'transparent' }}>
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {children}
        </main>
        {openRowId && <RowDetailPanel />}
      </div>
      <CommandPalette />
      <NewPageModal />
      <AIAssistant />
      <ClientPortalSync />
      <SupabaseAuthSync />
    </div>
  );
}
