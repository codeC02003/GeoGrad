import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import universityData from '../data/university_data.json';

const RADAR_METRICS = [
  { key: 'admission_rate',    label: 'Admission',    invert: false },
  { key: 'graduation_rate',   label: 'Grad Rate',    invert: false },
  { key: 'retention_rate',    label: 'Retention',     invert: false },
  { key: 'tuition_out',       label: 'Tuition',      invert: true },
  { key: 'sat_avg',           label: 'SAT',          invert: false },
  { key: 'avg_inst_grant',    label: 'Grant Aid',    invert: false },
  { key: 'enrollment_total',  label: 'Enrollment',   invert: false },
  { key: 'student_faculty_ratio', label: 'Stu:Fac',  invert: true },
];

const COLORS = ['#3b82f6', '#f97316', '#22c55e', '#a855f7', '#ef4444', '#eab308'];

export default function RadarChart({ universities }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !universities || universities.length === 0) return;

    const width = 280;
    const height = 280;
    const margin = 50;
    const radius = Math.min(width, height) / 2 - margin;
    const levels = 5;
    const n = RADAR_METRICS.length;
    const angleSlice = (2 * Math.PI) / n;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    // Normalize using the full dataset so the radar shows absolute position
    const scales = {};
    RADAR_METRICS.forEach(m => {
      const allVals = universityData.map(u => u[m.key]).filter(v => v != null && v !== 0);
      if (allVals.length === 0) { scales[m.key] = null; return; }
      const [mn, mx] = d3.extent(allVals);
      if (mn === mx) { scales[m.key] = () => 0.5; return; }
      scales[m.key] = m.invert
        ? d3.scaleLinear().domain([mx, mn]).range([0, 1]).clamp(true)
        : d3.scaleLinear().domain([mn, mx]).range([0, 1]).clamp(true);
    });

    // Grid circles
    for (let lvl = 1; lvl <= levels; lvl++) {
      g.append('circle')
        .attr('r', (radius / levels) * lvl)
        .attr('fill', 'none')
        .attr('stroke', 'rgba(99,102,241,0.10)');
    }

    // Axis lines and labels
    RADAR_METRICS.forEach((m, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      g.append('line')
        .attr('x1', 0).attr('y1', 0).attr('x2', x).attr('y2', y)
        .attr('stroke', 'rgba(99,102,241,0.08)');

      g.append('text')
        .attr('x', Math.cos(angle) * (radius + 18))
        .attr('y', Math.sin(angle) * (radius + 18))
        .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
        .attr('fill', '#7C73A6')
        .attr('font-size', '10px').attr('font-family', 'Inter, sans-serif')
        .text(m.label);
    });

    // Draw polygon for each university — skip null axes (draw segments only between known points)
    const lineRadial = d3.lineRadial()
      .radius(d => d.r)
      .angle(d => d.angle)
      .defined(d => d.r !== null)
      .curve(d3.curveLinearClosed);

    universities.forEach((uni, uIdx) => {
      const points = RADAR_METRICS.map((m, i) => {
        const val = uni[m.key];
        const scale = scales[m.key];
        if (val == null || scale == null) return { angle: angleSlice * i, r: null };
        return { angle: angleSlice * i, r: scale(val) * radius };
      });

      const validPoints = points.filter(p => p.r !== null);
      if (validPoints.length < 2) return;

      const color = COLORS[uIdx % COLORS.length];

      g.append('path')
        .datum(validPoints)
        .attr('d', lineRadial)
        .attr('fill', color).attr('fill-opacity', 0.12)
        .attr('stroke', color).attr('stroke-width', 2).attr('stroke-opacity', 0.8);

      validPoints.forEach(p => {
        g.append('circle')
          .attr('cx', Math.cos(p.angle - Math.PI / 2) * p.r)
          .attr('cy', Math.sin(p.angle - Math.PI / 2) * p.r)
          .attr('r', 3).attr('fill', color).attr('stroke', '#1E1B4B').attr('stroke-width', 1);
      });
    });

  }, [universities]);

  return (
    <div className="radar-wrapper">
      <svg ref={svgRef} />
      <div className="radar-legend">
        {universities.map((uni, i) => (
          <div key={uni.unitid} className="radar-legend-item">
            <span className="radar-legend-swatch" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="radar-legend-name">{uni.name.length > 30 ? uni.name.slice(0, 28) + '\u2026' : uni.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
