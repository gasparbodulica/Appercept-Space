'use client';

import { useState, useEffect } from 'react';

const CITIES = [
  { label: 'Los Angeles', short: 'LA',  tz: 'America/Los_Angeles' },
  { label: 'New York',    short: 'NY',  tz: 'America/New_York' },
  { label: 'London',      short: 'LDN', tz: 'Europe/London' },
  { label: 'Dubai',       short: 'DXB', tz: 'Asia/Dubai' },
  { label: 'Tokyo',       short: 'TYO', tz: 'Asia/Tokyo' },
];

interface TimeParts { h: number; m: number; s: number; weekday: string; day: string; month: string; }

function partsFor(tz: string, now: Date): TimeParts {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false, weekday: 'short', day: 'numeric', month: 'short',
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return {
    h: Number(get('hour')) % 24,
    m: Number(get('minute')),
    s: Number(get('second')),
    weekday: get('weekday'),
    day: get('day'),
    month: get('month'),
  };
}

function AnalogClock({ h, m, s, size = 78 }: { h: number; m: number; s: number; size?: number }) {
  const cx = size / 2, cy = size / 2, r = size / 2 - 2;
  const secA = s * 6;
  const minA = m * 6 + s * 0.1;
  const hourA = (h % 12) * 30 + m * 0.5;

  const hand = (angle: number, length: number, width: number, color: string) => {
    const rad = (angle - 90) * Math.PI / 180;
    return <line x1={cx} y1={cy} x2={cx + length * Math.cos(rad)} y2={cy + length * Math.sin(rad)} stroke={color} strokeWidth={width} strokeLinecap="round" />;
  };

  // Night (18:00–06:00) faces get a subtly darker tint
  const night = h >= 18 || h < 6;

  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      <circle cx={cx} cy={cy} r={r} fill={night ? 'rgba(10,20,38,0.7)' : 'var(--color-bg-surface)'} stroke="var(--color-border-strong)" strokeWidth={1} />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * 30) * Math.PI / 180;
        const inner = r - (i % 3 === 0 ? 9 : 6);
        const outer = r - 3;
        return (
          <line key={i}
            x1={cx + inner * Math.sin(a)} y1={cy - inner * Math.cos(a)}
            x2={cx + outer * Math.sin(a)} y2={cy - outer * Math.cos(a)}
            stroke="var(--color-text-muted)" strokeWidth={i % 3 === 0 ? 1.6 : 0.75} />
        );
      })}
      {hand(hourA, r * 0.50, 2.6, 'var(--color-text-primary)')}
      {hand(minA, r * 0.72, 1.8, 'var(--color-text-primary)')}
      {hand(secA, r * 0.80, 0.9, 'var(--color-accent-bright)')}
      <circle cx={cx} cy={cy} r={2.2} fill="var(--color-accent-bright)" />
    </svg>
  );
}

export function WorldClocks() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) return null; // avoid SSR/client time mismatch

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, flexWrap: 'wrap' }}>
      {CITIES.map((c) => {
        const p = partsFor(c.tz, now);
        const hh = String(p.h).padStart(2, '0');
        const mm = String(p.m).padStart(2, '0');
        return (
          <div key={c.tz} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <AnalogClock h={p.h} m={p.m} s={p.s} size={52} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.short}</div>
              <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>{hh}:{mm}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
