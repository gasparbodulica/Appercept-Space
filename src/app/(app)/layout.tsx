'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAppStore, useCurrentAccount } from '@/lib/store';
import { Sidebar } from '@/components/layout/Sidebar';
import { CommandPalette } from '@/components/CommandPalette';
import { RowDetailPanel } from '@/components/RowDetailPanel';
import { NewPageModal } from '@/components/NewPageModal';
import { AuthScreen } from '@/components/AuthScreen';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { ClientPortalView } from '@/components/ClientPortalView';
import { ClientPortalSync } from '@/components/ClientPortalSync';
import { SupabaseAuthSync } from '@/components/SupabaseAuthSync';
import { WorkspaceBackupSync } from '@/components/WorkspaceBackupSync';
import { useIsMobile } from '@/lib/useIsMobile';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { toggleSidebar, setCommandPaletteOpen, openRowId } = useAppStore();
  const isMobile = useIsMobile();
  const mobileNavOpen = useAppStore((s) => s.mobileNavOpen);
  const setMobileNavOpen = useAppStore((s) => s.setMobileNavOpen);
  const account = useCurrentAccount();
  const justSignedIn = useAppStore((s) => s.justSignedIn);
  const authChecked = useAppStore((s) => s.authChecked);

  // Wait for the persisted store to rehydrate so we don't flash the login
  // screen for an already-signed-in device.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);

  // Close the mobile drawer whenever the route changes (tapped a page).
  const pathname = usePathname();
  useEffect(() => { setMobileNavOpen(false); }, [pathname, setMobileNavOpen]);

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
  if (!hydrated || !authChecked) return <><SupabaseAuthSync /><WorkspaceBackupSync /></>;

  // Access gate: must be signed in AND approved by an admin
  if (!account || !account.approved) {
    return (
      <>
        <SupabaseAuthSync />
        <WorkspaceBackupSync />
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
      {isMobile ? (
        <>
          {/* Slide-in drawer + backdrop on phones */}
          {mobileNavOpen && (
            <div className="mobile-nav-backdrop" onClick={() => setMobileNavOpen(false)} />
          )}
          <div style={{
            position: 'fixed', top: 0, left: 0, height: '100dvh', zIndex: 70,
            transform: mobileNavOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 220ms ease', boxShadow: mobileNavOpen ? '4px 0 24px rgba(0,0,0,0.5)' : 'none',
          }}>
            <Sidebar />
          </div>
        </>
      ) : (
        <Sidebar />
      )}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', background: 'transparent', minWidth: 0 }}>
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {children}
        </main>
        {openRowId && <RowDetailPanel />}
      </div>
      <CommandPalette />
      <NewPageModal />
      <ClientPortalSync />
      <SupabaseAuthSync />
      <WorkspaceBackupSync />
    </div>
  );
}
