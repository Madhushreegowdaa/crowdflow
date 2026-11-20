"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export default function LandingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace("/home");
      else setChecking(false);
    });
  }, [router]);

  if (checking) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#f9f9f9", fontFamily: "var(--font-main, Montserrat, sans-serif)" }}>
      {/* Navbar */}
      <header className="navbar-header citytours-header">
        <div className="navbar-container">
          <div className="navbar-brand">
            <div className="brand-icon-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>
            </div>
            <div className="brand-text-block">
              <span className="brand-name">CROWD<span>FLOW</span></span>
              <span className="brand-tagline">Real-Time Bus Intelligence</span>
            </div>
          </div>
          <nav className="desktop-nav">
            <Link href="/member4/login" className="nav-link">Sign In</Link>
            <Link href="/member4/register" className="btn_1 nav-cta-btn">Get Started</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="hero-section citytours-hero">
        <div className="opacity-mask">
          <div className="hero-content">
            <div className="intro_title">
              <span className="hero-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="5"/></svg>
                Live Bus Tracking — Bengaluru & Coastal Karnataka
              </span>
              <h1 className="hero-title">SMART TRANSIT,<br />ZERO GUESSWORK</h1>
              <p className="subtitle-hand">Know before you go</p>
              <p className="hero-description">
                Real-time crowd levels, live GPS tracking, and intelligent route suggestions — all in one place.
              </p>
            </div>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/member4/register" className="btn_1" style={{ padding: "14px 36px", fontSize: "14px" }}>
                Create Free Account
              </Link>
              <Link href="/member4/login" className="btn_1 outline" style={{ padding: "14px 36px", fontSize: "14px", color: "#fff", borderColor: "#fff" }}>
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth: 1280, margin: "4rem auto", padding: "0 1.5rem" }}>
        <div className="main_title">
          <h2>WHY <span>CROWDFLOW</span>?</h2>
          <p className="subtitle-hand">Everything you need for a smarter commute</p>
        </div>
        <div className="features-grid">
          {[
            { color: "blue", icon: "📍", title: "Live GPS Tracking", desc: "See exactly where your bus is on an interactive map, updated in real time." },
            { color: "emerald", icon: "👥", title: "Crowd Intelligence", desc: "Know how packed a bus is before it arrives. Plan your trip stress-free." },
            { color: "amber", icon: "🔍", title: "Smart Route Search", desc: "Find buses between any two stops across Bengaluru and Coastal Karnataka." },
            { color: "purple", icon: "🎫", title: "Digital Pass", desc: "Manage your transit pass and travel history from your personal profile." },
          ].map((f) => (
            <div key={f.title} className="feature-item-card">
              <div className={`feature-icon-box ${f.color}`} style={{ fontSize: "22px" }}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{ background: "#1c1c1c", padding: "4rem 1.5rem", textAlign: "center", borderTop: "3px solid #e04f67" }}>
        <p className="subtitle-hand" style={{ color: "#e04f67", marginBottom: "0.5rem" }}>Ready to ride smarter?</p>
        <h2 style={{ color: "#fff", fontSize: "2rem", fontWeight: 800, marginBottom: "1.5rem", textTransform: "uppercase" }}>
          Join CrowdFlow Today
        </h2>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/member4/register" className="btn_1" style={{ padding: "14px 36px", fontSize: "14px" }}>Create Account</Link>
          <Link href="/member4/login" className="btn_1 outline" style={{ padding: "14px 36px", fontSize: "14px", color: "#fff", borderColor: "rgba(255,255,255,0.5)" }}>Sign In</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="crowdflow-footer citytours-footer">
        <div className="footer-container">
          <div className="footer-left">
            <span className="footer-brand">CROWD<span>FLOW</span></span>
            <span className="footer-tagline subtitle-hand">Track your bus &amp; avoid the crowd</span>
          </div>
          <div className="footer-right">
            <span className="footer-copy">© {new Date().getFullYear()} CrowdFlow. Powered by OpenStreetMap &amp; Supabase.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
