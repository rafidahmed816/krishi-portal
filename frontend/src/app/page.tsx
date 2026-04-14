"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";

const FEATURES = [
  {
    icon: "🌾",
    title: "Smart Marketplace",
    desc: "List your farm produce with real-time pricing, quality metrics, and direct buyer connections — no middlemen.",
    color: "rgba(22, 163, 74, 0.12)",
    accent: "#16a34a",
  },
  {
    icon: "📊",
    title: "Analytics Dashboard",
    desc: "Track sales, monitor crop demand trends, and optimize your pricing strategy with AI-powered insights.",
    color: "rgba(14, 165, 233, 0.12)",
    accent: "#0ea5e9",
  },
  {
    icon: "🛒",
    title: "Bulk Ordering",
    desc: "Buyers can place bulk orders directly from verified farmers with quality-assured produce and logistics.",
    color: "rgba(245, 158, 11, 0.12)",
    accent: "#f59e0b",
  },
  {
    icon: "🔒",
    title: "Secure Transactions",
    desc: "Enterprise-grade security with AWS Cognito authentication, encrypted payments, and verified identity.",
    color: "rgba(168, 85, 247, 0.12)",
    accent: "#a855f7",
  },
  {
    icon: "🤖",
    title: "AI Crop Advisor",
    desc: "Get personalized crop recommendations based on soil data, weather patterns, and market demand analysis.",
    color: "rgba(236, 72, 153, 0.12)",
    accent: "#ec4899",
  },
  {
    icon: "📦",
    title: "Supply Chain Tracking",
    desc: "End-to-end visibility from farm to table with real-time delivery tracking and quality checkpoints.",
    color: "rgba(20, 184, 166, 0.12)",
    accent: "#14b8a6",
  },
];

const STATS = [
  { number: "2,500+", label: "Active Farmers" },
  { number: "12,000+", label: "Products Listed" },
  { number: "98%", label: "Satisfaction Rate" },
  { number: "50+", label: "Districts Covered" },
];

export default function HomePage() {
  return (
    <div className="landing-page">
      <Navbar />

      {/* Hero */}
      <section className="landing-hero">
        <div className="hero-badge">Connecting Bangladesh&apos;s Agriculture</div>

        <h1>
          The Future of <br />
          <span className="gradient-text">Agricultural Commerce</span>
        </h1>

        <p className="hero-desc">
          AgroLink bridges the gap between farmers and buyers with an intelligent
          marketplace platform — powered by AI analytics, real-time pricing, and
          secure AWS cloud infrastructure.
        </p>

        <div className="landing-actions">
          <Link href="/register" className="cta-primary">
            Start Selling →
          </Link>
          <Link href="/login" className="cta-secondary">
            Browse Marketplace
          </Link>
        </div>

        {/* Stats */}
        <div className="stats-bar">
          {STATS.map((s) => (
            <div key={s.label} className="stat-item">
              <div className="stat-number">{s.number}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <h2>Built for Scale</h2>
        <p className="section-sub">
          Everything you need to digitize agricultural commerce, from farm-level
          operations to enterprise-grade supply chains.
        </p>

        <div className="features-grid">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="feature-card"
              style={{ "--card-accent": f.accent } as React.CSSProperties}
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

      {/* Footer */}
      <footer
        style={{
          textAlign: "center",
          padding: "3rem 2rem",
          color: "#475569",
          fontSize: "0.85rem",
          borderTop: "1px solid rgba(148, 163, 184, 0.06)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <p>© 2025 AgroLink — Smart Agricultural Marketplace Platform</p>
        <p style={{ marginTop: "0.5rem", color: "#334155" }}>
          Built with Next.js · FastAPI · AWS Cognito · PostgreSQL
        </p>
      </footer>
    </div>
  );
}
