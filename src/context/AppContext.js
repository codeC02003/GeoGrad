import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [metric, setMetric] = useState('cost_total');
  const [selectedStates, setSelectedStates] = useState([]);
  const [zoomedState, setZoomedState] = useState(null);
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [comparedUniversities, setComparedUniversities] = useState([]);
  const [highlightedUnis, setHighlightedUnis] = useState(null);
  const [chartView, setChartView] = useState(null);

  const pendingUniRef = useRef(null);
  const zoomedStateRef = useRef(zoomedState);
  zoomedStateRef.current = zoomedState;

  const toggleState = useCallback((abbr) => {
    setSelectedStates(prev =>
      prev.includes(abbr) ? prev.filter(s => s !== abbr) : [...prev, abbr]
    );
  }, []);

  const zoomToState = useCallback((abbr) => {
    setZoomedState(abbr);
    setSelectedUniversity(null);
  }, []);

  const toggleCompareUniversity = useCallback((uni, autoZoomOut = true) => {
    setComparedUniversities(prev => {
      const exists = prev.find(u => u.unitid === uni.unitid);
      if (exists) return prev.filter(u => u.unitid !== uni.unitid);

      const next = [...prev, uni];
      if (autoZoomOut) {
        const states = new Set(next.map(u => u.state));
        if (states.size > 1 && zoomedStateRef.current !== null) {
          setZoomedState(null);
          setSelectedUniversity(null);
        }
      }
      return next;
    });
  }, []);

  const clearComparedUniversities = useCallback(() => {
    setComparedUniversities([]);
  }, []);

  const backToNational = useCallback(() => {
    setZoomedState(null);
    setSelectedUniversity(null);
  }, []);

  const zoomToUniversity = useCallback((uni) => {
    if (zoomedStateRef.current === uni.state) {
      setSelectedUniversity(uni);
      return;
    }

    if (zoomedStateRef.current !== null) {
      pendingUniRef.current = uni;
      setZoomedState(null);
      setSelectedUniversity(null);
      setTimeout(() => {
        const pending = pendingUniRef.current;
        if (pending) {
          pendingUniRef.current = null;
          setZoomedState(pending.state);
          setSelectedUniversity(pending);
        }
      }, 500);
      return;
    }

    setZoomedState(uni.state);
    setSelectedUniversity(uni);
  }, []);

  return (
    <AppContext.Provider value={{
      metric, setMetric,
      selectedStates, toggleState,
      zoomedState, zoomToState, zoomToUniversity, backToNational,
      selectedUniversity, setSelectedUniversity,
      comparedUniversities, toggleCompareUniversity, clearComparedUniversities,
      highlightedUnis, setHighlightedUnis,
      chartView, setChartView,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
