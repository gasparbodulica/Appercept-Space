'use client';

import { Database, ViewConfig, Sort } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { IconPlus, IconX, IconArrowUp, IconArrowDown } from '@tabler/icons-react';

interface SortPanelProps { database: Database; view: ViewConfig; }

export function SortPanel({ database, view }: SortPanelProps) {
  const { setSort } = useAppStore();
  const sorts = view.sorts ?? [];
  const cols = database.columns.sort((a, b) => a.position - b.position);
  const save = (next: Sort[]) => setSort(database.id, view.id, next);

  const add = () => {
    const available = cols.find(c => !sorts.find(s => s.column_id === c.id));
    if (!available) return;
    save([...sorts, { column_id: available.id, direction: 'asc' }]);
  };

  const remove = (colId: string) => save(sorts.filter(s => s.column_id !== colId));

  const toggleDir = (colId: string) =>
    save(sorts.map(s => s.column_id === colId ? { ...s, direction: s.direction === 'asc' ? 'desc' : 'asc' } : s));

  const changeCol = (oldId: string, newId: string) => {
    if (sorts.find(s => s.column_id === newId)) return;
    save(sorts.map(s => s.column_id === oldId ? { ...s, column_id: newId } : s));
  };

  return (
    <div style={{ borderBottom: '0.5px solid var(--color-border-subtle)', background: 'var(--color-bg-base)', padding: '8px 20px 12px' }}>
      {sorts.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>No sorts applied.</span>
          <button onClick={add} style={addBtn}><IconPlus size={11} /> Add sort</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {sorts.map((s, i) => (
            <div key={s.column_id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 46, textAlign: 'right', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', flexShrink: 0 }}>
                {i === 0 ? 'Sort by' : 'Then by'}
              </span>

              <select value={s.column_id} onChange={e => changeCol(s.column_id, e.target.value)} style={sel}>
                {cols.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              <button
                onClick={() => toggleDir(s.column_id)}
                style={{ ...sel, display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}
              >
                {s.direction === 'asc'
                  ? <><IconArrowUp size={11} /> A → Z</>
                  : <><IconArrowDown size={11} /> Z → A</>}
              </button>

              <button onClick={() => remove(s.column_id)} style={iconBtn}><IconX size={12} /></button>
            </div>
          ))}
          <button onClick={add} style={{ ...addBtn, marginTop: 2 }}><IconPlus size={11} /> Add sort</button>
        </div>
      )}
    </div>
  );
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
