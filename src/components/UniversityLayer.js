import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { useApp } from '../context/AppContext';
import { METRICS } from './NationalMap';

// Map national-level metric keys → university-level field names
const UNI_FIELD = {
  tuition_out:      'tuition_out',
  tuition_in:       'tuition_in',
  admission_rate:   'admission_rate',
  grad_rate:        'graduation_rate',
  retention_rate:   'retention_rate',
  cost_total:       'state_cost_total',
  avg_temp_high_f:  'state_temp_f',
  safety_incidents: 'state_safety',
  university_count: null,
};

export default function UniversityLayer({ map, universities }) {
  const clusterGroupRef = useRef(null);
  const tooltipRef      = useRef(null);

  const { metric, selectedUniversity, setSelectedUniversity,
          comparedUniversities, toggleCompareUniversity } = useApp();

  // Keep stable refs for use inside Leaflet callbacks
  const metricRef      = useRef(metric);
  const selUniRef      = useRef(selectedUniversity);
  const setSelRef      = useRef(setSelectedUniversity);
  const comparedRef    = useRef(comparedUniversities);
  const toggleCompRef  = useRef(toggleCompareUniversity);
  const colorScaleRef  = useRef(null);
  metricRef.current    = metric;
  selUniRef.current    = selectedUniversity;
  setSelRef.current    = setSelectedUniversity;
  comparedRef.current  = comparedUniversities;
  toggleCompRef.current = toggleCompareUniversity;

  // ── Create clustered markers when map/universities change ──────────────
  useEffect(() => {
    if (!map || !universities.length) return;

    // Tooltip element
    const tip = L.DomUtil.create('div', '', document.body);
    Object.assign(tip.style, {
      position: 'fixed', pointerEvents: 'none', display: 'none',
      background: 'rgba(10,14,26,0.93)', color: '#e8eaf0',
      padding: '8px 12px', borderRadius: '6px', fontSize: '13px',
      maxWidth: '260px', lineHeight: '1.6', zIndex: '9999',
      boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
      border: '1px solid rgba(255,255,255,0.08)',
    });
    tooltipRef.current = tip;

    // Radius scale based on enrollment
    const enrollments = universities.map(u => u.enrollment_total).filter(Boolean);
    const radiusScale = enrollments.length > 1
      ? d3.scaleSqrt().domain(d3.extent(enrollments)).range([5, 18])
      : () => 10;

    // Create marker cluster group with custom styling
    const clusterGroup = L.markerClusterGroup({
      maxClusterRadius: 45,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      disableClusteringAtZoom: 12,
      iconCreateFunction: function (cluster) {
        const count = cluster.getChildCount();
        let size = 'small';
        let dim = 36;
        if (count > 30) { size = 'large'; dim = 52; }
        else if (count > 10) { size = 'medium'; dim = 44; }

        // Compute average metric color for the cluster
        let bgColor = null;
        const scale = colorScaleRef.current;
        const field = UNI_FIELD[metricRef.current];
        if (scale && field) {
          const markers = cluster.getAllChildMarkers();
          const vals = markers
            .map(m => m._uni && m._uni[field])
            .filter(v => v != null);
          if (vals.length > 0) {
            const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
            bgColor = scale(avg);
          }
        }

        const style = bgColor
          ? `background:${bgColor};box-shadow:0 0 14px ${bgColor}`
          : '';

        return L.divIcon({
          html: `<div class="cluster-inner" ${style ? `style="${style}"` : ''}>${count}</div>`,
          className: `uni-cluster uni-cluster-${size}`,
          iconSize: L.point(dim, dim),
        });
      },
    });

    universities.forEach(uni => {
      if (uni.lat == null || uni.lon == null) return;

      const radius = uni.enrollment_total ? radiusScale(uni.enrollment_total) : 6;

      const marker = L.circleMarker([uni.lat, uni.lon], {
        radius,
        fillColor: '#3b82f6',
        fillOpacity: 0.8,
        color: 'rgba(255,255,255,0.6)',
        weight: 1.5,
      });

      // Attach university data for use in effects
      marker._uni = uni;

      // Permanent label (shown when zoomed in)
      const shortName = uni.name.length > 25 ? uni.name.slice(0, 23) + '…' : uni.name;
      marker.bindTooltip(shortName, {
        permanent: true,
        direction: 'right',
        offset: [radius + 2, 0],
        className: 'uni-label',
      });

      marker.on({
        mouseover(e) {
          const cfg   = METRICS[metricRef.current];
          const field = UNI_FIELD[metricRef.current];
          const val   = field ? uni[field] : null;
          tip.innerHTML = [
            `<strong>${uni.name}</strong>`,
            `${uni.city} &middot; ${uni.control_label}`,
            cfg && val != null ? `${cfg.label}: <strong>${cfg.format(val)}</strong>` : '',
            uni.enrollment_total ? `Enrollment: ${d3.format(',')(uni.enrollment_total)}` : '',
          ].filter(Boolean).join('<br/>');
          tip.style.display = 'block';
          e.target.setStyle({ fillOpacity: 1, weight: 2.5 });
        },
        mousemove(e) {
          tip.style.left = `${e.originalEvent.pageX + 14}px`;
          tip.style.top  = `${e.originalEvent.pageY - 36}px`;
        },
        mouseout(e) {
          tip.style.display = 'none';
          const isSelected = selUniRef.current?.unitid === uni.unitid;
          e.target.setStyle({
            fillOpacity: isSelected ? 1 : 0.8,
            weight: isSelected ? 2.5 : 1.5,
          });
        },
        click(e) {
          L.DomEvent.stopPropagation(e);
          setSelRef.current(uni);
          // Also add to comparison (no auto-zoom-out from map clicks)
          const already = comparedRef.current.some(u => u.unitid === uni.unitid);
          if (!already) {
            toggleCompRef.current(uni, false);
          }
        },
      });

      clusterGroup.addLayer(marker);
    });

    map.addLayer(clusterGroup);
    clusterGroupRef.current = clusterGroup;

    // Show/hide permanent labels based on zoom level
    function updateLabels() {
      const zoom = map.getZoom();
      const show = zoom >= 10;
      const container = map.getContainer();
      if (show) {
        container.classList.add('show-uni-labels');
      } else {
        container.classList.remove('show-uni-labels');
      }
    }
    map.on('zoomend', updateLabels);
    updateLabels(); // initial state

    return () => {
      map.off('zoomend', updateLabels);
      clusterGroup.remove();
      if (tooltipRef.current && tooltipRef.current.parentNode) {
        document.body.removeChild(tooltipRef.current);
      }
      tooltipRef.current = null;
      clusterGroupRef.current = null;
    };
  }, [map, universities]);

  // ── Re-color markers and clusters when metric changes ────────────────────
  useEffect(() => {
    const cg = clusterGroupRef.current;
    if (!cg) return;

    const field = UNI_FIELD[metric];
    if (!field) {
      colorScaleRef.current = null;
      cg.eachLayer(m => {
        if (m.setStyle) m.setStyle({ fillColor: '#3b82f6' });
      });
      cg.refreshClusters();
      return;
    }

    const vals = universities.map(u => u[field]).filter(v => v != null);
    if (vals.length === 0) return;

    const cfg = METRICS[metric];
    const colorScale = d3.scaleSequential(d3.extent(vals), cfg.interpolator);
    colorScaleRef.current = colorScale;

    cg.eachLayer(marker => {
      if (!marker._uni || !marker.setStyle) return;
      const val = marker._uni[field];
      marker.setStyle({
        fillColor: val != null ? colorScale(val) : '#444',
      });
    });

    // Refresh cluster icons so they pick up the new average colors
    cg.refreshClusters();
  }, [metric, universities]);

  // ── Highlight selected and compared universities ────────────────────────
  useEffect(() => {
    const cg = clusterGroupRef.current;
    if (!cg) return;

    const comparedIds = new Set(comparedUniversities.map(u => u.unitid));

    cg.eachLayer(marker => {
      if (!marker._uni || !marker.setStyle) return;
      const isSelected = selectedUniversity?.unitid === marker._uni.unitid;
      const isCompared = comparedIds.has(marker._uni.unitid);

      if (isSelected) {
        marker.setStyle({ color: '#ff6b35', weight: 2.5, fillOpacity: 1 });
      } else if (isCompared) {
        marker.setStyle({ color: '#22d3ee', weight: 3, fillOpacity: 1 });
      } else {
        marker.setStyle({ color: 'rgba(255,255,255,0.6)', weight: 1.5, fillOpacity: 0.8 });
      }
      if ((isSelected || isCompared) && marker.bringToFront) marker.bringToFront();
    });
  }, [selectedUniversity, comparedUniversities, universities]);

  return null; // Renders via Leaflet, not React DOM
}
