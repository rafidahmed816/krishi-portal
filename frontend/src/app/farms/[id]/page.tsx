"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { farmsApi, type Farm } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";

export default function FarmDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, tokens } = useAuth();
  const [farm, setFarm] = useState<Farm | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      farmsApi.get(id).then((res) => { setFarm(res.data); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [id]);

  const handleDelete = async () => {
    if (!tokens?.access_token || !farm) return;
    if (!confirm("Are you sure you want to delete this farm?")) return;
    setDeleting(true);
    try {
      await farmsApi.delete(farm.id, tokens.access_token);
      router.push("/farms");
    } catch {
      alert("Failed to delete farm");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="landing-page"><Navbar />
        <div className="auth-bg" style={{ flexDirection: "column", gap: "1rem" }}>
          <span className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
          <p style={{ color: "var(--text-muted)" }}>Loading farm...</p>
        </div>
      </div>
    );
  }

  if (!farm) {
    return (
      <div className="landing-page"><Navbar />
        <div className="auth-bg" style={{ flexDirection: "column", gap: "1rem" }}>
          <span style={{ fontSize: "3rem" }}>❌</span>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>Farm not found</p>
          <Link href="/farms" className="btn btn-primary" style={{ width: "auto", padding: "12px 32px" }}>Back to Farms</Link>
        </div>
      </div>
    );
  }

  const isOwner = user?.email === farm.farmer_email;

  return (
    <div className="landing-page">
      <Navbar />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "5.5rem 2rem 3rem", position: "relative", zIndex: 1 }}>
        <Link href="/farms" className="back-link">← Back to My Farms</Link>

        <div className="animate-fadeInUp">
          {/* Hero image */}
          <div style={{
            height: 300, borderRadius: 20, marginBottom: "2rem", overflow: "hidden",
            background: farm.image_url
              ? `url(${farm.image_url}) center/cover`
              : "linear-gradient(135deg, rgba(22,163,74,0.15), rgba(14,165,233,0.1))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: farm.image_url ? 0 : "5rem",
            border: "1px solid var(--border-color)", boxShadow: "var(--shadow-card)",
          }}>
            {!farm.image_url && "🏡"}
          </div>

          {/* Farm name and info */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
            <div>
              <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.5rem" }}>{farm.name}</h1>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", fontSize: "0.9rem", color: "var(--text-muted)" }}>
                <span>📍 {farm.location}</span>
                <span>📐 {farm.size_acres} acres</span>
                {farm.soil_type && <span>🌱 {farm.soil_type}</span>}
                <span>👨‍🌾 {farm.farmer_name}</span>
              </div>
            </div>
            <span style={{
              padding: "8px 16px", borderRadius: 12, fontSize: "0.85rem", fontWeight: 700,
              background: "rgba(22,163,74,0.1)", color: "var(--accent-green-light)",
              border: "1px solid rgba(22,163,74,0.2)",
            }}>
              🌿 {farm.crop_count} crops
            </span>
          </div>

          {/* Description */}
          {farm.description && (
            <div className="glass-card" style={{ padding: "1.5rem", borderRadius: 16, marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "0.5rem" }}>About This Farm</h3>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.8, fontSize: "0.95rem" }}>{farm.description}</p>
            </div>
          )}

          {/* Info grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            <div className="glass-card" style={{ padding: "1.25rem", borderRadius: 14, textAlign: "center" }}>
              <div style={{ fontSize: "1.5rem", marginBottom: 4 }}>📐</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 2 }}>Total Area</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)" }}>{farm.size_acres} acres</div>
            </div>
            <div className="glass-card" style={{ padding: "1.25rem", borderRadius: 14, textAlign: "center" }}>
              <div style={{ fontSize: "1.5rem", marginBottom: 4 }}>🌱</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 2 }}>Soil Type</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)" }}>{farm.soil_type || "Not specified"}</div>
            </div>
            <div className="glass-card" style={{ padding: "1.25rem", borderRadius: 14, textAlign: "center" }}>
              <div style={{ fontSize: "1.5rem", marginBottom: 4 }}>📅</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 2 }}>Registered</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>
                {new Date(farm.created_at).toLocaleDateString("en-BD", { month: "short", day: "numeric", year: "numeric" })}
              </div>
            </div>
          </div>

          {/* Owner actions */}
          {isOwner && (
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button className="btn btn-danger" onClick={handleDelete} disabled={deleting} style={{ flex: 1, maxWidth: 250 }}>
                {deleting ? "Deleting..." : "🗑️ Delete Farm"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
