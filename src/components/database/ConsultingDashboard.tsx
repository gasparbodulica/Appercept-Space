'use client';

import { Database, Row } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import {
  IconBriefcase, IconCurrencyEuro, IconUserCheck, IconClock,
  IconPlayerPlay, IconCheck, IconSettings, IconMicrophone, IconMessage2, IconCpu
} from '@tabler/icons-react';

interface ConsultingDashboardProps {
  database: Database;
}

export function ConsultingDashboard({ database }: ConsultingDashboardProps) {
  const { openRow } = useAppStore();
  const rows = database.rows;

  // Derive metrics
  const totalPipeline = rows.reduce((sum, r) => sum + (Number(r.cells['con-fee']) || 0), 0);
  const activeEngagements = rows.filter(r => r.cells['con-status'] === 'In progress').length;
  const completedEngagements = rows.filter(r => r.cells['con-status'] === 'Completed').length;
  const avgFee = rows.length ? Math.round(totalPipeline / rows.length) : 0;

  // Count services
  const serviceCounts = rows.reduce((acc, r) => {
    const s = String(r.cells['con-service'] || 'Other');
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const serviceIcons: Record<string, React.ReactNode> = {
    'Voice Bot': <IconMicrophone size={18} />,
    'Chat Bot': <IconMessage2 size={18} />,
    'Process Automation': <IconCpu size={18} />,
    'AI Audit & Roadmap': <IconBriefcase size={18} />,
    'AI Workshop': <IconUserCheck size={18} />,
    'AI Integrations': <IconSettings size={18} />
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 28 }}>
      
      {/* Title */}
      <div>
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--color-text-primary)', margin: '0 0 4px' }}>Consulting Hub</h2>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', margin: 0 }}>Executive overview of active AI consulting pipelines and services.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid-4-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { label: 'Pipeline Value', value: `€${(totalPipeline / 1000).toFixed(1)}k`, icon: <IconCurrencyEuro size={20} />, color: 'var(--color-accent-bright)' },
          { label: 'Active Projects', value: activeEngagements, icon: <IconPlayerPlay size={18} />, color: 'var(--color-amber)' },
          { label: 'Completed Cases', value: completedEngagements, icon: <IconCheck size={18} />, color: 'var(--color-green)' },
          { label: 'Avg Project Fee', value: `€${avgFee.toLocaleString()}`, icon: <IconClock size={18} />, color: 'var(--color-purple)' },
        ].map((card, i) => (
          <div key={i} className="glass-card" style={{
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '0.5px solid rgba(28, 117, 188, 0.25)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            background: 'rgba(10, 20, 38, 0.4)'
          }}>
            <div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-text-primary)' }}>{card.value}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>{card.label}</div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(28, 117, 188, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Layout */}
      <div className="grid-2-1" style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 24 }}>
        
        {/* Active Engagements List */}
        <div className="glass-card" style={{ padding: 24, border: '0.5px solid rgba(28, 117, 188, 0.2)', background: 'rgba(10, 20, 38, 0.4)' }}>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px' }}>Consulting Pipeline</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {rows.map((row) => {
              const name = String(row.cells['con-name'] || 'Untitled Consultation');
              const client = String(row.cells['con-client'] || 'Unknown Client');
              const fee = Number(row.cells['con-fee']) || 0;
              const date = String(row.cells['con-date'] || '');
              const status = String(row.cells['con-status'] || 'Not started');
              const service = String(row.cells['con-service'] || '');

              const statusColor = status === 'Completed' ? 'var(--color-green)' : status === 'In progress' ? 'var(--color-amber)' : 'var(--color-text-muted)';

              return (
                <div
                  key={row.id}
                  onClick={() => openRow(row.id, database.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 8,
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '0.5px solid rgba(28, 117, 188, 0.1)',
                    cursor: 'pointer',
                    transition: 'all 120ms'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(28, 117, 188, 0.08)'; e.currentTarget.style.borderColor = 'var(--color-accent)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'; e.currentTarget.style.borderColor = 'rgba(28, 117, 188, 0.1)'; }}
                >
                  <div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-primary)' }}>{name}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 4 }}>
                      {client} {service && `· ${service}`} {date && `· ${date}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-accent-bright)' }}>€{fee.toLocaleString()}</span>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 9999,
                      background: `${statusColor}18`,
                      color: statusColor,
                      border: `1px solid ${statusColor}33`
                    }}>{status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Services & Capabilities */}
        <div className="glass-card" style={{ padding: 24, border: '0.5px solid rgba(28, 117, 188, 0.2)', background: 'rgba(10, 20, 38, 0.4)' }}>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px' }}>Services & AI Capabilities</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { name: 'Voice Bot', desc: 'Voice AI assistants scheduling appointments' },
              { name: 'Chat Bot', desc: 'WhatsApp & web-based smart conversational agents' },
              { name: 'Process Automation', desc: 'n8n & Make workflows eliminating manual tasks' },
              { name: 'AI Audit & Roadmap', desc: 'Operational audit outlining top value cases' },
              { name: 'AI Workshop', desc: 'Edukacija & training teams on enterprise tools' },
              { name: 'AI Integrations', desc: 'Connecting OpenAI, Anthropic to custom software' }
            ].map((srv, idx) => {
              const activeCount = serviceCounts[srv.name] || 0;
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 6, background: 'rgba(28, 117, 188, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent-bright)', flexShrink: 0 }}>
                    {serviceIcons[srv.name] || <IconBriefcase size={16} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-primary)' }}>{srv.name}</span>
                      {activeCount > 0 && (
                        <span style={{ fontSize: 10, color: 'var(--color-accent-bright)', background: 'rgba(0, 210, 255, 0.1)', padding: '1px 6px', borderRadius: 4, fontWeight: 500 }}>
                          {activeCount} active
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>{srv.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
