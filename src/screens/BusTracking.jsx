// BusTracking.jsx - Interactive Leaflet Bus Tracking Map & Live Telemetry
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  Bus, Navigation, Clock, Gauge, ArrowLeft, RefreshCw, 
  Play, Pause, Sparkles, UserCheck, Radio
} from 'lucide-react';
import CrowdIndicator from '../components/CrowdIndicator';
import RouteStops from '../components/RouteStops';
import AlternativeBusCard from '../components/AlternativeBusCard';
import { getBusById, advanceBusPosition, getAlternativeBuses, getAllBuses } from '../services/busService';

export default function BusTracking({
  busId,
  fleetRevision,
  searchQuery,
  onBack,
  onSelectBus
}) {
  const busesList = getAllBuses();
  const [activeBus, setActiveBus] = useState(() => getBusById(busId) || busesList[0]);
  const [isSimulating, setIsSimulating] = useState(true);
  const [simStep, setSimStep] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [showAlternatives, setShowAlternatives] = useState(false);

  // Map references
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const busMarkerRef = useRef(null);
  const stopsLayerRef = useRef(null);
  const routePolylineRef = useRef(null);

  // When busId prop changes, update active bus
  useEffect(() => {
    if (busId) {
      const b = getBusById(busId);
      if (b) {
        setActiveBus(b);
        setSimStep(0);
      }
    }
  }, [busId, fleetRevision]);

  // Alternatives for active bus
  const alternatives = getAlternativeBuses(
    activeBus.id,
    searchQuery?.source,
    searchQuery?.destination
  );

  // Create custom Leaflet HTML DivIcon for the bus
  const createBusDivIcon = (bus) => {
    const crowdColor =
      bus.crowdLevel === 'low' ? '#79a70a' :
      bus.crowdLevel === 'moderate' ? '#f59e0b' :
      bus.crowdLevel === 'high' ? '#e04f67' : '#999999';

    const html = `
      <div class="leaflet-bus-marker-wrapper" style="--crowd-color: ${crowdColor}">
        <div class="bus-pulse-ring"></div>
        <div class="bus-marker-pin" style="background-color: ${crowdColor}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="14" rx="2"/>
            <path d="M8 2v2"/><path d="M16 2v2"/><path d="M6 18h12"/>
            <circle cx="8" cy="21" r="1"/><circle cx="16" cy="21" r="1"/>
          </svg>
        </div>
        <div class="bus-marker-label">${bus.busNumber}</div>
      </div>
    `;

    return L.divIcon({
      className: 'custom-bus-leaflet-icon',
      html,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      popupAnchor: [0, -22]
    });
  };

  // Create custom icon for route stops
  const createStopDivIcon = (stop, index, isBoard, isDrop) => {
    const isSpecial = isBoard || isDrop;
    const bg = isBoard ? '#008489' : isDrop ? '#79a70a' : '#ffffff';
    const text = isSpecial ? '#ffffff' : '#333333';
    const border = isBoard ? '#006c70' : isDrop ? '#5a7c06' : '#cccccc';

    const html = `
      <div class="leaflet-stop-marker ${isSpecial ? 'special-stop' : ''}" style="background-color: ${bg}; border-color: ${border}; color: ${text}">
        <span>${index + 1}</span>
      </div>
    `;

    return L.divIcon({
      className: 'custom-stop-leaflet-icon',
      html,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12]
    });
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up if instance already exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const defaultLat = activeBus.currentLocation?.lat || 12.9716;
    const defaultLng = activeBus.currentLocation?.lng || 77.5946;

    const map = L.map(mapContainerRef.current, {
      center: [defaultLat, defaultLng],
      zoom: 13,
      zoomControl: false
    });

    // Add Tile Layer (CartoDB Positron / OSM style clean transit view)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    // Zoom controls at top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []); // Run once on mount

  // Update Map layers when activeBus changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !activeBus) return;

    // Clear previous layers
    if (stopsLayerRef.current) {
      map.removeLayer(stopsLayerRef.current);
    }
    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
    }

    // 1. Draw Route Polyline
    if (activeBus.routeCoordinates && activeBus.routeCoordinates.length > 0) {
      // Glow background path in CityTours coral
      const glowPath = L.polyline(activeBus.routeCoordinates, {
        color: '#fecdd3',
        weight: 8,
        opacity: 0.6,
        lineCap: 'round',
        lineJoin: 'round'
      });

      // Main route path in CityTours coral red
      const mainPath = L.polyline(activeBus.routeCoordinates, {
        color: '#e04f67',
        weight: 4,
        opacity: 0.95,
        dashArray: '8, 6',
        lineCap: 'round',
        lineJoin: 'round'
      });

      const polyGroup = L.layerGroup([glowPath, mainPath]).addTo(map);
      routePolylineRef.current = polyGroup;
    }

    // 2. Add Stop Markers
    const stopsGroup = L.layerGroup();
    const bounds = L.latLngBounds([]);

    activeBus.stops.forEach((stop, index) => {
      const isBoard = searchQuery?.source && stop.name.toLowerCase().includes(searchQuery.source.toLowerCase());
      const isDrop = searchQuery?.destination && stop.name.toLowerCase().includes(searchQuery.destination.toLowerCase());

      const marker = L.marker([stop.lat, stop.lng], {
        icon: createStopDivIcon(stop, index, isBoard, isDrop)
      });

      marker.bindPopup(`
        <div class="map-popup-card">
          <div class="popup-stop-number">Stop #${index + 1}</div>
          <h4 class="popup-title">${stop.name}</h4>
          <div class="popup-meta">
            <div><strong>Scheduled:</strong> ${stop.scheduledTime}</div>
            <div><strong>Estimated:</strong> ${stop.estimatedTime || 'On Schedule'}</div>
            <div><strong>Status:</strong> ${stop.passed ? 'Departed' : stop.isNext ? 'Approaching' : 'Upcoming'}</div>
          </div>
        </div>
      `);

      stopsGroup.addLayer(marker);
      bounds.extend([stop.lat, stop.lng]);
    });

    stopsGroup.addTo(map);
    stopsLayerRef.current = stopsGroup;

    // 3. Add or Update Bus Marker
    const busLoc = [activeBus.currentLocation.lat, activeBus.currentLocation.lng];
    bounds.extend(busLoc);

    if (!busMarkerRef.current) {
      const busMarker = L.marker(busLoc, {
        icon: createBusDivIcon(activeBus),
        zIndexOffset: 1000
      }).addTo(map);

      busMarker.bindPopup(`
        <div class="map-popup-card bus-popup">
          <div class="popup-bus-header">
            <span class="popup-bus-tag">${activeBus.busNumber}</span>
            <span class="popup-crowd-tag ${activeBus.crowdLevel}">${activeBus.crowdLevel} crowd</span>
          </div>
          <h4 class="popup-title">${activeBus.routeName}</h4>
          <div class="popup-meta">
            <div><strong>Current Speed:</strong> ${activeBus.speed} km/h</div>
            <div><strong>Location:</strong> ${activeBus.currentLocation.address}</div>
            <div><strong>Occupancy:</strong> ${activeBus.occupancyPercent}% (${activeBus.currentPassengers} passengers)</div>
          </div>
        </div>
      `);

      busMarkerRef.current = busMarker;
    } else {
      busMarkerRef.current.setLatLng(busLoc);
      busMarkerRef.current.setIcon(createBusDivIcon(activeBus));
    }

    // Auto-fit map to show route and bus location
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [activeBus.id]);

  // Simulation timer: Advances bus location every 3.5 seconds
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setSimStep((prev) => {
        const nextStep = prev + 1;
        const updated = advanceBusPosition(activeBus, nextStep);
        setActiveBus(updated);
        setLastUpdated(new Date());

        // Update marker position on map smoothly
        if (busMarkerRef.current && updated.currentLocation) {
          busMarkerRef.current.setLatLng([
            updated.currentLocation.lat,
            updated.currentLocation.lng
          ]);
        }
        return nextStep;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [isSimulating, activeBus]);

  // Manual refresh handler
  const handleManualRefresh = () => {
    const nextStep = simStep + 1;
    setSimStep(nextStep);
    const updated = advanceBusPosition(activeBus, nextStep);
    setActiveBus(updated);
    setLastUpdated(new Date());
    if (busMarkerRef.current && updated.currentLocation) {
      busMarkerRef.current.setLatLng([
        updated.currentLocation.lat,
        updated.currentLocation.lng
      ]);
    }
  };

  // Center map on bus
  const handleCenterOnBus = () => {
    if (mapInstanceRef.current && activeBus.currentLocation) {
      mapInstanceRef.current.setView(
        [activeBus.currentLocation.lat, activeBus.currentLocation.lng],
        15,
        { animate: true }
      );
      if (busMarkerRef.current) {
        busMarkerRef.current.openPopup();
      }
    }
  };

  return (
    <div className="bus-tracking-page animate-fade-in">
      {/* Top Navigation Bar */}
      <div className="tracking-top-bar">
        <div className="tracking-top-container">
          <div className="tracking-back-group">
            <button
              type="button"
              className="back-btn"
              onClick={onBack}
              aria-label="Back to results"
            >
              <ArrowLeft size={18} />
              <span>Back</span>
            </button>

            {/* Bus Selector Pill */}
            <div className="active-bus-pill">
              <Bus size={18} />
              <span className="bus-num">Bus {activeBus.busNumber}</span>
              <span className="pill-dot">•</span>
              <span className="bus-title">{activeBus.routeName}</span>
            </div>
          </div>

          {/* Quick Fleet Switcher Dropdown */}
          <div className="fleet-switcher-wrapper">
            <label htmlFor="fleet-select" className="switcher-label">Track Other Bus:</label>
            <select
              id="fleet-select"
              value={activeBus.id}
              onChange={(e) => {
                const b = getBusById(e.target.value);
                if (b) {
                  setActiveBus(b);
                  if (onSelectBus) onSelectBus(b);
                }
              }}
              className="fleet-select-input"
            >
              {busesList.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.busNumber} - {b.routeName.slice(0, 32)} ({b.crowdLevel} crowd)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Map + Right Telemetry Panel */}
      <div className="tracking-main-layout">
        {/* Left Column: Interactive Leaflet Map */}
        <div className="tracking-map-column">
          <div className="map-view-wrapper">
            <div ref={mapContainerRef} className="leaflet-map-canvas" id="crowdflow-leaflet-map" />

            {/* Floating Map HUD Controls */}
            <div className="map-hud-overlay">
              <div className="hud-card simulation-hud">
                <div className="hud-status-indicator">
                  <span className={`status-beacon ${isSimulating ? 'active' : 'paused'}`} />
                  <span className="status-text">
                    {isSimulating ? 'Live GPS Tracking Active' : 'Simulation Paused'}
                  </span>
                </div>
                <div className="hud-buttons-row">
                  <button
                    type="button"
                    className="hud-btn"
                    onClick={() => setIsSimulating(!isSimulating)}
                    title={isSimulating ? 'Pause GPS Updates' : 'Resume Live Updates'}
                  >
                    {isSimulating ? <Pause size={14} /> : <Play size={14} />}
                    <span>{isSimulating ? 'Pause' : 'Resume'}</span>
                  </button>

                  <button
                    type="button"
                    className="hud-btn"
                    onClick={handleManualRefresh}
                    title="Force refresh bus coordinates"
                  >
                    <RefreshCw size={14} />
                    <span>Ping</span>
                  </button>

                  <button
                    type="button"
                    className="hud-btn highlight"
                    onClick={handleCenterOnBus}
                    title="Recenter map on bus position"
                  >
                    <Navigation size={14} />
                    <span>Recenter</span>
                  </button>
                </div>
              </div>

              {/* Map Legend */}
              <div className="hud-card legend-hud">
                <div className="legend-item">
                  <span className="legend-color-dot green" />
                  <span>Low Crowd</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color-dot yellow" />
                  <span>Moderate</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color-dot red" />
                  <span>Heavy Crowd</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color-dot blue" />
                  <span>Stops</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Real-time Telemetry & Stop Details */}
        <div className="tracking-details-column">
          {/* Header Card */}
          <div className="telemetry-card hero-telemetry">
            <div className="telemetry-top">
              <div className="telemetry-bus-badge">
                <Bus size={22} />
                <div>
                  <h2 className="telemetry-bus-num">{activeBus.busNumber}</h2>
                  <span className="telemetry-bus-cat">{activeBus.category}</span>
                </div>
              </div>
              <div className="telemetry-plate-badge">{activeBus.plateNumber}</div>
            </div>

            {/* Next Stop Live ETA Banner */}
            <div className="next-stop-banner">
              <div className="next-banner-icon">
                <Clock size={20} />
              </div>
              <div className="next-banner-content">
                <div className="next-banner-label">NEXT STOP ARRIVAL</div>
                <div className="next-banner-time">
                  {activeBus.nextArrivalMins === 0 ? 'Arriving at Platform' : `~ ${activeBus.nextArrivalMins} minutes away`}
                </div>
                <div className="next-banner-stop">
                  Approaching <strong>{activeBus.stops[activeBus.currentStopIndex]?.name || 'Next Station'}</strong>
                </div>
              </div>
            </div>

            {/* Crowd Level Display Component */}
            <div className="crowd-display-wrapper">
              <CrowdIndicator
                level={activeBus.crowdLevel}
                occupancyPercent={activeBus.occupancyPercent}
                currentPassengers={activeBus.currentPassengers}
                totalCapacity={activeBus.totalCapacity}
                variant="detailed"
              />
            </div>

            {/* Telemetry Metrics Grid */}
            <div className="telemetry-metrics-grid">
              <div className="telemetry-stat">
                <span className="stat-label">Current Speed</span>
                <span className="stat-value">
                  <Gauge size={14} className="text-blue-500" />
                  {activeBus.speed} km/h
                </span>
              </div>

              <div className="telemetry-stat">
                <span className="stat-label">Total Duration</span>
                <span className="stat-value">
                  <Clock size={14} className="text-purple-500" />
                  ~{activeBus.totalDurationMins}m
                </span>
              </div>

              <div className="telemetry-stat">
                <span className="stat-label">Assigned Driver</span>
                <span className="stat-value">
                  <UserCheck size={14} className="text-emerald-500" />
                  {activeBus.driverName}
                </span>
              </div>

              <div className="telemetry-stat">
                <span className="stat-label">Live Telemetry</span>
                <span className="stat-value text-emerald-600">
                  <Radio size={14} className="pulse-mini" /> GPS Synced
                </span>
              </div>
            </div>
          </div>

          {/* Alternative Buses Section */}
          <div className="telemetry-card alternatives-section-card">
            <div className="alternatives-header-toggle" onClick={() => setShowAlternatives(!showAlternatives)}>
              <div className="alt-title-wrapper">
                <Sparkles size={16} className="text-amber-500" />
                <span className="alt-title">Alternative Buses Available ({alternatives.length})</span>
              </div>
              <button type="button" className="alt-toggle-btn">
                {showAlternatives ? 'Hide Alternatives' : 'View Suggestions'}
              </button>
            </div>

            {showAlternatives && (
              <div className="alternatives-collapsible-list animate-slide-down">
                {alternatives.length > 0 ? (
                  alternatives.map((alt) => (
                    <AlternativeBusCard
                      key={alt.id}
                      alternativeBus={alt}
                      currentBus={activeBus}
                      onSelectAlternative={(selected) => {
                        setActiveBus(selected);
                        if (onSelectBus) onSelectBus(selected);
                      }}
                    />
                  ))
                ) : (
                  <div className="no-alternatives-text">
                    No alternative buses currently operating along this exact segment.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Route Stops Stepper */}
          <div className="telemetry-card route-stops-card">
            <RouteStops
              stops={activeBus.stops}
              currentStopIndex={activeBus.currentStopIndex}
              boardStopName={searchQuery?.source}
              dropStopName={searchQuery?.destination}
              collapsible={true}
              initialExpanded={false}
              onSelectStop={(stop) => {
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.setView([stop.lat, stop.lng], 16, { animate: true });
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
