# GeoGrad

An interactive geospatial decision-support system for U.S. Master's program selection. GeoGrad integrates five public datasets covering 2,095 four-year institutions across all 50 U.S. states and Washington D.C., providing coordinated multi-view visualization to help prospective graduate students make informed decisions.

## Features

- **National Choropleth Map** with four switchable state-level metrics (cost of living, safety, climate, university count) and a toggleable university overlay showing all 2,095 institutions as clustered markers
- **Interactive Filtering** via sidebar range sliders (7 metrics) and parallel coordinates axis brushing, with cross-view coordination that propagates filters to all views simultaneously
- **Filter-Aware University Overlay** on the national map that dynamically excludes non-matching institutions from cluster groups, so cluster counts reflect only filtered results
- **State Drill-Down** with metric-aware marker clustering at actual GPS coordinates and five switchable university-level metrics
- **Scatter Plot** with eight selectable axes for exploring bivariate correlations across all institutions
- **Parallel Coordinates** with seven axes, draggable axis reordering, and axis brushing for multi-dimensional filtering
- **Radar Chart** comparing selected universities across seven normalized dimensions (normalized against the full 2,095-institution dataset)
- **Multi-State Comparison Panel** with ten metrics and direction-aware best-value highlighting
- **University Comparison Panel** with nine metrics, best-value highlighting, and direct website links
- **Distance Measurement Tool** using Haversine formula for straight-line distances between a reference pin and compared universities
- **University Search Bar** with autocomplete across all 2,095 institutions

## Tech Stack

- **React.js v18** with React Router and React Context API for coordinated state management
- **Leaflet.js** with Leaflet.markercluster for interactive maps, GeoJSON overlays, and marker clustering
- **D3.js v7** for color scales, scatter plot, parallel coordinates with axis brushing, radar chart, and enrollment-based marker sizing
- **CARTO Positron** light tiles as the base map

## Data Sources

| Source | Level | Description |
|--------|-------|-------------|
| IPEDS 2023/24 | Institution | Tuition, enrollment, admission/graduation/retention rates, GPS coordinates, financial aid, faculty data |
| Scimago IR | Institution | Overall and research rankings (US and global), fuzzy-matched to IPEDS at 82% threshold |
| Cost of Living Index | State | Total annual cost, housing cost, median income |
| FBI UCR | State | Hate-crime incidents and victims (safety proxy) |
| NOAA Climate | State | Average high/low temperature, precipitation |

Pre-generated data files are included in `src/data/`:
- `university_data.json` (2,095 records, 1.8 MB)
- `state_data.json` (51 entries, 32 KB)
- `us-states.json` (GeoJSON boundaries, 96 KB)

## Getting Started

### Prerequisites

- Node.js v18 or later
- npm

### Installation

```bash
cd GeoGrad
npm install
```

### Running

```bash
npm start
```

Opens the application at [http://localhost:3000](http://localhost:3000).

## Project Structure

```
GeoGrad/
  src/
    components/
      NationalMap.js        # Choropleth + university overlay + filter-aware clustering
      StateMap.js            # State drill-down with metric-aware marker clustering
      ScatterPlot.js         # Bivariate scatter plot with selectable axes
      ParallelCoordinates.js # 7-axis parallel coordinates with brushing
      RadarChart.js          # Normalized radar chart for university comparison
      FilterPanel.js         # Sidebar range sliders (7 metrics)
      ComparisonPanel.js     # Multi-state comparison panel
      UniversityComparisonPanel.js  # University-level comparison
      UniversityDetailPanel.js      # Individual university detail view
      SearchBar.js           # Autocomplete university search
      Navbar.js              # Navigation bar
    context/
      AppContext.js           # Shared state (13 variables) via React Context
    pages/
      MapPage.js             # Main visualization page (map + sidebar)
      HomePage.js            # Landing page
      AboutPage.js           # About the project
      DataSourcesPage.js     # Data source descriptions
      HowItWorksPage.js      # Usage guide
    data/
      university_data.json   # 2,095 institution records
      state_data.json        # 51 state-level entries
      us-states.json         # GeoJSON state boundaries
    utils/
      distance.js            # Haversine distance calculation
    App.js                   # Root component with routing
    App.css                  # Global styles
```

## Data Pipeline

The data pipeline (`build_data.py`, ~540 lines) is available in the project root. It:

1. Extracts institution data from the IPEDS 2023/24 Access database (587 MB) using `mdb-export`
2. Cleans and normalizes ~40 fields per institution
3. Fuzzy-matches institution names to Scimago rankings at 82% threshold
4. Aggregates institution-level metrics to state-level averages
5. Outputs `state_data.json` and `university_data.json`

The pipeline requires Python 3 with Pandas and `mdb-tools`. Since pre-generated JSON files are included, the pipeline does not need to be re-run to use the application.

## Author

Chinmay Mhatre - University of Arizona (chinmaymhatre@arizona.edu)

Developed as part of CSC 544: Data Visualization, Spring 2026.
