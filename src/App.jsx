
"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Navbar from './components/Navbar';
import Home from './screens/Home';
import SearchResults from './screens/SearchResults';
import { SAMPLE_BUSES } from './data/sampleBuses';
import {
  fetchLiveBusesFromSupabase,
  isDemoModeEnabled,
  subscribeToRealtimeBusUpdates
} from './services/busService';
import { createClient } from './lib/supabase/client';

const BusTracking = dynamic(() => import('./screens/BusTracking'), { ssr: false });

const MAX_HISTORY = 10;
const CURRENT_YEAR = new Date().getFullYear();

function getHistoryKey(userId) {
  return `crowdflow_search_history_${userId}`;
}

function loadHistory(userId) {
  if (!userId) return [];
  try {
    return JSON.parse(localStorage.getItem(getHistoryKey(userId)) || '[]');
  } catch {
    return [];
  }
}

function saveHistory(userId, history) {
  if (!userId) return;
  localStorage.setItem(getHistoryKey(userId), JSON.stringify(history));
}

export default function App() {
  const [activePage, setActivePage] = useState('home');
  const [searchQuery, setSearchQuery] = useState({
    source: '',
    destination: '',
    crowdFilter: 'all'
  });
  const [selectedBusId, setSelectedBusId] = useState(SAMPLE_BUSES[0].id);
  const [fleetRevision, setFleetRevision] = useState(0);
  const [fleetError, setFleetError] = useState('');
  const [userId, setUserId] = useState(null);

  // Get logged-in user ID
  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUserId(session.user.id);
    });
  }, []);

  // Restore last search when user is identified
  useEffect(() => {
    if (!userId) return;

    const history = loadHistory(userId);

    if (history.length > 0) {
      const last = history[0];

      setSearchQuery({
        source: last.source,
        destination: last.destination,
        crowdFilter: last.crowdFilter || 'all'
      });
    }
  }, [userId]);

  // Listen for auto-search from profile "Search again"
  useEffect(() => {
    const handler = (e) => handleSearch(e.detail);

    window.addEventListener('crowdflow:autosearch', handler);

    return () => window.removeEventListener('crowdflow:autosearch', handler);
  }, [userId]);

  // Initialize Supabase live data and Realtime channel
  useEffect(() => {
    fetchLiveBusesFromSupabase()
      .then(() => {
        setFleetError('');
        setFleetRevision((revision) => revision + 1);
      })
      .catch((error) => {
        setFleetError(
          error instanceof Error
            ? error.message
            : 'Bus data is currently unavailable.'
        );
        setFleetRevision((revision) => revision + 1);
      });

    const unsubscribe = subscribeToRealtimeBusUpdates((updatedBus) => {
      console.log('Real-time bus update applied:', updatedBus.busNumber);
      setFleetRevision((revision) => revision + 1);
    });

    return () => unsubscribe();
  }, []);

  // Search journey handler — saves to history
  const handleSearch = (query) => {
    setSearchQuery(query);
    setActivePage('search');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (userId && query.source && query.destination) {
      const history = loadHistory(userId);

      const entry = {
        source: query.source,
        destination: query.destination,
        crowdFilter: query.crowdFilter,
        searchedAt: new Date().toISOString()
      };

      const filtered = history.filter(
        (h) =>
          !(h.source === entry.source && h.destination === entry.destination)
      );

      saveHistory(userId, [entry, ...filtered].slice(0, MAX_HISTORY));
    }
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
      <Navbar
        activePage={activePage}
        onNavigate={(page) => {
          setActivePage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      <main className="app-main-content">
        {isDemoModeEnabled && (
          <div
            role="status"
            className="mx-auto my-4 max-w-5xl rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900"
          >
            Demo mode is enabled. Bus records shown here are simulated demonstration data.
          </div>
        )}

        {fleetError && (
          <div
            role="alert"
            className="mx-auto my-4 max-w-5xl rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          >
            {fleetError}
          </div>
        )}

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
            <span className="footer-brand">
              CROWD<span>FLOW</span>
            </span>
            <span className="footer-tagline subtitle-hand">
              Track your bus & avoid the crowd
            </span>
          </div>

          <div className="footer-middle">
            <div className="footer-links">
              <button type="button" onClick={handleBackToHome} className="footer-link">
                Home
              </button>
              <button
                type="button"
                onClick={() => setActivePage('search')}
                className="footer-link"
              >
                All Corridors
              </button>
              <button
                type="button"
                onClick={() => setActivePage('tracking')}
                className="footer-link"
              >
                GPS Playback
              </button>
            </div>
          </div>

          <div className="footer-right">
            <span className="member-tag">
              Passenger Interface & Route Tracking
            </span>
            <span className="footer-copy">
              © {CURRENT_YEAR} CrowdFlow. Fleet records from Supabase; map movement is simulated.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
