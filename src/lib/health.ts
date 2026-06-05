import { Database, Page, PortalMessage } from './types';

export interface HealthFactor {
  label: string;
  score: number;
  max: number;
  note: string;
}

export interface HealthScore {
  score: number;           // 0–100
  grade: 'excellent' | 'good' | 'fair' | 'at-risk';
  color: string;
  bgColor: string;
  label: string;
  factors: HealthFactor[];
}

function normalize(s: string) {
  return s.toLowerCase().replace(/\s+(d\.o\.o\.|j\.d\.o\.o\.|obrt)\.?$/, '').trim();
}
function matches(a: string, b: string) {
  const na = normalize(a), nb = normalize(b);
  return !!na && !!nb && (na === nb || na.includes(nb) || nb.includes(na));
}

function dbBySlug(databases: Record<string, Database>, pages: Page[], slug: string): Database | undefined {
  return Object.values(databases).find((d) => pages.some((p) => p.id === d.page_id && p.slug === slug));
}

export function computeClientHealth(
  company: string,
  databases: Record<string, Database>,
  pages: Page[],
  portalMessages: PortalMessage[],
): HealthScore {
  const factors: HealthFactor[] = [];

  // ── 1. Project progress (0–25) ───────────────────────────────────────────
  const projectsDb = dbBySlug(databases, pages, 'projects');
  let projectScore = 0;
  let projectNote = 'No active projects';
  if (projectsDb) {
    const cCol = projectsDb.columns.find((c) => c.name === 'Client');
    const progCol = projectsDb.columns.find((c) => c.name === 'Progress (%)' || (c.type === 'number' && c.name.toLowerCase().includes('progress')));
    const statCol = projectsDb.columns.find((c) => c.type === 'status');
    const relevant = projectsDb.rows.filter((r) => cCol && matches(String(r.cells[cCol.id] ?? ''), company));
    const active = relevant.filter((r) => {
      const s = statCol ? String(r.cells[statCol.id] ?? '') : '';
      return s !== 'Done' && s !== 'Completed';
    });
    if (active.length > 0 && progCol) {
      const avg = active.reduce((sum, r) => sum + (Number(r.cells[progCol.id]) || 0), 0) / active.length;
      projectScore = Math.round((avg / 100) * 25);
      projectNote = `${active.length} project${active.length !== 1 ? 's' : ''}, avg ${Math.round(avg)}% complete`;
    } else if (active.length > 0) {
      projectScore = 12;
      projectNote = `${active.length} active project${active.length !== 1 ? 's' : ''}`;
    }
  }
  factors.push({ label: 'Project progress', score: projectScore, max: 25, note: projectNote });

  // ── 2. Meeting recency (0–25) ────────────────────────────────────────────
  const meetingsDb = dbBySlug(databases, pages, 'meetings');
  let meetingScore = 0;
  let meetingNote = 'No meetings found';
  if (meetingsDb) {
    const cCol = meetingsDb.columns.find((c) => c.name === 'Client');
    const dCol = meetingsDb.columns.find((c) => c.type === 'date' || c.type === 'date_range');
    const relevant = meetingsDb.rows.filter((r) => cCol && matches(String(r.cells[cCol.id] ?? ''), company));
    if (relevant.length > 0 && dCol) {
      const dates = relevant
        .map((r) => { const v = String(r.cells[dCol.id] ?? '').split('|')[0].split('T')[0]; return v ? new Date(v).getTime() : 0; })
        .filter(Boolean)
        .sort((a, b) => b - a);
      if (dates.length > 0) {
        const daysSince = Math.floor((Date.now() - dates[0]) / (1000 * 60 * 60 * 24));
        if (daysSince <= 7)  { meetingScore = 25; meetingNote = `Met ${daysSince}d ago`; }
        else if (daysSince <= 14) { meetingScore = 20; meetingNote = `Met ${daysSince}d ago`; }
        else if (daysSince <= 30) { meetingScore = 14; meetingNote = `Met ${daysSince}d ago`; }
        else if (daysSince <= 60) { meetingScore = 7;  meetingNote = `Met ${daysSince}d ago — schedule soon`; }
        else { meetingScore = 0; meetingNote = `No meeting in ${daysSince}d — overdue`; }
      }
    } else if (relevant.length > 0) {
      meetingScore = 10; meetingNote = `${relevant.length} meeting${relevant.length !== 1 ? 's' : ''} on record`;
    }
  }
  factors.push({ label: 'Meeting recency', score: meetingScore, max: 25, note: meetingNote });

  // ── 3. No overdue tasks (0–20) ───────────────────────────────────────────
  const todoDb = dbBySlug(databases, pages, 'todo');
  let taskScore = 20;
  let taskNote = 'No overdue tasks';
  if (todoDb) {
    const statCol = todoDb.columns.find((c) => c.type === 'status');
    const dateCol = todoDb.columns.find((c) => c.type === 'date' || c.type === 'date_range');
    const relCol = todoDb.columns.find((c) => c.name.toLowerCase().includes('client') || c.type === 'relation');
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const overdue = todoDb.rows.filter((r) => {
      const s = statCol ? String(r.cells[statCol.id] ?? '') : '';
      if (s === 'Done' || s === 'Completed') return false;
      const d = dateCol ? String(r.cells[dateCol.id] ?? '').split('|')[0].split('T')[0] : '';
      if (!d) return false;
      const rel = relCol ? String(r.cells[relCol.id] ?? '') : '';
      const clientMatch = !rel || matches(rel, company);
      return clientMatch && new Date(d) < now;
    }).length;
    if (overdue === 0)     { taskScore = 20; taskNote = 'No overdue tasks'; }
    else if (overdue <= 2) { taskScore = 10; taskNote = `${overdue} overdue task${overdue !== 1 ? 's' : ''}`; }
    else                   { taskScore = 0;  taskNote = `${overdue} overdue tasks — needs attention`; }
  }
  factors.push({ label: 'Task health', score: taskScore, max: 20, note: taskNote });

  // ── 4. Portal responsiveness (0–15) ─────────────────────────────────────
  const clientMsgs = portalMessages.filter((m) => m.client === company && m.from === 'client');
  const teamReplies = portalMessages.filter((m) => m.client === company && m.from === 'team');
  let responseScore = 15;
  let responseNote = 'No client messages yet';
  if (clientMsgs.length > 0) {
    const unansweredCount = clientMsgs.filter((cm) => {
      return !teamReplies.some((tr) => tr.created_at > cm.created_at);
    }).length;
    if (unansweredCount === 0)     { responseScore = 15; responseNote = 'All messages answered'; }
    else if (unansweredCount === 1) { responseScore = 10; responseNote = '1 unanswered message'; }
    else if (unansweredCount <= 3) { responseScore = 5;  responseNote = `${unansweredCount} unanswered messages`; }
    else                            { responseScore = 0;  responseNote = `${unansweredCount} messages unanswered`; }
  }
  factors.push({ label: 'Portal responsiveness', score: responseScore, max: 15, note: responseNote });

  // ── 5. Revenue & status (0–15) ───────────────────────────────────────────
  const clientsDb = Object.values(databases).find((d) => d.id === 'db-clients' ||
    (d.columns.some((c) => c.name === 'Company') && d.columns.some((c) => c.name === 'Status') && d.columns.some((c) => c.type === 'number')));
  let revenueScore = 8;
  let revenueNote = 'Status unknown';
  if (clientsDb) {
    const compCol = clientsDb.columns.find((c) => c.name === 'Company');
    const statCol = clientsDb.columns.find((c) => c.name === 'Status');
    const revCol  = clientsDb.columns.find((c) => c.type === 'number');
    const row = clientsDb.rows.find((r) => compCol && matches(String(r.cells[compCol.id] ?? ''), company));
    if (row) {
      const status  = statCol ? String(row.cells[statCol.id] ?? '') : '';
      const revenue = revCol  ? Number(row.cells[revCol.id] ?? 0) : 0;
      if (status === 'Active' && revenue > 0) { revenueScore = 15; revenueNote = `Active · €${revenue.toLocaleString()}/mo`; }
      else if (status === 'Active')            { revenueScore = 8;  revenueNote = 'Active, no retainer set'; }
      else if (status === 'Pending')           { revenueScore = 5;  revenueNote = 'Pending client'; }
      else                                     { revenueScore = 0;  revenueNote = 'Inactive'; }
    }
  }
  factors.push({ label: 'Revenue & status', score: revenueScore, max: 15, note: revenueNote });

  // ── Total ────────────────────────────────────────────────────────────────
  const total = Math.min(100, factors.reduce((s, f) => s + f.score, 0));

  let grade: HealthScore['grade'];
  let color: string;
  let bgColor: string;
  let label: string;
  if (total >= 80)      { grade = 'excellent'; color = 'var(--color-green)';  bgColor = 'rgba(46,232,154,0.12)'; label = 'Excellent'; }
  else if (total >= 60) { grade = 'good';      color = 'var(--color-teal)';   bgColor = 'rgba(0,210,255,0.12)';  label = 'Good'; }
  else if (total >= 40) { grade = 'fair';      color = 'var(--color-amber)';  bgColor = 'rgba(245,166,35,0.12)'; label = 'Fair'; }
  else                  { grade = 'at-risk';   color = 'var(--color-red)';    bgColor = 'rgba(255,79,106,0.12)'; label = 'At risk'; }

  return { score: total, grade, color, bgColor, label, factors };
}
