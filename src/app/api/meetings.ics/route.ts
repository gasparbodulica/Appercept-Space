import { NextResponse } from 'next/server';
import { DATABASES, PAGES } from '@/lib/seed';

export const runtime = 'nodejs';

function icalDate(iso: string): string {
  // YYYY-MM-DD → 20260605 (all-day)
  return iso.replace(/-/g, '').slice(0, 8);
}

function icalEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export async function GET() {
  const meetingsDb = Object.values(DATABASES).find((db) => {
    const page = PAGES.find((p) => p.id === db.page_id);
    return page?.slug === 'meetings';
  });

  const nameCol = meetingsDb?.columns.find((c) => c.position === 0);
  const dateCol = meetingsDb?.columns.find((c) => c.type === 'date' || c.type === 'date_range');
  const clientCol = meetingsDb?.columns.find((c) => c.name === 'Client');
  const durationCol = meetingsDb?.columns.find((c) => c.name === 'Duration (min)');

  const rows = meetingsDb?.rows ?? [];

  const uid_domain = 'appercept.space';
  const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  const events = rows.map((row) => {
    const title = nameCol ? String(row.cells[nameCol.id] ?? 'Meeting') : 'Meeting';
    const dateRaw = dateCol ? String(row.cells[dateCol.id] ?? '') : '';
    const client = clientCol ? String(row.cells[clientCol.id] ?? '') : '';
    const duration = durationCol ? Number(row.cells[durationCol.id] ?? 60) : 60;
    const dateStr = dateRaw.split('|')[0].split('T')[0] || new Date().toISOString().split('T')[0];
    const dtstart = icalDate(dateStr);
    // End = same day + 1 for all-day, or use duration to compute end time
    const startD = new Date(dateStr + 'T09:00:00');
    const endD = new Date(startD.getTime() + duration * 60 * 1000);
    const dtend = endD.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '') + 'Z';

    return [
      'BEGIN:VEVENT',
      `UID:${row.id}@${uid_domain}`,
      `DTSTAMP:${now}Z`,
      `DTSTART;TZID=Europe/Zagreb:${dtstart}T090000`,
      `DTEND:${dtend}`,
      `SUMMARY:${icalEscape(title)}`,
      client ? `DESCRIPTION:Client: ${icalEscape(client)}` : '',
      'END:VEVENT',
    ].filter(Boolean).join('\r\n');
  }).join('\r\n');

  const cal = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Appercept Space//Meetings//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Appercept Meetings`,
    'X-WR-TIMEZONE:Europe/Zagreb',
    'X-PUBLISHED-TTL:PT15M',
    events,
    'END:VCALENDAR',
  ].join('\r\n');

  return new NextResponse(cal, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="appercept-meetings.ics"',
      'Cache-Control': 'no-cache, no-store',
    },
  });
}
