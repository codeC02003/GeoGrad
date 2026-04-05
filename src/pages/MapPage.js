import React, { useMemo, useState, useCallback, useEffect } from 'react';
import * as d3 from 'd3';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import NationalMap, { METRICS } from '../components/NationalMap';
import ComparisonPanel from '../components/ComparisonPanel';
import UniversityComparisonPanel from '../components/UniversityComparisonPanel';
import StateMap from '../components/StateMap';
import UniversityDetailPanel from '../components/UniversityDetailPanel';
import SearchBar from '../components/SearchBar';
import stateData from '../data/state_data.json';
import universityData from '../data/university_data.json';

function Controls() {
  const { metric, setMetric, selectedStates, toggleState,
          zoomedState, comparedUniversities, toggleCompareUniversity,
          clearComparedUniversities } = useApp();
  const navigate = useNavigate();

  const uniCount = useMemo(
    () => zoomedState ? universityData.filter(u => u.state === zoomedState).length : 0,
    [zoomedState],
  );

  // Auto-switch metric when view changes
  const level = zoomedState ? 'state' : 'national';
  useEffect(() => {
    const cfg = METRICS[metric];
    if (cfg && cfg.level !== level) {
      // Pick first metric of the correct level
      const fallback = Object.entries(METRICS).find(([, c]) => c.level === level);
      if (fallback) setMetric(fallback[0]);
    }
  }, [level, metric, setMetric]);

  const filteredMetrics = Object.entries(METRICS).filter(([, cfg]) => cfg.level === level);

  // ── State drill-down view controls ──────────────────────────────────────
  if (zoomedState) {
    const info = stateData[zoomedState];
    return (
      <div className="controls">
        <div className="controls-title">{info?.state_name || zoomedState}</div>
        <div className="state-uni-count">{uniCount} universities</div>

        <SearchBar />

        <label className="control-label">Metric</label>
        <select
          className="control-select"
          value={metric}
          onChange={e => setMetric(e.target.value)}
        >
          {filteredMetrics.map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>

        {comparedUniversities.length > 0 && (
          <div className="selected-states">
            <label className="control-label">Comparing</label>
            <div className="state-chips">
              {comparedUniversities.map(uni => (
                <span key={uni.unitid} className="chip chip-uni" onClick={() => toggleCompareUniversity(uni)}>
                  {uni.name.length > 20 ? uni.name.slice(0, 18) + '...' : uni.name} &times;
                </span>
              ))}
              {comparedUniversities.length > 1 && (
                <span className="chip chip-clear" onClick={clearComparedUniversities}>
                  Clear All
                </span>
              )}
            </div>
          </div>
        )}

        <div className="hint">
          <em>Click</em> a marker to view details<br />
          <em>Ctrl+Click</em> or use <em>+</em> in search to compare<br />
          <em>Scroll</em> to zoom into clusters
        </div>

        <button className="back-home-btn" onClick={() => navigate('/')}>
          &#8592; Back to Home
        </button>
      </div>
    );
  }

  // ── National view controls ──────────────────────────────────────────────
  return (
    <div className="controls">
      <div className="controls-title">GeoGrad</div>
      <div className="controls-subtitle">U.S. Master's Program Explorer</div>

      <SearchBar />

      <label className="control-label">Metric</label>
      <select
        className="control-select"
        value={metric}
        onChange={e => setMetric(e.target.value)}
      >
        {filteredMetrics.map(([key, cfg]) => (
          <option key={key} value={key}>{cfg.label}</option>
        ))}
      </select>

      {selectedStates.length > 0 && (
        <div className="selected-states">
          <label className="control-label">Selected States</label>
          <div className="state-chips">
            {selectedStates.map(abbr => (
              <span key={abbr} className="chip" onClick={() => toggleState(abbr)}>
                {abbr} ✕
              </span>
            ))}
          </div>
        </div>
      )}

      {comparedUniversities.length > 0 && (
        <div className="selected-states">
          <label className="control-label">Comparing Universities</label>
          <div className="state-chips">
            {comparedUniversities.map(uni => (
              <span key={uni.unitid} className="chip chip-uni" onClick={() => toggleCompareUniversity(uni)}>
                {uni.name.length > 20 ? uni.name.slice(0, 18) + '...' : uni.name} &times;
              </span>
            ))}
            {comparedUniversities.length > 1 && (
              <span className="chip chip-clear" onClick={clearComparedUniversities}>
                Clear All
              </span>
            )}
          </div>
        </div>
      )}

      <div className="hint">
        <em>Click</em> a state to select/compare<br />
        <em>Double-click</em> to drill into universities
      </div>

      <button className="back-home-btn" onClick={() => navigate('/')}>
        &#8592; Back to Home
      </button>
    </div>
  );
}

function Legend() {
  const { metric } = useApp();
  const cfg = METRICS[metric];
  if (!cfg) return null;

  const stops    = d3.range(0, 1.01, 0.1).map(t => cfg.interpolator(t)).reverse();
  const gradient = `linear-gradient(to bottom, ${stops.join(', ')})`;

  return (
    <div className="legend">
      <div className="legend-title">{cfg.label}</div>
      <div className="legend-gradient" style={{ background: gradient }} />
      <div className="legend-labels">
        <span>High</span>
        <span>Low</span>
      </div>
      <div className="legend-na">
        <span className="na-box" /> No data
      </div>
    </div>
  );
}

function Onboarding() {
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem('geograd-onboarded') === '1'; } catch { return false; }
  });
  const { zoomedState } = useApp();

  if (dismissed || zoomedState) return null;

  const dismiss = () => {
    setDismissed(true);
    try { sessionStorage.setItem('geograd-onboarded', '1'); } catch {}
  };

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-tip">
        <span className="onboarding-tip-icon">Click</span>
        <span className="onboarding-tip-text"><strong>Click</strong> a state to compare</span>
      </div>
      <div className="onboarding-tip">
        <span className="onboarding-tip-icon">2x</span>
        <span className="onboarding-tip-text"><strong>Double-click</strong> to explore universities</span>
      </div>
      <div className="onboarding-tip">
        <span className="onboarding-tip-icon">Search</span>
        <span className="onboarding-tip-text">Use the <strong>search bar</strong> to find any university</span>
      </div>
      <button className="onboarding-dismiss" onClick={dismiss} title="Dismiss">&#10005;</button>
    </div>
  );
}

function MapArea() {
  const { selectedStates, zoomedState, selectedUniversity, backToNational,
          comparedUniversities } = useApp();
  const [zoomingOut, setZoomingOut] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [showState, setShowState] = useState(false);

  // Smooth crossfade: when zoomedState changes, fade out then fade in
  useEffect(() => {
    if (zoomedState) {
      // Zoom-in: brief fade then show state map
      setTransitioning(true);
      const t = setTimeout(() => {
        setShowState(true);
        setTransitioning(false);
      }, 350);
      return () => clearTimeout(t);
    } else {
      setShowState(false);
      setTransitioning(false);
    }
  }, [zoomedState]);

  const showComparison    = !zoomedState && selectedStates.length > 0;
  const showDetail        = !!zoomedState && !!selectedUniversity && !zoomingOut;
  const showUniComparison = comparedUniversities.length > 0;

  // Panel height: university comparison takes priority when active
  let panelHeight = '0';
  if (showUniComparison) panelHeight = '260px';
  else if (showComparison) panelHeight = '220px';
  else if (showDetail) panelHeight = '280px';

  const handleBackToNational = useCallback(() => {
    setZoomingOut(true);
  }, []);

  const handleZoomOutComplete = useCallback(() => {
    setZoomingOut(false);
    backToNational();
  }, [backToNational]);

  return (
    <div className="map-area">
      {/* National map — stays mounted during zoom-in fade */}
      <div style={{
        position: 'absolute', inset: 0,
        bottom: panelHeight,
        transition: 'bottom 0.3s, opacity 0.35s ease-in-out',
        opacity: (zoomedState && showState) ? 0 : 1,
        pointerEvents: showState ? 'none' : 'auto',
        zIndex: 1,
      }}>
        <NationalMap />
      </div>

      {/* State map — fades in on top */}
      {zoomedState && (
        <div style={{
          position: 'absolute', inset: 0,
          bottom: panelHeight,
          transition: 'bottom 0.3s, opacity 0.4s ease-in-out',
          opacity: showState && !transitioning ? 1 : 0,
          zIndex: 2,
        }}>
          <StateMap zoomingOut={zoomingOut} onZoomOutComplete={handleZoomOutComplete} />
        </div>
      )}

      {/* Onboarding tips for first-time users */}
      <Onboarding />

      {/* Floating back button on state view */}
      {zoomedState && showState && !zoomingOut && (
        <button className="back-national-float" style={{ zIndex: 3 }} onClick={handleBackToNational}>
          &#8592; Back to National View
        </button>
      )}

      {/* National view: comparison panel */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: showComparison ? '220px' : 0,
        transition: 'height 0.3s', overflow: 'hidden',
        zIndex: 3,
      }}>
        <ComparisonPanel />
      </div>

      {/* State view: university detail panel (hidden when comparison is open) */}
      {!showUniComparison && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: showDetail ? '280px' : 0,
          transition: 'height 0.3s', overflow: 'hidden',
          zIndex: 3,
        }}>
          {zoomedState && <UniversityDetailPanel />}
        </div>
      )}

      {/* University comparison panel (visible in both views) */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: showUniComparison ? '260px' : 0,
        transition: 'height 0.3s', overflow: 'hidden',
        zIndex: 4,
      }}>
        <UniversityComparisonPanel />
      </div>
    </div>
  );
}

export default function MapPage() {
  return (
    <div className="map-page-shell">
      <Controls />
      <MapArea />
      <Legend />
    </div>
  );
}
