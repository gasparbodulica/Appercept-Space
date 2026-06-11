'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { findClientsDb } from '@/lib/finance';
import { computeClientHealth } from '@/lib/health';
import { formatDate } from '@/lib/utils';
import { Database } from '@/lib/types';
import {
  IconSend, IconChartBar, IconFolder, IconMessage2, IconCalendar, IconFile, IconActivity,
} from '@tabler/icons-react';

export function normalize(s: string) {
  return s.toLowerCase().replace(/\s+(d\.o\.o\.|j\.d\.o\.o\.|obrt)\.?$/, '').trim();
}
export function clientMatches(value: string, company: string) {
  const a = normalize(value), b = normalize(company);
  return !!a && !!b && (a === b || a.includes(b) || b.includes(a));
}

/**
 * One client's portal: progress, files, meetings and a Q&A thread.
 * mode 'agency' → the team replies; mode 'client' → the client asks.
 */
export function ClientPortalView({ company, mode }: { company: string; mode: 'agency' | 'client' }) {
  const { databases, pages, users, portalMessages, addPortalMessage, markPortalRead, portalColors } = useAppStore();
  const customColor = portalColors[company];
  const tileBg = customColor ? `linear-gradient(135deg, ${customColor}, ${customColor}cc)` : 'var(--gradient-accent)';

  // Mark this client's messages as read when the view mounts or the company changes
  useEffect(() => { if (company) markPortalRead(company); }, [company]);

  const dbBySlug = (slug: string): Database | undefined =>
    Object.values(databases).find((d) => pages.some((p) => p.id === d.page_id && p.slug === slug));

  const projectsDb = dbBySlug('projects');
  const filesDb = dbBySlug('files');
  const meetingsDb = dbBySlug('meetings');
  const clientsDb = findClientsDb(databases);

  const industries = useMemo(() => {
    return [];
  }, []);

  const projects = useMemo(() => {
    if (!projectsDb) return [];
    const cCol = projectsDb.columns.find((c) => c.name === 'Client');
    const pName = projectsDb.columns.find((c) => c.position === 0);
    const pProg = projectsDb.columns.find((c) => c.name === 'Progress' || c.type === 'number');
    return projectsDb.rows
      .filter((r) => cCol && clientMatches(String(r.cells[cCol.id] ?? ''), company))
      .map((r) => ({ id: r.id, name: pName ? String(r.cells[pName.id] ?? 'Untitled') : 'Untitled', progress: pProg ? Number(r.cells[pProg.id]) || 0 : 0 }));
  }, [projectsDb, company]);

  const meetings = useMemo(() => {
    if (!meetingsDb) return [];
    const cCol = meetingsDb.columns.find((c) => c.name === 'Client');
    const tCol = meetingsDb.columns.find((c) => c.position === 0);
    const dCol = meetingsDb.columns.find((c) => c.type === 'date' || c.type === 'date_range');
    return meetingsDb.rows
      .filter((r) => cCol && clientMatches(String(r.cells[cCol.id] ?? ''), company))
      .map((r) => ({ id: r.id, title: tCol ? String(r.cells[tCol.id] ?? '') : '', date: dCol ? String(r.cells[dCol.id] ?? '') : '' }));
  }, [meetingsDb, company]);

  const files = useMemo(() => {
    if (!filesDb) return [];
    const fName = filesDb.columns.find((c) => c.position === 0);
    const fType = filesDb.columns.find((c) => c.name === 'Type');
    const fDate = filesDb.columns.find((c) => c.type === 'date');
    const matched = filesDb.rows.filter((r) => fName && clientMatches(String(r.cells[fName.id] ?? ''), company));
    const rows = matched.length ? matched : filesDb.rows.slice(0, 5);
    return rows.map((r) => ({
      id: r.id, name: fName ? String(r.cells[fName.id] ?? 'File') : 'File',
      type: fType ? String(r.cells[fType.id] ?? '') : '', date: fDate ? String(r.cells[fDate.id] ?? '') : '',
    }));
  }, [filesDb, company]);

  const clientRow = useMemo(() => {
    if (!clientsDb) return null;
    const compCol = clientsDb.columns.find((c) => c.name === 'Company');
    return clientsDb.rows.find((r) => compCol && clientMatches(String(r.cells[compCol.id] ?? ''), company)) ?? null;
  }, [clientsDb, company]);

  const clientStatus = useMemo(() => {
    if (!clientRow || !clientsDb) return 'Active';
    const statCol = clientsDb.columns.find((c) => c.name === 'Status');
    return statCol ? String(clientRow.cells[statCol.id] ?? 'Active') : 'Active';
  }, [clientsDb, clientRow]);

  const clientInfo = useMemo(() => {
    if (!clientRow || !clientsDb) return {};
    const get = (name: string) => { const col = clientsDb.columns.find(c => c.name === name); return col ? String(clientRow.cells[col.id] ?? '') : ''; };
    return { email: get('Email'), phone: get('Phone'), name: get('Name'), notes: get('Notes') };
  }, [clientsDb, clientRow]);

  // Upfront + monthly from linked projects
  const projectRevenue = useMemo(() => {
    if (!projectsDb) return { upfront: 0, monthly: 0 };
    const clientCol  = projectsDb.columns.find(c => c.name === 'Client');
    const upfrontCol = projectsDb.columns.find(c => c.id === 'pc-upfront');
    const monthlyCol = projectsDb.columns.find(c => c.id === 'pc-monthly');
    const statusCol  = projectsDb.columns.find(c => c.type === 'status');
    let upfront = 0, monthly = 0;
    for (const r of projectsDb.rows) {
      if (clientCol && !clientMatches(String(r.cells[clientCol.id] ?? ''), company)) continue;
      const status = statusCol ? String(r.cells[statusCol.id] ?? '') : '';
      if (upfrontCol) upfront += Number(r.cells[upfrontCol.id]) || 0;
      if (monthlyCol && status !== 'Done' && status !== 'Completed') monthly += Number(r.cells[monthlyCol.id]) || 0;
    }
    return { upfront, monthly };
  }, [projectsDb, company]);

  const thread = useMemo(
    () => portalMessages.filter((m) => m.client === company).sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [portalMessages, company]
  );

  const [reply, setReply] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [thread.length, company]);
  const send = () => { if (!reply.trim()) return; addPortalMessage(company, reply, mode === 'client' ? 'client' : 'team'); setReply(''); };

  const initial = (company?.trim()?.charAt(0) ?? 'C').toUpperCase();
  const statusColor = clientStatus === 'Active' ? 'var(--color-green)' : clientStatus === 'Pending' ? 'var(--color-amber)' : 'var(--color-gray)';
  const [showHealth, setShowHealth] = useState(false);

  const { databases: dbs, pages: pgs, portalMessages: pm } = useAppStore.getState();
  const health = useMemo(() => computeClientHealth(company, dbs, pgs, pm), [company, dbs, pgs, pm]);
  const R = 24, CIRC = 2 * Math.PI * R, dash = (health.score / 100) * CIRC;

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--color-bg-base)', padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        {/* Health ring around initial */}
        <div style={{ position: 'relative', flexShrink: 0, width: 64, height: 64 }}>
          <svg width={64} height={64} style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
            <circle cx={32} cy={32} r={R} fill="none" stroke="var(--color-bg-active)" strokeWidth={3.5} />
            <circle cx={32} cy={32} r={R} fill="none" stroke={health.color} strokeWidth={3.5}
              strokeDasharray={`${dash} ${CIRC}`} strokeLinecap="round" />
          </svg>
          <div style={{ position: 'absolute', inset: 6, borderRadius: '50%', background: tileBg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 22, boxShadow: '0 4px 18px rgba(0,210,255,0.3)' }}>{initial}</div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-text-primary)' }}>{company}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 10px', borderRadius: 20, background: `${statusColor}22`, color: statusColor, fontSize: 'var(--text-xs)', fontWeight: 600 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor }} />{clientStatus}
            </span>
            {clientInfo.email && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{clientInfo.email}</span>}
            {clientInfo.phone && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{clientInfo.phone}</span>}
            {projectRevenue.upfront > 0 && (
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent-bright)', fontWeight: 600 }}>
                €{projectRevenue.upfront.toLocaleString()} one-time
              </span>
            )}
            {projectRevenue.monthly > 0 && (
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-teal)', fontWeight: 600 }}>
                €{projectRevenue.monthly.toLocaleString()}/mo
              </span>
            )}
          </div>
        </div>
        {/* Health score badge */}
        <button onClick={() => setShowHealth((v) => !v)} title="View health score breakdown"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '8px 14px', borderRadius: 10, border: `1px solid ${health.color}44`, background: health.bgColor, cursor: 'pointer', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <IconActivity size={13} style={{ color: health.color }} />
            <span style={{ fontSize: 20, fontWeight: 800, color: health.color, lineHeight: 1 }}>{health.score}</span>
          </div>
          <span style={{ fontSize: 10, fontWeight: 600, color: health.color }}>{health.label}</span>
        </button>
      </div>

      {/* Health breakdown panel */}
      {showHealth && (
        <div style={{ marginBottom: 18, padding: '14px 16px', borderRadius: 10, background: 'var(--color-bg-elevated)', border: `0.5px solid ${health.color}33` }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Health breakdown</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {health.factors.map((f) => (
              <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 130, flexShrink: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{f.label}</div>
                <div style={{ flex: 1, height: 5, background: 'var(--color-bg-active)', borderRadius: 9999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(f.score / f.max) * 100}%`, background: f.score === f.max ? 'var(--color-green)' : f.score >= f.max * 0.6 ? 'var(--color-amber)' : 'var(--color-red)', borderRadius: 9999 }} />
                </div>
                <div style={{ width: 36, textAlign: 'right', fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', flexShrink: 0 }}>{f.score}/{f.max}</div>
                <div style={{ flex: 1, fontSize: 10, color: 'var(--color-text-muted)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.note}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Card icon={<IconChartBar size={16} />} title="Progress" color="var(--color-accent-bright)">
          {projects.length === 0 ? <Empty>No active projects</Empty> : projects.map((p) => (
            <div key={p.id} style={{ padding: '10px 0', borderBottom: '0.5px solid var(--color-border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>{p.name}</span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{p.progress}%</span>
              </div>
              <div style={{ height: 5, background: 'var(--color-bg-active)', borderRadius: 9999, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${p.progress}%`, background: 'var(--gradient-accent)', borderRadius: 9999, transition: 'width 500ms' }} />
              </div>
            </div>
          ))}
        </Card>

        <Card icon={<IconFolder size={16} />} title="Shared files" color="#fb923c">
          {files.length === 0 ? <Empty>No files shared yet</Empty> : files.map((f) => (
            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '0.5px solid var(--color-border-subtle)' }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--color-accent-subtle)', color: 'var(--color-accent-bright)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><IconFile size={15} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{[f.type, f.date && formatDate(f.date)].filter(Boolean).join(' · ')}</div>
              </div>
            </div>
          ))}
        </Card>

        <Card icon={<IconCalendar size={16} />} title="Meetings" color="#a78bfa">
          {meetings.length === 0 ? <Empty>No meetings scheduled</Empty> : meetings.map((m) => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '0.5px solid var(--color-border-subtle)' }}>
              <div style={{ width: 3, height: 30, borderRadius: 9999, background: 'var(--color-purple)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>{m.title}</div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{m.date && formatDate(m.date)}</div>
              </div>
            </div>
          ))}
        </Card>

        <Card icon={<IconMessage2 size={16} />} title={mode === 'client' ? 'Ask us anything' : 'Questions'} color="var(--color-green)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 220, overflowY: 'auto', marginBottom: 12 }}>
            {thread.length === 0 && <Empty>{mode === 'client' ? 'Send us your first question' : 'No questions yet'}</Empty>}
            {thread.map((m) => {
              const team = m.from === 'team';
              const u = team ? users.find((x) => x.id === m.sender_id) : undefined;
              // In client mode, the client's own messages sit on the right
              const mine = mode === 'client' ? m.from === 'client' : team;
              return (
                <div key={m.id} style={{ display: 'flex', flexDirection: mine ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, background: team ? (u?.color ?? 'var(--color-accent)') : 'var(--color-bg-active)', color: team ? '#fff' : 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 }}>
                    {team ? (u?.initials ?? 'AP') : initial}
                  </div>
                  <div style={{
                    maxWidth: '76%', padding: '7px 11px', fontSize: 'var(--text-sm)', lineHeight: 1.45,
                    borderRadius: mine ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                    background: mine ? 'rgba(28,117,188,0.18)' : 'var(--color-bg-elevated)',
                    border: `0.5px solid ${mine ? 'rgba(0,210,255,0.22)' : 'var(--color-border-default)'}`,
                    color: 'var(--color-text-primary)',
                  }}>{m.body}</div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea value={reply} onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={mode === 'client' ? 'Type your question…' : 'Reply to the client…'} rows={1}
              style={{ flex: 1, background: 'var(--color-bg-input)', border: '0.5px solid var(--color-border-default)', borderRadius: 9, padding: '8px 10px', resize: 'none', outline: 'none', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-sans)', lineHeight: 1.4, maxHeight: 90 }} />
            <button onClick={send} disabled={!reply.trim()}
              style={{ width: 32, height: 32, borderRadius: 8, border: 'none', flexShrink: 0, cursor: reply.trim() ? 'pointer' : 'default', background: reply.trim() ? 'var(--gradient-accent)' : 'var(--color-bg-active)', color: reply.trim() ? '#fff' : 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconSend size={15} />
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Card({ icon, title, color, children }: { icon: React.ReactNode; title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--color-bg-elevated)', border: '0.5px solid var(--color-border-default)', borderRadius: 'var(--card-radius)', padding: 18, boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ color, display: 'flex' }}>{icon}</span>
        <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: '14px 0', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>{children}</div>;
}
