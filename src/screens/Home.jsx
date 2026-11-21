// Home.jsx - CityTours Themed Passenger Home Page for CrowdFlow
import React, { useState, useEffect, useRef } from 'react';
import { Search, Users, Navigation, Radio, Sparkles, ArrowRight, Zap } from 'lucide-react';
import SearchForm from '../components/SearchForm';
import BusCard from '../components/BusCard';
import { getAllBuses, getPopularRoutes } from '../services/busService';

function RevealDiv({ className, style, children, delay }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${className || ''}`} style={{ ...style, transitionDelay: delay || '0s' }}>
      {children}
    </div>
  );
}

const FEATURE_CARDS = [
  { cls: 'coral', Icon: Search, title: 'Smart Route Search', desc: 'Find buses serving your departure and destination with ordered stop matching and estimated travel times.', delay: '0s' },
  { cls: 'green', Icon: Users, title: 'Live Crowd Levels', desc: 'Real-time occupancy metrics (Low, Moderate, High) help you avoid overcrowded buses before boarding.', delay: '0.1s' },
  { cls: 'teal', Icon: Navigation, title: 'Interactive Leaflet GPS Map', desc: 'Live bus pins, stop waypoints, and animated telemetry updates directly on OpenStreetMap.', delay: '0.2s' },
  { cls: 'amber', Icon: Sparkles, title: 'Smart Alternatives', desc: 'Automated suggestions comparing arrival times and crowd density so you can choose a faster or emptier bus.', delay: '0.3s' },
];

export default function Home({ onSearch, onTrackBus, onViewAlternatives }) {
  const buses = getAllBuses();
  const [popularRoutes] = useState(getPopularRoutes());

  const lowCrowdBuses = buses.filter((b) => b.crowdLevel === 'low');
  const modCrowdBuses = buses.filter((b) => b.crowdLevel === 'moderate');
  const highCrowdBuses = buses.filter((b) => b.crowdLevel === 'high');

  const handlePopularClick = (route) => {
    if (onSearch) {
      onSearch({ source: route.source, destination: route.destination, crowdFilter: 'all' });
    }
  };

  return (
    <div className="home-page-container animate-fade-in">
      {/* CityTours Signature Hero Section */}
      <section className="hero-section citytours-hero">
        <div className="hero-decorations" aria-hidden="true">
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />
        </div>
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
                Track your bus &amp; avoid the crowd
              </p>
              <p className="hero-description">
                CrowdFlow is scoped to Bengaluru, Dakshina Kannada, Udupi, and Shivamogga. The available directory has detailed Bengaluru stops; the other areas currently have city/district references only, not complete pickup-stop lists or verified schedules.
              </p>
            </div>

            {/* CityTours Search Bar Container */}
            <div id="search_bar_container" className="hero-search-wrapper" style={{ animation: 'floatUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.6s both' }}>
              <SearchForm onSearch={onSearch} />
            </div>

            {/* Popular Fast Routes */}
            <div className="popular-routes-container" style={{ animation: 'floatUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.75s both' }}>
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
        <RevealDiv>
          <div className="main_title">
            <h2>Transit <span>Crowd</span> Status</h2>
          </div>
        </RevealDiv>

        <div className="crowd-stats-grid">
          <RevealDiv className="stat-card low-crowd-stat" delay="0.05s">
            <div className="stat-indicator-ring green">
              <Users size={22} />
            </div>
            <div className="stat-info">
              <div className="stat-number">{lowCrowdBuses.length} Buses</div>
              <div className="stat-title">Low Crowd</div>
              <div className="stat-desc">Based on recorded bus data</div>
            </div>
          </RevealDiv>

          <RevealDiv className="stat-card moderate-crowd-stat" delay="0.15s">
            <div className="stat-indicator-ring yellow">
              <Users size={22} />
            </div>
            <div className="stat-info">
              <div className="stat-number">{modCrowdBuses.length} Buses</div>
              <div className="stat-title">Moderate Crowd</div>
              <div className="stat-desc">Based on recorded bus data</div>
            </div>
          </RevealDiv>

          <RevealDiv className="stat-card high-crowd-stat" delay="0.25s">
            <div className="stat-indicator-ring red">
              <Users size={22} />
            </div>
            <div className="stat-info">
              <div className="stat-number">{highCrowdBuses.length} Buses</div>
              <div className="stat-title">Heavy Crowd (Packed)</div>
              <div className="stat-desc">Based on recorded bus data</div>
            </div>
          </RevealDiv>
        </div>
      </section>

      {/* Featured / Active Buses */}
      <section className="active-buses-section">
        <RevealDiv>
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
        </RevealDiv>

        <div className="buses-grid">
          {buses.slice(0, 4).map((bus, i) => (
            <RevealDiv key={bus.id} delay={`${i * 0.1}s`}>
              <BusCard
                bus={bus}
                onTrackBus={onTrackBus}
                onViewAlternatives={onViewAlternatives}
              />
            </RevealDiv>
          ))}
        </div>
      </section>

      {/* Member 1 Core Capabilities Showcase */}
      <section className="features-showcase-section">
        <RevealDiv>
          <div className="main_title">
            <h2>CrowdFlow <span>Passenger</span> Capabilities</h2>
          </div>
        </RevealDiv>

        <div className="features-grid">
          {FEATURE_CARDS.map(({ cls, Icon, title, desc, delay }) => (
            <RevealDiv key={title} className="feature-item-card" delay={delay}>
              <div className={`feature-icon-box ${cls}`}>
                <Icon size={22} />
              </div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </RevealDiv>
          ))}
        </div>
      </section>
    </div>
  );
}
