'use client';

import { useState, useRef, useCallback, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Topbar } from '@/components/layout/Topbar';
import { User } from '@/lib/types';
import {
  IconUser, IconBuilding, IconUsers, IconShield, IconUpload,
  IconTrash, IconPlus, IconCheck, IconX, IconPencil,
} from '@tabler/icons-react';

type Tab = 'profile' | 'general' | 'members' | 'roles';

const AVATAR_COLORS = [
  '#4f6fff', '#3ecf8e', '#a78bfa', '#2dd4bf',
  '#f472b6', '#fb923c', '#f5c518', '#60a5fa',
  '#ff5c5c', '#6b7280',
];

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
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

  useEffect(() => {
    const t = searchParams.get('tab') as Tab;
    if (t && ['profile', 'general', 'members', 'roles'].includes(t)) {
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
        </nav>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', background: 'var(--color-bg-base)', padding: '40px 56px' }}>
          <div style={{ maxWidth: 640 }}>
            {tab === 'profile' && <ProfileTab />}
            {tab === 'general' && <GeneralTab />}
            {tab === 'members' && <MembersTab />}
            {tab === 'roles' && <RolesTab />}
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
    reader.onload = () => updateWorkspace({ logo_url: reader.result as string });
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
              <button onClick={() => updateWorkspace({ logo_url: undefined })} style={{ ...secondaryBtnStyle, color: 'var(--color-red)' }}>
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
  const { users, currentUserId, addMember, removeMember, updateUser } = useAppStore();
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

function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height: '0.5px', background: 'var(--color-border-subtle)', margin: '16px 0' }} />;
}

function RoleBadge({ role }: { role: User['role'] }) {
  const colors: Record<string, string> = { admin: '#4f6fff', member: '#3ecf8e', viewer: '#6b7280' };
  return (
    <span style={{
      fontSize: 'var(--text-xs)', fontWeight: 600, padding: '3px 10px', borderRadius: 9999,
      background: `${colors[role]}22`, color: colors[role], border: `1px solid ${colors[role]}44`,
    }}>
      {ROLE_LABELS[role]}
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
