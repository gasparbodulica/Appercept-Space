'use client';

import { useEffect, useState } from 'react';
import { useAppStore, useCurrentAccount } from '@/lib/store';
import { Sidebar } from '@/components/layout/Sidebar';
import { CommandPalette } from '@/components/CommandPalette';
import { RowDetailPanel } from '@/components/RowDetailPanel';
import { NewPageModal } from '@/components/NewPageModal';
import { AuthScreen } from '@/components/AuthScreen';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { toggleSidebar, setCommandPaletteOpen, openRowId } = useAppStore();
  const account = useCurrentAccount();

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

  // Before hydration, render nothing to avoid an auth-screen flash
  if (!hydrated) return null;

  // Access gate: must be signed in AND approved by an admin
  if (!account || !account.approved) {
    return <AuthScreen />;
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
    </div>
  );
}
