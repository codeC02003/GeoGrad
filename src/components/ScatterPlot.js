import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { useApp } from '../context/AppContext';
import { passesFilters } from './FilterPanel';
import universityData from '../data/university_data.json';

const AXIS_OPTIONS = [
  { key: 'tuition_out',       label: 'Out-of-State Tuition' },
  { key: 'tuition_in',        label: 'In-State Tuition' },
  { key: 'admission_rate',    label: 'Admission Rate' },
  { key: 'graduation_rate',   label: 'Graduation Rate' },
  { key: 'retention_rate',    label: 'Retention Rate' },
  { key: 'enrollment_total',  label: 'Enrollment', log: true },
  { key: 'student_faculty_ratio', label: 'Student:Faculty Ratio' },
  { key: 'avg_inst_grant',    label: 'Avg Institutional Grant' },
];

function buildScale(key, data, range) {
  const cfg = AXIS_OPTIONS.find(o => o.key === key);
  const [mn, mx] = d3.extent(data, d => d[key]);
  if (cfg?.log && mn > 0) {
    return d3.scaleLog().domain([mn, mx]).range(range).nice();
  }
  return d3.scaleLinear().domain([mn, mx]).range(range).nice();
}

const ZERO_IS_MISSING = new Set(['admission_rate', 'graduation_rate', 'retention_rate']);

function isValid(v, key) {
  if (v == null || !Number.isFinite(v)) return false;
  if (v === 0 && ZERO_IS_MISSING.has(key)) return false;
  return true;
}

export default function ScatterPlot() {
  const wrapperRef = useRef(null);
  const [xKey, setXKey] = useState('tuition_out');
  const [yKey, setYKey] = useState('graduation_rate');
  const [resizeKey, setResizeKey] = useState(0);
  const { comparedUniversities, toggleCompareUniversity, filters } = useApp();

  const fnRef = useRef();
  fnRef.current = { toggleCompareUniversity };

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    let timer;
    const ro = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => setResizeKey(k => k + 1), 150);
    });
    ro.observe(wrapper);
    return () => { ro.disconnect(); clearTimeout(timer); };
  }, []);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const raf = requestAnimationFrame(() => {
      const fullWidth = wrapper.clientWidth;
      const fullHeight = wrapper.clientHeight;
      if (fullWidth < 100 || fullHeight < 100) return;

      const margin = { top: 24, right: 24, bottom: 50, left: 60 };
      const W = fullWidth - margin.left - margin.right;
      const H = fullHeight - margin.top - margin.bottom;

      const svg = d3.select(wrapper).select('svg');
      svg.selectAll('*').remove();
      svg.attr('width', fullWidth).attr('height', fullHeight);

      const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      const data = universityData.filter(u => isValid(u[xKey], xKey) && isValid(u[yKey], yKey));

      if (data.length === 0) {
        g.append('text').attr('x', W / 2).attr('y', H / 2)
          .attr('text-anchor', 'middle').attr('fill', '#A8A0C8')
          .attr('font-size', '14px').text('No data for this axis combination');
        return;
      }

      const xScale = buildScale(xKey, data, [0, W]);
      const yScale = buildScale(yKey, data, [H, 0]);

      // ── Grid ─────────────────────────────────────────────
      g.append('g')
        .selectAll('line').data(yScale.ticks(6)).join('line')
        .attr('x1', 0).attr('x2', W)
        .attr('y1', d => yScale(d)).attr('y2', d => yScale(d))
        .attr('stroke', 'rgba(99,102,241,0.07)');

      g.append('g')
        .selectAll('line').data(xScale.ticks(6)).join('line')
        .attr('y1', 0).attr('y2', H)
        .attr('x1', d => xScale(d)).attr('x2', d => xScale(d))
        .attr('stroke', 'rgba(99,102,241,0.07)');

      // ── Axes ─────────────────────────────────────────────
      const xAxisG = g.append('g').attr('transform', `translate(0,${H})`)
        .call(d3.axisBottom(xScale).ticks(6).tickFormat(d3.format('.2s')));
      xAxisG.selectAll('text').attr('fill', '#7C73A6').attr('font-size', '10px');
      xAxisG.selectAll('line, path').attr('stroke', 'rgba(99,102,241,0.15)');

      const yAxisG = g.append('g')
        .call(d3.axisLeft(yScale).ticks(6).tickFormat(d3.format('.2s')));
      yAxisG.selectAll('text').attr('fill', '#7C73A6').attr('font-size', '10px');
      yAxisG.selectAll('line, path').attr('stroke', 'rgba(99,102,241,0.15)');

      // ── Labels ───────────────────────────────────────────
      const xLabel = AXIS_OPTIONS.find(o => o.key === xKey)?.label || xKey;
      const yLabel = AXIS_OPTIONS.find(o => o.key === yKey)?.label || yKey;

      svg.append('text')
        .attr('x', margin.left + W / 2).attr('y', fullHeight - 6)
        .attr('text-anchor', 'middle').attr('fill', '#7C73A6')
        .attr('font-size', '11px').attr('font-family', 'Inter, sans-serif')
        .text(xLabel);

      svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -(margin.top + H / 2)).attr('y', 16)
        .attr('text-anchor', 'middle').attr('fill', '#7C73A6')
        .attr('font-size', '11px').attr('font-family', 'Inter, sans-serif')
        .text(yLabel);

      // ── Dots ─────────────────────────────────────────────
      const comparedIds = new Set(comparedUniversities.map(u => u.unitid));
      const hasFilters = Object.keys(filters).length > 0;

      const dots = g.append('g').selectAll('circle').data(data).join('circle')
        .attr('cx', d => xScale(d[xKey]))
        .attr('cy', d => yScale(d[yKey]))
        .attr('r', d => comparedIds.has(d.unitid) ? 5 : 3)
        .attr('fill', d => {
          if (comparedIds.has(d.unitid)) return '#6366F1';
          if (hasFilters && !passesFilters(d, filters)) return '#3B3660';
          return '#8B5CF6';
        })
        .attr('fill-opacity', d => {
          if (comparedIds.has(d.unitid)) return 0.95;
          if (hasFilters && !passesFilters(d, filters)) return 0.15;
          return 0.5;
        })
        .attr('stroke', d => comparedIds.has(d.unitid) ? '#1E1B4B' : 'none')
        .attr('stroke-width', d => comparedIds.has(d.unitid) ? 1.5 : 0)
        .style('pointer-events', 'none');

      function resetDots() {
        dots.attr('fill-opacity', d => {
            if (comparedIds.has(d.unitid)) return 0.95;
            if (hasFilters && !passesFilters(d, filters)) return 0.15;
            return 0.5;
          })
          .attr('r', d => comparedIds.has(d.unitid) ? 5 : 3)
          .attr('stroke', d => comparedIds.has(d.unitid) ? '#1E1B4B' : 'none')
          .attr('stroke-width', d => comparedIds.has(d.unitid) ? 1.5 : 0);
      }

      // ── Hover overlay + Tooltip ──────────────────────────
      const tooltip = d3.select(wrapper).select('.scatter-tooltip');

      g.append('rect')
        .attr('width', W).attr('height', H)
        .attr('fill', 'none')
        .style('pointer-events', 'all')
        .style('cursor', 'default')
        .on('mousemove', function (event) {
          const [mx, my] = d3.pointer(event, g.node());
          let best = null;
          let bestDist = 12;
          data.forEach(d => {
            const dist = Math.hypot(xScale(d[xKey]) - mx, yScale(d[yKey]) - my);
            if (dist < bestDist) { best = d; bestDist = dist; }
          });

          resetDots();

          if (best) {
            dots.filter(d => d.unitid === best.unitid)
              .attr('r', 6).attr('stroke', '#1E1B4B').attr('stroke-width', 1.5);
            const [tipX, tipY] = d3.pointer(event, wrapper);
            tooltip.style('display', 'block')
              .style('left', `${tipX + 14}px`)
              .style('top', `${tipY - 10}px`)
              .html(`<strong>${best.name}</strong><br/>${best.city}, ${best.state}`);
          } else {
            tooltip.style('display', 'none');
          }
        })
        .on('mouseleave', function () {
          resetDots();
          tooltip.style('display', 'none');
        })
        .on('click', function (event) {
          const [mx, my] = d3.pointer(event, g.node());
          let best = null;
          let bestDist = 14;
          data.forEach(d => {
            const dist = Math.hypot(xScale(d[xKey]) - mx, yScale(d[yKey]) - my);
            if (dist < bestDist) { best = d; bestDist = dist; }
          });
          if (best) fnRef.current.toggleCompareUniversity(best, false);
        });
    });

    return () => cancelAnimationFrame(raf);
  }, [xKey, yKey, comparedUniversities, filters, resizeKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="chart-container">
      <div className="chart-controls">
        <label>
          X:
          <select value={xKey} onChange={e => setXKey(e.target.value)}>
            {AXIS_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
        </label>
        <label>
          Y:
          <select value={yKey} onChange={e => setYKey(e.target.value)}>
            {AXIS_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
        </label>
        <span className="chart-hint">Hover for details &middot; Click dot to compare</span>
      </div>
      <div className="chart-svg-wrapper" ref={wrapperRef}>
        <svg />
        <div className="scatter-tooltip" />
      </div>
    </div>
  );
}
