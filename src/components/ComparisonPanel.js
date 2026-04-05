import React from 'react';
import { useApp } from '../context/AppContext';
import stateData from '../data/state_data.json';

const COMPARE_METRICS = [
  { key: 'university_count',  label: 'Universities',         format: v => v },
  { key: 'tuition_out',       label: 'Out-of-State Tuition', format: v => `$${v.toLocaleString()}` },
  { key: 'tuition_in',        label: 'In-State Tuition',     format: v => `$${v.toLocaleString()}` },
  { key: 'admission_rate',    label: 'Admission Rate',       format: v => `${(v * 100).toFixed(1)}%` },
  { key: 'grad_rate',         label: '6-yr Grad Rate',       format: v => `${v.toFixed(1)}%` },
  { key: 'retention_rate',    label: 'Retention Rate',       format: v => `${v.toFixed(1)}%` },
  { key: 'avg_inst_grant',    label: 'Avg Inst. Grant',      format: v => `$${v.toLocaleString()}` },
  { key: 'cost_total',        label: 'Cost of Living',       format: v => `$${v.toLocaleString()}` },
  { key: 'safety_incidents',  label: 'Hate Crimes',          format: v => v.toLocaleString() },
  { key: 'avg_temp_high_f',   label: 'Avg High Temp',        format: v => `${v.toFixed(1)}°F` },
  { key: 'best_cs_rank',      label: 'Best CS Rank',         format: v => `#${Math.round(v)}` },
];

const LOWER_IS_BETTER = new Set(['tuition_out','tuition_in','safety_incidents','cost_total']);

function bestIndex(values, key) {
  const nums  = values.map(v => (v == null ? null : parseFloat(v)));
  const valid = nums.filter(v => v != null);
  if (valid.length < 2) return -1;
  const target = LOWER_IS_BETTER.has(key) ? Math.min(...valid) : Math.max(...valid);
  return nums.indexOf(target);
}

export default function ComparisonPanel() {
  const { selectedStates, toggleState } = useApp();
  if (selectedStates.length === 0) return null;

  return (
    <div className="comparison-panel">
      <div className="cp-header">
        <span className="cp-title">State Comparison</span>
        <span className="cp-hint">click state to remove</span>
      </div>

      <div className="cp-table">
        {/* Column headers */}
        <div className="cp-row cp-header-row">
          <div className="cp-label-cell" />
          {selectedStates.map(abbr => (
            <div key={abbr} className="cp-state-chip" onClick={() => toggleState(abbr)}>
              <div className="cp-abbr">{abbr}</div>
              <div className="cp-name">{stateData[abbr]?.state_name || abbr}</div>
              <div className="cp-remove">✕</div>
            </div>
          ))}
        </div>

        {/* Metric rows */}
        {COMPARE_METRICS.map(({ key, label, format }) => {
          const values = selectedStates.map(abbr => stateData[abbr]?.[key] ?? null);
          const best   = bestIndex(values, key);
          return (
            <div key={key} className="cp-row">
              <div className="cp-label-cell">{label}</div>
              {values.map((val, i) => (
                <div
                  key={selectedStates[i]}
                  className={`cp-value-cell${i === best ? ' cp-best' : ''}`}
                >
                  {val != null ? format(val) : <span className="cp-na">—</span>}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
