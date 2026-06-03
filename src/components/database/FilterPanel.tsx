'use client';

import { Database, ViewConfig, Filter, Column } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { IconPlus, IconX } from '@tabler/icons-react';

const CONDITIONS: Record<string, [string, string][]> = {
  text:         [['contains','contains'],['does not contain','does_not_contain'],['is','is'],['is not','is_not'],['starts with','starts_with'],['is empty','is_empty'],['is not empty','is_not_empty']],
  number:       [['=','is'],['≠','is_not'],['>','>'],['<','<'],['≥','>='],['≤','<='],['is empty','is_empty'],['is not empty','is_not_empty']],
  status:       [['is','is'],['is not','is_not'],['is empty','is_empty'],['is not empty','is_not_empty']],
  select:       [['is','is'],['is not','is_not'],['is empty','is_empty'],['is not empty','is_not_empty']],
  date:         [['is','is'],['is before','<'],['is after','>'],['is empty','is_empty'],['is not empty','is_not_empty']],
  checkbox:     [['is checked','is_checked'],['is unchecked','is_unchecked']],
  person:       [['is me','is_me'],['is empty','is_empty'],['is not empty','is_not_empty']],
};
const NO_VALUE = new Set(['is_empty','is_not_empty','is_checked','is_unchecked','is_me']);

function getConditions(type: string): [string, string][] {
  if (type in CONDITIONS) return CONDITIONS[type];
  if (['email','phone','url','multi_select','tags'].includes(type)) return CONDITIONS.text;
  if (type === 'date_range') return CONDITIONS.date;
  return CONDITIONS.text;
}

let _fid = 1000;
function nextFid() { return `fui-${_fid++}`; }

interface FilterPanelProps { database: Database; view: ViewConfig; }

export function FilterPanel({ database, view }: FilterPanelProps) {
  const { setFilter } = useAppStore();
  const filters = view.filters ?? [];
  const cols = database.columns.sort((a, b) => a.position - b.position);

  const save = (next: Filter[]) => setFilter(database.id, view.id, next);

  const add = () => {
    const col = cols[0];
    if (!col) return;
    const conds = getConditions(col.type);
    save([...filters, { id: nextFid(), column_id: col.id, operator: conds[0][1], value: null }]);
  };

  const remove = (id: string) => save(filters.filter(f => f.id !== id));

  const patch = (id: string, changes: Partial<Filter>) =>
    save(filters.map(f => f.id === id ? { ...f, ...changes } : f));

  return (
    <div style={{ borderBottom: '0.5px solid var(--color-border-subtle)', background: 'var(--color-bg-base)', padding: '8px 20px 12px' }}>
      {filters.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>No filters applied.</span>
          <button onClick={add} style={addBtn}><IconPlus size={11} /> Add filter</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filters.map((f, i) => {
            const col = database.columns.find(c => c.id === f.column_id);
            if (!col) return null;
            const conds = getConditions(col.type);
            const needsVal = !NO_VALUE.has(f.operator);
            return (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 46, textAlign: 'right', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', flexShrink: 0 }}>
                  {i === 0 ? 'Where' : 'And'}
                </span>

                {/* Property */}
                <select value={f.column_id} onChange={e => {
                  const nc = database.columns.find(c => c.id === e.target.value);
                  if (!nc) return;
                  patch(f.id, { column_id: e.target.value, operator: getConditions(nc.type)[0][1], value: null });
                }} style={sel}>
                  {cols.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                {/* Condition */}
                <select value={f.operator} onChange={e => patch(f.id, { operator: e.target.value, value: null })} style={sel}>
                  {conds.map(([lbl, val]) => <option key={val} value={val}>{lbl}</option>)}
                </select>

                {/* Value */}
                {needsVal && <FilterValue filter={f} column={col} onChange={v => patch(f.id, { value: v })} />}
                {!needsVal && <div style={{ flex: 1 }} />}

                <button onClick={() => remove(f.id)} style={iconBtn}><IconX size={12} /></button>
              </div>
            );
          })}
          <button onClick={add} style={{ ...addBtn, marginTop: 2 }}><IconPlus size={11} /> Add filter</button>
        </div>
      )}
    </div>
  );
}

function FilterValue({ filter, column, onChange }: { filter: Filter; column: Column; onChange: (v: any) => void }) {
  const strVal = filter.value !== null && filter.value !== undefined ? String(filter.value) : '';

  if (column.type === 'status') {
    return <select value={strVal} onChange={e => onChange(e.target.value || null)} style={sel}>
      <option value="">Select…</option>
      {['Not started','In progress','Started','Done','Completed','Blocked'].map(o => <option key={o} value={o}>{o}</option>)}
    </select>;
  }
  if ((column.type === 'select' || column.type === 'multi_select') && column.config.options) {
    return <select value={strVal} onChange={e => onChange(e.target.value || null)} style={sel}>
      <option value="">Select…</option>
      {column.config.options.map(o => <option key={o.id} value={o.label}>{o.label}</option>)}
    </select>;
  }
  if (column.type === 'priority') {
    return <select value={strVal} onChange={e => onChange(e.target.value || null)} style={sel}>
      <option value="">Select…</option>
      {['High','Medium','Low'].map(o => <option key={o} value={o}>{o}</option>)}
    </select>;
  }
  if (column.type === 'date' || column.type === 'date_range') {
    return <input type="date" value={strVal} onChange={e => onChange(e.target.value || null)} style={{ ...sel, colorScheme: 'dark' }} />;
  }
  if (column.type === 'number') {
    return <input type="number" value={strVal} placeholder="Value" onChange={e => onChange(e.target.value !== '' ? Number(e.target.value) : null)} style={sel} />;
  }
  return <input type="text" value={strVal} placeholder="Value" onChange={e => onChange(e.target.value || null)} style={{ ...sel, minWidth: 120 }} />;
}

const sel: React.CSSProperties = {
  padding: '4px 8px', borderRadius: 5, border: '0.5px solid var(--color-border-default)',
  background: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)',
  fontSize: 'var(--text-xs)', outline: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)',
};
const addBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px',
  borderRadius: 5, border: 'none', background: 'none', color: 'var(--color-accent)',
  fontSize: 'var(--text-xs)', cursor: 'pointer', fontWeight: 500,
};
const iconBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: 20, height: 20, borderRadius: 4, border: 'none',
  background: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', flexShrink: 0,
};
