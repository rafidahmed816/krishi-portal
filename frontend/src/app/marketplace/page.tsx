"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { productsApi, type Product } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const CATEGORIES = [
  "All",
  "Rice",
  "Vegetables",
  "Fruits",
  "Fish",
  "Dairy",
  "Spices",
  "Grains",
  "Poultry",
  "Other",
];

const CATEGORY_ICONS: Record<string, string> = {
  All: "🛒",
  Rice: "🍚",
  Vegetables: "🥬",
  Fruits: "🍎",
  Fish: "🐟",
  Dairy: "🥛",
  Spices: "🌶️",
  Grains: "🌾",
  Poultry: "🐔",
  Other: "📦",
};

export default function MarketplacePage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    fetchProducts();
  }, [category]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params: { category?: string; search?: string } = {};
      if (category !== "All") params.category = category;
      if (search.trim()) params.search = search.trim();
      const res = await productsApi.list(params);
      setProducts(res.data.products);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  return (
    <div className="landing-page">
      {/* Navbar */}
      <nav className="navbar">
        <Link href="/" className="navbar-logo">🌿 AgroLink</Link>
        <div className="navbar-links">
          <Link href="/marketplace" style={{ color: "#16a34a" }}>Marketplace</Link>
          {user ? (
            <Link href="/dashboard" className="nav-cta">Dashboard</Link>
          ) : (
            <>
              <Link href="/login">Sign In</Link>
              <Link href="/register" className="nav-cta">Get Started</Link>
            </>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "6rem 2rem 2rem", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#f1f5f9", marginBottom: "0.5rem" }}>
              🛒 Marketplace
            </h1>
            <p style={{ color: "#64748b" }}>Fresh produce directly from local farmers</p>
          </div>
          {user?.user_type === "farmer" && (
            <Link
              href="/marketplace/add"
              className="btn btn-primary"
              style={{ width: "auto", padding: "12px 24px" }}
            >
              ➕ Add Product
            </Link>
          )}
        </div>

        {/* Search + Filters */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "2rem" }}>
          <form onSubmit={handleSearch} style={{ flex: 1, minWidth: 200, display: "flex", gap: "0.5rem" }}>
            <input
              className="form-input"
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" type="submit" style={{ width: "auto", padding: "12px 20px" }}>
              🔍
            </button>
          </form>
        </div>

        {/* Category tabs */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "2rem" }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                padding: "8px 16px",
                borderRadius: "10px",
                border: "1px solid",
                borderColor: category === cat ? "#16a34a" : "rgba(148,163,184,0.12)",
                background: category === cat ? "rgba(22,163,74,0.15)" : "rgba(15,23,42,0.6)",
                color: category === cat ? "#4ade80" : "#94a3b8",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {CATEGORY_ICONS[cat]} {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem" }}>
            <span className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
            <p style={{ color: "#64748b", marginTop: "1rem" }}>Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="dashboard-card" style={{ textAlign: "center", padding: "4rem" }}>
            <span style={{ fontSize: "3rem" }}>🌾</span>
            <h3 style={{ color: "#e2e8f0", marginTop: "1rem", fontSize: "1.2rem" }}>No products found</h3>
            <p style={{ color: "#64748b", marginTop: "0.5rem" }}>
              {user?.user_type === "farmer"
                ? "Be the first to list your produce!"
                : "Check back soon for fresh listings."}
            </p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1.25rem",
          }}>
            {products.map((p) => (
              <div
                key={p.id}
                className="feature-card"
                style={{ cursor: "pointer", padding: "1.5rem" }}
              >
                {/* Product image placeholder */}
                <div style={{
                  height: 140,
                  borderRadius: 12,
                  background: "rgba(22, 163, 74, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2.5rem",
                  marginBottom: "1rem",
                }}>
                  {CATEGORY_ICONS[p.category] || "📦"}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#f1f5f9", margin: 0 }}>
                    {p.title}
                  </h3>
                  <span style={{
                    padding: "4px 10px",
                    borderRadius: 8,
                    background: "rgba(22,163,74,0.12)",
                    color: "#4ade80",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}>
                    ৳{p.price}/{p.unit}
                  </span>
                </div>

                <p style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "0.5rem", lineHeight: 1.5 }}>
                  {p.description ? (p.description.length > 80 ? p.description.slice(0, 80) + "…" : p.description) : "No description"}
                </p>

                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "1rem",
                  paddingTop: "0.75rem",
                  borderTop: "1px solid rgba(148,163,184,0.06)",
                }}>
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                    👨‍🌾 {p.farmer_name}
                  </span>
                  <span style={{
                    fontSize: "0.75rem",
                    color: p.quantity > 0 ? "#4ade80" : "#f87171",
                    fontWeight: 600,
                  }}>
                    {p.quantity > 0 ? `${p.quantity} ${p.unit} available` : "Out of stock"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
