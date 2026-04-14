"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { farmsApi, type Farm } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";

export default function FarmsPage() {
  const { user, tokens, isLoading } = useAuth();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tokens?.access_token) {
      farmsApi.myFarms(tokens.access_token)
        .then((res) => setFarms(res.data.farms))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else if (!isLoading) {
      setLoading(false);
    }
  }, [tokens, isLoading]);

  const isFarmer = user?.user_type === "farmer";

  if (isLoading) {
    return (
      <div className="landing-page"><Navbar />
        <div className="auth-bg" style={{ flexDirection: "column", gap: "1rem" }}>
          <span className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="landing-page">
      <Navbar />
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "5.5rem 2rem 3rem", position: "relative", zIndex: 1 }}>
        <Link href="/dashboard" className="back-link">← Back to Dashboard</Link>

        <div className="animate-fadeInUp" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)" }}>My Farms</h1>
            <p style={{ color: "var(--text-muted)" }}>Manage your agricultural properties</p>
          </div>
          {isFarmer && (
            <Link href="/farms/add" className="btn btn-primary" style={{ width: "auto", padding: "12px 28px" }}>
              ➕ Add New Farm
            </Link>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "5rem" }}>
            <span className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
          </div>
        ) : farms.length === 0 ? (
          <div className="dashboard-card" style={{ textAlign: "center", padding: "5rem 2rem" }}>
            <span style={{ fontSize: "3.5rem" }}>🌾</span>
            <h3 style={{ color: "var(--text-primary)", marginTop: "1rem", fontSize: "1.3rem" }}>No farms yet</h3>
            <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>Add your first farm to start managing crops and livestock.</p>
            {isFarmer && (
              <Link href="/farms/add" className="btn btn-primary" style={{ width: "auto", padding: "12px 28px", margin: "1.5rem auto 0" }}>
                ➕ Create Your First Farm
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" }}>
            {farms.map((farm) => (
              <Link key={farm.id} href={`/farms/${farm.id}`} style={{ textDecoration: "none" }}>
                <div className="feature-card animate-fadeInUp" style={{ cursor: "pointer", height: "100%" }}>
                  {/* Farm image */}
                  <div style={{
                    height: 160, borderRadius: 12, marginBottom: "1rem",
                    background: farm.image_url
                      ? `url(${farm.image_url}) center/cover`
                      : "linear-gradient(135deg, rgba(22,163,74,0.15), rgba(14,165,233,0.1))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: farm.image_url ? 0 : "3rem",
                  }}>
                    {!farm.image_url && "🏡"}
                  </div>
                  <h3 style={{ marginTop: 0 }}>{farm.name}</h3>
                  <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "0.5rem", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    <span>📍 {farm.location}</span>
                    <span>📐 {farm.size_acres} acres</span>
                    {farm.soil_type && <span>🌱 {farm.soil_type}</span>}
                  </div>
                  <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.75rem" }}>
                    <span style={{
                      padding: "4px 10px", borderRadius: 8, fontSize: "0.75rem", fontWeight: 700,
                      background: "rgba(22,163,74,0.1)", color: "var(--accent-green-light)",
                      border: "1px solid rgba(22,163,74,0.2)",
                    }}>
                      🌿 {farm.crop_count} crops
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
