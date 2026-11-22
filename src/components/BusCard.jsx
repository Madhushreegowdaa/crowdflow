// BusCard.jsx - CityTours Tour-Style Bus Journey Card Component
import React from 'react';
import { Bus, Clock, ArrowRight, Sparkles, MapPin, Gauge, Navigation, Smile } from 'lucide-react';
import LiveArrivalTicker from './LiveArrivalTicker';

const toNullableNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

export default function BusCard({
  bus,
  onTrackBus,
  onViewAlternatives,
  isFeatured = false
}) {
  if (!bus) return null;

  const journey = bus.journeyDetails;
  const boardName = journey?.boardStopName || bus.stops[0]?.name;
  const dropName = journey?.dropStopName || bus.stops[bus.stops.length - 1]?.name;
  const travelMins = journey?.estimatedTravelMins || bus.totalDurationMins;
  const stopsCount = journey?.stopsCount || bus.stops.length;
  const crowdLevel = typeof bus.crowdLevel === 'string'
    ? bus.crowdLevel.trim().toLowerCase()
    : 'unavailable';
  const occupancy = toNullableNumber(bus.occupancyPercent);
  const passengers = toNullableNumber(bus.currentPassengers);
  const capacity = toNullableNumber(bus.totalCapacity);

  // CityTours Ribbon determination
  const ribbonType =
    crowdLevel === 'low' ? 'popular' :
    crowdLevel === 'high' || crowdLevel === 'very high' ? 'crowded' :
    crowdLevel === 'moderate' ? (isFeatured ? 'popular' : 'moderate') : 'unavailable';

  const ribbonText =
    crowdLevel === 'low' ? 'Low Crowd' :
    crowdLevel === 'high' || crowdLevel === 'very high' ? 'Packed' :
    crowdLevel === 'moderate'
      ? bus.status === 'On Time' ? 'On Time' : 'Corridor'
      : 'Crowd Unavailable';

  return (
    <div className={`tour_container bus-card ${isFeatured ? 'featured-bus-card' : ''}`}>
      {/* CityTours Ribbon */}
      <div className={`ribbon_3 ${ribbonType}`}>
        <span>{ribbonText}</span>
      </div>

      {/* Top Banner / Image Container with Short Info Overlay */}
      <div className="img_container transit-img-container">
        <div className="transit-cover-backdrop">
          <div className="bus-hero-pill">
            <Bus size={15} />
            <span className="bus-no">{bus.busNumber}</span>
          </div>
          <span className="bus-plate-tag">{bus.plateNumber}</span>
        </div>
        <div className="short_info">
          <span className="short-info-cat">
            <span className="dot-live" /> {bus.category}
          </span>
          <span className="price"><sup>₹</sup>{bus.fare}</span>
        </div>
      </div>

      <div className="tour_title_wrapper">
        {/* Route Headline */}
        <div className="tour_title">
          <h3 className="route-title">
            <strong>{bus.busNumber}</strong> {bus.routeName}
          </h3>
          <div className="rating">
            <Smile size={14} className={crowdLevel === 'low' ? 'text-green' : crowdLevel === 'moderate' ? 'text-amber' : crowdLevel === 'unavailable' ? 'text-gray-400' : 'text-red'} />
            <span className="rating-crowd-text capitalize">
              {crowdLevel === 'unavailable' ? 'Crowd info unavailable' : `${crowdLevel} Density`}
              {' '}({occupancy === null ? 'occupancy unavailable' : `${occupancy}% full`})
            </span>
          </div>
        </div>

        {/* Boarding and Destination Path Visual */}
        <div className="journey-path-preview">
          <div className="path-node">
            <span className="path-dot origin" />
            <div className="path-text">
              <span className="path-label">From:</span>
              <span className="path-stop-name" title={boardName}>{boardName}</span>
            </div>
          </div>

          <div className="path-connector">
            <span className="path-line" />
            <div className="path-stats-pill">
              <Clock size={11} />
              <span>~{travelMins} mins</span>
              <span className="dot-divider">•</span>
              <span>{stopsCount} stops</span>
            </div>
            <ArrowRight size={14} className="path-arrow" />
          </div>

          <div className="path-node">
            <span className="path-dot destination" />
            <div className="path-text">
              <span className="path-label">To:</span>
              <span className="path-stop-name" title={dropName}>{dropName}</span>
            </div>
          </div>
        </div>

        {/* Metrics Row: Arrival, Speed/Status, Capacity */}
        <div className="bus-metrics-row">
          <div className="metric-box arrival-metric">
            <div className="metric-label">Next Arrival</div>
            <div className="metric-val text-coral">
              {bus.nextArrivalMins === 0 ? 'Arriving Now' : `In ${bus.nextArrivalMins} mins`}
            </div>
          </div>

          <div className="metric-box status-metric">
            <div className="metric-label">Live Status</div>
            <div className="metric-val">
              <span className="live-status-dot" />
              <span>{bus.status}</span>
            </div>
          </div>

          <div className="metric-box fare-metric">
            <div className="metric-label">Passengers</div>
            <div className="metric-val">
              {passengers === null ? 'Unavailable' : passengers} / {capacity === null ? 'Unavailable' : capacity}
            </div>
          </div>
        </div>

        {/* Amenities & Live Location info */}
        <div className="bus-location-callout">
          <MapPin size={13} className="text-coral" />
          <span className="location-text">
            <strong>Current:</strong> {bus.currentLocation?.address || 'Operating on corridor'}
          </span>
          {bus.speed > 0 && (
            <span className="bus-speed-badge">
              <Gauge size={11} /> {bus.speed} km/h
            </span>
          )}
        </div>

        {/* Live Arrival Ticker */}
        <LiveArrivalTicker bus={bus} targetStopName={journey?.boardStopName} />

        {/* Card Actions in CityTours Button Styles */}
        <div className="bus-card-actions">
          {onViewAlternatives && (
            <button
              type="button"
              className="btn_1 outline action-btn-secondary"
              onClick={() => onViewAlternatives(bus)}
            >
              <Sparkles size={14} />
              <span>Alternatives</span>
            </button>
          )}

          <button
            type="button"
            className="btn_1 action-btn-primary"
            onClick={() => onTrackBus(bus)}
          >
            <Navigation size={14} />
            <span>Track Live Map</span>
          </button>
        </div>
      </div>
    </div>
  );
}
