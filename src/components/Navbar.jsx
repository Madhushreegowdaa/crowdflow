// Navbar.jsx - CityTours Themed Header and Navigation
import React, { useState } from 'react';
import Link from 'next/link';
import { Bus, Navigation, Search, Menu, X, ShieldCheck } from 'lucide-react';

export default function Navbar({ activePage = 'home', onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (page) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <header className="navbar-header citytours-header">
      {/* Main CityTours Navbar */}
      <div className="navbar-container">
        {/* Brand / Logo in CityTours Style */}
        <div className="navbar-brand" onClick={() => handleNav('home')}>
          <div className="brand-icon-wrapper">
            <Bus className="brand-icon" size={22} />
          </div>
          <div className="brand-text-block">
            <div className="brand-name">
              CROWD<span>FLOW</span>
            </div>
            <div className="brand-tagline">Urban Transit & Crowd Intelligence</div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="navbar-nav desktop-nav">
          <button
            type="button"
            className={`nav-link ${activePage === 'home' ? 'active' : ''}`}
            onClick={() => handleNav('home')}
          >
            <Search size={15} />
            <span>Search Journey</span>
          </button>

          <button
            type="button"
            className={`nav-link ${activePage === 'search' ? 'active' : ''}`}
            onClick={() => handleNav('search')}
          >
            <Bus size={15} />
            <span>All Corridors</span>
          </button>

          <button
            type="button"
            className={`btn_1 nav-cta-btn ${activePage === 'tracking' ? 'active' : ''}`}
            onClick={() => handleNav('tracking')}
          >
            <Navigation size={14} />
            <span>Live GPS Map</span>
          </button>

          <Link href="/member4/login" className="nav-link">Sign In</Link>
          <Link href="/member4/register" className="btn_1 nav-cta-btn">Register</Link>
        </nav>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-drawer animate-slide-down">
          <button
            type="button"
            className={`mobile-nav-link ${activePage === 'home' ? 'active' : ''}`}
            onClick={() => handleNav('home')}
          >
            <Search size={18} />
            <span>Plan Journey & Search</span>
          </button>

          <button
            type="button"
            className={`mobile-nav-link ${activePage === 'search' ? 'active' : ''}`}
            onClick={() => handleNav('search')}
          >
            <Bus size={18} />
            <span>All Available Buses</span>
          </button>

          <button
            type="button"
            className={`mobile-nav-link ${activePage === 'tracking' ? 'active' : ''}`}
            onClick={() => handleNav('tracking')}
          >
            <Navigation size={18} />
            <span>Interactive Bus Map</span>
          </button>

          <Link href="/member4/login" className="mobile-nav-link">Sign In</Link>
          <Link href="/member4/register" className="mobile-nav-link">Register</Link>

          <div className="mobile-drawer-footer">
            <ShieldCheck size={16} /> Member 1: Passenger Interface & Real-Time Tracking
          </div>
        </div>
      )}
    </header>
  );
}
