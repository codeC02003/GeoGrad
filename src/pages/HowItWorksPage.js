import React from 'react';
import { useNavigate } from 'react-router-dom';

const STEPS = [
  {
    n: '01',
    title: 'Pick a Metric',
    desc: 'Use the left panel dropdown to choose from 9 metrics: tuition (in/out-of-state), admission rate, graduation rate, retention rate, cost of living, safety, climate, or number of universities.',
  },
  {
    n: '02',
    title: 'Switch Views',
    desc: 'Toggle between Choropleth (geographic shape map) and Tile Grid (equal-area grid). Both visualize the same data — choose whichever makes comparison easier.',
  },
  {
    n: '03',
    title: 'Select States to Compare',
    desc: 'Click any state to add it to your comparison list. A panel slides up at the bottom showing all metrics side-by-side. Click a selected state again to remove it.',
  },
  {
    n: '04',
    title: 'Drill Into a State',
    desc: 'Double-click any state to zoom into a state-level view showing individual university markers on the map. The breadcrumb at the top shows USA → State.',
  },
  {
    n: '05',
    title: 'Explore University Details',
    desc: 'Click a university marker to open its detail panel, showing academic metrics, tuition, graduation rate, admission rate, and career outcomes where available.',
  },
];

const GLOSSARY = [
  {
    term: 'Choropleth Map',
    def: 'A map where geographic regions (states) are colored by a data variable. Darker colors represent higher values for most metrics.',
  },
  {
    term: 'Tile Grid',
    def: 'A grid where each state is an equal-sized tile, removing geographic area bias. Large states like Alaska don\'t dominate the view.',
  },
  {
    term: 'Drill-Down',
    def: 'The interaction of clicking into a high-level view (national) to see a more detailed view (state with individual universities).',
  },
  {
    term: 'Comparison Panel',
    def: 'The panel at the bottom of the map that appears when you select states, displaying all metrics in a table for side-by-side comparison.',
  },
];

export default function HowItWorksPage() {
  const navigate = useNavigate();

  return (
    <div className="info-page">
      <div className="info-hero">
        <h1>How It Works</h1>
        <p>A step-by-step guide to using GeoGrad</p>
      </div>

      <div className="info-content">
        <section className="info-section">
          <h2>Step-by-Step Usage</h2>
          <div className="steps-list">
            {STEPS.map(s => (
              <div key={s.n} className="step-item">
                <div className="step-number">{s.n}</div>
                <div className="step-body">
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="info-section">
          <h2>Glossary</h2>
          <div className="glossary-list">
            {GLOSSARY.map(g => (
              <div key={g.term} className="glossary-item">
                <dt>{g.term}</dt>
                <dd>{g.def}</dd>
              </div>
            ))}
          </div>
        </section>

        <div className="info-cta">
          <button className="btn-primary" onClick={() => navigate('/map')}>
            Try It Now →
          </button>
        </div>
      </div>
    </div>
  );
}
