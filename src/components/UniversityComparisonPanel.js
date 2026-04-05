import React from 'react';
import { useApp } from '../context/AppContext';

const COMPARE_METRICS = [
  { key: 'tuition_in',        label: 'In-State Tuition',   format: v => `$${v.toLocaleString()}` },
  { key: 'tuition_out',       label: 'Out-of-State Tuition', format: v => `$${v.toLocaleString()}` },
  { key: 'admission_rate',    label: 'Admission Rate',      format: v => `${(v * 100).toFixed(1)}%` },
  { key: 'graduation_rate',   label: 'Graduation Rate',     format: v => `${v.toFixed(1)}%` },
  { key: 'retention_rate',    label: 'Retention Rate',      format: v => `${v.toFixed(1)}%` },
  { key: 'enrollment_total',  label: 'Enrollment',          format: v => v.toLocaleString() },
  { key: 'sat_avg',           label: 'SAT Average',         format: v => Math.round(v).toLocaleString() },
  { key: 'student_faculty_ratio', label: 'Student:Faculty', format: v => `${v}:1` },
  { key: 'avg_inst_grant',    label: 'Avg Grant',           format: v => `$${v.toLocaleString()}` },
  { key: 'cs_rank',           label: 'CS Rank (US)',        format: v => `#${Math.round(v)}` },
  { key: 'overall_rank',      label: 'Overall Rank (US)',   format: v => `#${Math.round(v)}` },
];

const LOWER_IS_BETTER = new Set(['tuition_in', 'tuition_out', 'student_faculty_ratio', 'cs_rank', 'overall_rank']);

function bestIndex(values, key) {
  const nums  = values.map(v => (v == null ? null : parseFloat(v)));
  const valid = nums.filter(v => v != null);
  if (valid.length < 2) return -1;
  const target = LOWER_IS_BETTER.has(key) ? Math.min(...valid) : Math.max(...valid);
  return nums.indexOf(target);
}

export default function UniversityComparisonPanel() {
  const { comparedUniversities, toggleCompareUniversity, clearComparedUniversities } = useApp();
  if (comparedUniversities.length === 0) return null;

  return (
    <div className="comparison-panel uni-comparison-panel">
      <div className="cp-header">
        <span className="cp-title">University Comparison</span>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span className="cp-hint">click name to remove</span>
          {comparedUniversities.length > 1 && (
            <button className="cp-clear-btn" onClick={clearComparedUniversities}>
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className="cp-table">
        {/* Column headers */}
        <div className="cp-row cp-header-row">
          <div className="cp-label-cell" />
          {comparedUniversities.map(uni => (
            <div key={uni.unitid} className="cp-state-chip cp-uni-chip" onClick={() => toggleCompareUniversity(uni)}>
              <div className="cp-abbr">{uni.state}</div>
              <div className="cp-name cp-uni-name">{uni.name}</div>
              <div className="cp-remove">&times;</div>
            </div>
          ))}
        </div>

        {/* Metric rows */}
        {COMPARE_METRICS.map(({ key, label, format }) => {
          const values = comparedUniversities.map(uni => uni[key] ?? null);
          const best   = bestIndex(values, key);
          return (
            <div key={key} className="cp-row">
              <div className="cp-label-cell">{label}</div>
              {values.map((val, i) => (
                <div
                  key={comparedUniversities[i].unitid}
                  className={`cp-value-cell${i === best ? ' cp-best' : ''}`}
                >
                  {val != null ? format(val) : <span className="cp-na">&mdash;</span>}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
