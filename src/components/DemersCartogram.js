import { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { useApp } from '../context/AppContext';
import { METRICS } from './NationalMap';
import geoJson from '../data/us-states.json';

// Map metric keys → university-level field names
const UNI_FIELD = {
  tuition_out:    'tuition_out',
  tuition_in:     'tuition_in',
  admission_rate: 'admission_rate',
  grad_rate:      'graduation_rate',
  retention_rate: 'retention_rate',
};

// ── Polygon helpers ─────────────────────────────────────────────────────────

// Project GeoJSON rings to screen pixel coordinates
function projectRings(map, geometry) {
  const polys = geometry.type === 'MultiPolygon'
    ? geometry.coordinates.map(p => p[0])
    : [geometry.coordinates[0]];
  return polys.map(ring =>
    ring.map(([lon, lat]) => {
      const pt = map.latLngToContainerPoint([lat, lon]);
      return [pt.x, pt.y];
    }),
  );
}

// Ray-casting point-in-polygon
function pip(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}

function insideState(x, y, rings) {
  return rings.some(r => pip(x, y, r));
}

// Bounding box, centroid, and area of projected rings
function polyMetrics(rings) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let cx = 0, cy = 0, n = 0;
  let totalArea = 0;
  for (const ring of rings) {
    for (const [x, y] of ring) {
      if (x < minX) minX = x; if (y < minY) minY = y;
      if (x > maxX) maxX = x; if (y > maxY) maxY = y;
      cx += x; cy += y; n++;
    }
    // Shoelace area
    let a = 0;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      a += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]);
    }
    totalArea += Math.abs(a / 2);
  }
  return {
    bbox: { x: minX, y: minY, w: maxX - minX, h: maxY - minY },
    centroid: [cx / n, cy / n],
    area: totalArea,
  };
}

// ── Forces ──────────────────────────────────────────────────────────────────

// Custom rectangular collision (axis-aligned, O(n²))
function forceCollideRect(sideAccessor) {
  let nodes;
  const padding = 2;
  function force(alpha) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const halfA = (sideAccessor(a) + padding) / 2;
        const halfB = (sideAccessor(b) + padding) / 2;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const overlapX = (halfA + halfB) - Math.abs(dx);
        const overlapY = (halfA + halfB) - Math.abs(dy);
        if (overlapX > 0 && overlapY > 0) {
          const s = alpha * 0.7;
          if (overlapX < overlapY) {
            const shift = overlapX * s;
            const sign = dx > 0 ? 1 : -1;
            a.x -= (shift / 2) * sign;
            b.x += (shift / 2) * sign;
          } else {
            const shift = overlapY * s;
            const sign = dy > 0 ? 1 : -1;
            a.y -= (shift / 2) * sign;
            b.y += (shift / 2) * sign;
          }
        }
      }
    }
  }
  force.initialize = (_) => { nodes = _; };
  return force;
}

// Push nodes back inside the polygon boundary
function forceBoundary(rings, centroid) {
  let nodes;
  function force(alpha) {
    for (const n of nodes) {
      if (!insideState(n.x, n.y, rings)) {
        n.x += (centroid[0] - n.x) * alpha * 0.8;
        n.y += (centroid[1] - n.y) * alpha * 0.8;
      }
    }
  }
  force.initialize = (_) => { nodes = _; };
  return force;
}

// ─────────────────────────────────────────────────────────────────────────────
export default function DemersCartogram({ map, universities, zoomingOut }) {
  const svgRef     = useRef(null);
  const tooltipRef = useRef(null);

  const { metric, selectedUniversity, setSelectedUniversity, zoomedState } = useApp();

  const stateFeature = useMemo(
    () => geoJson.features.find(f => f.properties.abbr === zoomedState),
    [zoomedState],
  );

  const metricRef = useRef(metric);
  const selRef    = useRef(selectedUniversity);
  const setSelRef = useRef(setSelectedUniversity);
  metricRef.current = metric;
  selRef.current    = selectedUniversity;
  setSelRef.current = setSelectedUniversity;

  // ── Build cartogram ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!map || !universities.length || !stateFeature) return;

    const container = map.getContainer();
    const { x: width, y: height } = map.getSize();

    const filtered = universities.filter(u => u.lat != null && u.lon != null);

    // Project state polygon → screen coords
    const rings = projectRings(map, stateFeature.geometry);
    const { bbox, centroid, area: polyArea } = polyMetrics(rings);

    // ── Dynamic sizing: scale squares to fill ~55% of the polygon area ──
    const enrollments = filtered.map(u => u.enrollment_total).filter(Boolean);
    const targetArea = polyArea * 0.55;

    let sizeScale;
    if (enrollments.length > 1) {
      // First pass with base range to get total area
      const base = d3.scaleSqrt().domain(d3.extent(enrollments)).range([15, 60]);
      let baseTotalArea = 0;
      filtered.forEach(u => {
        const s = u.enrollment_total ? base(u.enrollment_total) : 15;
        baseTotalArea += s * s;
      });
      // Scale factor so total area ≈ targetArea
      const k = Math.sqrt(targetArea / Math.max(baseTotalArea, 1));
      const lo = Math.max(15 * k, 12);
      const hi = Math.min(60 * k, Math.min(bbox.w, bbox.h) * 0.3);
      sizeScale = d3.scaleSqrt().domain(d3.extent(enrollments)).range([lo, hi]);
    } else {
      sizeScale = () => Math.min(40, Math.min(bbox.w, bbox.h) * 0.2);
    }

    // Sort by enrollment (largest first → center of spiral)
    const sorted = [...filtered].sort(
      (a, b) => (b.enrollment_total || 0) - (a.enrollment_total || 0),
    );

    // ── Deterministic spiral layout filling the polygon ──
    const maxR = Math.min(bbox.w, bbox.h) * 0.45;
    const rScale = maxR / Math.max(Math.sqrt(sorted.length - 1), 1);

    const nodes = sorted.map((u, i) => {
      const angle = i * 2.399963;          // golden angle ≈ 137.5°
      const r     = Math.sqrt(i) * rScale; // Fermat spiral
      const minSide = sizeScale.domain ? sizeScale.range()[0] : 12;
      return {
        uni:  u,
        x:    centroid[0] + r * Math.cos(angle),
        y:    centroid[1] + r * Math.sin(angle),
        side: u.enrollment_total ? sizeScale(u.enrollment_total) : minSide,
      };
    });

    // ── Force simulation: collision + boundary (no centering) ──
    const sim = d3.forceSimulation(nodes)
      .force('collide',  forceCollideRect(d => d.side))
      .force('boundary', forceBoundary(rings, centroid))
      .force('x', d3.forceX(centroid[0]).strength(0.003))
      .force('y', d3.forceY(centroid[1]).strength(0.003))
      .alpha(1)
      .alphaDecay(0.012)
      .stop();

    for (let i = 0; i < 500; i++) sim.tick();

    // Final clamp to container bounds
    nodes.forEach(n => {
      const half = n.side / 2;
      n.x = Math.max(half, Math.min(width  - half, n.x));
      n.y = Math.max(half, Math.min(height - half, n.y));
    });

    // Create SVG overlay
    const svg = d3.select(container)
      .append('svg')
      .attr('class', 'demers-svg')
      .attr('width', width)
      .attr('height', height);

    svgRef.current = svg.node();

    // Tooltip
    const tip = document.createElement('div');
    Object.assign(tip.style, {
      position: 'fixed', pointerEvents: 'none', display: 'none',
      background: 'rgba(10,14,26,0.93)', color: '#e8eaf0',
      padding: '8px 12px', borderRadius: '6px', fontSize: '13px',
      maxWidth: '260px', lineHeight: '1.6', zIndex: '9999',
      boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
      border: '1px solid rgba(255,255,255,0.08)',
    });
    document.body.appendChild(tip);
    tooltipRef.current = tip;

    // Render squares
    svg.selectAll('rect')
      .data(nodes)
      .join('rect')
      .attr('x',      d => d.x - d.side / 2)
      .attr('y',      d => d.y - d.side / 2)
      .attr('width',  d => d.side)
      .attr('height', d => d.side)
      .attr('rx', 2)
      .style('fill', '#3b82f6')
      .style('fill-opacity', 0.85)
      .style('stroke', 'rgba(255,255,255,0.5)')
      .style('stroke-width', 1)
      .on('mouseenter', function (event, d) {
        const cfg   = METRICS[metricRef.current];
        const field = UNI_FIELD[metricRef.current];
        const val   = field ? d.uni[field] : null;
        tip.innerHTML = [
          `<strong>${d.uni.name}</strong>`,
          `${d.uni.city} &middot; ${d.uni.control_label}`,
          cfg && val != null ? `${cfg.label}: <strong>${cfg.format(val)}</strong>` : '',
          d.uni.enrollment_total ? `Enrollment: ${d3.format(',')(d.uni.enrollment_total)}` : '',
        ].filter(Boolean).join('<br/>');
        tip.style.display = 'block';
        d3.select(this).style('fill-opacity', 1).style('stroke-width', 2);
      })
      .on('mousemove', function (event) {
        tip.style.left = `${event.pageX + 14}px`;
        tip.style.top  = `${event.pageY - 36}px`;
      })
      .on('mouseleave', function (event, d) {
        tip.style.display = 'none';
        const isSel = selRef.current?.unitid === d.uni.unitid;
        d3.select(this)
          .style('fill-opacity', isSel ? 1 : 0.85)
          .style('stroke-width', isSel ? 2.5 : 1);
      })
      .on('click', function (event, d) {
        event.stopPropagation();
        setSelRef.current(d.uni);
      });

    return () => {
      svg.remove();
      if (tooltipRef.current && tooltipRef.current.parentNode) {
        document.body.removeChild(tooltipRef.current);
      }
      svgRef.current = null;
      tooltipRef.current = null;
    };
  }, [map, universities, stateFeature]);

  // ── Re-color on metric change ───────────────────────────────────────────
  useEffect(() => {
    if (!svgRef.current) return;
    const rects = d3.select(svgRef.current).selectAll('rect');
    const field = UNI_FIELD[metric];

    if (!field) {
      rects.style('fill', '#3b82f6');
      return;
    }

    const vals = universities.map(u => u[field]).filter(v => v != null);
    if (!vals.length) return;

    const cfg = METRICS[metric];
    const colorScale = d3.scaleSequential(d3.extent(vals), cfg.interpolator);

    rects.style('fill', d => {
      const val = d.uni[field];
      return val != null ? colorScale(val) : '#444';
    });
  }, [metric, universities]);

  // ── Selection highlight ─────────────────────────────────────────────────
  useEffect(() => {
    if (!svgRef.current) return;
    d3.select(svgRef.current).selectAll('rect')
      .style('stroke', d =>
        selectedUniversity?.unitid === d.uni.unitid ? '#ff6b35' : 'rgba(255,255,255,0.5)')
      .style('stroke-width', d =>
        selectedUniversity?.unitid === d.uni.unitid ? 2.5 : 1)
      .style('fill-opacity', d =>
        selectedUniversity?.unitid === d.uni.unitid ? 1 : 0.85);
  }, [selectedUniversity, universities]);

  // ── Hide during zoom-out animation ──────────────────────────────────────
  useEffect(() => {
    if (zoomingOut && svgRef.current) {
      svgRef.current.style.display = 'none';
    }
  }, [zoomingOut]);

  return null;
}
