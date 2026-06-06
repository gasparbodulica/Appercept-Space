'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { Topbar } from '@/components/layout/Topbar';
import { TeamRole, ProjectShare } from '@/lib/types';
import {
  IconPercentage, IconPlus, IconTrash, IconPencil, IconCheck, IconX,
  IconCurrencyEuro, IconUsers, IconHistory, IconCalculator, IconUserPlus,
  IconBuilding, IconChevronUp, IconChevronDown,
} from '@tabler/icons-react';

const ROLE_COLORS = ['#1c75bc','#2ee89a','#a78bfa','#fb923c','#f472b6','#2dd4bf','#f5c518','#60a5fa','#ff5c5c','#6b7280'];

function fmt(n: number) { return `€${Math.round(n).toLocaleString('de-DE')}`; }

// ── Share card — one per person ───────────────────────────────────────────────
function ShareCard({ role, onChange, onDelete }: {
  role: TeamRole;
  onChange: (updates: Partial<TeamRole>) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(role.name);
  const [title, setTitle] = useState(role.role_title);
  const [email, setEmail] = useState(role.email ?? '');
  const [share, setShare] = useState(role.default_share);

  const save = () => { onChange({ name, role_title: title, email: email.trim() || undefined, default_share: Math.max(0, Math.min(100, Number(share))) }); setEditing(false); };
  const initials = role.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  if (editing) {
    return (
      <div style={{ background: 'var(--color-bg-active)', border: `1.5px solid ${role.color}55`, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Name"
          style={{ padding: '7px 10px', borderRadius: 7, border: '0.5px solid var(--color-border-default)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', outline: 'none' }} />
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Role title"
          style={{ padding: '7px 10px', borderRadius: 7, border: '0.5px solid var(--color-border-default)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', outline: 'none' }} />
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email (optional)" type="email"
          style={{ padding: '7px 10px', borderRadius: 7, border: '0.5px solid var(--color-border-default)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', outline: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', flexShrink: 0 }}>Default %</label>
          <input type="range" min={0} max={80} value={share} onChange={e => setShare(Number(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontSize: 'var(--text-md)', fontWeight: 800, color: role.color, width: 40, textAlign: 'right' }}>{share}%</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={save} style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: 'none', background: 'var(--gradient-accent)', color: '#fff', fontWeight: 600, fontSize: 'var(--text-xs)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><IconCheck size={12} /> Save</button>
          <button onClick={() => setEditing(false)} style={{ padding: '7px 12px', borderRadius: 7, border: '0.5px solid var(--color-border-default)', background: 'none', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: `${role.color}0d`, border: `1px solid ${role.color}33`, borderRadius: 12, padding: '16px 16px 14px', position: 'relative', display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0, overflow: 'hidden' }}>
      {/* Action buttons top-right */}
      <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 2 }}>
        <button onClick={() => setEditing(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: role.color, opacity: 0.6, display: 'flex', padding: 3, borderRadius: 4 }} title="Edit"><IconPencil size={13} /></button>
        <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', padding: 3, borderRadius: 4 }} title="Remove"><IconTrash size={13} /></button>
      </div>
      {/* Avatar + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: role.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>{initials}</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{role.name}</div>
          <div style={{ fontSize: 10, color: role.is_external ? '#fb923c' : 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{role.role_title}{role.is_external ? ' · External' : ''}</div>
          {role.email && <div style={{ fontSize: 10, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{role.email}</div>}
        </div>
      </div>
      {/* Big % */}
      <div style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, color: role.color, lineHeight: 1, letterSpacing: '-1px' }}>{role.default_share}%</div>
      {/* Bar */}
      <div style={{ height: 5, background: `${role.color}22`, borderRadius: 9999, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${role.default_share}%`, background: role.color, borderRadius: 9999, transition: 'width 300ms' }} />
      </div>
    </div>
  );
}

// ── Company retention card ────────────────────────────────────────────────────
function CompanyCard({ pct, onChange }: { pct: number; onChange: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(pct);

  const save = () => { onChange(Math.max(0, Math.min(100, draft))); setEditing(false); };

  if (editing) {
    return (
      <div style={{ background: 'rgba(0,210,255,0.07)', border: '1.5px solid rgba(0,210,255,0.35)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Company retention</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input type="range" min={0} max={80} value={draft} onChange={e => setDraft(Number(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontSize: 'var(--text-md)', fontWeight: 800, color: 'var(--color-accent-bright)', width: 40, textAlign: 'right' }}>{draft}%</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={save} style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: 'none', background: 'var(--gradient-accent)', color: '#fff', fontWeight: 600, fontSize: 'var(--text-xs)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><IconCheck size={12} /> Save</button>
          <button onClick={() => setEditing(false)} style={{ padding: '7px 12px', borderRadius: 7, border: '0.5px solid var(--color-border-default)', background: 'none', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'rgba(0,210,255,0.07)', border: '1px solid rgba(0,210,255,0.25)', borderRadius: 12, padding: '16px 16px 14px', position: 'relative', display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 10, right: 10 }}>
        <button onClick={() => { setDraft(pct); setEditing(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-accent-bright)', opacity: 0.6, display: 'flex', padding: 3, borderRadius: 4 }} title="Edit"><IconPencil size={13} /></button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--gradient-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}><IconBuilding size={18} /></div>
        <div>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)' }}>Appercept</div>
          <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Company retention</div>
        </div>
      </div>
      <div style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, color: 'var(--color-accent-bright)', lineHeight: 1, letterSpacing: '-1px' }}>{pct}%</div>
      <div style={{ height: 5, background: 'rgba(0,210,255,0.15)', borderRadius: 9999, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--gradient-accent)', borderRadius: 9999, transition: 'width 300ms' }} />
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function RevenueSplitPage() {
  const { teamRoles, projectShares, companyRetentionPct, databases, pages, users, accounts,
    addTeamRole, updateTeamRole, deleteTeamRole, setCompanyRetentionPct,
    addProjectShare, deleteProjectShare } = useAppStore();

  // Existing workspace members not yet in the revenue split (by name/email match)
  const availableMembers = useMemo(() => {
    const taken = new Set(teamRoles.flatMap(r => [r.name.toLowerCase(), (r.email ?? '').toLowerCase()].filter(Boolean)));
    const seen = new Set<string>();
    const list: { name: string; email: string; role: string; color: string; initials: string; user_id?: string }[] = [];
    // Workspace users first
    for (const u of users) {
      const key = u.email.toLowerCase();
      if (taken.has(u.name.toLowerCase()) || taken.has(key) || seen.has(key)) continue;
      seen.add(key);
      list.push({ name: u.name, email: u.email, role: u.role === 'admin' ? 'Admin' : 'Member', color: u.color, initials: u.initials, user_id: u.id });
    }
    // Approved non-client accounts that aren't already covered
    for (const a of accounts) {
      if (!a.approved || a.role === 'client') continue;
      const key = a.email.toLowerCase();
      if (taken.has(a.name.toLowerCase()) || taken.has(key) || seen.has(key)) continue;
      seen.add(key);
      list.push({ name: a.name, email: a.email, role: a.role.charAt(0).toUpperCase() + a.role.slice(1), color: a.color, initials: a.initials });
    }
    return list;
  }, [teamRoles, users, accounts]);

  // Consulting DB for quick-fill
  const consultingDb = Object.values(databases).find(d => pages.some(p => p.id === d.page_id && p.slug === 'consulting'));
  const feeCol    = consultingDb?.columns.find(c => c.name === 'Fee');
  const nameCol   = consultingDb?.columns.find(c => c.position === 0);
  const clientCol = consultingDb?.columns.find(c => c.name === 'Client name');
  const consultingJobs = useMemo(() => (consultingDb?.rows ?? []).map(r => ({
    id: r.id,
    name: nameCol ? String(r.cells[nameCol.id] ?? '') : '',
    client: clientCol ? String(r.cells[clientCol.id] ?? '') : '',
    fee: feeCol ? Number(r.cells[feeCol.id] ?? 0) : 0,
  })), [consultingDb]);

  // Own companies
  const companiesDb = Object.values(databases).find(d => pages.some(p => p.id === d.page_id && p.slug === 'companies'));
  const companyNameCol = companiesDb?.columns.find(c => c.position === 0);
  const ownCompanies = useMemo(() =>
    (companiesDb && companyNameCol ? companiesDb.rows.map(r => String(r.cells[companyNameCol.id] ?? '')) : ['Appercept']).filter(Boolean),
    [companiesDb, companyNameCol]);

  const teamTotal = teamRoles.reduce((s, r) => s + r.default_share, 0);
  const grandTotal = teamTotal + companyRetentionPct;
  const splitOk = grandTotal === 100;

  // Calculator state
  const [calcLabel, setCalcLabel] = useState('');
  const [calcAmount, setCalcAmount] = useState('');
  const [calcBillingCompany, setCalcBillingCompany] = useState('');
  const [calcEntries, setCalcEntries] = useState<{ role_id: string; name: string; share: number; color: string }[]>([]);
  const [calcSaved, setCalcSaved] = useState(false);

  const initCalc = () => {
    setCalcEntries([
      ...teamRoles.map(r => ({ role_id: r.id, name: r.name, share: r.default_share, color: r.color })),
      { role_id: 'company', name: 'Appercept', share: companyRetentionPct, color: 'var(--color-accent-bright)' },
    ]);
    setCalcSaved(false);
  };

  const total = Number(calcAmount) || 0;
  const calcSum = calcEntries.reduce((s, e) => s + e.share, 0);
  const calcValid = total > 0 && calcLabel.trim() && calcSum === 100;

  const saveCalc = () => {
    if (!calcValid) return;
    const companyEntry = calcEntries.find(e => e.role_id === 'company');
    const teamEntries = calcEntries.filter(e => e.role_id !== 'company');
    addProjectShare({
      label: calcLabel.trim(),
      billing_company: calcBillingCompany || ownCompanies[0] || 'Appercept',
      total_amount: total,
      company_share: companyEntry?.share ?? companyRetentionPct,
      entries: teamEntries.map(e => ({ role_id: e.role_id, name: e.name, share: e.share, amount: Math.round(total * e.share / 100) })),
      company_amount: Math.round(total * (companyEntry?.share ?? companyRetentionPct) / 100),
    });
    setCalcSaved(true);
    setCalcLabel(''); setCalcAmount(''); setCalcBillingCompany('');
    setCalcEntries([]);
    setTimeout(() => setCalcSaved(false), 2500);
  };

  // Add external in calculator
  const [showAddExt, setShowAddExt] = useState(false);
  const [extName, setExtName] = useState('');
  const [extShare, setExtShare] = useState(10);
  const addExternal = () => {
    if (!extName.trim()) return;
    setCalcEntries(prev => [...prev, { role_id: `ext-${Date.now()}`, name: extName.trim(), share: extShare, color: '#fb923c' }]);
    setExtName(''); setExtShare(10); setShowAddExt(false);
  };

  // Add new team role
  const [showAddRole, setShowAddRole] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newShare, setNewShare] = useState(10);
  const [newExternal, setNewExternal] = useState(false);
  const [newColor, setNewColor] = useState(ROLE_COLORS[4]);
  const addRole = () => {
    if (!newName.trim()) return;
    addTeamRole({ name: newName.trim(), role_title: newTitle || 'Team member', email: newEmail.trim() || undefined, default_share: newShare, is_external: newExternal, color: newColor, user_id: undefined });
    setNewName(''); setNewTitle(''); setNewEmail(''); setNewShare(10); setNewExternal(false); setShowAddRole(false);
  };

  const addExistingMember = (m: { name: string; email: string; role: string; color: string; user_id?: string }) => {
    addTeamRole({ name: m.name, role_title: m.role, email: m.email || undefined, default_share: 10, is_external: false, color: m.color, user_id: m.user_id });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Topbar breadcrumb={['Team & Revenue']} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', background: 'var(--color-bg-base)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>

          <div>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 6 }}>Team &amp; Revenue Split</h1>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Your team, their roles and payout percentages — edit shares here and calculate distributions per job. External collaborators can be added too.</p>
          </div>

          {/* ── Default splits grid ── */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Default shares</h2>
                {/* Total indicator */}
                <span style={{
                  padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                  background: splitOk ? 'rgba(46,232,154,0.12)' : 'rgba(255,79,106,0.12)',
                  color: splitOk ? 'var(--color-green)' : 'var(--color-red)',
                  border: `1px solid ${splitOk ? 'rgba(46,232,154,0.3)' : 'rgba(255,79,106,0.3)'}`,
                }}>
                  {grandTotal}% {splitOk ? '✓' : `— needs ${100 - grandTotal > 0 ? `+${100 - grandTotal}` : 100 - grandTotal}% adjustment`}
                </span>
              </div>
              {!showAddRole && (
                <button onClick={() => setShowAddRole(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 13px', borderRadius: 7, border: '0.5px solid var(--color-border-default)', background: 'none', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', cursor: 'pointer', fontWeight: 600 }}>
                  <IconPlus size={13} /> Add member
                </button>
              )}
            </div>

            {/* Cards grid — fixed columns so cards never overflow */}
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(teamRoles.length + 1, 4)}, 1fr)`, gap: 14, minWidth: 0 }}>
              {teamRoles.map(r => (
                <ShareCard key={r.id} role={r} onChange={u => updateTeamRole(r.id, u)} onDelete={() => deleteTeamRole(r.id)} />
              ))}
              <CompanyCard pct={companyRetentionPct} onChange={setCompanyRetentionPct} />
            </div>

            {/* Add member form */}
            {showAddRole && (
              <div style={{ marginTop: 14, padding: 16, borderRadius: 12, background: 'var(--color-bg-elevated)', border: '0.5px solid var(--color-border-default)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Existing workspace members */}
                {availableMembers.length > 0 && (
                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Add an existing member</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {availableMembers.map(m => (
                        <button key={m.email || m.name} onClick={() => addExistingMember(m)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px 6px 6px', borderRadius: 20, border: '0.5px solid var(--color-border-default)', background: 'var(--color-bg-active)', cursor: 'pointer', transition: 'border-color 80ms' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = m.color; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border-default)'; }}
                          title={`Add ${m.name} at 10% (editable)`}>
                          <span style={{ width: 24, height: 24, borderRadius: '50%', background: m.color, color: '#fff', fontSize: 9, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{m.initials}</span>
                          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
                            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-primary)' }}>{m.name}</span>
                            <span style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>{m.role}</span>
                          </span>
                          <IconPlus size={13} style={{ color: m.color, flexShrink: 0 }} />
                        </button>
                      ))}
                    </div>
                    <div style={{ height: '0.5px', background: 'var(--color-border-subtle)', margin: '14px 0 4px' }} />
                  </div>
                )}
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>Or add someone new / external</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Full name"
                    style={{ padding: '7px 10px', borderRadius: 7, border: '0.5px solid var(--color-border-default)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', outline: 'none' }} />
                  <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Role title"
                    style={{ padding: '7px 10px', borderRadius: 7, border: '0.5px solid var(--color-border-default)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', outline: 'none' }} />
                </div>
                <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Email (optional)" type="email"
                  style={{ padding: '7px 10px', borderRadius: 7, border: '0.5px solid var(--color-border-default)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', outline: 'none' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', flexShrink: 0 }}>Share %</span>
                  <input type="range" min={0} max={60} value={newShare} onChange={e => setNewShare(Number(e.target.value))} style={{ flex: 1 }} />
                  <span style={{ fontWeight: 800, color: newColor, width: 36, textAlign: 'right', fontSize: 'var(--text-sm)' }}>{newShare}%</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Colour</span>
                  {ROLE_COLORS.map(c => (
                    <button key={c} onClick={() => setNewColor(c)} style={{ width: 18, height: 18, borderRadius: '50%', background: c, border: newColor === c ? '2.5px solid white' : '1.5px solid transparent', cursor: 'pointer', padding: 0, flexShrink: 0 }} />
                  ))}
                  <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginLeft: 8, cursor: 'pointer' }}>
                    <input type="checkbox" checked={newExternal} onChange={e => setNewExternal(e.target.checked)} /> External
                  </label>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={addRole} style={{ flex: 1, padding: '8px 0', borderRadius: 7, border: 'none', background: 'var(--gradient-accent)', color: '#fff', fontWeight: 700, fontSize: 'var(--text-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}><IconCheck size={14} /> Add</button>
                  <button onClick={() => setShowAddRole(false)} style={{ padding: '8px 14px', borderRadius: 7, border: '0.5px solid var(--color-border-default)', background: 'none', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            )}
          </section>

          {/* ── Payout Calculator ── */}
          <section>
            <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>Payout calculator</h2>
            <div style={{ background: 'var(--color-bg-elevated)', border: '0.5px solid var(--color-border-default)', borderRadius: 'var(--card-radius)', padding: '20px 22px', boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Left inputs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Billing company */}
                  {ownCompanies.length > 1 && (
                    <div>
                      <label style={labelStyle}>Invoiced by</label>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {ownCompanies.map(co => (
                          <button key={co} onClick={() => setCalcBillingCompany(co)} style={{
                            flex: 1, padding: '7px 8px', borderRadius: 7,
                            border: `1px solid ${(calcBillingCompany || ownCompanies[0]) === co ? 'var(--color-accent)' : 'var(--color-border-default)'}`,
                            background: (calcBillingCompany || ownCompanies[0]) === co ? 'rgba(0,210,255,0.1)' : 'transparent',
                            color: (calcBillingCompany || ownCompanies[0]) === co ? 'var(--color-accent-bright)' : 'var(--color-text-secondary)',
                            fontSize: 'var(--text-xs)', fontWeight: 600, cursor: 'pointer',
                          }}>
                            {co}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Job label */}
                  <div>
                    <label style={labelStyle}>Job / project</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input value={calcLabel} onChange={e => setCalcLabel(e.target.value)} placeholder="e.g. Medikal Lux — Voice Bot"
                        style={inputStyle} />
                      {consultingJobs.length > 0 && (
                        <select onChange={e => {
                          const job = consultingJobs.find(j => j.id === e.target.value);
                          if (job) { setCalcLabel(`${job.client} — ${job.name}`); setCalcAmount(String(job.fee)); initCalc(); }
                          e.target.value = '';
                        }} defaultValue="" style={{ ...inputStyle, width: 'auto', flex: 'none', fontSize: 'var(--text-xs)', cursor: 'pointer' }}>
                          <option value="">Fill from job…</option>
                          {consultingJobs.map(j => <option key={j.id} value={j.id}>{j.client} · €{j.fee}</option>)}
                        </select>
                      )}
                    </div>
                  </div>
                  {/* Amount */}
                  <div>
                    <label style={labelStyle}>Total fee (€)</label>
                    <input type="number" value={calcAmount} min={0}
                      onChange={e => { setCalcAmount(e.target.value); if (!calcEntries.length) initCalc(); }}
                      placeholder="0"
                      style={{ ...inputStyle, fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-accent-bright)' }} />
                  </div>
                  {!calcEntries.length && total > 0 && (
                    <button onClick={initCalc} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 7, border: '0.5px solid var(--color-border-default)', background: 'none', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', cursor: 'pointer' }}>
                      <IconCalculator size={13} /> Load default splits
                    </button>
                  )}
                </div>

                {/* Right: live breakdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {calcEntries.length > 0 && total > 0 ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <label style={labelStyle}>Distribution</label>
                        {calcSum !== 100 && <span style={{ fontSize: 10, color: 'var(--color-red)', fontWeight: 600 }}>Total: {calcSum}% (must be 100%)</span>}
                      </div>
                      {calcEntries.map((e, i) => (
                        <div key={e.role_id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: e.color === 'var(--color-accent-bright)' ? '#00d2ff' : e.color, flexShrink: 0 }} />
                          <span style={{ flex: 1, fontSize: 'var(--text-xs)', color: 'var(--color-text-primary)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</span>
                          <input type="number" min={0} max={100} value={e.share}
                            onChange={ev => setCalcEntries(prev => prev.map((x, j) => j === i ? { ...x, share: Number(ev.target.value) } : x))}
                            style={{ width: 46, padding: '3px 6px', borderRadius: 5, border: '0.5px solid var(--color-border-default)', background: 'var(--color-bg-input)', color: e.color === 'var(--color-accent-bright)' ? '#00d2ff' : e.color, fontWeight: 700, fontSize: 'var(--text-xs)', outline: 'none', textAlign: 'right' }} />
                          <span style={{ fontSize: 10, color: 'var(--color-text-muted)', width: 10 }}>%</span>
                          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-primary)', minWidth: 64, textAlign: 'right' }}>{fmt(total * e.share / 100)}</span>
                          {e.role_id.startsWith('ext-') && (
                            <button onClick={() => setCalcEntries(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', padding: 0 }}><IconX size={11} /></button>
                          )}
                        </div>
                      ))}
                      {/* Add external */}
                      {showAddExt ? (
                        <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginTop: 4 }}>
                          <input value={extName} onChange={e => setExtName(e.target.value)} placeholder="External name" style={{ flex: 1, padding: '5px 8px', borderRadius: 6, border: '0.5px solid #fb923c55', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)', fontSize: 'var(--text-xs)', outline: 'none' }} />
                          <input type="number" min={0} max={50} value={extShare} onChange={e => setExtShare(Number(e.target.value))} style={{ width: 44, padding: '5px 6px', borderRadius: 6, border: '0.5px solid #fb923c55', background: 'var(--color-bg-input)', color: '#fb923c', fontWeight: 700, fontSize: 'var(--text-xs)', outline: 'none', textAlign: 'right' }} />
                          <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>%</span>
                          <button onClick={addExternal} style={{ background: '#fb923c', border: 'none', borderRadius: 5, padding: '5px 8px', color: '#fff', fontSize: 10, cursor: 'pointer', fontWeight: 600 }}>Add</button>
                          <button onClick={() => setShowAddExt(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex' }}><IconX size={12} /></button>
                        </div>
                      ) : (
                        <button onClick={() => setShowAddExt(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4, padding: '5px 10px', borderRadius: 6, border: '0.5px dashed rgba(251,146,60,0.4)', background: 'none', color: '#fb923c', fontSize: 10, cursor: 'pointer' }}>
                          <IconUserPlus size={11} /> Add external
                        </button>
                      )}
                    </>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', textAlign: 'center', padding: 20 }}>
                      Enter an amount and load default splits to see the breakdown
                    </div>
                  )}
                </div>
              </div>

              {/* Save */}
              {calcEntries.length > 0 && total > 0 && (
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: '0.5px solid var(--color-border-subtle)' }}>
                  {calcSaved ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-green)', fontSize: 'var(--text-sm)', fontWeight: 600 }}><IconCheck size={16} /> Saved to history!</div>
                  ) : (
                    <button onClick={saveCalc} disabled={!calcValid} style={{
                      padding: '10px 24px', borderRadius: 9, border: 'none',
                      background: calcValid ? 'var(--gradient-accent)' : 'var(--color-bg-active)',
                      color: calcValid ? '#fff' : 'var(--color-text-muted)',
                      fontWeight: 700, fontSize: 'var(--text-sm)', cursor: calcValid ? 'pointer' : 'default',
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                    }}><IconPercentage size={15} /> Save payout record</button>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* ── Payout history ── */}
          {projectShares.length > 0 && (
            <section>
              <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>
                Payout history ({projectShares.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {projectShares.map(ps => (
                  <div key={ps.id} style={{ background: 'var(--color-bg-elevated)', border: '0.5px solid var(--color-border-default)', borderRadius: 12, padding: '16px 18px', boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)' }}>{ps.label}</span>
                          {ps.billing_company && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '1px 7px', borderRadius: 20, background: 'rgba(0,210,255,0.1)', color: 'var(--color-accent-bright)', fontSize: 9, fontWeight: 700 }}>
                              <IconBuilding size={9} /> {ps.billing_company}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>{new Date(ps.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-green)' }}>{fmt(ps.total_amount)}</div>
                        <button onClick={() => deleteProjectShare(ps.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', padding: 4, borderRadius: 5 }}><IconTrash size={14} /></button>
                      </div>
                    </div>
                    {/* Payout chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {ps.entries.map((e, i) => {
                        const role = teamRoles.find(r => r.id === e.role_id);
                        const color = role?.color ?? '#fb923c';
                        return (
                          <div key={i} style={{ padding: '8px 14px', borderRadius: 10, background: `${color}12`, border: `1px solid ${color}33`, textAlign: 'center', minWidth: 90 }}>
                            <div style={{ fontSize: 'var(--text-md)', fontWeight: 800, color }}>{fmt(e.amount)}</div>
                            <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 2 }}>{e.name.split(' ')[0]} · {e.share}%</div>
                          </div>
                        );
                      })}
                      <div style={{ padding: '8px 14px', borderRadius: 10, background: 'rgba(0,210,255,0.08)', border: '1px solid rgba(0,210,255,0.2)', textAlign: 'center', minWidth: 90 }}>
                        <div style={{ fontSize: 'var(--text-md)', fontWeight: 800, color: 'var(--color-accent-bright)' }}>{fmt(ps.company_amount)}</div>
                        <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}><IconBuilding size={9} /> {ps.company_share}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* All-time totals */}
              {(() => {
                const grandTotalAmt = projectShares.reduce((s, p) => s + p.total_amount, 0);
                const companyTotalAmt = projectShares.reduce((s, p) => s + p.company_amount, 0);
                const personTotals: Record<string, { name: string; amount: number; color: string }> = {};
                for (const ps of projectShares) {
                  for (const e of ps.entries) {
                    if (!personTotals[e.role_id]) { const r = teamRoles.find(r => r.id === e.role_id); personTotals[e.role_id] = { name: e.name, amount: 0, color: r?.color ?? '#fb923c' }; }
                    personTotals[e.role_id].amount += e.amount;
                  }
                }
                return (
                  <div style={{ marginTop: 16, padding: '16px 18px', borderRadius: 12, background: 'var(--color-bg-elevated)', border: '0.5px solid var(--color-border-default)' }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>All-time totals</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                      {Object.entries(personTotals).map(([id, { name, amount, color }]) => (
                        <div key={id} style={{ textAlign: 'center', padding: '10px 16px', borderRadius: 10, background: `${color}12`, border: `1px solid ${color}30`, minWidth: 100 }}>
                          <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color }}>{fmt(amount)}</div>
                          <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 2 }}>{name.split(' ')[0]}</div>
                        </div>
                      ))}
                      <div style={{ textAlign: 'center', padding: '10px 16px', borderRadius: 10, background: 'rgba(0,210,255,0.08)', border: '1px solid rgba(0,210,255,0.2)', minWidth: 100 }}>
                        <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--color-accent-bright)' }}>{fmt(companyTotalAmt)}</div>
                        <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 2 }}>Appercept</div>
                      </div>
                      <div style={{ textAlign: 'center', padding: '10px 16px', borderRadius: 10, background: 'rgba(46,232,154,0.08)', border: '1px solid rgba(46,232,154,0.2)', minWidth: 100 }}>
                        <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--color-green)' }}>{fmt(grandTotalAmt)}</div>
                        <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 2 }}>Grand total</div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </section>
          )}

        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 5, fontWeight: 600 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: 7, border: '0.5px solid var(--color-border-default)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', outline: 'none', boxSizing: 'border-box' };
