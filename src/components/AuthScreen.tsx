'use client';

import { useState, useEffect } from 'react';
import { useAppStore, useCurrentAccount } from '@/lib/store';
import { isSupabaseConfigured, signInSupabase, signUpSupabase, sendResetEmail } from '@/lib/auth';
import { IconLock, IconMail, IconUser, IconShieldCheck, IconClock, IconLogout } from '@tabler/icons-react';

export function AuthScreen() {
  const { signIn, signUp, signOut, requestResetCode, confirmReset, workspace } = useAppStore();
  const account = useCurrentAccount();
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [resetStep, setResetStep] = useState<'request' | 'verify'>('request');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('signup') === '1') {
        setMode('signup');
      }
    }
  }, []);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

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
    setError(''); setNotice('');
    if (mode === 'reset') { void handleReset(); return; }
    if (isSupabaseConfigured) { void handleSupabaseAuth(); return; }
    // Local prototype fallback
    const res = mode === 'signin' ? signIn(email, password) : signUp(name, email, password);
    if (!res.ok) setError(res.error ?? 'Something went wrong.');
  };

  // Real auth via Supabase — the SupabaseAuthSync bridge picks up the session.
  const handleSupabaseAuth = async () => {
    if (mode === 'signup' && !name.trim()) { setError('Please enter your name.'); return; }
    if (!email.trim() || !password) { setError('Email and password are required.'); return; }
    setSending(true);
    try {
      if (mode === 'signin') {
        const res = await signInSupabase(email, password);
        if (!res.ok) setError(res.error ?? 'Could not sign in.');
      } else {
        const res = await signUpSupabase(name, email, password);
        if (!res.ok) { setError(res.error ?? 'Could not create account.'); return; }
        if (res.needsConfirm) {
          setNotice('Account created. Check your email to confirm, then sign in.');
          setMode('signin');
        }
        // If confirmation is off, the session is live and the app loads automatically
        // (a new account waits on the "approval" screen until an admin approves it).
      }
    } catch {
      setError('Could not reach the authentication service.');
    } finally {
      setSending(false);
    }
  };

  const handleReset = async () => {
    // Supabase: send a real password-reset email
    if (isSupabaseConfigured) {
      if (!email.trim()) { setError('Enter your account email.'); return; }
      setSending(true);
      const res = await sendResetEmail(email);
      setSending(false);
      if (!res.ok) { setError(res.error ?? 'Could not send reset email.'); return; }
      setNotice(`We sent a password-reset link to ${email.trim()}. Check your inbox.`);
      return;
    }
    if (resetStep === 'request') {
      // 1) generate a code locally, 2) email it via the API
      const gen = requestResetCode(email);
      if (!gen.ok) { setError(gen.error ?? 'Could not start reset.'); return; }
      setSending(true);
      try {
        const res = await fetch('/api/send-reset-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), code: gen.code, name: gen.name }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) { setError(data.error || 'Could not send the email.'); setSending(false); return; }
        setNotice(`We sent a 6-digit code to ${email.trim()}. Enter it below.`);
        setResetStep('verify');
      } catch {
        setError('Could not reach the email service.');
      } finally {
        setSending(false);
      }
      return;
    }
    // verify step
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    const res = confirmReset(email, code, password);
    if (!res.ok) { setError(res.error ?? 'Could not reset password.'); return; }
    setNotice('Password reset. You can sign in now.');
    setMode('signin'); setResetStep('request');
    setPassword(''); setConfirm(''); setCode('');
  };

  const switchMode = (m: 'signin' | 'signup' | 'reset') => {
    setMode(m); setResetStep('request'); setError(''); setNotice('');
    setPassword(''); setConfirm(''); setCode('');
  };

  return (
    <Shell workspaceName={workspace.name}>
      {/* Tabs (hidden in reset mode) */}
      {mode !== 'reset' && (
        <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--color-bg-active)', borderRadius: 9, marginBottom: 22 }}>
          {(['signin', 'signup'] as const).map((m) => (
            <button key={m} onClick={() => switchMode(m)}
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
      )}

      {mode === 'reset' && (
        <div style={{ marginBottom: 18 }}>
          <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>Reset password</h2>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
            {resetStep === 'request'
              ? 'Enter your account email and we’ll send you a 6-digit code.'
              : 'Enter the code from your email and choose a new password.'}
          </p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {mode === 'signup' && (
          <Field icon={<IconUser size={15} />} placeholder="Full name" value={name} onChange={setName} onEnter={submit} />
        )}

        {/* Email: shown for signin/signup, and reset-request step */}
        {(mode !== 'reset' || resetStep === 'request') && (
          <Field icon={<IconMail size={15} />} placeholder="Email" value={email} onChange={setEmail} onEnter={submit} type="email" />
        )}

        {/* Password for signin/signup */}
        {mode !== 'reset' && (
          <Field icon={<IconLock size={15} />} placeholder="Password" value={password} onChange={setPassword} onEnter={submit} type="password" />
        )}

        {/* Reset verify step: code + new password + confirm */}
        {mode === 'reset' && resetStep === 'verify' && (
          <>
            <Field icon={<IconShieldCheck size={15} />} placeholder="6-digit code" value={code} onChange={setCode} onEnter={submit} />
            <Field icon={<IconLock size={15} />} placeholder="New password" value={password} onChange={setPassword} onEnter={submit} type="password" />
            <Field icon={<IconLock size={15} />} placeholder="Confirm new password" value={confirm} onChange={setConfirm} onEnter={submit} type="password" />
          </>
        )}

        {error && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-red)', padding: '2px 2px' }}>{error}</div>}
        {notice && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-green)', padding: '2px 2px' }}>{notice}</div>}

        <button onClick={submit} disabled={sending} style={{
          marginTop: 4, padding: '11px 0', borderRadius: 9, border: 'none',
          background: 'var(--gradient-accent)', color: '#fff', fontSize: 'var(--text-sm)', fontWeight: 700,
          cursor: sending ? 'default' : 'pointer', opacity: sending ? 0.7 : 1, boxShadow: '0 4px 20px rgba(0,210,255,0.25)',
        }}>
          {mode === 'signin' ? 'Sign in'
            : mode === 'signup' ? 'Create account'
            : resetStep === 'request' ? (sending ? 'Sending…' : 'Send code')
            : 'Reset password'}
        </button>

        {mode === 'reset' && resetStep === 'verify' && (
          <button onClick={() => { setResetStep('request'); setError(''); setNotice(''); }} style={linkBtn}>Use a different email / resend</button>
        )}

        {/* Forgot / back links */}
        {mode === 'signin' && (
          <button onClick={() => switchMode('reset')} style={linkBtn}>Forgot password?</button>
        )}
        {mode === 'reset' && (
          <button onClick={() => switchMode('signin')} style={linkBtn}>← Back to sign in</button>
        )}
      </div>

      {mode === 'signup' && (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
          New accounts need admin approval before they can enter.
        </p>
      )}

      {mode === 'signin' && !isSupabaseConfigured && (
        <div style={{ marginTop: 18, padding: '10px 12px', borderRadius: 8, background: 'var(--color-bg-active)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--color-text-secondary)', fontWeight: 600, marginBottom: 3 }}>
            <IconShieldCheck size={12} /> Demo admin login
          </div>
          gbodulica@appercept.net · password <b style={{ color: 'var(--color-text-secondary)' }}>appercept</b>
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

const linkBtn: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
  color: 'var(--color-accent-bright)', fontSize: 'var(--text-xs)', fontWeight: 600,
  textAlign: 'center', alignSelf: 'center',
};
