"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Navbar from './components/Navbar';
import Home from './screens/Home';
import SearchResults from './screens/SearchResults';
import { SAMPLE_BUSES } from './data/sampleBuses';
import { fetchLiveBusesFromSupabase, subscribeToRealtimeBusUpdates } from './services/busService';

const BusTracking = dynamic(() => import('./screens/BusTracking'), { ssr: false });

const CURRENT_YEAR = new Date().getFullYear();

export default function App() {
  const [activePage, setActivePage] = useState('home'); // 'home' | 'search' | 'tracking'
  const [searchQuery, setSearchQuery] = useState({
    source: '',
    destination: '',
    crowdFilter: 'all'
  });
  const [selectedBusId, setSelectedBusId] = useState(SAMPLE_BUSES[0].id);
  const [fleetRevision, setFleetRevision] = useState(0);

  // Initialize Supabase live data & Realtime channel
  useEffect(() => {
    fetchLiveBusesFromSupabase().then(() => {
      setFleetRevision((revision) => revision + 1);
    });

    const unsubscribe = subscribeToRealtimeBusUpdates((updatedBus) => {
      console.log('Real-time bus update applied:', updatedBus.busNumber);
      setFleetRevision((revision) => revision + 1);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Search journey handler
  const handleSearch = (query) => {
    setSearchQuery(query);
    setActivePage('search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Track bus handler
  const handleTrackBus = (bus) => {
    setSelectedBusId(bus.id);
    setActivePage('tracking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Back navigation handlers
  const handleBackToHome = () => {
    setActivePage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToResults = () => {
    setActivePage('search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="crowdflow-app">
      {/* Top Navbar */}
      <Navbar
        activePage={activePage}
        onNavigate={(page) => {
          setActivePage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Main Content Area */}
      <main className="app-main-content">
        {activePage === 'home' && (
          <Home
            onSearch={handleSearch}
            onTrackBus={handleTrackBus}
            onViewAlternatives={handleTrackBus}
          />
        )}

        {activePage === 'search' && (
          <SearchResults
            searchQuery={searchQuery}
            onSearch={handleSearch}
            onTrackBus={handleTrackBus}
            onBackToHome={handleBackToHome}
          />
        )}

        {activePage === 'tracking' && (
          <BusTracking
            busId={selectedBusId}
            fleetRevision={fleetRevision}
            searchQuery={searchQuery}
            onBack={handleBackToResults}
            onSelectBus={(bus) => setSelectedBusId(bus.id)}
          />
        )}
      </main>

      {/* CityTours Themed Transit Footer */}
      <footer className="crowdflow-footer citytours-footer">
        <div className="footer-container">
          <div className="footer-left">
            <span className="footer-brand">CROWD<span>FLOW</span></span>
            <span className="footer-tagline subtitle-hand">Track your bus & avoid the crowd</span>
          </div>
          <div className="footer-middle">
            <div className="footer-links">
              <button type="button" onClick={handleBackToHome} className="footer-link">Home</button>
              <button type="button" onClick={() => setActivePage('search')} className="footer-link">All Corridors</button>
              <button type="button" onClick={() => setActivePage('tracking')} className="footer-link">Live GPS Map</button>
            </div>
          </div>
          <div className="footer-right">
            <span className="member-tag">Member 1: Passenger Interface & Real-Time Tracking</span>
            <span className="footer-copy">© {CURRENT_YEAR} CrowdFlow. Powered by OpenStreetMap & Supabase Telemetry.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
