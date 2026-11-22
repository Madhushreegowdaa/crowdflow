"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Navbar from './components/Navbar';
import Home from './screens/Home';
import SearchResults from './screens/SearchResults';
import { SAMPLE_BUSES } from './data/sampleBuses';
import { fetchLiveBusesFromSupabase, subscribeToRealtimeBusUpdates } from './services/busService';
import { createClient } from './lib/supabase/client';

const BusTracking = dynamic(() => import('./screens/BusTracking'), { ssr: false });

const MAX_HISTORY = 10;

function getHistoryKey(userId) {
  return `crowdflow_search_history_${userId}`;
}

function loadHistory(userId) {
  if (!userId) return [];
  try {
    return JSON.parse(localStorage.getItem(getHistoryKey(userId)) || '[]');
  } catch { return []; }
}

function saveHistory(userId, history) {
  if (!userId) return;
  localStorage.setItem(getHistoryKey(userId), JSON.stringify(history));
}

export default function App() {
  const [activePage, setActivePage] = useState('home');
  const [searchQuery, setSearchQuery] = useState({ source: '', destination: '', crowdFilter: 'all' });
  const [selectedBusId, setSelectedBusId] = useState(SAMPLE_BUSES[0].id);
  const [fleetRevision, setFleetRevision] = useState(0);
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
      setSearchQuery({ source: last.source, destination: last.destination, crowdFilter: last.crowdFilter || 'all' });
    }
  }, [userId]);

  // Listen for auto-search from profile "Search again"
  useEffect(() => {
    const handler = (e) => handleSearch(e.detail);
    window.addEventListener('crowdflow:autosearch', handler);
    return () => window.removeEventListener('crowdflow:autosearch', handler);
  }, [userId]);

  // Initialize Supabase live data & Realtime channel
  useEffect(() => {
    fetchLiveBusesFromSupabase().then(() => {
      setFleetRevision((revision) => revision + 1);
    });

    const unsubscribe = subscribeToRealtimeBusUpdates((updatedBus) => {
      console.log('Real-time bus update applied:', updatedBus.busNumber);
      setFleetRevision((revision) => revision + 1);
    });

    return () => { unsubscribe(); };
  }, []);

  // Search journey handler — saves to history
  const handleSearch = (query) => {
    setSearchQuery(query);
    setActivePage('search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (userId && query.source && query.destination) {
      const history = loadHistory(userId);
      const entry = { source: query.source, destination: query.destination, crowdFilter: query.crowdFilter, searchedAt: new Date().toISOString() };
      const filtered = history.filter(h => !(h.source === entry.source && h.destination === entry.destination));
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

    </div>
  );
}
