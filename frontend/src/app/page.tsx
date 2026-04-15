"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

const FEATURES = [
  { icon: "🌾", title: "Smart Marketplace", desc: "List produce with real-time pricing and direct buyer connections — no middlemen.", color: "rgba(22, 163, 74, 0.12)", accent: "#16a34a" },
  { icon: "🏡", title: "Farm Management", desc: "Track multiple farms, manage crop lifecycles, monitor soil health, and plan harvests.", color: "rgba(14, 165, 233, 0.12)", accent: "#0ea5e9" },
  { icon: "🌱", title: "Crop Lifecycle", desc: "Monitor growth stages from seedling to harvest with health tracking and progress visualization.", color: "rgba(245, 158, 11, 0.12)", accent: "#f59e0b" },
  { icon: "📦", title: "Inventory Tracking", desc: "Manage seeds, fertilizers, pesticides with low-stock alerts and automatic depletion tracking.", color: "rgba(168, 85, 247, 0.12)", accent: "#a855f7" },
  { icon: "🔔", title: "Smart Notifications", desc: "AWS SNS-powered email alerts for crop reminders, order updates, and harvest schedules.", color: "rgba(236, 72, 153, 0.12)", accent: "#ec4899" },
  { icon: "🤖", title: "ML-Powered Insights", desc: "AI yield prediction, price estimation, and pest severity analysis with chatbot integration.", color: "rgba(20, 184, 166, 0.12)", accent: "#14b8a6" },
];

const STATS = [
  { number: "2,500+", label: "Active Farmers", icon: "👨‍🌾" },
  { number: "12,000+", label: "Products Listed", icon: "🌽" },
  { number: "98%", label: "Satisfaction Rate", icon: "⭐" },
  { number: "50+", label: "Districts Covered", icon: "🗺️" },
];

const TECH = [
  { name: "Next.js", icon: "⚡" },
  { name: "FastAPI", icon: "🐍" },
  { name: "AWS Cognito", icon: "🔐" },
  { name: "DynamoDB", icon: "🗄️" },
  { name: "S3", icon: "☁️" },
  { name: "SNS", icon: "📧" },
];

const FLOATING_ITEMS = ["🌾", "🌿", "🍃", "🌱", "🌻", "🍀", "🌸", "🥕", "🌽", "🍅", "🥬", "🍇"];

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div className="landing-page">
      <Navbar />

      {/* Floating particles */}
      {mounted && (
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
          {FLOATING_ITEMS.map((item, i) => (
            <span key={i} style={{
              position: "absolute",
              fontSize: `${12 + Math.random() * 16}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: 0.08 + Math.random() * 0.07,
              animation: `floatParticle ${15 + Math.random() * 20}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 10}s`,
            }}>
              {item}
            </span>
          ))}
        </div>
      )}

      {/* Hero */}
      <section className="landing-hero">
        <div className="hero-badge" style={{ animationDelay: "0.2s" }}>
          <span style={{ animation: "pulse 2s ease-in-out infinite" }}>🌾</span> Connecting Bangladesh&apos;s Agriculture
        </div>

        <h1 style={{ animation: "fadeSlideUp 0.8s ease-out forwards", opacity: 0, animationDelay: "0.3s" }}>
          The Future of <br />
          <span className="gradient-text" style={{ display: "inline-block", animation: "shimmer 3s ease-in-out infinite" }}>Agricultural Commerce</span>
        </h1>

        <p className="hero-desc" style={{ animation: "fadeSlideUp 0.8s ease-out forwards", opacity: 0, animationDelay: "0.5s" }}>
          AgroLink bridges the gap between farmers and buyers with an intelligent
          marketplace platform — powered by AI analytics, real-time pricing, and
          secure AWS cloud infrastructure.
        </p>

        <div className="landing-actions" style={{ animation: "fadeSlideUp 0.8s ease-out forwards", opacity: 0, animationDelay: "0.7s" }}>
          <Link href="/register" className="cta-primary" style={{ position: "relative", overflow: "hidden" }}>
            <span style={{ position: "relative", zIndex: 1 }}>Start Selling →</span>
          </Link>
          <Link href="/marketplace" className="cta-secondary">
            Browse Marketplace
          </Link>
        </div>

        {/* Animated stats */}
        <div className="stats-bar" style={{ animation: "fadeSlideUp 0.8s ease-out forwards", opacity: 0, animationDelay: "0.9s" }}>
          {STATS.map((s) => (
            <div key={s.label} className="stat-item" style={{ cursor: "default" }}>
              <div style={{ fontSize: "1.2rem", marginBottom: 2 }}>{s.icon}</div>
              <div className="stat-number">{s.number}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: "4rem 2rem 2rem", position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
          How It Works
        </h2>
        <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "2.5rem" }}>
          Three simple steps to transform your agricultural business
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem" }}>
          {[
            { step: "01", icon: "📝", title: "Register", desc: "Sign up as a Farmer or Buyer with AWS Cognito — secure and verified." },
            { step: "02", icon: "🏡", title: "Setup Farm", desc: "Add your farms, crops, inventory — track everything in one dashboard." },
            { step: "03", icon: "💰", title: "Trade", desc: "List products on the marketplace, receive orders, and grow your business." },
          ].map((s, i) => (
            <div key={s.step} className="glass-card animate-fadeInUp" style={{ padding: "2rem 1.5rem", textAlign: "center", borderRadius: 20, animationDelay: `${i * 0.15}s`, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 10, right: 14, fontSize: "3rem", fontWeight: 900, opacity: 0.04, color: "var(--text-primary)" }}>{s.step}</div>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>{s.icon}</div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>{s.title}</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <h2>Powerful Features</h2>
        <p className="section-sub">
          Everything you need to digitize agricultural commerce — from farm-level
          operations to enterprise-grade supply chains.
        </p>

        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="feature-card animate-fadeInUp"
              style={{ "--card-accent": f.accent, animationDelay: `${i * 0.1}s` } as React.CSSProperties}
            >
              <div className="feature-icon" style={{ background: f.color }}>
                {f.icon}
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech stack strip */}
      <section style={{ padding: "3rem 2rem", position: "relative", zIndex: 1, textAlign: "center" }}>
        <h3 style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "1.5rem" }}>
          Powered By
        </h3>
        <div style={{ display: "flex", justifyContent: "center", gap: "1.25rem", flexWrap: "wrap" }}>
          {TECH.map((t) => (
            <div key={t.name} className="glass-card" style={{
              padding: "10px 20px", borderRadius: 12, display: "flex", alignItems: "center", gap: "0.5rem",
              fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)",
              transition: "all 0.3s", cursor: "default",
            }}>
              <span>{t.icon}</span> {t.name}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "3rem 2rem 4rem", position: "relative", zIndex: 1, textAlign: "center" }}>
        <div className="glass-card" style={{ padding: "3rem 2rem", borderRadius: 24, maxWidth: 600, margin: "0 auto", background: "linear-gradient(135deg, rgba(22,163,74,0.06), rgba(14,165,233,0.06))" }}>
          <span style={{ fontSize: "2.5rem" }}>🚀</span>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "0.75rem", marginBottom: "0.75rem" }}>
            Ready to Transform Your Farm?
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.5rem", maxWidth: 400, margin: "0 auto 1.5rem" }}>
            Join thousands of farmers and buyers already using AgroLink to grow their agricultural business.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/register" className="cta-primary">Get Started Free →</Link>
            <Link href="/marketplace" className="cta-secondary">Explore Marketplace</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", fontSize: "0.82rem", borderTop: "1px solid var(--border-color)", position: "relative", zIndex: 1 }}>
        <p>© 2025 AgroLink — Smart Agricultural Marketplace Platform</p>
        <p style={{ marginTop: "0.4rem", fontSize: "0.75rem", color: "var(--text-dim)" }}>
          Built with Next.js · FastAPI · AWS DynamoDB · Cognito · S3 · SNS
        </p>
      </footer>

      {/* Animation keyframes */}
      <style jsx>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%, 100% { filter: hue-rotate(0deg) brightness(1); }
          50% { filter: hue-rotate(15deg) brightness(1.1); }
        }
        @keyframes floatParticle {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(30px, -40px) rotate(90deg); }
          50% { transform: translate(-20px, -80px) rotate(180deg); }
          75% { transform: translate(40px, -30px) rotate(270deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
