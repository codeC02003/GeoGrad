import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { useApp } from '../context/AppContext';
import { passesFilters } from './FilterPanel';
import universityData from '../data/university_data.json';

const DEFAULT_AXES = [
  { key: 'tuition_out',       label: 'Tuition (Out)' },
  { key: 'admission_rate',    label: 'Admission Rate' },
  { key: 'graduation_rate',   label: 'Grad Rate' },
  { key: 'retention_rate',    label: 'Retention' },
  { key: 'enrollment_total',  label: 'Enrollment' },
  { key: 'avg_inst_grant',    label: 'Avg Grant' },
  { key: 'student_faculty_ratio', label: 'Stu:Fac' },
];

export default function ParallelCoordinates() {
  const svgRef = useRef(null);
  const [resizeKey, setResizeKey] = useState(0);
  const axisOrderRef = useRef(DEFAULT_AXES.map(a => a.key));
  const brushesRef = useRef({});
  const { comparedUniversities, toggleCompareUniversity, filters } = useApp();

  const fnRef = useRef();
  fnRef.current = { toggleCompareUniversity };

  useEffect(() => {
    const el = svgRef.current?.parentElement;
    if (!el) return;
    let timer;
    const ro = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => setResizeKey(k => k + 1), 150);
    });
    ro.observe(el);
    return () => { ro.disconnect(); clearTimeout(timer); };
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;

    const raf = requestAnimationFrame(() => {
      const container = svgRef.current?.parentElement;
      if (!container) return;
      const fullWidth = container.clientWidth;
      const fullHeight = container.clientHeight;
      if (fullWidth < 50 || fullHeight < 50) return;

      const margin = { top: 36, right: 30, bottom: 12, left: 30 };
      const width = fullWidth - margin.left - margin.right;
      const height = fullHeight - margin.top - margin.bottom;

      const svg = d3.select(svgRef.current);
      svg.selectAll('*').remove();
      svg.attr('width', fullWidth).attr('height', fullHeight);

      const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

      let axes = axisOrderRef.current.map(key => DEFAULT_AXES.find(a => a.key === key)).filter(Boolean);

      const data = universityData.filter(u => {
        if (u.lat == null || u.lon == null) return false;
        const validCount = axes.filter(a => u[a.key] != null).length;
        return validCount >= 2;
      });

      const comparedIds = new Set(comparedUniversities.map(u => u.unitid));
      const hasFilters = Object.keys(filters).length > 0;
      const activeBrushes = brushesRef.current;

      const yScales = {};
      axes.forEach(a => {
        const vals = data.map(d => d[a.key]).filter(v => v != null);
        if (vals.length === 0) {
          yScales[a.key] = d3.scaleLinear().domain([0, 1]).range([height, 0]);
          return;
        }
        yScales[a.key] = d3.scaleLinear()
          .domain(d3.extent(vals))
          .range([height, 0]).nice();
      });

      const xScale = d3.scalePoint()
        .domain(axes.map(a => a.key))
        .range([0, width]).padding(0.1);

      const positions = {};
      axes.forEach(a => { positions[a.key] = xScale(a.key); });

      function passesBrushes(d) {
        for (const key of Object.keys(activeBrushes)) {
          const [y0, y1] = activeBrushes[key];
          const v = d[key];
          if (v == null) return false;
          const scaledV = yScales[key](v);
          if (scaledV < y0 || scaledV > y1) return false;
        }
        return true;
      }

      function isHighlighted(d) {
        const hasBrush = Object.keys(activeBrushes).length > 0;
        const brushOk = !hasBrush || passesBrushes(d);
        const filterOk = !hasFilters || passesFilters(d, filters);
        return brushOk && filterOk;
      }

      function makeLinePath(d, overrideKey, overrideX) {
        const pts = axes.map(a => {
          const v = d[a.key];
          const x = a.key === overrideKey ? overrideX : positions[a.key];
          return v != null ? [x, yScales[a.key](v)] : [x, null];
        });
        return d3.line().defined(p => p[1] !== null)(pts);
      }

      function linePath(d) {
        return makeLinePath(d, null, null);
      }

      function updateLineStyles() {
        lines
          .attr('stroke', d => comparedIds.has(d.unitid) ? '#6366F1' : isHighlighted(d) ? '#8B5CF6' : '#3B3660')
          .attr('stroke-width', d => comparedIds.has(d.unitid) ? 2.5 : isHighlighted(d) ? 0.8 : 0.4)
          .attr('stroke-opacity', d => {
            if (comparedIds.has(d.unitid)) return 0.9;
            return isHighlighted(d) ? 0.25 : 0.03;
          })
          .style('pointer-events', d => isHighlighted(d) || comparedIds.has(d.unitid) ? 'stroke' : 'none')
          .attr('cursor', d => isHighlighted(d) || comparedIds.has(d.unitid) ? 'pointer' : 'default');
      }

      const linesLayer = g.append('g').attr('class', 'lines-layer');
      const lines = linesLayer.selectAll('.pc-line').data(data).join('path')
        .attr('class', 'pc-line')
        .attr('d', linePath)
        .attr('fill', 'none')
        .attr('stroke', d => comparedIds.has(d.unitid) ? '#6366F1' : isHighlighted(d) ? '#8B5CF6' : '#3B3660')
        .attr('stroke-width', d => comparedIds.has(d.unitid) ? 2.5 : isHighlighted(d) ? 0.8 : 0.4)
        .attr('stroke-opacity', d => {
          if (comparedIds.has(d.unitid)) return 0.9;
          return isHighlighted(d) ? 0.25 : 0.03;
        })
        .style('pointer-events', d => isHighlighted(d) || comparedIds.has(d.unitid) ? 'stroke' : 'none')
        .attr('cursor', d => isHighlighted(d) || comparedIds.has(d.unitid) ? 'pointer' : 'default')
        .on('mouseenter', function(event, d) {
          if (!isHighlighted(d) && !comparedIds.has(d.unitid)) return;
          d3.select(this).attr('stroke-opacity', 0.9).attr('stroke-width', 2.5).raise();
          tooltip.style('display', 'block')
            .style('left', `${event.offsetX + 12}px`)
            .style('top', `${event.offsetY - 10}px`)
            .html(`<strong>${d.name}</strong><br/>${d.city}, ${d.state}`);
        })
        .on('mouseleave', function(_, d) {
          const isComp = comparedIds.has(d.unitid);
          d3.select(this)
            .attr('stroke-opacity', isComp ? 0.9 : isHighlighted(d) ? 0.25 : 0.03)
            .attr('stroke-width', isComp ? 2.5 : isHighlighted(d) ? 0.8 : 0.4);
          tooltip.style('display', 'none');
        })
        .on('click', function(event, d) {
          if (!isHighlighted(d) && !comparedIds.has(d.unitid)) return;
          event.stopPropagation();
          const uni = universityData.find(u => u.unitid === d.unitid);
          if (uni) fnRef.current.toggleCompareUniversity(uni, false);
        });

      const tooltip = d3.select(container).select('.pc-tooltip');

      const axesLayer = g.append('g').attr('class', 'axes-layer');
      const axisGroups = {};

      axes.forEach(a => {
        const axisG = axesLayer.append('g')
          .attr('class', 'pc-axis')
          .attr('transform', `translate(${positions[a.key]},0)`)
          .datum(a.key);

        axisGroups[a.key] = axisG;

        const axis = axisG.append('g')
          .call(d3.axisLeft(yScales[a.key]).ticks(5).tickFormat(d3.format('.2s')));
        axis.selectAll('text').attr('fill', '#7C73A6').attr('font-size', '9px');
        axis.selectAll('line, path').attr('stroke', 'rgba(99,102,241,0.15)');

        // Brush on each axis
        const brushWidth = 24;
        const brush = d3.brushY()
          .extent([[-brushWidth / 2, 0], [brushWidth / 2, height]])
          .on('brush', function(event) {
            if (!event.sourceEvent) return;
            if (event.selection) {
              activeBrushes[a.key] = event.selection;
            } else {
              delete activeBrushes[a.key];
            }
            updateLineStyles();
          })
          .on('end', function(event) {
            if (!event.sourceEvent) return;
            if (event.selection) {
              activeBrushes[a.key] = event.selection;
            } else {
              delete activeBrushes[a.key];
            }
            brushesRef.current = { ...activeBrushes };
            updateLineStyles();
          });

        const brushG = axisG.append('g')
          .attr('class', 'pc-brush')
          .call(brush);

        if (activeBrushes[a.key]) {
          brushG.call(brush.move, activeBrushes[a.key]);
        }

        brushG.selectAll('.selection')
          .attr('fill', 'rgba(99,102,241,0.25)')
          .attr('stroke', '#6366F1')
          .attr('stroke-width', 1);
        brushG.selectAll('.handle')
          .attr('fill', '#6366F1')
          .attr('rx', 2);

        const label = axisG.append('text')
          .attr('y', -16).attr('text-anchor', 'middle')
          .attr('fill', '#4C4578')
          .attr('font-size', '10px').attr('font-weight', '600')
          .attr('font-family', 'Inter, sans-serif')
          .attr('cursor', 'grab')
          .text(a.label);

        label.call(d3.drag()
          .on('start', function() {
            d3.select(this).attr('cursor', 'grabbing');
            d3.select(this.parentNode).raise();
          })
          .on('drag', function(event) {
            const currentX = positions[a.key] + event.x;
            d3.select(this.parentNode).attr('transform', `translate(${currentX},0)`);
            lines.attr('d', d => makeLinePath(d, a.key, currentX));
          })
          .on('end', function(event) {
            d3.select(this).attr('cursor', 'grab');
            const finalX = positions[a.key] + event.x;

            const sorted = axes.map(ax => ({
              key: ax.key,
              x: ax.key === a.key ? finalX : positions[ax.key],
            })).sort((p1, p2) => p1.x - p2.x);

            const newOrder = sorted.map(p => p.key);
            axisOrderRef.current = newOrder;
            axes = newOrder.map(key => DEFAULT_AXES.find(ax => ax.key === key)).filter(Boolean);

            xScale.domain(newOrder);
            axes.forEach(ax => { positions[ax.key] = xScale(ax.key); });

            axes.forEach(ax => {
              axisGroups[ax.key]
                .transition().duration(300).ease(d3.easeCubicOut)
                .attr('transform', `translate(${positions[ax.key]},0)`);
            });

            lines.transition().duration(300).ease(d3.easeCubicOut)
              .attr('d', linePath);
          })
        );
      });
    });

    return () => cancelAnimationFrame(raf);
  }, [comparedUniversities, filters, resizeKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="chart-container">
      <div className="chart-controls">
        <span className="chart-hint">Drag axis label to reorder &middot; Drag on axis to brush/filter &middot; Click line to compare</span>
      </div>
      <div className="chart-svg-wrapper">
        <svg ref={svgRef} />
        <div className="pc-tooltip" />
      </div>
    </div>
  );
}
