import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import NationalMap, { METRICS } from '../components/NationalMap';
import ComparisonPanel from '../components/ComparisonPanel';
import UniversityComparisonPanel from '../components/UniversityComparisonPanel';
import StateMap from '../components/StateMap';
import UniversityDetailPanel from '../components/UniversityDetailPanel';
import SearchBar from '../components/SearchBar';
import ScatterPlot from '../components/ScatterPlot';
import ParallelCoordinates from '../components/ParallelCoordinates';
import FilterPanel from '../components/FilterPanel';
import { activeFilterCount } from '../components/FilterPanel';
import stateData from '../data/state_data.json';
import universityData from '../data/university_data.json';

/* ── Sidebar ──────────────────────────────────────────────────────────────── */
function Sidebar() {
  const { metric, setMetric, selectedStates, toggleState,
          zoomedState, comparedUniversities, toggleCompareUniversity,
          clearComparedUniversities, chartView, filters,
          distanceMode, setDistanceMode, referencePoint, setReferencePoint,
          showChoropleth, setShowChoropleth, showUniversities, setShowUniversities } = useApp();
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  const uniCount = useMemo(
    () => zoomedState ? universityData.filter(u => u.state === zoomedState).length : 0,
    [zoomedState],
  );

  const level = zoomedState ? 'state' : 'national';
  useEffect(() => {
    const cfg = METRICS[metric];
    if (cfg && cfg.level !== level) {
      const fallback = Object.entries(METRICS).find(([, c]) => c.level === level);
      if (fallback) setMetric(fallback[0]);
    }
  }, [level, metric, setMetric]);

  const filteredMetrics = Object.entries(METRICS).filter(([, cfg]) => cfg.level === level);
  const stateInfo = zoomedState ? stateData[zoomedState] : null;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        {zoomedState ? (
          <>
            <div className="sidebar-state-name">{stateInfo?.state_name || zoomedState}</div>
            <div className="sidebar-subtitle">{uniCount} universities</div>
          </>
        ) : (
          <>
            <div className="sidebar-brand">GeoGrad</div>
            <div className="sidebar-subtitle">U.S. Master's Program Explorer</div>
          </>
        )}
      </div>

      <div className="sidebar-body">
        <div className="sidebar-section">
          <SearchBar />
        </div>

        {!chartView && (
          <div className="sidebar-section">
            <div className="sidebar-label">Color by</div>
            <select
              className="sidebar-select"
              value={metric}
              onChange={e => setMetric(e.target.value)}
            >
              {filteredMetrics.map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
          </div>
        )}

        {!chartView && !zoomedState && (
          <div className="sidebar-section">
            <div className="sidebar-label">Map Layers</div>
            <label className="layer-checkbox">
              <input
                type="checkbox"
                checked={showChoropleth}
                onChange={e => {
                  if (!e.target.checked && !showUniversities) return;
                  setShowChoropleth(e.target.checked);
                }}
              />
              <span>Choropleth (State Metrics)</span>
            </label>
            <label className="layer-checkbox">
              <input
                type="checkbox"
                checked={showUniversities}
                onChange={e => {
                  if (!e.target.checked && !showChoropleth) return;
                  setShowUniversities(e.target.checked);
                }}
              />
              <span>Universities (All 2,095)</span>
            </label>
          </div>
        )}

        {!chartView && (
          <div className="sidebar-section">
            <div className="sidebar-label">Distance Tool</div>
            <button
              className={`distance-toggle${distanceMode ? ' distance-toggle--active' : ''}`}
              onClick={() => {
                const next = !distanceMode;
                setDistanceMode(next);
                if (!next) setReferencePoint(null);
              }}
            >
              <svg viewBox="0 0 18 18" width="14" height="14" fill="none">
                <path d="M3 15l12-12M3 15l2-5M3 15l5-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="15" cy="3" r="2" stroke="currentColor" strokeWidth="1.3"/>
                <circle cx="3" cy="15" r="2" stroke="currentColor" strokeWidth="1.3"/>
              </svg>
              {distanceMode ? 'Measuring — click map' : 'Measure Distance'}
            </button>
            {distanceMode && !referencePoint && (
              <div className="distance-hint">Click anywhere on the map to place a pin. Straight-line distances to compared universities will appear.</div>
            )}
            {referencePoint && (
              <div className="distance-ref-info">
                <span>Pin: {referencePoint.lat.toFixed(2)}°, {referencePoint.lng.toFixed(2)}°</span>
                <button className="distance-clear" onClick={() => setReferencePoint(null)}>Clear pin</button>
              </div>
            )}
            {referencePoint && comparedUniversities.length === 0 && (
              <div className="distance-hint">Add universities to compare to see distances.</div>
            )}
          </div>
        )}

        <div className="sidebar-section">
          <button
            className={`filter-toggle${showFilters ? ' filter-toggle--active' : ''}`}
            onClick={() => setShowFilters(v => !v)}
          >
            <svg viewBox="0 0 18 18" width="14" height="14" fill="none">
              <path d="M2 4h14M5 9h8M7 14h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            {showFilters ? 'Hide Filters' : 'Filter Universities'}
            {activeFilterCount(filters) > 0 && (
              <span className="sidebar-badge">{activeFilterCount(filters)}</span>
            )}
          </button>
          {showFilters && <FilterPanel />}
        </div>

        {!zoomedState && selectedStates.length > 0 && (
          <div className="sidebar-section">
            <div className="sidebar-label">
              Selected States
              <span className="sidebar-badge">{selectedStates.length}</span>
            </div>
            <div className="sidebar-chips">
              {selectedStates.map(abbr => (
                <button key={abbr} className="sidebar-chip" onClick={() => toggleState(abbr)}>
                  {abbr}
                  <svg viewBox="0 0 10 10" width="10" height="10"><path d="M2.5 2.5l5 5M7.5 2.5l-5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {comparedUniversities.length > 0 && (
          <div className="sidebar-section">
            <div className="sidebar-label">
              Comparing
              <span className="sidebar-badge">{comparedUniversities.length}</span>
              {comparedUniversities.length > 1 && (
                <button className="sidebar-clear" onClick={clearComparedUniversities}>Clear all</button>
              )}
            </div>
            <div className="sidebar-chips">
              {comparedUniversities.map(uni => (
                <button key={uni.unitid} className="sidebar-chip sidebar-chip--cyan" onClick={() => toggleCompareUniversity(uni)}>
                  {uni.name.length > 22 ? uni.name.slice(0, 20) + '\u2026' : uni.name}
                  <svg viewBox="0 0 10 10" width="10" height="10"><path d="M2.5 2.5l5 5M7.5 2.5l-5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-tips">
          <div className="sidebar-tips-title">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M8 7v4M8 5v.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Quick Tips
          </div>
          <div className="sidebar-tips-list">
            {zoomedState ? (
              <>
                <span><b>Click</b> a marker to view details</span>
                <span><b>Ctrl+Click</b> or search <b>+</b> to compare</span>
                <span><b>Scroll</b> to zoom into clusters</span>
              </>
            ) : (
              <>
                <span><b>Click</b> a state to select &amp; compare</span>
                <span><b>Double-click</b> to explore universities</span>
                <span>Use <b>search</b> to find any university</span>
              </>
            )}
          </div>
        </div>

        <button className="sidebar-home-btn" onClick={() => navigate('/')}>
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Home
        </button>
      </div>
    </aside>
  );
}

/* ── View Toolbar (breadcrumb + tabs) ─────────────────────────────────────── */
function ViewToolbar() {
  const { chartView, setChartView, zoomedState, backToNational } = useApp();
  const stateInfo = zoomedState ? stateData[zoomedState] : null;

  const views = [
    { id: null, label: 'Map', icon: (
      <svg viewBox="0 0 18 18" width="15" height="15" fill="none">
        <path d="M2 5.5l4.5-3 5 3.5 4.5-3v10l-4.5 3-5-3.5-4.5 3V5.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      </svg>
    )},
    { id: 'scatter', label: 'Scatter', icon: (
      <svg viewBox="0 0 18 18" width="15" height="15" fill="none">
        <circle cx="5" cy="13" r="1.3" fill="currentColor"/><circle cx="8" cy="7" r="1.3" fill="currentColor"/>
        <circle cx="13" cy="10" r="1.3" fill="currentColor"/><circle cx="11" cy="4" r="1.3" fill="currentColor"/>
        <circle cx="15" cy="6" r="1.3" fill="currentColor"/>
      </svg>
    )},
    { id: 'parallel', label: 'Parallel', icon: (
      <svg viewBox="0 0 18 18" width="15" height="15" fill="none">
        <path d="M3 3v12M7 3v12M11 3v12M15 3v12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        <path d="M3 7l4 4 4-2 4 3" stroke="currentColor" strokeWidth="1" opacity="0.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )},
  ];

  return (
    <div className="view-toolbar">
      <div className="toolbar-nav">
        <button
          className={`toolbar-crumb${!zoomedState ? ' toolbar-crumb--current' : ''}`}
          onClick={() => zoomedState && backToNational()}
          disabled={!zoomedState}
        >
          National
        </button>
        {zoomedState && (
          <>
            <svg className="toolbar-crumb-sep" viewBox="0 0 8 14" width="8" height="14">
              <path d="M2 1l4 6-4 6" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="toolbar-crumb toolbar-crumb--current">
              {stateInfo?.state_name || zoomedState}
            </span>
          </>
        )}
      </div>

      <div className="view-tabs">
        {views.map(v => (
          <button
            key={v.label}
            className={`view-tab${chartView === v.id ? ' view-tab--active' : ''}`}
            onClick={() => setChartView(v.id)}
          >
            {v.icon}
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Floating Legend (draggable) ───────────────────────────────────────────── */
function FloatingLegend() {
  const { metric, chartView } = useApp();
  const legendRef = useRef(null);
  const dragState = useRef(null);

  const onPointerDown = useCallback((e) => {
    const el = legendRef.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);
    dragState.current = { startX: e.clientX, startY: e.clientY, origLeft: el.offsetLeft, origTop: el.offsetTop };
    el.style.cursor = 'grabbing';
  }, []);

  const onPointerMove = useCallback((e) => {
    const ds = dragState.current;
    const el = legendRef.current;
    if (!ds || !el) return;
    const dx = e.clientX - ds.startX;
    const dy = e.clientY - ds.startY;
    el.style.left = `${ds.origLeft + dx}px`;
    el.style.top = `${ds.origTop + dy}px`;
    el.style.bottom = 'auto';
    el.style.right = 'auto';
  }, []);

  const onPointerUp = useCallback((e) => {
    const el = legendRef.current;
    if (!el) return;
    el.releasePointerCapture(e.pointerId);
    dragState.current = null;
    el.style.cursor = 'grab';
  }, []);

  if (chartView) return null;
  const cfg = METRICS[metric];
  if (!cfg) return null;

  const stops = d3.range(0, 1.01, 0.1).map(t => cfg.interpolator(t)).reverse();
  const gradient = `linear-gradient(to bottom, ${stops.join(', ')})`;

  return (
    <div
      className="floating-legend"
      ref={legendRef}
      style={{ cursor: 'grab' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div className="fl-title">{cfg.label}</div>
      <div className="fl-row">
        <div className="fl-bar" style={{ background: gradient }} />
        <div className="fl-labels">
          <span>High</span>
          <span>Low</span>
        </div>
      </div>
      <div className="fl-na">
        <span className="fl-na-swatch" />
        No data
      </div>
    </div>
  );
}

/* ── Onboarding ───────────────────────────────────────────────────────────── */
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
    <div className="onboarding">
      <div className="onboarding-inner">
        <div className="onboarding-pill">
          <kbd>Click</kbd>
          <span>Select &amp; compare states</span>
        </div>
        <div className="onboarding-sep" />
        <div className="onboarding-pill">
          <kbd>2&times; Click</kbd>
          <span>Explore universities</span>
        </div>
        <div className="onboarding-sep" />
        <div className="onboarding-pill">
          <kbd>Search</kbd>
          <span>Find any university</span>
        </div>
      </div>
      <button className="onboarding-dismiss" onClick={dismiss} aria-label="Dismiss">
        <svg viewBox="0 0 10 10" width="10" height="10">
          <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}

/* ── Content Area ─────────────────────────────────────────────────────────── */
function ContentArea() {
  const { selectedStates, zoomedState, selectedUniversity, backToNational,
          comparedUniversities, chartView } = useApp();
  const [zoomingOut, setZoomingOut] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [showState, setShowState] = useState(false);
  const [uniPanelDragH, setUniPanelDragH] = useState(null);
  const [statePanelDragH, setStatePanelDragH] = useState(null);
  const panelDragRef = useRef(null);
  const statePanelDragRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    if (zoomedState) {
      setTransitioning(true);
      const t = setTimeout(() => { setShowState(true); setTransitioning(false); }, 350);
      return () => clearTimeout(t);
    } else {
      setShowState(false);
      setTransitioning(false);
    }
  }, [zoomedState]);

  const showComparison    = !zoomedState && selectedStates.length > 0;
  const showDetail        = !!zoomedState && !!selectedUniversity && !zoomingOut;
  const showUniComparison = comparedUniversities.length > 0;

  const hasRadar = showUniComparison && comparedUniversities.length >= 2;

  const handleZoomOutComplete = useCallback(() => {
    setZoomingOut(false);
    backToNational();
  }, [backToNational]);

  const isChart = chartView === 'scatter' || chartView === 'parallel';

  const defaultUniH = hasRadar ? 420 : 260;
  const uniPanelH = showUniComparison
    ? `${uniPanelDragH != null ? uniPanelDragH : defaultUniH}px`
    : '0';

  useEffect(() => {
    if (!showUniComparison) setUniPanelDragH(null);
  }, [showUniComparison]);

  useEffect(() => {
    if (!showComparison) setStatePanelDragH(null);
  }, [showComparison]);

  const onPanelDragStart = useCallback((e) => {
    const container = contentRef.current;
    if (!container) return;
    e.target.setPointerCapture(e.pointerId);
    const containerRect = container.getBoundingClientRect();
    panelDragRef.current = { containerBottom: containerRect.bottom, containerTop: containerRect.top };
  }, []);

  const onPanelDragMove = useCallback((e) => {
    const ds = panelDragRef.current;
    if (!ds) return;
    const newH = ds.containerBottom - e.clientY;
    const maxH = (ds.containerBottom - ds.containerTop) * 0.85;
    setUniPanelDragH(Math.max(120, Math.min(newH, maxH)));
  }, []);

  const onPanelDragEnd = useCallback((e) => {
    e.target.releasePointerCapture(e.pointerId);
    panelDragRef.current = null;
  }, []);

  const onStatePanelDragStart = useCallback((e) => {
    const container = contentRef.current;
    if (!container) return;
    e.target.setPointerCapture(e.pointerId);
    const rect = container.getBoundingClientRect();
    statePanelDragRef.current = { containerBottom: rect.bottom, containerTop: rect.top };
  }, []);

  const onStatePanelDragMove = useCallback((e) => {
    const ds = statePanelDragRef.current;
    if (!ds) return;
    const newH = ds.containerBottom - e.clientY;
    const maxH = (ds.containerBottom - ds.containerTop) * 0.85;
    setStatePanelDragH(Math.max(120, Math.min(newH, maxH)));
  }, []);

  const onStatePanelDragEnd = useCallback((e) => {
    e.target.releasePointerCapture(e.pointerId);
    statePanelDragRef.current = null;
  }, []);
  const statePanelH = `${statePanelDragH != null ? statePanelDragH : 220}px`;
  const mapOnlyPanelH = showUniComparison ? uniPanelH
    : showComparison ? statePanelH
    : showDetail ? '280px' : '0';

  return (
    <div className="content-area" ref={contentRef}>
      {/* ── Map view ────────────────────────────────────────── */}
      <div className={`view-layer${isChart ? ' view-hidden' : ''}`}>
        <div style={{
          position: 'absolute', inset: 0,
          bottom: mapOnlyPanelH,
          transition: 'bottom 0.3s ease, opacity 0.35s ease-in-out',
          opacity: (zoomedState && showState) ? 0 : 1,
          pointerEvents: showState ? 'none' : 'auto',
          zIndex: 1,
        }}>
          <NationalMap />
        </div>

        {zoomedState && (
          <div style={{
            position: 'absolute', inset: 0,
            bottom: mapOnlyPanelH,
            transition: 'bottom 0.3s ease, opacity 0.4s ease-in-out',
            opacity: showState && !transitioning ? 1 : 0,
            zIndex: 2,
          }}>
            <StateMap zoomingOut={zoomingOut} onZoomOutComplete={handleZoomOutComplete} />
          </div>
        )}

        <Onboarding />
        <FloatingLegend />

        <div className="bottom-panel-wrapper" style={{
          height: (!showUniComparison && showComparison)
            ? `${statePanelDragH != null ? statePanelDragH : 220}px`
            : 0,
          zIndex: 3,
          transition: statePanelDragRef.current ? 'none' : undefined,
        }}>
          <div
            className="panel-drag-handle"
            onPointerDown={onStatePanelDragStart}
            onPointerMove={onStatePanelDragMove}
            onPointerUp={onStatePanelDragEnd}
          />
          <ComparisonPanel />
        </div>

        {!showUniComparison && (
          <div className="bottom-panel-wrapper" style={{
            height: showDetail ? '280px' : 0,
            zIndex: 3,
          }}>
            {zoomedState && <UniversityDetailPanel />}
          </div>
        )}
      </div>

      {/* ── Chart views (conditional render) ────────────────── */}
      {chartView === 'scatter' && (
        <div className="view-layer view-chart" style={{ bottom: uniPanelH, transition: 'bottom 0.3s ease' }}>
          <ScatterPlot />
        </div>
      )}
      {chartView === 'parallel' && (
        <div className="view-layer view-chart" style={{ bottom: uniPanelH, transition: 'bottom 0.3s ease' }}>
          <ParallelCoordinates />
        </div>
      )}

      {/* ── University Comparison Panel (visible in ALL views) ─── */}
      <div className="bottom-panel-wrapper" style={{
        height: uniPanelH,
        zIndex: 20,
        transition: panelDragRef.current ? 'none' : undefined,
      }}>
        <div
          className="panel-drag-handle"
          onPointerDown={onPanelDragStart}
          onPointerMove={onPanelDragMove}
          onPointerUp={onPanelDragEnd}
        />
        <UniversityComparisonPanel />
      </div>
    </div>
  );
}

/* ── Page Shell ───────────────────────────────────────────────────────────── */
export default function MapPage() {
  return (
    <div className="explorer">
      <Sidebar />
      <main className="explorer-main">
        <ViewToolbar />
        <ContentArea />
      </main>
    </div>
  );
}
