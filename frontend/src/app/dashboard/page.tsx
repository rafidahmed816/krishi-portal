"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { dashboardApi, productsApi, type DashboardStat, type Product } from "@/lib/api";
import Navbar from "@/components/Navbar";

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

const CATEGORY_ICONS: Record<string, string> = {
  Rice: "🍚", Vegetables: "🥬", Fruits: "🍎", Fish: "🐟",
  Dairy: "🥛", Spices: "🌶️", Grains: "🌾", Poultry: "🐔", Other: "📦",
};

export default function DashboardPage() {
  const { user, tokens, signOut, isLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (tokens?.access_token) {
      // Fetch live stats
      dashboardApi.getStats(tokens.access_token)
        .then((res) => setStats(res.data.stats))
        .catch(() => {})
        .finally(() => setLoadingStats(false));

      // Fetch recent products — farmer sees their own, others see all
      const fetchProducts = user?.user_type === "farmer"
        ? productsApi.myListings(tokens.access_token)
        : productsApi.list();
      fetchProducts
        .then((res) => setRecentProducts(res.data.products.slice(0, 6)))
        .catch(() => {});
    }
  }, [tokens, user]);

  if (isLoading) {
    return (
      <div className="landing-page"><Navbar />
        <div className="auth-bg" style={{ flexDirection: "column", gap: "1rem" }}>
          <span className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
          <p style={{ color: "var(--text-muted)" }}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="landing-page"><Navbar />
        <div className="auth-bg" style={{ flexDirection: "column", gap: "1rem" }}>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>Please sign in to access your dashboard.</p>
          <Link href="/login" className="btn btn-primary" style={{ width: "auto", padding: "12px 32px" }}>Sign In</Link>
        </div>
      </div>
    );
  }

  const role = user.user_type || "farmer";
  const actions = ROLE_ACTIONS[role] || ROLE_ACTIONS.farmer;

  return (
    <div className="landing-page">
      <Navbar />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "5rem 2rem 2rem", position: "relative", zIndex: 1 }}>
        <Link href="/" className="back-link">← Back to Home</Link>

        {/* Welcome + Sign Out */}
        <div className="animate-fadeInUp" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
              Welcome back, {user.name || "User"} 👋
            </h1>
            <p style={{ color: "var(--text-muted)" }}>Here&apos;s your {role} dashboard overview for today.</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span className="role-badge">{role === "farmer" ? "🌾" : role === "buyer" ? "🛒" : "⚙️"} {role}</span>
            <button className="btn btn-danger" onClick={signOut} style={{ width: "auto", padding: "8px 18px", fontSize: "13px" }}>Sign Out</button>
          </div>
        </div>

        {/* Live stat cards */}
        <div className="dashboard-grid">
          {loadingStats ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="dashboard-stat-card animate-fadeInUp" style={{ minHeight: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="spinner" style={{ width: 20, height: 20 }} />
              </div>
            ))
          ) : (
            stats.map((s) => (
              <div key={s.label} className="dashboard-stat-card animate-fadeInUp">
                <div className="stat-icon" style={{ background: s.color }}>{s.icon}</div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))
          )}
        </div>

        {/* Quick Actions */}
        <div className="dashboard-card animate-fadeInUp" style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.25rem", color: "var(--text-primary)" }}>Quick Actions</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            {actions.map((a) => (
              <Link key={a.label} href={a.href} className="btn btn-secondary" style={{ flexDirection: "column", alignItems: "flex-start", padding: "1.25rem", textAlign: "left", height: "auto" }}>
                <span style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{a.icon}</span>
                <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.95rem" }}>{a.label}</span>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 400 }}>{a.desc}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Products */}
        {recentProducts.length > 0 && (
          <div className="dashboard-card animate-fadeInUp" style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                {role === "farmer" ? "My Products" : "Recent Products"}
              </h3>
              <Link href="/marketplace" style={{ fontSize: "0.85rem", color: "var(--accent-green-light)", fontWeight: 600 }}>View All →</Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
              {recentProducts.map((p) => (
                <Link key={p.id} href={`/marketplace/${p.id}`} style={{ textDecoration: "none" }}>
                  <div style={{
                    display: "flex", gap: "1rem", padding: "0.75rem",
                    borderRadius: 12, background: "var(--bg-input)",
                    border: "1px solid var(--border-color)",
                    transition: "all 0.2s ease", cursor: "pointer",
                  }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 10, flexShrink: 0,
                      background: p.image_url ? `url(${p.image_url}) center/cover` : "var(--tab-active-bg)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem",
                    }}>
                      {!p.image_url && (CATEGORY_ICONS[p.category] || "📦")}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.title}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>👨‍🌾 {p.farmer_name}</span>
                        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--accent-green-light)" }}>৳{p.price}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Profile */}
        <div className="dashboard-card animate-fadeInUp">
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", color: "var(--text-primary)" }}>Profile Information</h3>
          <div className="profile-row"><span className="label">Full Name</span><span className="value">{user.name || "—"}</span></div>
          <div className="profile-row"><span className="label">Email Address</span><span className="value">{user.email}</span></div>
          <div className="profile-row"><span className="label">Account Type</span><span className="value" style={{ textTransform: "capitalize" }}>{role}</span></div>
          <div className="profile-row"><span className="label">Email Verified</span><span className="value" style={{ color: user.email_verified === "true" ? "var(--accent-green-light)" : "#fbbf24" }}>{user.email_verified === "true" ? "✅ Verified" : "⏳ Pending"}</span></div>
          <div className="profile-row"><span className="label">User ID</span><span className="value" style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>{user.sub}</span></div>
        </div>
      </div>
    </div>
  );
}
