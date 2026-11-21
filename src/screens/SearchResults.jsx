// SearchResults.jsx - Search Results and Route Matching Page
import React, { useState, useMemo } from 'react';
import { Bus, ArrowUpDown, AlertCircle, ArrowLeft, RefreshCw, Sparkles, Navigation } from 'lucide-react';
import SearchForm from '../components/SearchForm';
import BusCard from '../components/BusCard';
import AlternativeBusCard from '../components/AlternativeBusCard';
import {
  getAlternativeBuses,
  getIsLiveFromSupabase,
  isServiceAreaLocation,
  searchBusesByCoverage,
  searchCoastalDemoRoutes
} from '../services/busService';

export default function SearchResults({
  searchQuery,
  onSearch,
  onTrackBus,
  onBackToHome
}) {
  const [sortBy, setSortBy] = useState('recommended');
  const [selectedBusForAlternatives, setSelectedBusForAlternatives] = useState(null);

  // Execute search using the service
  const coverage = useMemo(() => {
    return searchBusesByCoverage({
      source: searchQuery?.source || '',
      destination: searchQuery?.destination || '',
      crowdFilter: searchQuery?.crowdFilter || 'all',
      sort: sortBy
    });
  }, [searchQuery, sortBy]);
  const results = coverage.direct;

  const coastalDemoRoutes = useMemo(() => {
    const liveRouteNames = new Set([
      ...coverage.direct,
      ...coverage.reverseOrder,
      ...coverage.sourceOnly,
      ...coverage.destinationOnly
    ].map((bus) => bus.routeName.trim().toLowerCase()));

    return searchCoastalDemoRoutes({
      source: searchQuery?.source || '',
      destination: searchQuery?.destination || ''
    }).filter((route) => !liveRouteNames.has(route.routeName.trim().toLowerCase()));
  }, [coverage, searchQuery?.source, searchQuery?.destination]);

  // Compute alternatives for modal/drawer if selected
  const alternativesList = useMemo(() => {
    if (!selectedBusForAlternatives) return [];
    return getAlternativeBuses(
      selectedBusForAlternatives.id,
      searchQuery?.source,
      searchQuery?.destination
    );
  }, [selectedBusForAlternatives, searchQuery]);

  const hasSearchTerm = Boolean(searchQuery?.source || searchQuery?.destination);
  const relatedBusesCount = coverage.reverseOrder.length
    + coverage.sourceOnly.length
    + coverage.destinationOnly.length;
  const busDataSource = getIsLiveFromSupabase() ? 'shared database' : 'local demo fleet';
  const renderRelatedBusCards = (buses) => (
    <div className="results-grid">
      {buses.map((bus) => (
        <BusCard
          key={bus.id}
          bus={{ ...bus, journeyDetails: null }}
          onTrackBus={onTrackBus}
        />
      ))}
    </div>
  );
  const googleMapsTransitUrl = useMemo(() => {
    const source = searchQuery?.source?.trim();
    const destination = searchQuery?.destination?.trim();
    if (!source || !destination) return null;

    const params = new URLSearchParams({
      api: '1',
      origin: source,
      destination,
      travelmode: 'transit'
    });
    return `https://www.google.com/maps/dir/?${params.toString()}`;
  }, [searchQuery?.source, searchQuery?.destination]);

  return (
    <div className="search-results-page animate-fade-in">
      {/* Top Search Controls Bar */}
      <div className="search-header-panel">
        <div className="search-header-container">
          <div className="header-navigation-row">
            <button
              type="button"
              className="back-btn"
              onClick={onBackToHome}
              aria-label="Back to home page"
            >
              <ArrowLeft size={18} />
              <span>Back to Home</span>
            </button>

            {hasSearchTerm && (
              <div className="current-search-badge">
                <span className="badge-label">Journey:</span>
                <span className="badge-route">
                  {searchQuery.source || 'Any origin'} → {searchQuery.destination || 'Any destination'}
                </span>
                {searchQuery.crowdFilter !== 'all' && (
                  <span className="badge-filter">Filter: {searchQuery.crowdFilter}</span>
                )}
              </div>
            )}
          </div>

          {/* Compact Search Form */}
          <div className="compact-search-container">
            <SearchForm
              initialSource={searchQuery?.source || ''}
              initialDestination={searchQuery?.destination || ''}
              initialCrowdFilter={searchQuery?.crowdFilter || 'all'}
              onSearch={onSearch}
              compact={true}
            />
          </div>
        </div>
      </div>

      <div className="results-content-container">
        {/* Results Bar: Count & Sorting */}
        <div className="results-toolbar">
          <div className="results-count">
            <Bus size={18} className="text-coral" />
            <span>
              <strong>{results.length}</strong> {results.length === 1 ? 'direct bus found' : 'direct buses found'}
            </span>
            {hasSearchTerm && <span className="results-scope">from the {busDataSource}</span>}
            {relatedBusesCount > 0 && (
              <span className="results-scope">
                {relatedBusesCount} related {relatedBusesCount === 1 ? 'bus' : 'buses'} shown separately; not all are direct trips
              </span>
            )}
            {coastalDemoRoutes.length > 0 && (
              <span className="results-scope">
                {coastalDemoRoutes.length} sample {coastalDemoRoutes.length === 1 ? 'route' : 'routes'} shown separately
              </span>
            )}
            {coverage.connected.length > 0 && (
              <span className="results-scope">
                {coverage.connected.length} connected {coverage.connected.length === 1 ? 'journey' : 'journeys'} available
              </span>
            )}
          </div>

          <div className="sort-controls">
            <label htmlFor="sort-select" className="sort-label">
              <ArrowUpDown size={14} /> Sort by:
            </label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-dropdown"
            >
              <option value="recommended">🌟 Recommended (Crowd + ETA)</option>
              <option value="crowd">🟢 Least Crowded First</option>
              <option value="arrival">⚡ Earliest Arrival</option>
              <option value="duration">⏱️ Shortest Travel Duration</option>
              <option value="fare">💰 Lowest Fare</option>
            </select>
          </div>
        </div>

        {googleMapsTransitUrl
          && isServiceAreaLocation(searchQuery?.source)
          && isServiceAreaLocation(searchQuery?.destination) && (
          <section className="google-directions-panel" aria-label="Google Maps transit directions">
            <div className="google-directions-copy">
              <h2>Need broader route coverage?</h2>
              <p>
                Check public-transit directions for this journey in Google Maps. Availability depends
                on local agency data; these directions are not verified CrowdFlow bus schedules,
                live locations, or crowd readings.
              </p>
            </div>
            <a
              className="btn_1 outline"
              href={googleMapsTransitUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Navigation size={15} />
              <span>Open Google Maps directions</span>
            </a>
          </section>
        )}

        {/* Results List */}
        {results.length > 0 ? (
          <div className="results-grid">
            {results.map((bus) => (
              <BusCard
                key={bus.id}
                bus={bus}
                onTrackBus={onTrackBus}
                onViewAlternatives={(b) => setSelectedBusForAlternatives(b)}
              />
            ))}
          </div>
        ) : (
          /* Empty Search State */
          <div className="empty-results-card">
            <div className="empty-icon-bubble">
              <AlertCircle size={36} className="text-amber-500" />
            </div>
            <h3 className="empty-title">No Direct Buses in the {busDataSource}</h3>
            <p className="empty-description">
              No recorded route covers both selected stops in this direction:{' '}
              <strong>"{searchQuery?.source || 'Origin'}"</strong> and{' '}
              <strong>"{searchQuery?.destination || 'Destination'}"</strong>.
            </p>

            <div className="empty-tips-box">
              <h4>What you can try:</h4>
              <ul>
                <li>Select a listed bus stop rather than only a district name when one is available.</li>
                <li>Check the related buses and sample coastal routes below; they are not direct live services.</li>
                <li>Try relaxing your crowd filter if one was selected.</li>
              </ul>
            </div>

            {coverage.connected.length === 0 && (
              <button
                type="button"
                className="btn_1 reset-search-btn"
                onClick={() => onSearch({ source: '', destination: '', crowdFilter: 'all' })}
              >
                <RefreshCw size={15} />
                <span>Show All Fleet Buses</span>
              </button>
            )}
          </div>
        )}

        {coverage.connected.length > 0 && (
          <section className="related-bus-results">
            <h3>Connected journeys with one bus change ({coverage.connected.length})</h3>
            <p>These options combine recorded routes through a shared stop. Transfer availability is subject to live schedules.</p>
            <div className="buses-grid">
              {coverage.connected.map((journey) => {
                const pickupIndex = journey.pickupBus.stops.findIndex((stop) =>
                  stop.name.toLowerCase() === (searchQuery?.source || '').toLowerCase()
                  || stop.name.toLowerCase().includes((searchQuery?.source || '').toLowerCase())
                );
                const transferIndex = journey.pickupBus.stops.findIndex((stop) =>
                  stop.name === journey.transferStop.name
                );
                const pickupBoardIndex = pickupIndex >= 0 ? pickupIndex : 0;

                return (
                  <article className="tour_container bus-card" key={journey.id}>
                    <div className="tour_title_wrapper">
                      <div className="tour_title">
                        <h3 className="route-title">
                          <strong>{journey.pickupBus.busNumber}</strong> + <strong>{journey.dropBus.busNumber}</strong>
                        </h3>
                        <div className="rating">
                          <span className="rating-crowd-text">One transfer via {journey.transferStop.name}</span>
                        </div>
                      </div>
                      <div className="journey-path-preview">
                        <div className="path-node">
                          <span className="path-dot origin" />
                          <div className="path-text">
                            <span className="path-label">From:</span>
                            <span className="path-stop-name">{journey.pickupBus.stops[pickupBoardIndex]?.name || searchQuery?.source}</span>
                          </div>
                        </div>
                        <div className="path-connector">
                          <span className="path-line" />
                          <div className="path-stats-pill">
                            <span>Transfer</span>
                            <span className="dot-divider">•</span>
                            <span>~{journey.totalMinutes} mins</span>
                          </div>
                          <Navigation size={14} />
                        </div>
                        <div className="path-node">
                          <span className="path-dot destination" />
                          <div className="path-text">
                            <span className="path-label">To:</span>
                            <span className="path-stop-name">{searchQuery?.destination}</span>
                          </div>
                        </div>
                      </div>
                      <div className="bus-metrics-row">
                        <div className="metric-box">
                          <div className="metric-label">Leg 1</div>
                          <div className="metric-val">{journey.pickupBus.busNumber} • {journey.firstLegStops} stops</div>
                        </div>
                        <div className="metric-box">
                          <div className="metric-label">Leg 2</div>
                          <div className="metric-val">{journey.dropBus.busNumber} • {journey.secondLegStops} stops</div>
                        </div>
                        <div className="metric-box">
                          <div className="metric-label">Estimated Fare</div>
                          <div className="metric-val">₹{journey.totalFare}</div>
                        </div>
                      </div>
                      <div className="bus-card-actions">
                        <button
                          type="button"
                          className="btn_1 action-btn-primary"
                          onClick={() => onTrackBus(journey.pickupBus)}
                        >
                          <Navigation size={14} />
                          <span>Track First Bus</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {coverage.reverseOrder.length > 0 && (
          <section className="related-bus-results">
            <h3>Routes listing both stops in the opposite order ({coverage.reverseOrder.length})</h3>
            <p>The stored route order is opposite to your search; a return trip or its schedule is not confirmed.</p>
            {renderRelatedBusCards(coverage.reverseOrder)}
          </section>
        )}

        {coverage.sourceOnly.length > 0 && (
          <section className="related-bus-results">
            <h3>Buses serving the pickup only ({coverage.sourceOnly.length})</h3>
            <p>These buses do not have the selected destination recorded on their route.</p>
            {renderRelatedBusCards(coverage.sourceOnly)}
          </section>
        )}

        {coverage.destinationOnly.length > 0 && (
          <section className="related-bus-results">
            <h3>Buses serving the destination only ({coverage.destinationOnly.length})</h3>
            <p>These buses do not have the selected pickup recorded on their route.</p>
            {renderRelatedBusCards(coverage.destinationOnly)}
          </section>
        )}

        {coastalDemoRoutes.length > 0 && (
          <section className="coastal-demo-results">
            <h3>Sample coastal routes — not live or verified</h3>
            <p>
              These bundled examples are shown separately from the shared bus database. Their
              operators, terminals, schedules, fares, live locations, and crowd readings are not verified.
            </p>
            <div className="coastal-demo-grid">
              {coastalDemoRoutes.map((route) => (
                <article className="coastal-demo-card" key={route.id}>
                  <span className="coastal-demo-label">
                    {route.matchType === 'direct'
                      ? 'Sample route match'
                      : route.matchType === 'reverse'
                        ? 'Sample route in reverse order — not verified'
                        : 'Sample route at one selected stop'}
                  </span>
                  <h4>{route.routeName}</h4>
                  <p>{route.stops.join(' → ')}</p>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Alternative Buses Modal / Slide Drawer */}
      {selectedBusForAlternatives && (
        <div className="modal-overlay animate-fade-in" onClick={() => setSelectedBusForAlternatives(null)}>
          <div className="modal-content animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-badge">
                  <Sparkles size={16} /> Alternative Options
                </div>
                <h3>Alternatives for Bus {selectedBusForAlternatives.busNumber}</h3>
                <p className="modal-subtitle">
                  Currently <strong>{selectedBusForAlternatives.crowdLevel} crowd</strong> ({selectedBusForAlternatives.occupancyPercent}% full) • Arriving in {selectedBusForAlternatives.nextArrivalMins}m
                </p>
              </div>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setSelectedBusForAlternatives(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {alternativesList.length > 0 ? (
                <div className="alternatives-modal-grid">
                  {alternativesList.map((altBus) => (
                    <AlternativeBusCard
                      key={altBus.id}
                      alternativeBus={altBus}
                      currentBus={selectedBusForAlternatives}
                      onSelectAlternative={(bus) => {
                        setSelectedBusForAlternatives(null);
                        onTrackBus(bus);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="no-alternatives-notice">
                  <p>No direct overlapping alternative buses currently operating within this corridor.</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn_1 modal-action-btn"
                onClick={() => {
                  const b = selectedBusForAlternatives;
                  setSelectedBusForAlternatives(null);
                  onTrackBus(b);
                }}
              >
                <Navigation size={15} />
                <span>Keep & Track Bus {selectedBusForAlternatives.busNumber}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
