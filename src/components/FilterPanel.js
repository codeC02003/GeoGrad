import React, { useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import universityData from '../data/university_data.json';

const FILTER_METRICS = [
  { key: 'tuition_out',       label: 'Out-of-State Tuition', format: v => `$${Math.round(v).toLocaleString()}`, step: 1000 },
  { key: 'tuition_in',        label: 'In-State Tuition',     format: v => `$${Math.round(v).toLocaleString()}`, step: 1000 },
  { key: 'graduation_rate',   label: 'Graduation Rate',      format: v => `${v.toFixed(0)}%`, step: 1 },
  { key: 'retention_rate',    label: 'Retention Rate',        format: v => `${v.toFixed(0)}%`, step: 1 },
  { key: 'admission_rate',    label: 'Admission Rate',        format: v => `${(v * 100).toFixed(0)}%`, step: 0.01 },
  { key: 'enrollment_total',  label: 'Enrollment',            format: v => Math.round(v).toLocaleString(), step: 500 },
  { key: 'avg_inst_grant',    label: 'Avg Grant',             format: v => `$${Math.round(v).toLocaleString()}`, step: 500 },
];

const ranges = {};
FILTER_METRICS.forEach(m => {
  const vals = universityData.map(u => u[m.key]).filter(v => v != null && v !== 0 && Number.isFinite(v));
  if (vals.length === 0) { ranges[m.key] = [0, 1]; return; }
  ranges[m.key] = [Math.min(...vals), Math.max(...vals)];
});

export function passesFilters(uni, filters) {
  for (const key of Object.keys(filters)) {
    const f = filters[key];
    if (!f) continue;
    const v = uni[key];
    if (v == null || v === 0) continue;
    if (f.min != null && v < f.min) return false;
    if (f.max != null && v > f.max) return false;
  }
  return true;
}

export function activeFilterCount(filters) {
  return Object.values(filters).filter(f => f && (f.min != null || f.max != null)).length;
}

export default function FilterPanel() {
  const { filters, setFilters } = useApp();

  const matchCount = useMemo(() => {
    return universityData.filter(u => passesFilters(u, filters)).length;
  }, [filters]);

  const count = activeFilterCount(filters);

  const updateFilter = useCallback((key, side, value) => {
    setFilters(prev => {
      const cur = prev[key] || {};
      const r = ranges[key];
      const numVal = parseFloat(value);
      const isAtBound = side === 'min' ? numVal <= r[0] : numVal >= r[1];
      const next = { ...cur, [side]: isAtBound ? null : numVal };
      if (next.min == null && next.max == null) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: next };
    });
  }, [setFilters]);

  const clearAll = useCallback(() => setFilters({}), [setFilters]);

  return (
    <div className="filter-panel">
      <div className="filter-header">
        <span className="filter-title">
          Filter Universities
          {count > 0 && <span className="sidebar-badge">{count}</span>}
        </span>
        {count > 0 && (
          <button className="filter-clear" onClick={clearAll}>Reset</button>
        )}
      </div>
      <div className="filter-match-count">
        {matchCount.toLocaleString()} of {universityData.length.toLocaleString()} universities
      </div>
      <div className="filter-sliders">
        {FILTER_METRICS.map(m => {
          const r = ranges[m.key];
          const f = filters[m.key] || {};
          const curMin = f.min != null ? f.min : r[0];
          const curMax = f.max != null ? f.max : r[1];
          const isActive = f.min != null || f.max != null;
          return (
            <div key={m.key} className={`filter-row${isActive ? ' filter-row--active' : ''}`}>
              <div className="filter-label">{m.label}</div>
              <div className="filter-range-inputs">
                <input
                  type="range"
                  min={r[0]}
                  max={r[1]}
                  step={m.step}
                  value={curMin}
                  onChange={e => updateFilter(m.key, 'min', e.target.value)}
                  className="filter-slider filter-slider--min"
                />
                <input
                  type="range"
                  min={r[0]}
                  max={r[1]}
                  step={m.step}
                  value={curMax}
                  onChange={e => updateFilter(m.key, 'max', e.target.value)}
                  className="filter-slider filter-slider--max"
                />
              </div>
              <div className="filter-values">
                <span>{m.format(curMin)}</span>
                <span>{m.format(curMax)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
