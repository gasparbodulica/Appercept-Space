'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useAppStore, useCurrentAccount } from '@/lib/store';
import { computeClientHealth } from '@/lib/health';
import { Topbar } from '@/components/layout/Topbar';
import { ClientPortalView, clientMatches, normalize } from '@/components/ClientPortalView';
import { findClientsDb } from '@/lib/finance';
import { IconArrowLeft, IconBuilding, IconBriefcase, IconPlus, IconX, IconCheck, IconUser, IconLock, IconMail, IconUserPlus, IconDots, IconTrash } from '@tabler/icons-react';

function clientStatusFor(clientsDb: ReturnType<typeof findClientsDb>, company: string) {
  if (!clientsDb) return 'Active';
  const compCol = clientsDb.columns.find((c) => c.name === 'Company');
  const statCol = clientsDb.columns.find((c) => c.name === 'Status');
  const row = clientsDb.rows.find((r) => compCol && clientMatches(String(r.cells[compCol.id] ?? ''), company));
  return statCol && row ? String(row.cells[statCol.id] ?? 'Active') : 'Active';
}

// ── Add-account modal shown when inside a client portal ──────────────────────
function AddAccountModal({ company, onClose }: { company: string; onClose: () => void }) {
  const { accounts, createAccount } = useAppStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => { nameRef.current?.focus(); }, []);

  // Existing client accounts for this company
  const existing = accounts.filter((a) => a.role === 'client' && a.client_company === company);

  const submit = () => {
    setError(''); setDone('');
    const res = createAccount(name, email, pass, 'client', company);
    if (!res.ok) { setError(res.error ?? 'Error'); return; }
    setDone(`Account for ${name} created. They can now sign in with these credentials.`);
    setName(''); setEmail(''); setPass('');
    setTimeout(() => { onClose(); }, 2500);
  };

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.6)' }} onClick={onClose} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        zIndex: 1000, width: 420, maxWidth: 'calc(100vw - 40px)',
        background: 'var(--color-bg-surface)', border: '0.5px solid var(--color-border-default)',
        borderRadius: 'var(--card-radius)', padding: '26px 24px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>Add portal login</h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 4 }}>
              Create a login for <b style={{ color: 'var(--color-text-primary)' }}>{company}</b> — they'll see only their portal.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex' }}><IconX size={16} /></button>
        </div>

        {/* Existing accounts for this company */}
        {existing.length > 0 && (
          <div style={{ marginBottom: 18, padding: '10px 12px', borderRadius: 8, background: 'var(--color-bg-active)', border: '0.5px solid var(--color-border-subtle)' }}>
            <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 8 }}>Existing logins for this company</div>
            {existing.map((a) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{a.initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-primary)', fontWeight: 500 }}>{a.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{a.email}</div>
                </div>
                <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: 'rgba(251,146,60,0.15)', color: '#fb923c', fontWeight: 600 }}>client</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Field ref={nameRef} icon={<IconUser size={14} />} placeholder="Full name" value={name} onChange={setName} onEnter={submit} />
          <Field icon={<IconMail size={14} />} placeholder="Email address" value={email} onChange={setEmail} onEnter={submit} type="email" />
          <Field icon={<IconLock size={14} />} placeholder="Password" value={pass} onChange={setPass} onEnter={submit} type="password" />

          {error && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-red)', padding: '2px 0' }}>{error}</div>}
          {done && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-green)', padding: '2px 0' }}>{done}</div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={submit} style={{
              flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '10px 0', borderRadius: 8, border: 'none',
              background: 'var(--gradient-accent)', color: '#fff', fontWeight: 700, fontSize: 'var(--text-sm)', cursor: 'pointer',
            }}><IconCheck size={14} /> Create login</button>
            <button onClick={onClose} style={{
              padding: '10px 16px', borderRadius: 8, border: '0.5px solid var(--color-border-default)',
              background: 'none', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', cursor: 'pointer',
            }}>Cancel</button>
          </div>
          <p style={{ fontSize: 10, color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5, textAlign: 'center' }}>
            Share these credentials with the client. They will see only the {company} portal when they sign in.
          </p>
        </div>
      </div>
    </>
  );
}

// ── Add-company modal — adds a new row to the Clients DB ──────────────────────
function AddCompanyModal({ onClose, onCreated }: { onClose: () => void; onCreated: (name: string) => void }) {
  const { databases, addRow, updateCell } = useAppStore();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Clients DB is the source of truth for portal companies
  const clientsDb = findClientsDb(databases);
  const companyCol = clientsDb?.columns.find((c) => c.name === 'Company');
  const statusCol  = clientsDb?.columns.find((c) => c.name === 'Status');

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) { setError('Company name is required.'); return; }
    if (!clientsDb || !companyCol) { setError('Clients database not found.'); return; }
    const exists = clientsDb.rows.some((r) => normalize(String(r.cells[companyCol.id] ?? '')) === normalize(trimmed));
    if (exists) { setError('A client with this company name already exists.'); return; }
    const row = addRow(clientsDb.id);
    updateCell(clientsDb.id, row.id, companyCol.id, trimmed);
    if (statusCol) updateCell(clientsDb.id, row.id, statusCol.id, 'Active');
    onCreated(trimmed);
    onClose();
  };

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.6)' }} onClick={onClose} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        zIndex: 1000, width: 380, maxWidth: 'calc(100vw - 40px)',
        background: 'var(--color-bg-surface)', border: '0.5px solid var(--color-border-default)',
        borderRadius: 'var(--card-radius)', padding: '24px 22px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>Add new client company</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex' }}><IconX size={16} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Field ref={inputRef} icon={<IconBuilding size={14} />} placeholder="Company name (e.g. Medikal Lux d.o.o.)" value={name} onChange={setName} onEnter={submit} />
          {error && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-red)' }}>{error}</div>}
          <p style={{ fontSize: 10, color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
            The company will appear immediately as a portal block. Add their contact details, revenue, and status in the Clients database.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={submit} style={{
              flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '10px 0', borderRadius: 8, border: 'none',
              background: 'var(--gradient-accent)', color: '#fff', fontWeight: 700, fontSize: 'var(--text-sm)', cursor: 'pointer',
            }}><IconCheck size={14} /> Add company</button>
            <button onClick={onClose} style={{
              padding: '10px 16px', borderRadius: 8, border: '0.5px solid var(--color-border-default)',
              background: 'none', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', cursor: 'pointer',
            }}>Cancel</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Input field helper ────────────────────────────────────────────────────────
const Field = ({ icon, placeholder, value, onChange, onEnter, type = 'text', ref: _ref }: {
  icon: React.ReactNode; placeholder: string; value: string;
  onChange: (v: string) => void; onEnter: () => void; type?: string;
  ref?: React.RefObject<HTMLInputElement | null>;
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '0 12px', borderRadius: 9, background: 'var(--color-bg-input)', border: '0.5px solid var(--color-border-default)' }}>
    <span style={{ color: 'var(--color-text-muted)', display: 'flex', flexShrink: 0 }}>{icon}</span>
    <input
      ref={_ref as React.RefObject<HTMLInputElement>}
      type={type} value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter') onEnter(); }}
      placeholder={placeholder}
      style={{ flex: 1, padding: '11px 0', background: 'none', border: 'none', outline: 'none', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-sans)' }}
    />
  </div>
);

// ── Main page ─────────────────────────────────────────────────────────────────
const PORTAL_COLORS = ['#1c75bc','#00d2ff','#3ecf8e','#a78bfa','#fb923c','#f472b6','#2dd4bf','#f5c518','#ff5c5c','#60a5fa'];

export default function ClientPortalPage() {
  const { databases, pages, portalMessages, portalReadAt, accounts, portalColors, setPortalColor, renameClientCompany, deleteClientCompany } = useAppStore();
  const healthFor = (company: string) => computeClientHealth(company, databases, pages, portalMessages);
  const account = useCurrentAccount();
  const isAdmin = account?.role === 'admin';
  const [editMenu, setEditMenu] = useState<string | null>(null); // company being edited
  const [renameVal, setRenameVal] = useState('');

  const dbBySlug = (slug: string) =>
    Object.values(databases).find((d) => pages.some((p) => p.id === d.page_id && p.slug === slug));

  const clientsDb = findClientsDb(databases);

  const clientCompanies = useMemo(() => {
    if (!clientsDb) return [];
    const compCol = clientsDb.columns.find((c) => c.name === 'Company');
    if (!compCol) return [];
    const seen = new Set<string>();
    const result: { id: string; name: string; industries: string[] }[] = [];
    for (const r of clientsDb.rows) {
      const name = String(r.cells[compCol.id] ?? '').trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({ id: r.id, name, industries: [] });
    }
    return result;
  }, [clientsDb, databases]);

  const unreadFor = (company: string) => {
    const lastRead = portalReadAt[company] ?? '1970-01-01T00:00:00Z';
    return portalMessages.filter((m) => m.client === company && m.from === 'client' && m.created_at > lastRead).length;
  };

  const loginsFor = (company: string) =>
    accounts.filter((a) => a.role === 'client' && a.client_company === company);

  const [selected, setSelected] = useState<string | null>(null);
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);

  if (selected) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <Topbar
          breadcrumb={['Client Portal', selected]}
          extra={
            <div style={{ display: 'flex', gap: 8 }}>
              {isAdmin && (
                <button
                  onClick={() => setShowAddAccount(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 7, border: '0.5px solid rgba(251,146,60,0.5)', background: 'rgba(251,146,60,0.1)', color: '#fb923c', fontSize: 'var(--text-xs)', fontWeight: 600, cursor: 'pointer' }}
                >
                  <IconUserPlus size={13} /> Add login
                </button>
              )}
              <button
                onClick={() => setSelected(null)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 7, border: '0.5px solid var(--color-border-default)', background: 'var(--color-bg-active)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', fontWeight: 600, cursor: 'pointer' }}
              >
                <IconArrowLeft size={13} /> All clients
              </button>
            </div>
          }
        />
        {/* Login accounts bar */}
        {(() => {
          const logins = loginsFor(selected);
          return (
            <div style={{ padding: '8px 28px', borderBottom: '0.5px solid var(--color-border-subtle)', background: 'var(--color-bg-surface)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Portal logins</span>
              {logins.length === 0 ? (
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>No accounts yet —</span>
              ) : logins.map((a) => (
                <div key={a.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px 3px 5px', borderRadius: 20, background: 'var(--color-bg-active)', border: '0.5px solid var(--color-border-subtle)' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 8, fontWeight: 700 }}>{a.initials}</div>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-primary)', fontWeight: 500 }}>{a.name}</span>
                  <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{a.email}</span>
                </div>
              ))}
              {isAdmin && (
                <button
                  onClick={() => setShowAddAccount(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, border: '0.5px dashed var(--color-border-default)', background: 'none', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', cursor: 'pointer', fontWeight: 500 }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#fb923c'; e.currentTarget.style.color = '#fb923c'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border-default)'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                >
                  <IconPlus size={11} /> Add login
                </button>
              )}
            </div>
          );
        })()}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
          <ClientPortalView company={selected} mode="agency" />
        </div>
        {showAddAccount && <AddAccountModal company={selected} onClose={() => setShowAddAccount(false)} />}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Topbar breadcrumb={['Client Portal']} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', background: 'var(--color-bg-base)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 6 }}>Client Portal</h1>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Click a client to open their private portal — progress, files, meetings and direct Q&A.</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowAddCompany(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '0.5px solid var(--color-border-default)', background: 'var(--color-bg-elevated)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer', flexShrink: 0, transition: 'border-color 100ms, color 100ms' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent-bright)'; e.currentTarget.style.color = 'var(--color-accent-bright)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border-default)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
            >
              <IconPlus size={14} /> Add company
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
          {clientCompanies.map((c) => {
            const status = clientStatusFor(clientsDb, c.name);
            const statusColor = status === 'Active' ? 'var(--color-green)' : status === 'Pending' ? 'var(--color-amber)' : 'var(--color-gray)';
            const initial = c.name.trim().charAt(0).toUpperCase();
            const unread = unreadFor(c.name);
            const health = healthFor(c.name);
            const R = 22, CIRC = 2 * Math.PI * R;
            const dash = (health.score / 100) * CIRC;
            const portalColor = portalColors[c.name];
            const tileBg = portalColor ? `linear-gradient(135deg, ${portalColor}, ${portalColor}cc)` : 'var(--gradient-accent)';
            return (
              <div
                key={c.id}
                onClick={() => setSelected(c.name)}
                style={{
                  position: 'relative',
                  background: 'var(--color-bg-elevated)',
                  border: '0.5px solid var(--color-border-default)',
                  borderRadius: 'var(--card-radius)',
                  padding: '22px 20px',
                  cursor: 'pointer',
                  transition: 'border-color 120ms, box-shadow 120ms, transform 120ms',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent-bright)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,210,255,0.18)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border-default)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.25)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {/* Edit menu (admin) */}
                {isAdmin && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setRenameVal(c.name); setEditMenu(editMenu === c.name ? null : c.name); }}
                    title="Edit portal"
                    style={{ position: 'absolute', top: 12, right: 12, width: 26, height: 26, borderRadius: 7, border: 'none', background: 'var(--color-bg-active)', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-text-primary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                  >
                    <IconDots size={15} />
                  </button>
                )}
                {editMenu === c.name && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={(e) => { e.stopPropagation(); setEditMenu(null); }} />
                    <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: 44, right: 12, width: 230, zIndex: 50, background: 'var(--color-bg-popover)', border: '0.5px solid var(--color-border-strong)', borderRadius: 10, boxShadow: '0 12px 40px rgba(0,0,0,0.55)', padding: 14 }}>
                      <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 6 }}>Portal name</div>
                      <input
                        value={renameVal}
                        onChange={(e) => setRenameVal(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { renameClientCompany(c.name, renameVal); setEditMenu(null); } }}
                        style={{ width: '100%', padding: '7px 9px', borderRadius: 7, border: '0.5px solid var(--color-border-default)', background: 'var(--color-bg-input)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', outline: 'none', boxSizing: 'border-box', marginBottom: 12 }}
                      />
                      <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 8 }}>Colour</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
                        {PORTAL_COLORS.map((col) => (
                          <button key={col} onClick={() => setPortalColor(c.name, col)}
                            style={{ width: 22, height: 22, borderRadius: '50%', background: col, border: portalColor === col ? '2.5px solid #fff' : '1.5px solid transparent', cursor: 'pointer', padding: 0, flexShrink: 0 }} />
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => { renameClientCompany(c.name, renameVal); setEditMenu(null); }}
                          style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: 'none', background: 'var(--gradient-accent)', color: '#fff', fontWeight: 600, fontSize: 'var(--text-xs)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <IconCheck size={12} /> Save
                        </button>
                        <button
                          onClick={() => { if (confirm(`Delete the portal for "${c.name}"? This removes its client records and messages. Login accounts stay (manage in Settings).`)) { deleteClientCompany(c.name); setEditMenu(null); } }}
                          title="Delete portal"
                          style={{ padding: '7px 11px', borderRadius: 7, border: '0.5px solid rgba(255,79,106,0.4)', background: 'none', color: 'var(--color-red)', fontSize: 'var(--text-xs)', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <IconTrash size={12} /> Delete
                        </button>
                      </div>
                    </div>
                  </>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  {/* Health score ring */}
                  <div style={{ position: 'relative', flexShrink: 0, width: 52, height: 52 }}>
                    <svg width={52} height={52} style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
                      <circle cx={26} cy={26} r={R} fill="none" stroke="var(--color-bg-active)" strokeWidth={3} />
                      <circle cx={26} cy={26} r={R} fill="none" stroke={health.color} strokeWidth={3}
                        strokeDasharray={`${dash} ${CIRC}`} strokeLinecap="round"
                        style={{ transition: 'stroke-dasharray 600ms ease' }} />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: tileBg, borderRadius: '50%', margin: 4, color: '#fff', fontWeight: 800, fontSize: 17 }}>
                      {initial}
                    </div>
                    {unread > 0 && (
                      <span style={{ position: 'absolute', top: -2, right: -2, minWidth: 17, height: 17, borderRadius: 9, padding: '0 3px', background: 'var(--color-red)', color: '#fff', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--color-bg-elevated)', lineHeight: 1, zIndex: 1 }}>
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 20, background: `${statusColor}22`, color: statusColor, fontSize: 10, fontWeight: 600 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor }} />{status}
                      </div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 20, background: health.bgColor, color: health.color, fontSize: 10, fontWeight: 700 }}>
                        {health.score} · {health.label}
                      </div>
                    </div>
                  </div>
                </div>

                {c.industries.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
                    {c.industries.slice(0, 3).map((ind) => (
                      <span key={ind} style={{ padding: '2px 8px', borderRadius: 20, background: 'var(--color-bg-active)', color: 'var(--color-text-secondary)', fontSize: 10 }}>{ind}</span>
                    ))}
                  </div>
                )}

                {/* Login avatars */}
                {(() => {
                  const logins = loginsFor(c.name);
                  if (logins.length === 0) return (
                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 10 }}>No portal logins yet</div>
                  );
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10 }}>
                      {logins.slice(0, 4).map((a, i) => (
                        <div key={a.id} title={`${a.name} · ${a.email}`} style={{ width: 24, height: 24, borderRadius: '50%', background: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 9, fontWeight: 700, border: '1.5px solid var(--color-bg-elevated)', marginLeft: i > 0 ? -6 : 0, flexShrink: 0 }}>{a.initials}</div>
                      ))}
                      {logins.length > 4 && <span style={{ fontSize: 10, color: 'var(--color-text-muted)', marginLeft: 4 }}>+{logins.length - 4}</span>}
                      <span style={{ fontSize: 10, color: 'var(--color-text-muted)', marginLeft: 4 }}>{logins.length} login{logins.length !== 1 ? 's' : ''}</span>
                    </div>
                  );
                })()}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--color-accent-bright)', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                    <IconBuilding size={13} /> Open portal →
                  </div>
                  {unread > 0 && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--color-red)', fontWeight: 700 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-red)', display: 'inline-block' }} />
                      {unread} new message{unread !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Add company card */}
          {isAdmin && (
            <div
              onClick={() => setShowAddCompany(true)}
              style={{
                border: '1.5px dashed var(--color-border-default)',
                borderRadius: 'var(--card-radius)',
                padding: '22px 20px',
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
                minHeight: 148,
                color: 'var(--color-text-muted)',
                transition: 'border-color 120ms, color 120ms',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent-bright)'; e.currentTarget.style.color = 'var(--color-accent-bright)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border-default)'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 11, border: '1.5px dashed currentColor', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconPlus size={20} />
              </div>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Add company</span>
            </div>
          )}
        </div>

        {clientCompanies.length === 0 && !isAdmin && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '80px 0', color: 'var(--color-text-muted)' }}>
            <IconBriefcase size={40} style={{ opacity: 0.35 }} />
            <span style={{ fontSize: 'var(--text-sm)' }}>No clients yet.</span>
          </div>
        )}
      </div>

      {showAddCompany && <AddCompanyModal onClose={() => setShowAddCompany(false)} onCreated={(name) => setSelected(name)} />}
    </div>
  );
}
