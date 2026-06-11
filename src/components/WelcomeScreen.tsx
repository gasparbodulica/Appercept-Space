'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import type { Account } from '@/lib/types';

const QUOTES = [
  'Perceive beyond the obvious.',
  'Great things are built one focused day at a time.',
  'Today is a canvas — make something remarkable.',
  'Small steps, compounding into momentum.',
  'Clarity comes from action, not waiting.',
  'Build what you wish existed.',
  'Progress over perfection, always.',
  'The best work feels like play. Enjoy today.',
  'You’ve got everything you need to make today count.',
  'Focus is the new superpower — use yours well.',
  'Done is better than perfect. Ship it.',
  'Every expert was once a beginner who kept going.',
  'Your future self is built by what you do now.',
  'Calm mind, sharp focus, bold moves.',
  'Make it work, make it right, make it beautiful.',
];

export function WelcomeScreen({ account }: { account: Account }) {
  const clearJustSignedIn = useAppStore((s) => s.clearJustSignedIn);
  const workspace = useAppStore((s) => s.workspace);
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const firstName = account.name.trim().split(/\s+/)[0] || 'there';

  useEffect(() => {
    // Share first name with appercept.net via a cross-subdomain cookie so the
    // landing page overlay can greet the user by name on their next visit.
    const maxAge = 365 * 24 * 3600;
    document.cookie = `appercept_fn=${encodeURIComponent(firstName)}; domain=.appercept.net; max-age=${maxAge}; path=/; SameSite=Lax`;

    const t = setTimeout(() => clearJustSignedIn(), 3000);
    return () => clearTimeout(t);
  }, [clearJustSignedIn, firstName]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 5000,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 22, padding: 24,
      background: `
        radial-gradient(ellipse 85% 55% at 15% -5%, rgba(40,130,210,0.40) 0%, transparent 62%),
        radial-gradient(ellipse 65% 45% at 88% 12%, rgba(0,210,255,0.28) 0%, transparent 58%),
        linear-gradient(135deg, #0c2148 0%, #16386e 100%)`,
      animation: 'welcomeFade 400ms ease-out',
    }}>
      {/* Logo / brand mark */}
      <div style={{
        width: 72, height: 72, borderRadius: 18,
        background: 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 800, fontSize: 32,
        boxShadow: '0 8px 30px rgba(0,210,255,0.4)',
        animation: 'welcomePop 600ms cubic-bezier(0.34,1.56,0.64,1)',
        overflow: 'hidden',
      }}>
        <img
          src={workspace.logo_url || '/appercept-icon.svg'}
          alt={workspace.name}
          style={{ width: '100%', height: '100%', objectFit: 'contain', padding: workspace.logo_url ? 0 : 10 }}
        />
      </div>

      <div style={{ textAlign: 'center', maxWidth: 460 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 10, letterSpacing: '-0.01em' }}>
          Welcome, {firstName}
        </h1>
        <p style={{ fontSize: 'var(--text-md)', color: 'rgba(232,240,248,0.78)', lineHeight: 1.5, fontStyle: 'italic' }}>
          &ldquo;{quote}&rdquo;
        </p>
      </div>

      {/* Loading bar */}
      <div style={{ width: 200, height: 4, borderRadius: 9999, background: 'rgba(255,255,255,0.12)', overflow: 'hidden', marginTop: 6 }}>
        <div style={{ height: '100%', borderRadius: 9999, background: 'linear-gradient(90deg,#1c75bc,#00d2ff)', animation: 'welcomeBar 3s linear forwards' }} />
      </div>
      <div style={{ fontSize: 'var(--text-xs)', color: 'rgba(232,240,248,0.5)' }}>Entering {workspace.name}…</div>

      <style jsx global>{`
        @keyframes welcomeFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes welcomePop { from { transform: scale(0.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes welcomeBar { from { width: 0%; } to { width: 100%; } }
      `}</style>
    </div>
  );
}
