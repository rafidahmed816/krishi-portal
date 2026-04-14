"use client";

import React, { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { productsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const CATEGORIES = ["Rice", "Vegetables", "Fruits", "Fish", "Dairy", "Spices", "Grains", "Poultry", "Other"];
const UNITS = ["kg", "piece", "dozen", "liter", "bundle", "bag", "ton"];

export default function AddProductPage() {
  const router = useRouter();
  const { tokens, user } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("kg");
  const [category, setCategory] = useState("Vegetables");
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!tokens?.access_token) {
      setError("You must be logged in to add products.");
      return;
    }

    setLoading(true);
    try {
      await productsApi.create(
        {
          title,
          description: description || undefined,
          price: parseFloat(price),
          unit,
          category,
          quantity: parseInt(quantity),
        },
        tokens.access_token,
      );
      router.push("/marketplace");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr?.response?.data?.detail || "Failed to create product.");
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.user_type !== "farmer") {
    return (
      <div className="auth-bg" style={{ flexDirection: "column", gap: "1rem" }}>
        <span style={{ fontSize: "3rem" }}>🚫</span>
        <p style={{ color: "#94a3b8", fontSize: "1.1rem" }}>Only farmers can add products.</p>
        <Link href="/marketplace" className="btn btn-primary" style={{ width: "auto", padding: "12px 32px" }}>
          Back to Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="auth-bg">
      <div className="glass-card" style={{ width: "100%", maxWidth: 560, padding: "2.5rem", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "2.5rem" }}>🌾</span>
          </div>
          <h1 style={{
            fontSize: "1.5rem",
            fontWeight: 800,
            background: "linear-gradient(135deg, #16a34a, #0ea5e9)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: "0.5rem",
          }}>
            Add New Product
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
            List your produce on the AgroLink marketplace
          </p>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label className="form-label">Product Name</label>
            <input className="form-input" type="text" placeholder="e.g. Premium Basmati Rice" value={title} onChange={(e) => setTitle(e.target.value)} required minLength={2} />
          </div>

          <div>
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              placeholder="Describe your product — quality, origin, freshness..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{ resize: "vertical" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label className="form-label">Price (৳)</label>
              <input className="form-input" type="number" step="0.01" min="0.01" placeholder="0.00" value={price} onChange={(e) => setPrice(e.target.value)} required />
            </div>
            <div>
              <label className="form-label">Unit</label>
              <select className="form-input" value={unit} onChange={(e) => setUnit(e.target.value)}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label className="form-label">Category</label>
              <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Quantity Available</label>
              <input className="form-input" type="number" min="0" placeholder="100" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
            </div>
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: "0.5rem" }}>
            {loading ? (<><span className="spinner" /> Publishing...</>) : "🚀 Publish Product"}
          </button>

          <Link href="/marketplace" style={{ textAlign: "center", color: "#64748b", fontSize: "0.85rem" }}>
            ← Back to Marketplace
          </Link>
        </form>
      </div>
    </div>
  );
}
