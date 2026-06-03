'use client';

import { useState } from 'react';
import { useAppStore, useCurrentAccount } from '@/lib/store';
import { IconLock, IconMail, IconUser, IconShieldCheck, IconClock, IconLogout } from '@tabler/icons-react';

export function AuthScreen() {
  const { signIn, signUp, signOut, workspace } = useAppStore();
  const account = useCurrentAccount();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Logged in but not approved → waiting screen
  if (account && !account.approved) {
    return (
      <Shell workspaceName={workspace.name}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, margin: '0 auto 18px', background: 'rgba(245,166,35,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-amber)' }}>
            <IconClock size={28} />
          </div>
          <h1 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>Waiting for access</h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
            Your account <b style={{ color: 'var(--color-text-primary)' }}>{account.email}</b> was created. An admin needs to approve it before you can enter {workspace.name}.
          </p>
          <button onClick={signOut} style={ghostBtn}>
            <IconLogout size={14} /> Sign out
          </button>
        </div>
      </Shell>
    );
  }

  const submit = () => {
    setError('');
    const res = mode === 'signin' ? signIn(email, password) : signUp(name, email, password);
    if (!res.ok) setError(res.error ?? 'Something went wrong.');
  };

  return (
    <Shell workspaceName={workspace.name}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--color-bg-active)', borderRadius: 9, marginBottom: 22 }}>
        {(['signin', 'signup'] as const).map((m) => (
          <button key={m} onClick={() => { setMode(m); setError(''); }}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 6, border: 'none', cursor: 'pointer',
              fontSize: 'var(--text-sm)', fontWeight: 600,
              background: mode === m ? 'var(--gradient-accent)' : 'transparent',
              color: mode === m ? '#fff' : 'var(--color-text-secondary)',
              transition: 'all 120ms',
            }}>
            {m === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {mode === 'signup' && (
          <Field icon={<IconUser size={15} />} placeholder="Full name" value={name} onChange={setName} onEnter={submit} />
        )}
        <Field icon={<IconMail size={15} />} placeholder="Email" value={email} onChange={setEmail} onEnter={submit} type="email" />
        <Field icon={<IconLock size={15} />} placeholder="Password" value={password} onChange={setPassword} onEnter={submit} type="password" />

        {error && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-red)', padding: '2px 2px' }}>{error}</div>}

        <button onClick={submit} style={{
          marginTop: 4, padding: '11px 0', borderRadius: 9, border: 'none',
          background: 'var(--gradient-accent)', color: '#fff', fontSize: 'var(--text-sm)', fontWeight: 700,
          cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,210,255,0.25)',
        }}>
          {mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>
      </div>

      {mode === 'signup' && (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
          New accounts need admin approval before they can enter.
        </p>
      )}

      {mode === 'signin' && (
        <div style={{ marginTop: 18, padding: '10px 12px', borderRadius: 8, background: 'var(--color-bg-active)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: 3 }}>
            <IconShieldCheck size={12} /> Demo admin login
          </div>
          gaspar@appercept.net · password <b style={{ color: 'var(--color-text-secondary)' }}>appercept</b>
        </div>
      )}
    </Shell>
  );
}

function Shell({ children, workspaceName }: { children: React.ReactNode; workspaceName: string }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
      background: `
        radial-gradient(ellipse 85% 55% at 15% -5%, rgba(40,130,210,0.38) 0%, transparent 62%),
        radial-gradient(ellipse 65% 45% at 88% 12%, rgba(0,210,255,0.26) 0%, transparent 58%),
        linear-gradient(135deg, #0c2148 0%, #16386e 100%)`,
    }}>
      <div style={{
        width: 380, maxWidth: '100%',
        background: 'var(--color-bg-popover)',
        border: '0.5px solid var(--color-border-strong)',
        borderRadius: 16,
        boxShadow: '0 24px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
        padding: '32px 28px',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{ width: 48, height: 48, borderRadius: 13, background: 'var(--gradient-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 22, boxShadow: '0 4px 18px rgba(0,210,255,0.35)' }}>
            {workspaceName.charAt(0)}
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)' }}>{workspaceName}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Secure workspace · access by invitation</div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ icon, placeholder, value, onChange, onEnter, type = 'text' }: {
  icon: React.ReactNode; placeholder: string; value: string; onChange: (v: string) => void; onEnter: () => void; type?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '0 12px', borderRadius: 9, background: 'var(--color-bg-input)', border: '0.5px solid var(--color-border-default)' }}>
      <span style={{ color: 'var(--color-text-muted)', display: 'flex', flexShrink: 0 }}>{icon}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') onEnter(); }}
        placeholder={placeholder}
        style={{ flex: 1, padding: '11px 0', background: 'none', border: 'none', outline: 'none', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-sans)' }}
      />
    </div>
  );
}

const ghostBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
  border: '0.5px solid var(--color-border-default)', background: 'none', color: 'var(--color-text-secondary)',
  fontSize: 'var(--text-sm)', cursor: 'pointer',
};
