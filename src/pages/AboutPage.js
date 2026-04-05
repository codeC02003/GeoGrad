import React from 'react';
import { useNavigate } from 'react-router-dom';

const DIFFERENTIATORS = [
  {
    title: 'Choropleth Map',
    desc: 'Continuous state-level metrics encoded as color gradients — compare tuition, crime, and salary at a glance.',
  },
  {
    title: 'Tile Grid View',
    desc: 'Equal-area tile cartogram for count-based metrics, removing geographic area distortion.',
  },
  {
    title: 'State Drill-Down',
    desc: 'Double-click any state to zoom in and see individual university markers with academic and career details.',
  },
  {
    title: 'Multi-State Comparison',
    desc: 'Select multiple states and compare all metrics side-by-side in a structured panel.',
  },
];

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="info-page">
      <div className="info-hero">
        <h1>About GeoGrad</h1>
        <p>A visualization tool built from lived experience</p>
      </div>

      <div className="info-content">
        <section className="info-section">
          <h2>The Story</h2>
          <p>
            As an international student who personally navigated the fragmented and overwhelming process of applying to
            U.S. master's programs, I found that the data I needed — tuition costs, cost of living, safety, research
            strength, career outcomes — was scattered across dozens of websites with no way to compare them holistically.
          </p>
          <p>
            GeoGrad was built to solve that problem: a single interactive platform that brings all the decision factors
            together in a spatial, visual, and comparable form.
          </p>
        </section>

        <section className="info-section">
          <h2>What Problem It Solves</h2>
          <p>
            Most existing platforms like U.S. News focus narrowly on rankings. IPEDS provides raw tabular data with no
            visualization. Students end up manually synthesizing information from Google, Reddit, Glassdoor, Numbeo,
            and university websites — a cognitively demanding and error-prone process.
          </p>
          <p>
            GeoGrad integrates federal data from IPEDS, BLS, NSF, FBI, and NOAA into one interactive geospatial tool,
            making the comparison structured, visual, and holistic.
          </p>
        </section>

        <section className="info-section">
          <h2>What Makes It Different</h2>
          <div className="diff-grid">
            {DIFFERENTIATORS.map(d => (
              <div key={d.title} className="diff-card">
                <h3>{d.title}</h3>
                <p>{d.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="info-section">
          <h2>About the Author</h2>
          <div className="profile-card">
            <div className="profile-avatar">CM</div>
            <div className="profile-info">
              <h3>Chinmay Mhatre</h3>
              <p>Graduate Student · University of Arizona</p>
              <p>CSC 544 – Information Visualization · Spring 2025</p>
              <p>
                <a href="mailto:chinmaymhatre@arizona.edu">chinmaymhatre@arizona.edu</a>
              </p>
            </div>
          </div>
        </section>

        <div className="info-cta">
          <button className="btn-primary" onClick={() => navigate('/map')}>
            Open Interactive Map →
          </button>
        </div>
      </div>
    </div>
  );
}
