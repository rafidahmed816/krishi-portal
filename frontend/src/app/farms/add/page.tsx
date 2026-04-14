"use client";

import React, { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { farmsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";

const SOIL_TYPES = ["Clay", "Sandy", "Loamy", "Silt", "Peaty", "Chalky", "Alluvial", "Other"];

export default function AddFarmPage() {
  const router = useRouter();
  const { tokens } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [sizeAcres, setSizeAcres] = useState("");
  const [soilType, setSoilType] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!tokens?.access_token) return;
    setError("");
    setLoading(true);
    try {
      await farmsApi.create(
        {
          name,
          location,
          size_acres: parseFloat(sizeAcres) || 0,
          soil_type: soilType,
          description,
          image_url: imageUrl,
        },
        tokens.access_token
      );
      router.push("/farms");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed to create farm";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-page">
      <Navbar />
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "5.5rem 2rem 3rem", position: "relative", zIndex: 1 }}>
        <Link href="/farms" className="back-link">← Back to My Farms</Link>

        <div className="glass-card animate-fadeInUp" style={{ padding: "2rem", borderRadius: 20 }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <span style={{ fontSize: "3rem" }}>🏡</span>
            <h1 style={{
              fontSize: "1.75rem", fontWeight: 800, marginTop: "0.5rem",
              background: "linear-gradient(135deg, #16a34a, #0ea5e9)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Add New Farm
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Register a new agricultural property</p>
          </div>

          {error && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label className="form-label">Farm Name *</label>
              <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Green Valley Farm" required />
            </div>

            <div>
              <label className="form-label">Location *</label>
              <input className="form-input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Gazipur, Dhaka" required />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label className="form-label">Size (Acres) *</label>
                <input className="form-input" type="number" step="0.1" min="0.1" value={sizeAcres} onChange={(e) => setSizeAcres(e.target.value)} placeholder="e.g. 5.0" required />
              </div>
              <div>
                <label className="form-label">Soil Type</label>
                <select className="form-input" value={soilType} onChange={(e) => setSoilType(e.target.value)}>
                  <option value="">Select soil type</option>
                  {SOIL_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="form-label">Description</label>
              <textarea className="form-input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your farm — what you grow, irrigation, etc." style={{ resize: "vertical" }} />
            </div>

            <div>
              <label className="form-label">Image URL (optional)</label>
              <input className="form-input" type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: "0.5rem" }}>
              {loading ? (<><span className="spinner" /> Creating...</>) : "🏡 Create Farm"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
