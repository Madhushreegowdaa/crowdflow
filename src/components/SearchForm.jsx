// SearchForm.jsx - Source and Destination Journey Search Component
import React, { useState, useEffect, useRef } from 'react';
import { Search, ArrowUpDown, MapPin, Navigation, Filter, X } from 'lucide-react';
import { getAllStops, isServiceAreaLocation } from '../services/busService';

export default function SearchForm({
  initialSource = '',
  initialDestination = '',
  initialCrowdFilter = 'all',
  onSearch,
  compact = false
}) {
  const [source, setSource] = useState(initialSource);
  const [destination, setDestination] = useState(initialDestination);
  const [crowdFilter, setCrowdFilter] = useState(initialCrowdFilter);

  const allStops = getAllStops().sort((a, b) => a.name.localeCompare(b.name));
  const [sourceSuggestions, setSourceSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [activeInput, setActiveInput] = useState(null);
  const [locationError, setLocationError] = useState('');

  const wrapperRef = useRef(null);

  const getSuggestions = (value) => {
    const query = value.trim().toLowerCase();
    const bengaluruSearch = ['bengaluru', 'bengaluru urban'].includes(query);
    return allStops.filter((stop) => (
      !query
      || (bengaluruSearch && /^stop-\d+$/.test(stop.id))
      || [stop.name, stop.city, stop.district, stop.area]
        .filter(Boolean)
        .some((candidate) => candidate.toLowerCase().includes(query))
    ));
  };

  // Sync with props if updated externally
  useEffect(() => {
    if (initialSource !== undefined) setSource(initialSource);
    if (initialDestination !== undefined) setDestination(initialDestination);
    if (initialCrowdFilter !== undefined) setCrowdFilter(initialCrowdFilter);
  }, [initialSource, initialDestination, initialCrowdFilter]);

  // Handle source suggestions
  const handleSourceChange = (val) => {
    setSource(val);
    setLocationError('');
    setSourceSuggestions(getSuggestions(val));
  };

  // Handle destination suggestions
  const handleDestChange = (val) => {
    setDestination(val);
    setLocationError('');
    setDestSuggestions(getSuggestions(val));
  };

  // Swap source and destination
  const handleSwap = () => {
    const temp = source;
    setSource(destination);
    setDestination(temp);
  };

  // Handle submission
  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    setActiveInput(null);
    const invalidLocation = [source, destination]
      .some((location) => location.trim() && !isServiceAreaLocation(location));
    if (invalidLocation) {
      setLocationError('CrowdFlow currently covers Bengaluru, Dakshina Kannada, Udupi, and Shivamogga only. Choose a listed stop or place.');
      return;
    }

    setLocationError('');
    if (onSearch) {
      onSearch({
        source: source.trim(),
        destination: destination.trim(),
        crowdFilter
      });
    }
  };

  // Close suggestions on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setActiveInput(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`search-form-card ${compact ? 'compact-layout' : ''}`} ref={wrapperRef}>
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-inputs-grid">
          {/* Starting Point Input */}
          <div className="search-input-group">
            <label className="input-label" htmlFor="source-input">
              <span className="dot dot-origin" />
              <span>Starting Point (Source)</span>
            </label>
            <div className="input-field-wrapper">
              <MapPin size={18} className="field-icon origin-icon" />
              <input
                id="source-input"
                type="text"
                placeholder="e.g., Bengaluru, Mangaluru, Udupi, Shivamogga..."
                value={source}
                onChange={(e) => handleSourceChange(e.target.value)}
                onFocus={() => {
                  setActiveInput('source');
                  setSourceSuggestions(getSuggestions(source));
                }}
                className="journey-text-input"
                autoComplete="off"
              />
              {source && (
                <button
                  type="button"
                  className="clear-input-btn"
                  onClick={() => {
                    setSource('');
                    setLocationError('');
                    setSourceSuggestions(getSuggestions(''));
                    setActiveInput('source');
                  }}
                  aria-label="Clear source input"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Source Autocomplete Dropdown */}
            {activeInput === 'source' && sourceSuggestions.length > 0 && (
              <ul className="suggestions-dropdown animate-fade-in">
                <li className="suggestion-header">
                  <MapPin size={12} /> Select a listed pickup stop or place
                </li>
                {sourceSuggestions.map((stop) => (
                  <li
                    key={stop.id}
                    className="suggestion-item"
                    onClick={() => {
                      setSource(stop.name);
                      setLocationError('');
                      setActiveInput(null);
                    }}
                  >
                    <span className="stop-marker-dot" />
                    <span className="suggestion-name">{stop.name}</span>
                    {stop.id?.startsWith('district-') && (
                      <span className="suggestion-kind">Area reference</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Swap Button */}
          <div className="swap-button-container">
            <button
              type="button"
              className="swap-button"
              onClick={handleSwap}
              title="Swap starting point and destination"
              aria-label="Swap source and destination"
            >
              <ArrowUpDown size={18} />
            </button>
          </div>

          {/* Destination Input */}
          <div className="search-input-group">
            <label className="input-label" htmlFor="dest-input">
              <span className="dot dot-destination" />
              <span>Destination</span>
            </label>
            <div className="input-field-wrapper">
              <Navigation size={18} className="field-icon dest-icon" />
              <input
                id="dest-input"
                type="text"
                placeholder="e.g., Bengaluru, Mangaluru, Udupi, Shivamogga..."
                value={destination}
                onChange={(e) => handleDestChange(e.target.value)}
                onFocus={() => {
                  setActiveInput('dest');
                  setDestSuggestions(getSuggestions(destination));
                }}
                className="journey-text-input"
                autoComplete="off"
              />
              {destination && (
                <button
                  type="button"
                  className="clear-input-btn"
                  onClick={() => {
                    setDestination('');
                    setLocationError('');
                    setDestSuggestions(getSuggestions(''));
                    setActiveInput('dest');
                  }}
                  aria-label="Clear destination input"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Destination Autocomplete Dropdown */}
            {activeInput === 'dest' && destSuggestions.length > 0 && (
              <ul className="suggestions-dropdown animate-fade-in">
                <li className="suggestion-header">
                  <Navigation size={12} /> Select a listed drop-off stop or place
                </li>
                {destSuggestions.map((stop) => (
                  <li
                    key={stop.id}
                    className="suggestion-item"
                    onClick={() => {
                      setDestination(stop.name);
                      setLocationError('');
                      setActiveInput(null);
                    }}
                  >
                    <span className="stop-marker-dot dest" />
                    <span className="suggestion-name">{stop.name}</span>
                    {stop.id?.startsWith('district-') && (
                      <span className="suggestion-kind">Area reference</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {locationError && (
          <p className="search-location-error" role="alert">
            {locationError}
          </p>
        )}

        {/* Filter & Action Row */}
        <div className="search-controls-row">
          <div className="crowd-filter-wrapper">
            <span className="filter-label">
              <Filter size={14} /> Crowd Filter:
            </span>
            <div className="crowd-filter-pills">
              {[
                { id: 'all', label: 'All Crowds' },
                { id: 'low', label: '🟢 Low Only' },
                { id: 'moderate', label: '🟡 Moderate' },
                { id: 'high', label: '🔴 High' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`crowd-filter-pill ${crowdFilter === opt.id ? 'active' : ''}`}
                  onClick={() => setCrowdFilter(opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="btn_1 search-submit-btn">
            <Search size={16} />
            <span>Search Buses</span>
          </button>
        </div>
      </form>
    </div>
  );
}
