"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

const ROLE_STATS: Record<string, { icon: string; label: string; value: string; color: string }[]> = {
  farmer: [
    { icon: "📦", label: "Products Listed", value: "0", color: "rgba(22, 163, 74, 0.12)" },
    { icon: "💰", label: "Total Revenue", value: "৳0", color: "rgba(245, 158, 11, 0.12)" },
    { icon: "📈", label: "Active Orders", value: "0", color: "rgba(14, 165, 233, 0.12)" },
    { icon: "⭐", label: "Buyer Rating", value: "—", color: "rgba(168, 85, 247, 0.12)" },
  ],
  buyer: [
    { icon: "🛒", label: "Orders Placed", value: "0", color: "rgba(14, 165, 233, 0.12)" },
    { icon: "💳", label: "Total Spent", value: "৳0", color: "rgba(245, 158, 11, 0.12)" },
    { icon: "📦", label: "Pending Delivery", value: "0", color: "rgba(22, 163, 74, 0.12)" },
    { icon: "❤️", label: "Saved Farms", value: "0", color: "rgba(236, 72, 153, 0.12)" },
  ],
  admin: [
    { icon: "👥", label: "Total Users", value: "1", color: "rgba(14, 165, 233, 0.12)" },
    { icon: "🏪", label: "Active Listings", value: "0", color: "rgba(22, 163, 74, 0.12)" },
    { icon: "📊", label: "Revenue (MTD)", value: "৳0", color: "rgba(245, 158, 11, 0.12)" },
    { icon: "⚠️", label: "Pending Reports", value: "0", color: "rgba(239, 68, 68, 0.12)" },
  ],
};

const ROLE_ACTIONS: Record<string, { label: string; icon: string; desc: string; href: string }[]> = {
  farmer: [
    { label: "Add Product", icon: "➕", desc: "List a new crop or produce item", href: "/marketplace/add" },
    { label: "My Listings", icon: "📋", desc: "Manage your marketplace products", href: "/marketplace" },
    { label: "Browse Market", icon: "🛒", desc: "See what others are selling", href: "/marketplace" },
  ],
  buyer: [
    { label: "Browse Market", icon: "🔍", desc: "Explore fresh produce from local farms", href: "/marketplace" },
    { label: "My Orders", icon: "📦", desc: "Track your current purchases", href: "/marketplace" },
    { label: "Contact Farmer", icon: "💬", desc: "Message sellers directly", href: "/marketplace" },
  ],
  admin: [
    { label: "Manage Users", icon: "👥", desc: "Review and moderate user accounts", href: "/dashboard" },
    { label: "View Marketplace", icon: "📊", desc: "View platform product listings", href: "/marketplace" },
    { label: "Content Moderation", icon: "🛡️", desc: "Review flagged listings", href: "/marketplace" },
  ],
};

export default function DashboardPage() {
  const { user, signOut, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="auth-bg" style={{ flexDirection: "column", gap: "1rem" }}>
        <span className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
        <p style={{ color: "#64748b" }}>Loading your dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-bg" style={{ flexDirection: "column", gap: "1rem" }}>
        <p style={{ color: "#94a3b8", fontSize: "1.1rem" }}>Please sign in to access your dashboard.</p>
        <Link href="/login" className="btn btn-primary" style={{ width: "auto", padding: "12px 32px" }}>
          Sign In
        </Link>
      </div>
    );
  }

  const role = user.user_type || "farmer";
  const stats = ROLE_STATS[role] || ROLE_STATS.farmer;
  const actions = ROLE_ACTIONS[role] || ROLE_ACTIONS.farmer;

  return (
    <div className="dashboard-layout">
      {/* Top bar */}
      <div className="dashboard-topbar">
        <Link href="/" className="navbar-logo" style={{ fontSize: "1.15rem", textDecoration: "none" }}>
          🌿 AgroLink
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span className={`role-badge ${role}`}>
            {role === "farmer" ? "🌾" : role === "buyer" ? "🛒" : "⚙️"} {role}
          </span>
          <button
            className="btn btn-danger"
            onClick={signOut}
            style={{ width: "auto", padding: "8px 18px", fontSize: "13px" }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="dashboard-container">
        {/* Welcome */}
        <div className="dashboard-welcome animate-fadeInUp">
          <h1>
            Welcome back, {user.name || "User"} 👋
          </h1>
          <p>Here&apos;s your {role} dashboard overview for today.</p>
        </div>

        {/* Stat cards */}
        <div className="dashboard-grid">
          {stats.map((s) => (
            <div key={s.label} className="dashboard-stat-card animate-fadeInUp">
              <div className="stat-icon" style={{ background: s.color }}>
                {s.icon}
              </div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="dashboard-card animate-fadeInUp" style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.25rem", color: "#e2e8f0" }}>
            Quick Actions
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            {actions.map((a) => (
              <Link
                key={a.label}
                href={a.href}
                className="btn btn-secondary"
                style={{
                  flexDirection: "column",
                  alignItems: "flex-start",
                  padding: "1.25rem",
                  textAlign: "left",
                  height: "auto",
                }}
              >
                <span style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{a.icon}</span>
                <span style={{ fontWeight: 700, color: "#e2e8f0", fontSize: "0.95rem" }}>{a.label}</span>
                <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 400 }}>{a.desc}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Profile */}
        <div className="dashboard-card animate-fadeInUp">
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", color: "#e2e8f0" }}>
            Profile Information
          </h3>
          <div className="profile-row">
            <span className="label">Full Name</span>
            <span className="value">{user.name || "—"}</span>
          </div>
          <div className="profile-row">
            <span className="label">Email Address</span>
            <span className="value">{user.email}</span>
          </div>
          <div className="profile-row">
            <span className="label">Account Type</span>
            <span className="value" style={{ textTransform: "capitalize" }}>{role}</span>
          </div>
          <div className="profile-row">
            <span className="label">Email Verified</span>
            <span className="value" style={{ color: user.email_verified === "true" ? "#4ade80" : "#fbbf24" }}>
              {user.email_verified === "true" ? "✅ Verified" : "⏳ Pending"}
            </span>
          </div>
          <div className="profile-row">
            <span className="label">User ID</span>
            <span className="value" style={{ fontSize: "0.8rem", color: "#475569" }}>{user.sub}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
