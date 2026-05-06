import React from 'react';
import { useApp } from '../context/AppContext';
import { haversineDistance, formatDistance } from '../utils/distance';
import RadarChart from './RadarChart';

const ZERO_IS_MISSING = new Set(['admission_rate', 'graduation_rate', 'retention_rate']);

const COMPARE_METRICS = [
  { key: 'tuition_in',        label: 'In-State Tuition',   format: v => `$${v.toLocaleString()}` },
  { key: 'tuition_out',       label: 'Out-of-State Tuition', format: v => `$${v.toLocaleString()}` },
  { key: 'admission_rate',    label: 'Admission Rate',      format: v => `${(v * 100).toFixed(1)}%` },
  { key: 'graduation_rate',   label: 'Graduation Rate',     format: v => `${v.toFixed(1)}%` },
  { key: 'retention_rate',    label: 'Retention Rate',      format: v => `${v.toFixed(1)}%` },
  { key: 'enrollment_total',  label: 'Enrollment',          format: v => v.toLocaleString() },
  { key: 'student_faculty_ratio', label: 'Student:Faculty', format: v => `${v}:1` },
  { key: 'avg_inst_grant',    label: 'Avg Grant',           format: v => `$${v.toLocaleString()}` },
  { key: 'overall_rank',      label: 'Overall Rank (US)',   format: v => `#${Math.round(v)}` },
];

const LOWER_IS_BETTER = new Set(['tuition_in', 'tuition_out', 'student_faculty_ratio', 'overall_rank']);

function bestIndex(values, key) {
  const nums  = values.map(v => (v == null ? null : parseFloat(v)));
  const valid = nums.filter(v => v != null);
  if (valid.length < 2) return -1;
  const target = LOWER_IS_BETTER.has(key) ? Math.min(...valid) : Math.max(...valid);
  return nums.indexOf(target);
}

export default function UniversityComparisonPanel() {
  const { comparedUniversities, toggleCompareUniversity, clearComparedUniversities, referencePoint } = useApp();
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

      {comparedUniversities.length >= 2 && (
        <div className="cp-radar-area">
          <RadarChart universities={comparedUniversities} />
        </div>
      )}

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

        {/* Website row */}
        <div className="cp-row cp-row--website">
          <div className="cp-label-cell">Website</div>
          {comparedUniversities.map(uni => {
            const href = uni.website
              ? (uni.website.startsWith('http') ? uni.website : `https://${uni.website}`)
              : null;
            return (
              <div key={uni.unitid} className="cp-value-cell">
                {href
                  ? <a href={href} target="_blank" rel="noopener noreferrer" className="cp-website-link">Visit &#8599;</a>
                  : <span className="cp-na">&mdash;</span>}
              </div>
            );
          })}
        </div>

        {/* Metric rows */}
        {COMPARE_METRICS.map(({ key, label, format }) => {
          const values = comparedUniversities.map(uni => {
            const v = uni[key] ?? null;
            return (v === 0 && ZERO_IS_MISSING.has(key)) ? null : v;
          });
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

        {/* Distance row — shown when reference pin is placed */}
        {referencePoint && (
          <div className="cp-row cp-row--distance">
            <div className="cp-label-cell">
              <span className="cp-distance-icon" />
              Distance (straight-line)
            </div>
            {comparedUniversities.map(uni => {
              const d = (uni.lat != null && uni.lon != null)
                ? haversineDistance(referencePoint.lat, referencePoint.lng, uni.lat, uni.lon)
                : null;
              return (
                <div key={uni.unitid} className="cp-value-cell">
                  {d != null ? formatDistance(d) : <span className="cp-na">&mdash;</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
