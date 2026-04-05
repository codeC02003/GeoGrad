import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  // Currently selected metric for coloring states
  const [metric, setMetric] = useState('cost_total');

  // States clicked for comparison (array of abbr strings, e.g. ['CA','TX'])
  const [selectedStates, setSelectedStates] = useState([]);

  // State zoomed into (double-click) — null means national view
  const [zoomedState, setZoomedState] = useState(null);

  // University selected in the state drill-down view
  const [selectedUniversity, setSelectedUniversity] = useState(null);

  // Universities added to comparison (array of university objects)
  const [comparedUniversities, setComparedUniversities] = useState([]);

  // Ref to track pending university zoom (for cross-state search)
  const pendingUniRef = useRef(null);

  function toggleState(abbr) {
    setSelectedStates(prev =>
      prev.includes(abbr) ? prev.filter(s => s !== abbr) : [...prev, abbr]
    );
  }

  function zoomToState(abbr) {
    setZoomedState(abbr);
    setSelectedUniversity(null);
  }

  function toggleCompareUniversity(uni, autoZoomOut = true) {
    setComparedUniversities(prev => {
      const exists = prev.find(u => u.unitid === uni.unitid);
      if (exists) return prev.filter(u => u.unitid !== uni.unitid);

      const next = [...prev, uni];
      // If compared universities span multiple states, go to national view
      if (autoZoomOut) {
        const states = new Set(next.map(u => u.state));
        if (states.size > 1 && zoomedState !== null) {
          setZoomedState(null);
          setSelectedUniversity(null);
        }
      }
      return next;
    });
  }

  function clearComparedUniversities() {
    setComparedUniversities([]);
  }

  const zoomToUniversity = useCallback((uni) => {
    // If already zoomed into the SAME state, just update selected university
    if (zoomedState === uni.state) {
      setSelectedUniversity(uni);
      return;
    }

    // If zoomed into a DIFFERENT state, go back to national first, then zoom to new state
    if (zoomedState !== null) {
      pendingUniRef.current = uni;
      setZoomedState(null);
      setSelectedUniversity(null);
      // After the national view renders, zoom to the new state+university
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

    // From national view — direct zoom
    setZoomedState(uni.state);
    setSelectedUniversity(uni);
  }, [zoomedState]);

  function backToNational() {
    setZoomedState(null);
    setSelectedUniversity(null);
  }

  return (
    <AppContext.Provider value={{
      metric, setMetric,
      selectedStates, toggleState,
      zoomedState, zoomToState, zoomToUniversity, backToNational,
      selectedUniversity, setSelectedUniversity,
      comparedUniversities, toggleCompareUniversity, clearComparedUniversities,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
