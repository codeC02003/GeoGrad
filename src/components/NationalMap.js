import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useApp } from '../context/AppContext';
import geoJson from '../data/us-states.json';
import stateData from '../data/state_data.json';

// ── Metric configuration ──────────────────────────────────────────────────────
const METRICS = {
  // ── State-level metrics (national view) ──
  cost_total:       { level: 'national', label: 'Avg Cost of Living (Annual)', interpolator: d3.interpolateYlOrBr,  format: v => `$${d3.format(',')(Math.round(v))}` },
  safety_incidents: { level: 'national', label: 'Hate Crime Incidents',        interpolator: d3.interpolateReds,    format: v => d3.format(',')(Math.round(v)) },
  avg_temp_high_f:  { level: 'national', label: 'Avg High Temp (°F)',          interpolator: d3.interpolateYlOrRd,  format: v => `${v.toFixed(1)}°F` },
  university_count: { level: 'national', label: 'Number of Universities',      interpolator: d3.interpolateBuPu,    format: v => d3.format(',')(Math.round(v)) },
  // ── University-level metrics (state view) ──
  tuition_out:      { level: 'state', label: 'Out-of-State Tuition',    interpolator: d3.interpolateBlues,   format: v => `$${d3.format(',')(Math.round(v))}` },
  tuition_in:       { level: 'state', label: 'In-State Tuition',        interpolator: d3.interpolateGreens,  format: v => `$${d3.format(',')(Math.round(v))}` },
  admission_rate:   { level: 'state', label: 'Admission Rate',          interpolator: d3.interpolateOranges, format: v => `${(v * 100).toFixed(1)}%` },
  grad_rate:        { level: 'state', label: '6-yr Graduation Rate',    interpolator: d3.interpolatePurples, format: v => `${v.toFixed(1)}%` },
  retention_rate:   { level: 'state', label: 'Retention Rate',          interpolator: d3.interpolateGreens,  format: v => `${v.toFixed(1)}%` },
};
export { METRICS };

function buildColorScale(metricKey) {
  const cfg  = METRICS[metricKey] || METRICS.cost_total;
  const vals = Object.values(stateData).map(d => d[metricKey]).filter(v => v != null);
  const [mn, mx] = d3.extent(vals);
  return d3.scaleSequential([mn, mx], cfg.interpolator);
}

function getFeatureStyle(abbr, metricKey, colorScale, selectedStates) {
  const val      = stateData[abbr]?.[metricKey];
  const selected = selectedStates.includes(abbr);
  return {
    fillColor:   val != null ? colorScale(val) : '#E4E0EF',
    fillOpacity: 0.7,
    color:       selected ? '#6366F1' : 'rgba(30,27,75,0.3)',
    weight:      selected ? 2.5 : 0.6,
  };
}

export default function NationalMap() {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const layerRef     = useRef(null);
  const tooltipRef   = useRef(null);

  const { metric, selectedStates, toggleState, zoomToState,
          comparedUniversities } = useApp();

  const metricRef    = useRef(metric);
  const selectedRef  = useRef(selectedStates);
  const toggleRef    = useRef(toggleState);
  const zoomRef      = useRef(zoomToState);
  const compMarkersRef = useRef(null);
  metricRef.current   = metric;
  selectedRef.current = selectedStates;
  toggleRef.current   = toggleState;
  zoomRef.current     = zoomToState;

  useEffect(() => {
    const map = L.map(containerRef.current, {
      center: [39, -96],
      zoom: 4,
      zoomSnap: 0.5,
      maxBounds: [[15, -175], [75, -50]],
      maxBoundsViscosity: 0.85,
      doubleClickZoom: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    const tip = L.DomUtil.create('div', '', document.body);
    Object.assign(tip.style, {
      position: 'fixed', pointerEvents: 'none', display: 'none',
      background: 'rgba(254,252,249,0.96)', color: '#1E1B4B',
      padding: '8px 12px', borderRadius: '6px', fontSize: '13px',
      maxWidth: '240px', lineHeight: '1.6', zIndex: '9999',
      boxShadow: '0 4px 14px rgba(99,102,241,0.12)',
      border: '1px solid rgba(99,102,241,0.12)',
    });
    tooltipRef.current = tip;

    const cs = buildColorScale(metricRef.current);
    const geoLayer = L.geoJSON(geoJson, {
      style: f => getFeatureStyle(f.properties.abbr, metricRef.current, cs, selectedRef.current),
      onEachFeature(feature, layer) {
        const abbr = feature.properties.abbr;
        const name = feature.properties.name;
        layer.on({
          mouseover(e) {
            const cfg = METRICS[metricRef.current] || METRICS.cost_total;
            const val = stateData[abbr]?.[metricRef.current];
            tip.innerHTML = `<strong>${name}</strong> (${abbr})<br/>${cfg.label}: <strong>${val != null ? cfg.format(val) : 'N/A'}</strong>`;
            tip.style.display = 'block';
            e.target.setStyle({ fillOpacity: 0.92 });
          },
          mousemove(e) {
            tip.style.left = `${e.originalEvent.pageX + 14}px`;
            tip.style.top  = `${e.originalEvent.pageY - 36}px`;
          },
          mouseout(e) {
            tip.style.display = 'none';
            e.target.setStyle({ fillOpacity: 0.7 });
          },
          click(e) {
            L.DomEvent.stopPropagation(e);
            toggleRef.current(abbr);
          },
          dblclick(e) {
            L.DomEvent.stopPropagation(e);
            tip.style.display = 'none';
            map.flyToBounds(layer.getBounds(), { duration: 0.8, padding: [30, 30] });
            map.once('moveend', () => zoomRef.current(abbr));
          },
        });
      },
    }).addTo(map);

    layerRef.current = geoLayer;
    mapRef.current   = map;

    // Re-render tiles when container resizes (e.g. comparison panel slides up/down)
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      if (tooltipRef.current) document.body.removeChild(tooltipRef.current);
      if (compMarkersRef.current) {
        compMarkersRef.current.forEach(m => { if (map.hasLayer(m)) map.removeLayer(m); });
        compMarkersRef.current = [];
      }
      map.remove();
      mapRef.current = layerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    const cs = buildColorScale(metric);
    layer.setStyle(f => getFeatureStyle(f.properties.abbr, metric, cs, selectedStates));
  }, [metric, selectedStates]);

  // ── Overlay compared university markers on national map ──────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove previous markers
    if (compMarkersRef.current) {
      compMarkersRef.current.forEach(m => {
        if (map.hasLayer(m)) map.removeLayer(m);
      });
    }
    compMarkersRef.current = [];

    const valid = comparedUniversities.filter(u => u.lat != null && u.lon != null);
    if (valid.length === 0) return;

    // Add labeled markers for each compared university
    valid.forEach(uni => {
      const marker = L.circleMarker([uni.lat, uni.lon], {
        radius: 8,
        fillColor: '#6366F1',
        fillOpacity: 0.9,
        color: '#fff',
        weight: 2,
        pane: 'markerPane',
      });

      const shortName = uni.name.length > 30 ? uni.name.slice(0, 28) + '...' : uni.name;
      marker.bindTooltip(shortName, {
        permanent: true,
        direction: 'right',
        offset: [10, 0],
        className: 'compared-uni-label',
      });

      marker.addTo(map);
      compMarkersRef.current.push(marker);
    });

    // Fit bounds to show all compared universities (with padding)
    if (valid.length >= 2) {
      const bounds = L.latLngBounds(valid.map(u => [u.lat, u.lon]));
      map.flyToBounds(bounds.pad(0.4), { duration: 0.8, maxZoom: 7 });
    } else if (valid.length === 1) {
      map.flyTo([valid[0].lat, valid[0].lon], 6, { duration: 0.8 });
    }
  }, [comparedUniversities]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
