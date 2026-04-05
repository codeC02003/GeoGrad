import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const FEATURES = [
  {
    icon: '🗺️',
    title: 'Compare States',
    desc: 'Select multiple U.S. states and compare them side-by-side across tuition, cost of living, crime rate, salary, and research output.',
  },
  {
    icon: '🎓',
    title: 'Explore Universities',
    desc: 'Double-click any state to zoom in and see individual universities with academic, financial, and career outcome data.',
  },
  {
    icon: '📊',
    title: 'Multi-Metric Analysis',
    desc: 'Switch between 9 metrics — tuition, admission rate, graduation rate, safety, climate, R&D spending, and more.',
  },
  {
    icon: '📡',
    title: 'Federal Data Sources',
    desc: 'Built on IPEDS, BLS, NSF R&D, FBI crime, and NOAA climate data. Transparent, reproducible, and publicly available.',
  },
];

const DATA_SOURCES = ['IPEDS', 'BLS', 'NSF R&D', 'FBI Crime', 'NOAA', 'Scimago CS'];

export default function HomePage() {
  const navigate = useNavigate();

  const previewCells = useMemo(() =>
    Array.from({ length: 48 }, (_, i) => ({
      opacity: 0.25 + ((Math.sin(i * 0.9) + 1) / 2) * 0.75,
      hue: 210 + (i % 14) * 4,
      lightness: 28 + (i % 10) * 3,
    })), []);

  return (
    <div className="home-page">

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">Interactive Visualization Tool</div>
          <h1 className="hero-title">GeoGrad</h1>
          <p className="hero-subtitle">
            An interactive geospatial decision-support system for international students choosing a U.S. master's program —
            combining tuition, safety, research strength, career outcomes, and more in one place.
          </p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={() => navigate('/map')}>
              Open Interactive Map →
            </button>
            <button className="btn-secondary" onClick={() => navigate('/how-it-works')}>
              How It Works
            </button>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-map-preview">
            <div className="preview-label">Choropleth Preview</div>
            <div className="preview-grid">
              {previewCells.map((c, i) => (
                <div
                  key={i}
                  className="preview-cell"
                  style={{ opacity: c.opacity, background: `hsl(${c.hue}, 55%, ${c.lightness}%)` }}
                />
              ))}
            </div>
            <div className="preview-footer">9 metrics · 50 states · 2,095 universities</div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="features-section">
        <h2 className="section-title">What You Can Do</h2>
        <div className="features-grid">
          {FEATURES.map(f => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <h2>Ready to find your ideal program?</h2>
        <p>Explore all 50 states and hundreds of universities — all in one interactive map.</p>
        <button className="btn-primary" onClick={() => navigate('/map')}>
          Launch GeoGrad →
        </button>
      </section>

      {/* ── Footer ── */}
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">GeoGrad</div>
          <div className="footer-sources">
            <span className="footer-label">Data Sources:</span>
            {DATA_SOURCES.map(s => (
              <span key={s} className="footer-source-chip">{s}</span>
            ))}
          </div>
          <div className="footer-meta">
            Built by Chinmay Mhatre · University of Arizona CSC 544 · 2025
          </div>
        </div>
      </footer>
    </div>
  );
}
