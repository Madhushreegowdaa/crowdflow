// Home.jsx - CityTours Themed Passenger Home Page for CrowdFlow
import React, { useState } from 'react';
import { Search, Users, Navigation, Radio, Sparkles, ArrowRight, Zap } from 'lucide-react';
import SearchForm from '../components/SearchForm';
import BusCard from '../components/BusCard';
import { getAllBuses, getPopularRoutes } from '../services/busService';

export default function Home({ onSearch, onTrackBus, onViewAlternatives }) {
  const buses = getAllBuses();
  const [popularRoutes] = useState(getPopularRoutes());

  // Quick stats
  const lowCrowdBuses = buses.filter((b) => b.crowdLevel === 'low');
  const modCrowdBuses = buses.filter((b) => b.crowdLevel === 'moderate');
  const highCrowdBuses = buses.filter((b) => b.crowdLevel === 'high');

  const handlePopularClick = (route) => {
    if (onSearch) {
      onSearch({
        source: route.source,
        destination: route.destination,
        crowdFilter: 'all'
      });
    }
  };

  return (
    <div className="home-page-container animate-fade-in">
      {/* CityTours Signature Hero Section */}
      <section className="hero-section citytours-hero">
        <div className="opacity-mask">
          <div className="hero-content">
            <div className="intro_title">
              <div className="hero-badge">
                <Radio size={13} className="pulse-mini" />
                <span>Bengaluru · Dakshina Kannada · Udupi · Shivamogga</span>
              </div>

              <h1 className="hero-title">
                NEVER WAIT BLINDLY
              </h1>
              <p className="subtitle-hand">
                Track your bus & avoid the crowd
              </p>
              <p className="hero-description">
                CrowdFlow is scoped to Bengaluru, Dakshina Kannada, Udupi, and Shivamogga. The available directory has detailed Bengaluru stops; the other areas currently have city/district references only, not complete pickup-stop lists or verified schedules.
              </p>
            </div>

            {/* CityTours Search Bar Container */}
            <div id="search_bar_container" className="hero-search-wrapper">
              <SearchForm onSearch={onSearch} />
            </div>

            {/* Popular Fast Routes */}
            <div className="popular-routes-container">
              <span className="popular-label">
                <Zap size={14} className="text-amber" /> Popular Corridors:
              </span>
              <div className="popular-pills-row">
                {popularRoutes.map((route, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="popular-route-pill"
                    onClick={() => handlePopularClick(route)}
                  >
                    <span className="route-endpoints">
                      {route.source.split(' ')[0]} → {route.destination.split(' ')[0]}
                    </span>
                    <span className="route-tag">{route.tag}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Transit Live Crowd Pulse Stats */}
      <section className="crowd-pulse-section">
        <div className="main_title">
          <h2>Transit <span>Crowd</span> Status</h2>
        </div>

        <div className="crowd-stats-grid">
          <div className="stat-card low-crowd-stat">
            <div className="stat-indicator-ring green">
              <Users size={22} />
            </div>
            <div className="stat-info">
              <div className="stat-number">{lowCrowdBuses.length} Buses</div>
              <div className="stat-title">Low Crowd</div>
              <div className="stat-desc">Based on recorded bus data</div>
            </div>
          </div>

          <div className="stat-card moderate-crowd-stat">
            <div className="stat-indicator-ring yellow">
              <Users size={22} />
            </div>
            <div className="stat-info">
              <div className="stat-number">{modCrowdBuses.length} Buses</div>
              <div className="stat-title">Moderate Crowd</div>
              <div className="stat-desc">Based on recorded bus data</div>
            </div>
          </div>

          <div className="stat-card high-crowd-stat">
            <div className="stat-indicator-ring red">
              <Users size={22} />
            </div>
            <div className="stat-info">
              <div className="stat-number">{highCrowdBuses.length} Buses</div>
              <div className="stat-title">Heavy Crowd (Packed)</div>
              <div className="stat-desc">Based on recorded bus data</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured / Active Buses */}
      <section className="active-buses-section">
        <div className="section-header-row">
          <div className="main_title text-start mb-0">
            <h2>Buses in <span>Selected</span> Service Areas</h2>
          </div>
          <button
            type="button"
            className="btn_1 outline explore-all-btn"
            onClick={() => onSearch({ source: '', destination: '', crowdFilter: 'all' })}
          >
            <span>View All Fleet ({buses.length})</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="buses-grid">
          {buses.slice(0, 4).map((bus) => (
            <BusCard
              key={bus.id}
              bus={bus}
              onTrackBus={onTrackBus}
              onViewAlternatives={onViewAlternatives}
            />
          ))}
        </div>
      </section>

      {/* Member 1 Core Capabilities Showcase */}
      <section className="features-showcase-section">
        <div className="main_title">
          <h2>CrowdFlow <span>Passenger</span> Capabilities</h2>
        </div>

        <div className="features-grid">
          <div className="feature-item-card">
            <div className="feature-icon-box coral">
              <Search size={22} />
            </div>
            <h3>Smart Route Search</h3>
            <p>Find buses serving your departure and destination with ordered stop matching and estimated travel times.</p>
          </div>

          <div className="feature-item-card">
            <div className="feature-icon-box green">
              <Users size={22} />
            </div>
            <h3>Live Crowd Levels</h3>
            <p>Real-time occupancy metrics (Low, Moderate, High) help you avoid overcrowded buses before boarding.</p>
          </div>

          <div className="feature-item-card">
            <div className="feature-icon-box teal">
              <Navigation size={22} />
            </div>
            <h3>Interactive Leaflet GPS Map</h3>
            <p>Live bus pins, stop waypoints, and animated telemetry updates directly on OpenStreetMap.</p>
          </div>

          <div className="feature-item-card">
            <div className="feature-icon-box amber">
              <Sparkles size={22} />
            </div>
            <h3>Smart Alternatives</h3>
            <p>Automated suggestions comparing arrival times and crowd density so you can choose a faster or emptier bus.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
