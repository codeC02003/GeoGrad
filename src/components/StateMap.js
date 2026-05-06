import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useApp } from '../context/AppContext';
import { haversineDistance, formatDistance } from '../utils/distance';
import geoJson from '../data/us-states.json';
import universityData from '../data/university_data.json';
import UniversityLayer from './UniversityLayer';

export default function StateMap({ zoomingOut, onZoomOutComplete }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  const { zoomedState, selectedUniversity, backToNational,
          distanceMode, referencePoint, setReferencePoint,
          comparedUniversities } = useApp();
  const distLineRef  = useRef([]);
  const refMarkerRef = useRef(null);

  // Find the GeoJSON feature for this state
  const stateFeature = useMemo(
    () => geoJson.features.find(f => f.properties.abbr === zoomedState),
    [zoomedState],
  );

  // Filter universities for this state
  const universities = useMemo(
    () => universityData.filter(u => u.state === zoomedState),
    [zoomedState],
  );

  useEffect(() => {
    if (!stateFeature || !containerRef.current) return;

    const stateBounds = L.geoJSON(stateFeature).getBounds();

    const map = L.map(containerRef.current, {
      zoomSnap: 0.25,
      maxZoom: 19,
      doubleClickZoom: true,
      scrollWheelZoom: true,
      dragging: true,
      touchZoom: true,
      boxZoom: true,
      keyboard: true,
      zoomControl: true,
      maxBounds: stateBounds.pad(0.5),
      maxBoundsViscosity: 0.8,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // State boundary overlay
    const boundaryLayer = L.geoJSON(stateFeature, {
      style: {
        fillColor: 'rgba(99,102,241,0.06)',
        fillOpacity: 1,
        color: 'rgba(99,102,241,0.35)',
        weight: 2,
      },
    }).addTo(map);

    // Fit map to the state bounds
    map.fitBounds(boundaryLayer.getBounds(), { padding: [30, 30] });
    map.setMinZoom(map.getZoom() - 1);

    mapRef.current = map;
    setMapReady(true);

    // Re-render tiles when container resizes
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [stateFeature]);

  // Fly to selected university (from search bar or clicking a different uni)
  const prevUniRef = useRef(null);
  useEffect(() => {
    if (!mapReady || !mapRef.current || !selectedUniversity) return;
    if (selectedUniversity.lat == null || selectedUniversity.lon == null) return;
    // Skip if same university already focused
    if (prevUniRef.current?.unitid === selectedUniversity.unitid) return;
    prevUniRef.current = selectedUniversity;

    const delay = mapRef.current.getZoom() > 8 ? 100 : 400;
    const t = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.flyTo(
          [selectedUniversity.lat, selectedUniversity.lon],
          12,
          { duration: 1.0 }
        );
      }
    }, delay);

    return () => clearTimeout(t);
  }, [mapReady, selectedUniversity]);

  // Zoom-out animation: remove constraints, fly to national view, then swap
  useEffect(() => {
    if (!zoomingOut || !mapRef.current) return;
    const map = mapRef.current;
    map.setMinZoom(1);
    map.setMaxBounds(null);
    map.flyTo([39, -96], 4, { duration: 0.8 });
    map.once('moveend', () => {
      if (onZoomOutComplete) onZoomOutComplete();
    });
  }, [zoomingOut, onZoomOutComplete]);

  // ── Distance mode: click handler ────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const handler = (e) => {
      if (distanceMode) setReferencePoint({ lat: e.latlng.lat, lng: e.latlng.lng });
    };
    map.on('click', handler);
    return () => map.off('click', handler);
  }, [mapReady, distanceMode, setReferencePoint]);

  // ── Distance mode: cursor style ──────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.style.cursor = distanceMode ? 'crosshair' : '';
  }, [distanceMode]);

  // ── Distance mode: reference marker + lines ─────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (refMarkerRef.current) { map.removeLayer(refMarkerRef.current); refMarkerRef.current = null; }
    distLineRef.current.forEach(l => map.removeLayer(l));
    distLineRef.current = [];

    if (!referencePoint) return;

    const pin = L.circleMarker([referencePoint.lat, referencePoint.lng], {
      radius: 8, fillColor: '#EF4444', fillOpacity: 0.9,
      color: '#fff', weight: 2.5, pane: 'markerPane',
    });
    pin.bindTooltip('Reference Point', { permanent: true, direction: 'top', offset: [0, -10], className: 'distance-label' });
    pin.addTo(map);
    refMarkerRef.current = pin;

    const valid = comparedUniversities.filter(u => u.lat != null && u.lon != null);
    valid.forEach(uni => {
      const dist = haversineDistance(referencePoint.lat, referencePoint.lng, uni.lat, uni.lon);
      const line = L.polyline(
        [[referencePoint.lat, referencePoint.lng], [uni.lat, uni.lon]],
        { color: '#EF4444', weight: 2, dashArray: '8 6', opacity: 0.7 },
      );
      line.addTo(map);
      distLineRef.current.push(line);

      const mid = [(referencePoint.lat + uni.lat) / 2, (referencePoint.lng + uni.lon) / 2];
      const label = L.tooltip({ permanent: true, direction: 'center', className: 'distance-label' })
        .setLatLng(mid)
        .setContent(formatDistance(dist));
      map.addLayer(label);
      distLineRef.current.push(label);
    });
  }, [referencePoint, comparedUniversities]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {mapReady && mapRef.current && (
        <UniversityLayer map={mapRef.current} universities={universities} />
      )}
      <button className="back-to-national-btn" onClick={backToNational}>
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
          <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back to National
      </button>
    </div>
  );
}
