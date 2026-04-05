import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import universityData from '../data/university_data.json';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapperRef = useRef(null);
  const listRef = useRef(null);

  const { zoomToUniversity, toggleCompareUniversity, comparedUniversities } = useApp();

  // Filter and rank matches
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];

    const scored = universityData
      .filter(u => u.name && u.lat != null && u.lon != null)
      .map(u => {
        const name = u.name.toLowerCase();
        // Exact start match gets highest priority
        if (name.startsWith(q)) return { uni: u, score: 0 };
        // Word-start match
        const words = name.split(/\s+/);
        if (words.some(w => w.startsWith(q))) return { uni: u, score: 1 };
        // Contains match
        if (name.includes(q)) return { uni: u, score: 2 };
        return null;
      })
      .filter(Boolean)
      .sort((a, b) => a.score - b.score || a.uni.name.localeCompare(b.uni.name));

    return scored.slice(0, 8).map(s => s.uni);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Scroll active item into view
  useEffect(() => {
    if (activeIdx >= 0 && listRef.current) {
      const item = listRef.current.children[activeIdx];
      if (item) item.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIdx]);

  function handleSelect(uni) {
    setQuery('');
    setOpen(false);
    setActiveIdx(-1);
    zoomToUniversity(uni);
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (!open || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      // Select highlighted item, or first result if none highlighted
      const idx = activeIdx >= 0 ? activeIdx : 0;
      handleSelect(results[idx]);
    }
  }

  return (
    <div className="search-bar-wrapper" ref={wrapperRef}>
      <div className="search-input-container">
        <svg className="search-icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder="Search universities..."
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIdx(-1);
          }}
          onFocus={() => query.length >= 2 && setOpen(true)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {open && results.length > 0 && (
        <ul className="search-results" ref={listRef}>
          {results.map((uni, i) => {
            const isCompared = comparedUniversities.some(u => u.unitid === uni.unitid);
            return (
              <li
                key={uni.unitid}
                className={`search-result-item ${i === activeIdx ? 'active' : ''}`}
                onMouseEnter={() => setActiveIdx(i)}
                onMouseDown={() => handleSelect(uni)}
              >
                <div className="search-result-info">
                  <span className="search-result-name">{uni.name}</span>
                  <span className="search-result-meta">{uni.city}, {uni.state}</span>
                </div>
                <button
                  className={`search-compare-btn ${isCompared ? 'compared' : ''}`}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    toggleCompareUniversity(uni);
                  }}
                  title={isCompared ? 'Remove from comparison' : 'Add to comparison'}
                >
                  {isCompared ? '−' : '+'}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {open && query.length >= 2 && results.length === 0 && (
        <div className="search-no-results">No universities found</div>
      )}
    </div>
  );
}
