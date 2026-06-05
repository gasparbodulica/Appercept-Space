'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { computeClientRevenue, computeConsultingRevenue, computeCompanyFinance } from '@/lib/finance';
import { IconSparkles, IconX, IconSend, IconMinus, IconAlertTriangle } from '@tabler/icons-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'Which client is most at risk?',
  'What\'s our profit this month?',
  'Who has the most open tasks?',
  'Which projects are behind?',
  'When did we last meet with Medikal Lux?',
];

export function AIAssistant() {
  const { databases, pages, users, accounts } = useAppStore();
  const [open, setOpen] = useState(false);
  const [minimised, setMinimised] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { if (open && !minimised) bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, open, minimised]);
  useEffect(() => { if (open && !minimised) setTimeout(() => inputRef.current?.focus(), 80); }, [open, minimised]);

  const dbBySlug = (slug: string) =>
    Object.values(databases).find((d) => pages.some((p) => p.id === d.page_id && p.slug === slug));

  const context = useMemo(() => {
    const clientsDb    = Object.values(databases).find((d) => d.id === 'db-clients' || (d.columns.some((c) => c.name === 'Company') && d.columns.some((c) => c.name === 'Status') && d.columns.some((c) => c.type === 'number')));
    const projectsDb   = dbBySlug('projects');
    const todoDb       = dbBySlug('todo');
    const meetingsDb   = dbBySlug('meetings');
    const costsDb      = dbBySlug('costs');
    const consultingDb = dbBySlug('consulting');
    const workspace    = useAppStore.getState().workspace;

    const { revenue: retainerRevenue } = computeClientRevenue(clientsDb);
    const { revenue: consultingRevenue } = computeConsultingRevenue(consultingDb);
    const finance = computeCompanyFinance(costsDb, 'Appercept', retainerRevenue, consultingRevenue);

    const compCol = clientsDb?.columns.find((c) => c.name === 'Company');
    const nameColC = clientsDb?.columns.find((c) => c.name === 'Name' || c.position === 0);
    const statColC = clientsDb?.columns.find((c) => c.name === 'Status');
    const revColC  = clientsDb?.columns.find((c) => c.type === 'number');
    const freqColC = clientsDb?.columns.find((c) => c.name === 'Frequency');
    const clients  = (clientsDb?.rows ?? []).map((r) => ({
      name:      nameColC ? String(r.cells[nameColC.id] ?? '') : '',
      company:   compCol  ? String(r.cells[compCol.id]  ?? '') : '',
      status:    statColC ? String(r.cells[statColC.id] ?? '') : '',
      revenue:   revColC  ? Number(r.cells[revColC.id]  ?? 0) : 0,
      frequency: freqColC ? String(r.cells[freqColC.id] ?? '') : '',
    }));

    const projNameCol = projectsDb?.columns.find((c) => c.position === 0);
    const projStatCol = projectsDb?.columns.find((c) => c.type === 'status');
    const projProgCol = projectsDb?.columns.find((c) => c.name.toLowerCase().includes('progress') || c.type === 'number');
    const projClCol   = projectsDb?.columns.find((c) => c.name === 'Client');
    const projPersCol = projectsDb?.columns.find((c) => c.type === 'person');
    const projects = (projectsDb?.rows ?? []).map((r) => {
      const uid = projPersCol ? String(r.cells[projPersCol.id] ?? '') : '';
      const u = users.find((u) => u.id === uid);
      return {
        name:     projNameCol ? String(r.cells[projNameCol.id] ?? '') : '',
        client:   projClCol   ? String(r.cells[projClCol.id]   ?? '') : '',
        status:   projStatCol ? String(r.cells[projStatCol.id] ?? '') : '',
        progress: projProgCol ? Number(r.cells[projProgCol.id] ?? 0)  : 0,
        assignee: u?.name ?? uid,
      };
    });

    const taskNameCol = todoDb?.columns.find((c) => c.position === 0);
    const taskStatCol = todoDb?.columns.find((c) => c.type === 'status');
    const taskPersCol = todoDb?.columns.find((c) => c.type === 'person');
    const taskDateCol = todoDb?.columns.find((c) => c.type === 'date');
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const tasks = (todoDb?.rows ?? [])
      .filter((r) => { const s = taskStatCol ? String(r.cells[taskStatCol.id] ?? '') : ''; return s !== 'Done' && s !== 'Completed'; })
      .map((r) => {
        const uid  = taskPersCol ? String(r.cells[taskPersCol.id] ?? '') : '';
        const u    = users.find((u) => u.id === uid);
        const date = taskDateCol ? String(r.cells[taskDateCol.id] ?? '').split('T')[0] : '';
        return {
          name:     taskNameCol ? String(r.cells[taskNameCol.id] ?? '') : '',
          status:   taskStatCol ? String(r.cells[taskStatCol.id] ?? '') : '',
          assignee: u?.name ?? uid,
          overdue:  !!date && new Date(date) < now,
        };
      });

    const mtgNameCol = meetingsDb?.columns.find((c) => c.position === 0);
    const mtgDateCol = meetingsDb?.columns.find((c) => c.type === 'date');
    const mtgClCol   = meetingsDb?.columns.find((c) => c.name === 'Client');
    const meetings   = (meetingsDb?.rows ?? []).map((r) => ({
      title:  mtgNameCol ? String(r.cells[mtgNameCol.id] ?? '') : '',
      date:   mtgDateCol ? String(r.cells[mtgDateCol.id] ?? '').split('T')[0] : '',
      client: mtgClCol   ? String(r.cells[mtgClCol.id]   ?? '') : '',
    })).sort((a, b) => a.date.localeCompare(b.date));

    const conFeeCol  = consultingDb?.columns.find((c) => c.name === 'Fee');
    const conNameCol = consultingDb?.columns.find((c) => c.position === 0);
    const conClCol   = consultingDb?.columns.find((c) => c.name === 'Client name');
    const conSvcCol  = consultingDb?.columns.find((c) => c.name === 'Service type');
    const conStatCol = consultingDb?.columns.find((c) => c.type === 'status');
    const consulting = (consultingDb?.rows ?? []).map((r) => ({
      name:    conNameCol ? String(r.cells[conNameCol.id] ?? '') : '',
      client:  conClCol   ? String(r.cells[conClCol.id]   ?? '') : '',
      service: conSvcCol  ? String(r.cells[conSvcCol.id]  ?? '') : '',
      fee:     conFeeCol  ? Number(r.cells[conFeeCol.id]  ?? 0)  : 0,
      status:  conStatCol ? String(r.cells[conStatCol.id] ?? '') : '',
    }));

    return {
      workspaceName:     workspace.name,
      currentDate:       new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      team:              users.map((u) => ({ name: u.name, role: accounts.find((a) => a.email === u.email)?.role ?? 'member' })),
      clients, projects, tasks, meetings, consulting,
      finance: {
        monthLabel:        finance.monthLabel,
        retainerRevenue:   finance.revenue,
        consultingRevenue: finance.consultingRevenue,
        totalRevenue:      finance.totalRevenue,
        costs:             finance.expenses,
        profit:            finance.profit,
      },
    };
  }, [databases, pages, users, accounts]);

  const send = async (text?: string) => {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    setInput('');
    setError('');
    const userMsg: Message = { role: 'user', content: q };
    const next = [...messages, userMsg];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, context, history: messages.map((m) => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setError(data.error ?? 'Something went wrong.'); }
      else { setMessages([...next, { role: 'assistant', content: data.answer }]); }
    } catch { setError('Could not reach the AI. Check your connection.'); }
    finally { setLoading(false); }
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => { setOpen(true); setMinimised(false); }}
          title="Open AI assistant"
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 900,
            width: 52, height: 52, borderRadius: '50%',
            background: 'var(--gradient-accent)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', boxShadow: '0 6px 24px rgba(0,210,255,0.45)',
            transition: 'transform 120ms, box-shadow 120ms',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,210,255,0.6)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,210,255,0.45)'; }}
        >
          <IconSparkles size={22} />
        </button>
      )}

      {/* Panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 900,
          width: minimised ? 260 : 380, height: minimised ? 48 : 540,
          background: 'var(--color-bg-surface)',
          border: '0.5px solid var(--color-border-strong)',
          borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 16px 64px rgba(0,0,0,0.55), 0 0 0 0.5px rgba(0,210,255,0.08)',
          display: 'flex', flexDirection: 'column',
          transition: 'height 200ms ease, width 200ms ease',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 9, padding: '12px 14px',
            background: 'linear-gradient(135deg, rgba(0,120,200,0.25), rgba(0,210,255,0.12))',
            borderBottom: minimised ? 'none' : '0.5px solid var(--color-border-subtle)',
            flexShrink: 0,
          }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--gradient-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
              <IconSparkles size={15} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)' }}>Appercept AI</div>
              {!minimised && <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Ask anything about your workspace</div>}
            </div>
            <button onClick={() => setMinimised((m) => !m)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', padding: 4, borderRadius: 5 }}>
              <IconMinus size={14} />
            </button>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', padding: 4, borderRadius: 5 }}>
              <IconX size={14} />
            </button>
          </div>

          {!minimised && (
            <>
              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {messages.length === 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--gradient-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', margin: '0 auto 10px' }}>
                        <IconSparkles size={20} />
                      </div>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>Ask about your workspace</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>I know your clients, projects, tasks, finance and team — ask me anything.</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {SUGGESTIONS.map((s) => (
                        <button key={s} onClick={() => send(s)} style={{
                          padding: '8px 12px', borderRadius: 8,
                          border: '0.5px solid var(--color-border-default)',
                          background: 'var(--color-bg-active)', color: 'var(--color-text-secondary)',
                          fontSize: 'var(--text-xs)', cursor: 'pointer', textAlign: 'left',
                          transition: 'border-color 80ms, color 80ms',
                        }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent-bright)'; e.currentTarget.style.color = 'var(--color-accent-bright)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border-default)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
                        >{s}</button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((m, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: m.role === 'user' ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end' }}>
                    {m.role === 'assistant' && (
                      <div style={{ width: 24, height: 24, borderRadius: 7, background: 'var(--gradient-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                        <IconSparkles size={12} />
                      </div>
                    )}
                    <div style={{
                      maxWidth: '85%', padding: '8px 12px',
                      borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                      background: m.role === 'user' ? 'rgba(28,117,188,0.22)' : 'var(--color-bg-elevated)',
                      border: `0.5px solid ${m.role === 'user' ? 'rgba(0,210,255,0.25)' : 'var(--color-border-default)'}`,
                      fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', lineHeight: 1.55,
                      whiteSpace: 'pre-wrap',
                    }}>{m.content}</div>
                  </div>
                ))}

                {loading && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                    <div style={{ width: 24, height: 24, borderRadius: 7, background: 'var(--gradient-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                      <IconSparkles size={12} />
                    </div>
                    <div style={{ padding: '10px 14px', borderRadius: '12px 12px 12px 4px', background: 'var(--color-bg-elevated)', border: '0.5px solid var(--color-border-default)', display: 'flex', gap: 5, alignItems: 'center' }}>
                      {[0, 1, 2].map((i) => (
                        <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-accent)', opacity: 0.7, animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                      ))}
                    </div>
                  </div>
                )}

                {error && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(255,79,106,0.1)', border: '0.5px solid rgba(255,79,106,0.3)', fontSize: 'var(--text-xs)', color: 'var(--color-red)' }}>
                    <IconAlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                    {error}
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div style={{ padding: '8px 12px 12px', borderTop: '0.5px solid var(--color-border-subtle)', flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                    placeholder="Ask about clients, finance, tasks…"
                    rows={1}
                    style={{
                      flex: 1, background: 'var(--color-bg-input)', border: '0.5px solid var(--color-border-default)',
                      borderRadius: 9, padding: '8px 10px', resize: 'none', outline: 'none',
                      color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-sans)',
                      lineHeight: 1.4, maxHeight: 80,
                    }}
                  />
                  <button
                    onClick={() => send()}
                    disabled={!input.trim() || loading}
                    style={{
                      width: 34, height: 34, borderRadius: 9, border: 'none', flexShrink: 0,
                      cursor: input.trim() && !loading ? 'pointer' : 'default',
                      background: input.trim() && !loading ? 'var(--gradient-accent)' : 'var(--color-bg-active)',
                      color: input.trim() && !loading ? '#fff' : 'var(--color-text-muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  ><IconSend size={15} /></button>
                </div>
                {messages.length > 0 && (
                  <button onClick={() => { setMessages([]); setError(''); }} style={{ marginTop: 6, fontSize: 10, color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Clear conversation</button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      <style>{`@keyframes pulse { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1); } }`}</style>
    </>
  );
}
