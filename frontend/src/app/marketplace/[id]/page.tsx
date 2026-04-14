"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { productsApi, type Product } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";

const CATEGORY_ICONS: Record<string, string> = {
  Rice: "🍚", Vegetables: "🥬", Fruits: "🍎", Fish: "🐟",
  Dairy: "🥛", Spices: "🌶️", Grains: "🌾", Poultry: "🐔", Other: "📦",
};

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, tokens } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      productsApi.get(id).then((res) => { setProduct(res.data); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [id]);

  const handleDelete = async () => {
    if (!tokens?.access_token || !product) return;
    if (!confirm("Are you sure you want to delete this product?")) return;
    setDeleting(true);
    try {
      await productsApi.delete(product.id, tokens.access_token);
      window.location.href = "/marketplace";
    } catch {
      alert("Failed to delete product");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="landing-page">
        <Navbar />
        <div className="auth-bg" style={{ flexDirection: "column", gap: "1rem" }}>
          <span className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
          <p style={{ color: "var(--text-muted)" }}>Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="landing-page">
        <Navbar />
        <div className="auth-bg" style={{ flexDirection: "column", gap: "1rem" }}>
          <span style={{ fontSize: "3rem" }}>❌</span>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>Product not found</p>
          <Link href="/marketplace" className="btn btn-primary" style={{ width: "auto", padding: "12px 32px" }}>Back to Marketplace</Link>
        </div>
      </div>
    );
  }

  const isOwner = user?.email === product.farmer_email;

  return (
    <div className="landing-page">
      <Navbar />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "5.5rem 2rem 3rem", position: "relative", zIndex: 1 }}>
        <Link href="/marketplace" className="back-link">← Back to Marketplace</Link>

        <div className="feature-card" style={{ padding: 0, overflow: "hidden" }}>
          {/* Image */}
          <div style={{
            height: 280,
            background: product.image_url ? `url(${product.image_url}) center/cover` : "linear-gradient(135deg, var(--mesh-1), var(--mesh-2))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: product.image_url ? 0 : "5rem", position: "relative",
          }}>
            {!product.image_url && (CATEGORY_ICONS[product.category] || "📦")}
            <span style={{
              position: "absolute", top: 16, left: 16,
              padding: "6px 14px", borderRadius: 10,
              background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
              color: "#e2e8f0", fontSize: "0.85rem", fontWeight: 600,
            }}>
              {CATEGORY_ICONS[product.category]} {product.category}
            </span>
          </div>

          {/* Content */}
          <div style={{ padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
              <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>{product.title}</h1>
              <span style={{
                padding: "8px 18px", borderRadius: 12,
                background: "rgba(22,163,74,0.12)", color: "var(--accent-green-light)",
                fontSize: "1.2rem", fontWeight: 800,
              }}>৳{product.price}/{product.unit}</span>
            </div>

            <p style={{ color: "var(--text-muted)", marginTop: "1rem", lineHeight: 1.8, fontSize: "0.95rem" }}>
              {product.description || "No description provided."}
            </p>

            {/* Info grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", margin: "1.5rem 0" }}>
              <div className="dashboard-stat-card" style={{ padding: "1rem" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Available Stock</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: product.quantity > 0 ? "var(--accent-green-light)" : "var(--accent-red)", marginTop: 4 }}>
                  {product.quantity > 0 ? `${product.quantity} ${product.unit}` : "Sold out"}
                </div>
              </div>
              <div className="dashboard-stat-card" style={{ padding: "1rem" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Farmer</div>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginTop: 4 }}>👨‍🌾 {product.farmer_name}</div>
              </div>
              <div className="dashboard-stat-card" style={{ padding: "1rem" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Listed On</div>
                <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)", marginTop: 4 }}>
                  {new Date(product.created_at).toLocaleDateString("en-BD", { year: "numeric", month: "short", day: "numeric" })}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1.5rem" }}>
              {product.quantity > 0 && (
                <button className="btn btn-primary" style={{ width: "auto", padding: "12px 28px" }}>🛒 Contact Farmer</button>
              )}
              {isOwner && (
                <button className="btn btn-danger" onClick={handleDelete} disabled={deleting} style={{ width: "auto", padding: "12px 28px" }}>
                  {deleting ? "Deleting..." : "🗑️ Delete Product"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
