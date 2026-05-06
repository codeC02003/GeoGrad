import React from 'react';

const SOURCES = [
  {
    name: 'IPEDS',
    full: 'Integrated Postsecondary Education Data System',
    org: 'National Center for Education Statistics (NCES)',
    contributes: 'University locations, enrollment, tuition & fees, graduation rates, admission rates, and institution type.',
    freq: 'Annual',
  },
  {
    name: 'BLS',
    full: 'Bureau of Labor Statistics',
    org: 'U.S. Department of Labor',
    contributes: 'Median salary by state, unemployment rates, and occupational wage estimates.',
    freq: 'Annual',
  },
  {
    name: 'NSF HERD',
    full: 'Higher Education Research & Development Survey',
    org: 'National Science Foundation',
    contributes: 'R&D expenditure aggregated by state and institution.',
    freq: 'Annual',
  },
  {
    name: 'FBI UCR',
    full: 'Uniform Crime Reporting / Hate Crime Statistics',
    org: 'Federal Bureau of Investigation',
    contributes: 'Hate crime incidents by state used as a proxy for safety.',
    freq: 'Annual',
  },
  {
    name: 'NOAA',
    full: 'National Oceanic and Atmospheric Administration',
    org: 'U.S. Department of Commerce',
    contributes: 'Average high temperature and climate indicators by state.',
    freq: 'Annual',
  },
  {
    name: 'Scimago IR',
    full: 'Scimago Institutions Rankings',
    org: 'Scimago Lab',
    contributes: 'Research output rankings for U.S. universities in Computer Science.',
    freq: 'Annual',
  },
];

const METRICS_DEF = [
  { metric: 'Tuition (Out-of-State / In-State)', def: 'Average of published tuition and fees for all universities in a state that reported to IPEDS.' },
  { metric: 'Admission Rate', def: 'Average admission rate (accepted / applied) across reporting institutions per state.' },
  { metric: 'Graduation Rate', def: '6-year graduation rate for first-time, full-time students, averaged by state.' },
  { metric: 'Retention Rate', def: 'First-year retention rate (returning students / enrolled), averaged by state.' },
  { metric: 'Safety (Hate Crime Incidents)', def: 'Total reported hate crime incidents per state. Lower values indicate fewer reported incidents.' },
  { metric: 'Cost of Living', def: 'Annual estimated total cost including rent, groceries, transport, and utilities.' },
  { metric: 'Avg High Temperature (°F)', def: 'Average annual high temperature in degrees Fahrenheit by state.' },
  { metric: 'Number of Universities', def: 'Count of IPEDS-reporting 4-year institutions in each state.' },
];

export default function DataSourcesPage() {
  return (
    <div className="info-page">
      <div className="info-hero">
        <h1>Data &amp; Sources</h1>
        <p>Transparent, federal, and publicly accessible datasets</p>
      </div>

      <div className="info-content">
        <section className="info-section">
          <h2>Datasets Used</h2>
          <div className="source-cards">
            {SOURCES.map(s => (
              <div key={s.name} className="source-card">
                <div className="source-header">
                  <span className="source-badge">{s.name}</span>
                  <span className="source-freq">{s.freq}</span>
                </div>
                <div className="source-full">{s.full}</div>
                <div className="source-org">{s.org}</div>
                <p className="source-contributes">{s.contributes}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="info-section">
          <h2>Metric Definitions</h2>
          <div className="glossary-list">
            {METRICS_DEF.map(m => (
              <div key={m.metric} className="glossary-item">
                <dt>{m.metric}</dt>
                <dd>{m.def}</dd>
              </div>
            ))}
          </div>
        </section>

        <section className="info-section">
          <h2>Limitations</h2>
          <ul className="limitations-list">
            <li>Data reflects the most recent available year; some datasets may lag by 1–2 years.</li>
            <li>State-level metrics are averages across reporting institutions and may not reflect all schools.</li>
            <li>Cost of living data is from third-party estimates and may vary significantly within a state.</li>
            <li>Hate crime statistics rely on voluntary reporting — actual incidence may differ.</li>
            <li>Rankings and research data cover Computer Science specifically and may not generalize to all programs.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
