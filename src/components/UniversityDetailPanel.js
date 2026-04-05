import React from 'react';
import * as d3 from 'd3';
import { useApp } from '../context/AppContext';

const fmt    = v => v != null ? d3.format(',')(Math.round(v)) : '—';
const pct    = v => v != null ? `${(v * 100).toFixed(1)}%` : '—';
const pctRaw = v => v != null ? `${v.toFixed(1)}%` : '—';
const dollar = v => v != null ? `$${d3.format(',')(Math.round(v))}` : '—';
const rank   = v => v != null ? `#${Math.round(v)}` : '—';

export default function UniversityDetailPanel() {
  const { selectedUniversity: uni, setSelectedUniversity } = useApp();
  if (!uni) return null;

  const href = uni.website
    ? (uni.website.startsWith('http') ? uni.website : `https://${uni.website}`)
    : null;

  return (
    <div className="uni-detail-panel">
      <div className="uni-detail-header">
        <div>
          <div className="uni-detail-name">{uni.name}</div>
          <div className="uni-detail-meta">
            {uni.city}, {uni.state} &middot; {uni.control_label}
          </div>
        </div>
        <div className="uni-detail-actions">
          {href && (
            <a href={href} target="_blank" rel="noopener noreferrer" className="uni-website-link">
              Visit Website &#8599;
            </a>
          )}
          <button className="uni-close-btn" onClick={() => setSelectedUniversity(null)}>
            &#10005;
          </button>
        </div>
      </div>

      <div className="uni-detail-grid">
        <div className="uni-detail-section">
          <div className="uni-section-title">Academics</div>
          <div className="uni-stat-row"><span>Admission Rate</span><span>{pct(uni.admission_rate)}</span></div>
          <div className="uni-stat-row"><span>SAT Average</span><span>{fmt(uni.sat_avg)}</span></div>
          <div className="uni-stat-row"><span>Graduation Rate</span><span>{pctRaw(uni.graduation_rate)}</span></div>
          <div className="uni-stat-row"><span>Retention Rate</span><span>{pctRaw(uni.retention_rate)}</span></div>
          <div className="uni-stat-row"><span>CS Degree %</span><span>{uni.pct_cs_degrees != null ? `${(uni.pct_cs_degrees * 100).toFixed(1)}%` : '—'}</span></div>
        </div>

        <div className="uni-detail-section">
          <div className="uni-section-title">Enrollment</div>
          <div className="uni-stat-row"><span>Total</span><span>{fmt(uni.enrollment_total)}</span></div>
          <div className="uni-stat-row"><span>Undergraduate</span><span>{fmt(uni.enrollment_ug)}</span></div>
          <div className="uni-stat-row"><span>Graduate</span><span>{fmt(uni.enrollment_grad)}</span></div>
          <div className="uni-stat-row"><span>Student : Faculty</span><span>{uni.student_faculty_ratio ? `${uni.student_faculty_ratio}:1` : '—'}</span></div>
        </div>

        <div className="uni-detail-section">
          <div className="uni-section-title">Cost</div>
          <div className="uni-stat-row"><span>In-State Tuition</span><span>{dollar(uni.tuition_in)}</span></div>
          <div className="uni-stat-row"><span>Out-of-State</span><span>{dollar(uni.tuition_out)}</span></div>
          <div className="uni-stat-row"><span>Grad In-State</span><span>{dollar(uni.tuition_grad_in)}</span></div>
          <div className="uni-stat-row"><span>Grad Out-State</span><span>{dollar(uni.tuition_grad_out)}</span></div>
          <div className="uni-stat-row"><span>Avg Grant</span><span>{dollar(uni.avg_inst_grant)}</span></div>
        </div>

        <div className="uni-detail-section">
          <div className="uni-section-title">Rankings</div>
          <div className="uni-stat-row"><span>CS (US)</span><span>{rank(uni.cs_rank)}</span></div>
          <div className="uni-stat-row"><span>CS (Global)</span><span>{rank(uni.cs_global_rank)}</span></div>
          <div className="uni-stat-row"><span>Overall (US)</span><span>{rank(uni.overall_rank)}</span></div>
          <div className="uni-stat-row"><span>Overall (Global)</span><span>{rank(uni.overall_global_rank)}</span></div>
          <div className="uni-stat-row"><span>Research (US)</span><span>{rank(uni.research_rank)}</span></div>
          <div className="uni-stat-row"><span>Research (Global)</span><span>{rank(uni.research_global_rank)}</span></div>
        </div>
      </div>
    </div>
  );
}
