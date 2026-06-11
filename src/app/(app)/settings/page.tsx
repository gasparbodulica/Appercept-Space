'use client';

import { useState, useRef, useCallback, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppStore, useCurrentAccount } from '@/lib/store';
import { Topbar } from '@/components/layout/Topbar';
import { User } from '@/lib/types';
import {
  IconUser, IconBuilding, IconUsers, IconShield, IconUpload,
  IconTrash, IconPlus, IconCheck, IconX, IconPencil, IconKey, IconClock,
} from '@tabler/icons-react';

type Tab = 'profile' | 'general' | 'members' | 'roles' | 'access';

const AVATAR_COLORS = [
  '#4f6fff', '#3ecf8e', '#a78bfa', '#2dd4bf',
  '#f472b6', '#fb923c', '#f5c518', '#60a5fa',
  '#ff5c5c', '#6b7280',
];

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
  client: 'Client',
};

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--color-bg-base)', color: 'var(--color-text-secondary)' }}>
        Loading Settings...
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>('profile');
  const account = useCurrentAccount();
  const isAdmin = account?.role === 'admin';

  useEffect(() => {
    const t = searchParams.get('tab') as Tab;
    if (t && ['profile', 'general', 'members', 'roles', 'access'].includes(t)) {
      setTab(t);
    }
  }, [searchParams]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Topbar breadcrumb={['Settings']} />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left settings nav */}
        <nav style={{
          width: 220, minWidth: 220, borderRight: '0.5px solid var(--color-border-subtle)',
          padding: '20px 8px', overflowY: 'auto', flexShrink: 0,
          background: 'var(--color-bg-surface)',
        }}>
          <SettingsSection label="My Account">
            <SettingsNavItem icon={<IconUser size={14} />} label="Profile" active={tab === 'profile'} onClick={() => setTab('profile')} />
          </SettingsSection>
          <SettingsSection label="Workspace">
            <SettingsNavItem icon={<IconBuilding size={14} />} label="General" active={tab === 'general'} onClick={() => setTab('general')} />
            <SettingsNavItem icon={<IconUsers size={14} />} label="Members" active={tab === 'members'} onClick={() => setTab('members')} />
            <SettingsNavItem icon={<IconShield size={14} />} label="Roles" active={tab === 'roles'} onClick={() => setTab('roles')} />
          </SettingsSection>
          {isAdmin && (
            <SettingsSection label="Admin">
              <SettingsNavItem icon={<IconKey size={14} />} label="Access" active={tab === 'access'} onClick={() => setTab('access')} />
            </SettingsSection>
          )}
        </nav>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', background: 'var(--color-bg-base)', padding: '40px 56px' }}>
          <div style={{ maxWidth: 640 }}>
            {tab === 'profile' && <ProfileTab />}
            {tab === 'general' && <GeneralTab />}
            {tab === 'members' && <MembersTab />}
            {tab === 'roles' && <RolesTab />}
            {tab === 'access' && (isAdmin ? <AccessTab /> : <RolesTab />)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────

function ProfileTab() {
  const { users, currentUserId, updateUser } = useAppStore();
  const me = users.find((u) => u.id === currentUserId) ?? users[0];
  const [name, setName] = useState(me.name);
  const [email, setEmail] = useState(me.email);
  const [color, setColor] = useState(me.color);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateUser(me.id, { avatar_url: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const initials = name.trim().split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
    updateUser(me.id, { name: name.trim(), email: email.trim(), color, initials });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <PageHeader title="My Profile" subtitle="Manage your personal information and avatar." />

      {/* Avatar section */}
      <SettingsCard>
        <CardLabel>Profile photo</CardLabel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ position: 'relative' }}>
            {me.avatar_url ? (
              <img src={me.avatar_url} alt={me.initials} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-border-default)' }} />
            ) : (
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 24 }}>
                {me.initials}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
            <button onClick={() => fileRef.current?.click()} style={secondaryBtnStyle}>
              <IconUpload size={13} /> Upload photo
            </button>
            {me.avatar_url && (
              <button onClick={() => updateUser(me.id, { avatar_url: undefined })} style={{ ...secondaryBtnStyle, color: 'var(--color-red)' }}>
                <IconTrash size={13} /> Remove photo
              </button>
            )}
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: 0 }}>JPG, PNG or GIF · max 2 MB</p>
          </div>
        </div>

        {!me.avatar_url && (
          <>
            <Divider />
            <CardLabel>Avatar colour</CardLabel>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: 28, height: 28, borderRadius: '50%', background: c, border: 'none',
                    cursor: 'pointer', outline: color === c ? `2px solid ${c}` : '2px solid transparent',
                    outlineOffset: 2, transition: 'outline 100ms',
                  }}
                />
              ))}
            </div>
          </>
        )}
      </SettingsCard>

      {/* Name & email */}
      <SettingsCard>
        <CardLabel>Full name</CardLabel>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
          placeholder="Your name"
        />
        <Divider />
        <CardLabel>Email</CardLabel>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
          placeholder="you@example.com"
          type="email"
        />
        <Divider />
        <CardLabel>Role</CardLabel>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', padding: '4px 0' }}>
          <RoleBadge role={me.role} />
        </div>
      </SettingsCard>

      <button onClick={handleSave} style={primaryBtnStyle}>
        {saved ? <><IconCheck size={14} /> Saved</> : 'Save changes'}
      </button>

      <div style={{ height: 28 }} />
      <ChangePasswordCard />
    </div>
  );
}

function ChangePasswordCard() {
  const changePassword = useAppStore((s) => s.changePassword);
  const account = useCurrentAccount();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  if (!account) return null;

  const submit = () => {
    setError(''); setDone(false);
    if (next !== confirm) { setError('New passwords do not match.'); return; }
    const res = changePassword(current, next);
    if (!res.ok) { setError(res.error ?? 'Could not change password.'); return; }
    setCurrent(''); setNext(''); setConfirm('');
    setDone(true);
    setTimeout(() => setDone(false), 2500);
  };

  return (
    <div>
      <PageHeader title="Password" subtitle="Change the password you use to sign in." />
      <SettingsCard>
        <CardLabel>Current password</CardLabel>
        <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} style={inputStyle} placeholder="••••••••" />
        <Divider />
        <CardLabel>New password</CardLabel>
        <input type="password" value={next} onChange={(e) => setNext(e.target.value)} style={inputStyle} placeholder="At least 6 characters" />
        <Divider />
        <CardLabel>Confirm new password</CardLabel>
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') submit(); }} style={inputStyle} placeholder="Repeat new password" />
        {error && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-red)', margin: '10px 0 0' }}>{error}</p>}
      </SettingsCard>
      <button onClick={submit} style={primaryBtnStyle}>
        {done ? <><IconCheck size={14} /> Password updated</> : 'Update password'}
      </button>
    </div>
  );
}

// ─── General Tab ──────────────────────────────────────────────────────────────

function GeneralTab() {
  const { workspace, updateWorkspace } = useAppStore();
  const [name, setName] = useState(workspace.name);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [logoError, setLogoError] = useState('');
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError('');
    if (!file.type.startsWith('image/')) { setLogoError('Please choose an image file.'); return; }
    if (file.size > 2 * 1024 * 1024) { setLogoError('Image is too large — max 2 MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      updateWorkspace({ logo_url: url });
      localStorage.setItem('appercept-logo', url);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    updateWorkspace({ name: name.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <PageHeader title="Workspace Settings" subtitle="Manage your workspace name and branding." />

      <SettingsCard>
        <CardLabel>Workspace logo</CardLabel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {workspace.logo_url ? (
            <img src={workspace.logo_url} alt="logo" style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', border: '2px solid var(--color-border-default)' }} />
          ) : (
            <div style={{ width: 64, height: 64, borderRadius: 12, background: 'var(--gradient-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 28 }}>
              {workspace.name.charAt(0)}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
            <button onClick={() => fileRef.current?.click()} style={secondaryBtnStyle}>
              <IconUpload size={13} /> Upload logo
            </button>
            {workspace.logo_url && (
              <button onClick={() => { updateWorkspace({ logo_url: undefined }); localStorage.removeItem('appercept-logo'); }} style={{ ...secondaryBtnStyle, color: 'var(--color-red)' }}>
                <IconTrash size={13} /> Remove logo
              </button>
            )}
            {logoError
              ? <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-red)', margin: 0 }}>{logoError}</p>
              : <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: 0 }}>PNG, JPG or SVG · max 2 MB · shown in the sidebar</p>}
          </div>
        </div>
        <Divider />
        <CardLabel>Workspace name</CardLabel>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
          placeholder="Workspace name"
        />
      </SettingsCard>

      <button onClick={handleSave} style={primaryBtnStyle}>
        {saved ? <><IconCheck size={14} /> Saved</> : 'Save changes'}
      </button>
    </div>
  );
}

// ─── Members Tab ──────────────────────────────────────────────────────────────

function MembersTab() {
  const { users, currentUserId, addMember, removeMember, updateUser, addPendingInvite, pendingInvites, removePendingInvite } = useAppStore();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'viewer'>('member');

  const handleInvite = () => {
    if (!inviteName.trim() || !inviteEmail.trim()) return;
    const initials = inviteName.trim().split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
    const colors = AVATAR_COLORS;
    addMember({
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      role: inviteRole,
      initials,
      color: colors[users.length % colors.length],
    });
    // Save as pending invite so the person is auto-approved on first login
    addPendingInvite({ email: inviteEmail.trim(), name: inviteName.trim(), role: inviteRole });
    setInviteName('');
    setInviteEmail('');
    setInviteRole('member');
    setShowInvite(false);
  };

  return (
    <div>
      <PageHeader title="Members" subtitle={`${users.length} member${users.length !== 1 ? 's' : ''} in this workspace.`} />

      <SettingsCard>
        {users.map((user, i) => (
          <div key={user.id}>
            {i > 0 && <Divider />}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.initials} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: user.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                  {user.initials}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-primary)' }}>{user.name}</span>
                  {user.id === currentUserId && <span style={{ fontSize: 10, color: 'var(--color-text-muted)', background: 'var(--color-bg-active)', borderRadius: 4, padding: '1px 6px' }}>You</span>}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{user.email}</div>
              </div>
              <select
                value={user.role}
                onChange={(e) => updateUser(user.id, { role: e.target.value as User['role'] })}
                disabled={user.id === currentUserId && user.role === 'admin'}
                style={{
                  fontSize: 'var(--text-xs)', padding: '4px 8px', borderRadius: 6,
                  border: '0.5px solid var(--color-border-default)',
                  background: 'var(--color-bg-elevated)', color: 'var(--color-text-secondary)',
                  cursor: 'pointer', outline: 'none',
                }}
              >
                <option value="admin">Admin</option>
                <option value="member">Member</option>
                <option value="viewer">Viewer</option>
              </select>
              {user.id !== currentUserId && (
                <button
                  onClick={() => removeMember(user.id)}
                  style={{ padding: '4px 6px', borderRadius: 6, border: 'none', background: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-red)'; e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.background = 'none'; }}
                >
                  <IconTrash size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </SettingsCard>

      {/* Pending invites — waiting for signup */}
      {pendingInvites.length > 0 && (
        <SettingsCard>
          <CardLabel>Pending invites</CardLabel>
          {pendingInvites.map((inv, i) => (
            <div key={inv.email}>
              {i > 0 && <Divider />}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-bg-active)', border: '1.5px dashed var(--color-border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                  {inv.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-primary)' }}>{inv.name}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{inv.email} · waiting for sign-up</div>
                </div>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'var(--color-bg-active)', color: 'var(--color-text-muted)' }}>{inv.role}</span>
                <button
                  onClick={() => removePendingInvite(inv.email)}
                  style={{ padding: '4px 6px', borderRadius: 6, border: 'none', background: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-red)'; e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.background = 'none'; }}
                  title="Cancel invite"
                >
                  <IconX size={14} />
                </button>
              </div>
            </div>
          ))}
        </SettingsCard>
      )}

      {/* Invite form */}
      {showInvite ? (
        <SettingsCard>
          <CardLabel>Invite a member</CardLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input value={inviteName} onChange={(e) => setInviteName(e.target.value)} style={inputStyle} placeholder="Full name" />
            <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} style={inputStyle} placeholder="Email address" type="email" />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as 'member' | 'viewer')}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
            </select>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleInvite} style={primaryBtnStyle}>Add member</button>
              <button onClick={() => setShowInvite(false)} style={secondaryBtnStyle}><IconX size={13} /> Cancel</button>
            </div>
          </div>
        </SettingsCard>
      ) : (
        <button onClick={() => setShowInvite(true)} style={{ ...secondaryBtnStyle, marginTop: 12 }}>
          <IconPlus size={14} /> Add member
        </button>
      )}
    </div>
  );
}

// ─── Roles Tab ────────────────────────────────────────────────────────────────

function RolesTab() {
  const roles = [
    {
      role: 'admin',
      label: 'Admin',
      color: '#4f6fff',
      description: 'Full access to everything. Can invite and remove members, change workspace settings, and manage all content.',
      permissions: ['View all pages', 'Edit all content', 'Manage members', 'Change workspace settings', 'Invite new members', 'Delete content'],
    },
    {
      role: 'member',
      label: 'Member',
      color: '#3ecf8e',
      description: 'Can view and edit all workspace content, but cannot manage members or workspace settings.',
      permissions: ['View all pages', 'Edit all content', 'Add rows and pages', 'Comment on items'],
    },
    {
      role: 'viewer',
      label: 'Viewer',
      color: '#6b7280',
      description: 'Read-only access. Can view content but cannot make any changes.',
      permissions: ['View all pages', 'Read all content'],
    },
  ];

  return (
    <div>
      <PageHeader title="Roles & Permissions" subtitle="Roles define what members can do in this workspace." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {roles.map((r) => (
          <SettingsCard key={r.role}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <RoleBadge role={r.role as User['role']} />
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: '0 0 12px' }}>{r.description}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {r.permissions.map((p) => (
                <span key={p} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', background: 'var(--color-bg-active)', padding: '3px 8px', borderRadius: 9999 }}>
                  <IconCheck size={11} style={{ color: r.color }} /> {p}
                </span>
              ))}
            </div>
          </SettingsCard>
        ))}
      </div>
    </div>
  );
}

// ─── Access Tab (admin) ───────────────────────────────────────────────────────

function AccessTab() {
  const { accounts, databases, pages, approveAccount, approveAsClient, revokeAccount, deleteAccount, createAccount } = useAppStore();
  const me = useCurrentAccount();
  const pending = accounts.filter((a) => !a.approved);
  const teamAccounts = accounts.filter((a) => a.approved && a.role !== 'client');
  const clientAccounts = accounts.filter((a) => a.approved && a.role === 'client');

  // Company list for client picker
  const companiesDb = Object.values(databases).find((db) => pages.some((p) => p.id === db.page_id && p.slug === 'companies'));
  const nameCol = companiesDb?.columns.find((c) => c.position === 0);
  const companies = companiesDb && nameCol
    ? companiesDb.rows.map((r) => String(r.cells[nameCol.id] ?? '')).filter((n) => n && n.toLowerCase() !== 'appercept')
    : [];

  const [clientPickerFor, setClientPickerFor] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState('');

  // Direct create form
  const [showCreate, setShowCreate] = useState(false);
  const [createType, setCreateType] = useState<'member' | 'client'>('member');
  const [cName, setCName] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cPass, setCPass] = useState('');
  const [cCompany, setCCompany] = useState('');
  const [cError, setCError] = useState('');
  const [cDone, setCDone] = useState('');

  const submitCreate = () => {
    setCError(''); setCDone('');
    const res = createAccount(cName, cEmail, cPass, createType === 'client' ? 'client' : 'member', createType === 'client' ? cCompany : undefined);
    if (!res.ok) { setCError(res.error ?? 'Error'); return; }
    setCDone(`Account for ${cName} created and approved.`);
    setCName(''); setCEmail(''); setCPass(''); setCCompany('');
    setTimeout(() => { setShowCreate(false); setCDone(''); }, 2200);
  };

  return (
    <div>
      <PageHeader title="Access control" subtitle="Manage who can enter this workspace. Approve sign-up requests or create accounts directly." />

      {/* ── Pending requests ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <CardLabel style={{ marginBottom: 0 }}>
            Pending sign-up requests
            {pending.length > 0 && (
              <span style={{ marginLeft: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 20, height: 20, borderRadius: 10, background: 'var(--color-red)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '0 5px' }}>{pending.length}</span>
            )}
          </CardLabel>
        </div>

        <SettingsCard>
          {pending.length === 0 ? (
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', padding: '6px 0' }}>No pending requests. New sign-ups will appear here.</div>
          ) : pending.map((a, i) => (
            <div key={a.id}>
              {i > 0 && <Divider />}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar account={a} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>{a.name}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{a.email} · signed up {new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  </div>
                  <button onClick={() => deleteAccount(a.id)} title="Reject & delete" style={iconDangerBtn}><IconTrash size={14} /></button>
                </div>
                {/* Action row */}
                <div style={{ display: 'flex', gap: 8, paddingLeft: 46, flexWrap: 'wrap' }}>
                  <button onClick={() => approveAccount(a.id)} style={{ ...approveBtn, gap: 5 }}>
                    <IconCheck size={13} /> Approve as team member
                  </button>
                  <button
                    onClick={() => { setClientPickerFor(p => p === a.id ? null : a.id); setSelectedCompany(''); }}
                    style={{ ...ghostSmallBtn, color: '#fb923c', borderColor: '#fb923c55', gap: 5 }}
                  >
                    <IconPlus size={12} /> Approve as client
                  </button>
                </div>
                {/* Client company picker */}
                {clientPickerFor === a.id && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 46, flexWrap: 'wrap', padding: '10px 12px', marginLeft: 46, background: 'rgba(251,146,60,0.07)', borderRadius: 8, border: '0.5px solid rgba(251,146,60,0.25)' }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: '#fb923c', fontWeight: 600 }}>Assign to which client portal?</span>
                    <select
                      value={selectedCompany}
                      onChange={(e) => setSelectedCompany(e.target.value)}
                      style={{ flex: 1, minWidth: 160, padding: '6px 10px', borderRadius: 7, border: '0.5px solid rgba(251,146,60,0.4)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', outline: 'none' }}
                    >
                      <option value="">— select company —</option>
                      {companies.map((co) => <option key={co} value={co}>{co}</option>)}
                    </select>
                    <button
                      disabled={!selectedCompany}
                      onClick={() => { if (selectedCompany) { approveAsClient(a.id, selectedCompany); setClientPickerFor(null); setSelectedCompany(''); } }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 7, border: 'none', background: selectedCompany ? '#fb923c' : 'var(--color-bg-active)', color: selectedCompany ? '#fff' : 'var(--color-text-muted)', fontSize: 'var(--text-xs)', fontWeight: 600, cursor: selectedCompany ? 'pointer' : 'default' }}
                    ><IconCheck size={13} /> Confirm</button>
                    <button onClick={() => setClientPickerFor(null)} style={ghostSmallBtn}>Cancel</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </SettingsCard>
      </div>

      {/* ── Create account directly ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <CardLabel style={{ marginBottom: 0 }}>Create account directly</CardLabel>
          {!showCreate && (
            <button onClick={() => setShowCreate(true)} style={{ ...ghostSmallBtn, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <IconPlus size={13} /> New account
            </button>
          )}
        </div>

        {!showCreate ? (
          <div style={{ padding: '14px 16px', borderRadius: 10, border: '0.5px dashed var(--color-border-default)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', textAlign: 'center' }}>
            Skip the sign-up flow — create a member or client account and share credentials directly.
            <span onClick={() => setShowCreate(true)} style={{ color: 'var(--color-accent-bright)', cursor: 'pointer', marginLeft: 6, fontWeight: 600 }}>Create account →</span>
          </div>
        ) : (
          <SettingsCard>
            {/* Type selector */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {(['member', 'client'] as const).map((t) => (
                <button key={t} onClick={() => setCreateType(t)} style={{
                  flex: 1, padding: '8px 0', borderRadius: 7, border: `1px solid ${createType === t ? (t === 'client' ? '#fb923c' : 'var(--color-accent)') : 'var(--color-border-default)'}`,
                  background: createType === t ? (t === 'client' ? 'rgba(251,146,60,0.12)' : 'rgba(0,210,255,0.10)') : 'transparent',
                  color: createType === t ? (t === 'client' ? '#fb923c' : 'var(--color-accent-bright)') : 'var(--color-text-secondary)',
                  fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer',
                }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    {t === 'member' ? <IconUsers size={15} /> : <IconBuilding size={15} />}
                    {t === 'member' ? 'Team member' : 'Client account'}
                  </span>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input value={cName} onChange={(e) => setCName(e.target.value)} placeholder="Full name" style={inputStyle} />
              <input value={cEmail} onChange={(e) => setCEmail(e.target.value)} placeholder="Email address" type="email" style={inputStyle} />
              <input value={cPass} onChange={(e) => setCPass(e.target.value)} placeholder="Initial password" type="password" style={inputStyle} />
              {createType === 'client' && (
                <select value={cCompany} onChange={(e) => setCCompany(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">— assign to client company —</option>
                  {companies.map((co) => <option key={co} value={co}>{co}</option>)}
                </select>
              )}
              {cError && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-red)' }}>{cError}</div>}
              {cDone && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-green)' }}>{cDone}</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button onClick={submitCreate} style={approveBtn}>
                  <IconCheck size={13} /> Create &amp; approve
                </button>
                <button onClick={() => { setShowCreate(false); setCError(''); setCName(''); setCEmail(''); setCPass(''); setCCompany(''); }} style={ghostSmallBtn}>Cancel</button>
              </div>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                Account is created pre-approved. Share the email and password with them directly.
              </div>
            </div>
          </SettingsCard>
        )}
      </div>

      {/* ── Team accounts ── */}
      <div style={{ marginBottom: 24 }}>
        <CardLabel>Team accounts ({teamAccounts.length})</CardLabel>
        <SettingsCard>
          {teamAccounts.map((a, i) => (
            <div key={a.id}>
              {i > 0 && <Divider />}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar account={a} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-primary)' }}>{a.name}</span>
                    {a.id === me?.id && <span style={{ fontSize: 10, color: 'var(--color-text-muted)', background: 'var(--color-bg-active)', borderRadius: 4, padding: '1px 6px' }}>You</span>}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{a.email}</div>
                </div>
                <RoleBadge role={a.role} />
                {a.role !== 'admin' && (
                  <>
                    <button onClick={() => revokeAccount(a.id)} title="Revoke access" style={ghostSmallBtn}>Revoke</button>
                    <button onClick={() => deleteAccount(a.id)} title="Delete" style={iconDangerBtn}><IconTrash size={14} /></button>
                  </>
                )}
              </div>
            </div>
          ))}
        </SettingsCard>
      </div>

      {/* ── Client accounts ── */}
      <div>
        <CardLabel>Client accounts ({clientAccounts.length})</CardLabel>
        <SettingsCard>
          {clientAccounts.length === 0 && (
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', padding: '6px 0' }}>No client accounts yet. Approve a pending request as a client, or create one directly above.</div>
          )}
          {clientAccounts.map((a, i) => (
            <div key={a.id}>
              {i > 0 && <Divider />}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar account={a} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-primary)' }}>{a.name}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{a.email}</div>
                  {a.client_company && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 4, padding: '2px 8px', borderRadius: 20, background: 'rgba(251,146,60,0.12)', color: '#fb923c', fontSize: 10, fontWeight: 600 }}>
                      <IconBuilding size={11} /> {a.client_company}
                    </div>
                  )}
                </div>
                <RoleBadge role={a.role} />
                <button onClick={() => revokeAccount(a.id)} title="Revoke access" style={ghostSmallBtn}>Revoke</button>
                <button onClick={() => deleteAccount(a.id)} title="Delete" style={iconDangerBtn}><IconTrash size={14} /></button>
              </div>
            </div>
          ))}
        </SettingsCard>
      </div>
    </div>
  );
}

function Avatar({ account }: { account: { avatar_url?: string; color: string; initials: string } }) {
  return account.avatar_url
    ? <img src={account.avatar_url} alt={account.initials} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
    : <div style={{ width: 34, height: 34, borderRadius: '50%', background: account.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{account.initials}</div>;
}

const approveBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 7, border: 'none',
  background: 'var(--gradient-accent)', color: '#fff', fontSize: 'var(--text-xs)', fontWeight: 600, cursor: 'pointer', flexShrink: 0,
};
const ghostSmallBtn: React.CSSProperties = {
  padding: '5px 11px', borderRadius: 7, border: '0.5px solid var(--color-border-default)', background: 'none',
  color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', fontWeight: 600, cursor: 'pointer', flexShrink: 0,
};
const iconDangerBtn: React.CSSProperties = {
  width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6,
  border: 'none', background: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', flexShrink: 0,
};

// ─── Shared UI helpers ────────────────────────────────────────────────────────

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 6px' }}>{title}</h1>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', margin: 0 }}>{subtitle}</p>
    </div>
  );
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--color-bg-elevated)',
      border: '0.5px solid var(--color-border-default)',
      borderRadius: 'var(--card-radius)',
      padding: '20px 24px',
      marginBottom: 16,
    }}>
      {children}
    </div>
  );
}

function CardLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6, ...style }}>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height: '0.5px', background: 'var(--color-border-subtle)', margin: '16px 0' }} />;
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = { admin: '#4f6fff', member: '#3ecf8e', viewer: '#6b7280', client: '#fb923c' };
  const c = colors[role] ?? '#6b7280';
  return (
    <span style={{
      fontSize: 'var(--text-xs)', fontWeight: 600, padding: '3px 10px', borderRadius: 9999,
      background: `${c}22`, color: c, border: `1px solid ${c}44`,
    }}>
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}

function SettingsSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 8px', marginBottom: 4 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function SettingsNavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
        borderRadius: 6, border: 'none', textAlign: 'left',
        background: active ? 'var(--color-bg-active)' : 'none',
        color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
        fontSize: 'var(--text-sm)', fontWeight: active ? 500 : 400, cursor: 'pointer',
        transition: 'all 100ms',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'none'; }}
    >
      <span style={{ color: active ? 'var(--color-accent)' : 'var(--color-text-muted)', display: 'flex' }}>{icon}</span>
      {label}
    </button>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 6,
  border: '0.5px solid var(--color-border-default)',
  background: 'var(--color-bg-base)', color: 'var(--color-text-primary)',
  fontSize: 'var(--text-sm)', outline: 'none', boxSizing: 'border-box',
};

const primaryBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '8px 18px', borderRadius: 6, border: 'none',
  background: 'var(--gradient-accent)', color: '#fff',
  fontSize: 'var(--text-sm)', fontWeight: 500, cursor: 'pointer',
};

const secondaryBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '6px 12px', borderRadius: 6,
  border: '0.5px solid var(--color-border-default)',
  background: 'none', color: 'var(--color-text-secondary)',
  fontSize: 'var(--text-sm)', cursor: 'pointer',
};
