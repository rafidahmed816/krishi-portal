"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { productsApi, type Product } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";

const CATEGORIES = ["All", "Rice", "Vegetables", "Fruits", "Fish", "Dairy", "Spices", "Grains", "Poultry", "Other"];

const CATEGORY_ICONS: Record<string, string> = {
  All: "🛒", Rice: "🍚", Vegetables: "🥬", Fruits: "🍎", Fish: "🐟",
  Dairy: "🥛", Spices: "🌶️", Grains: "🌾", Poultry: "🐔", Other: "📦",
};

export default function MarketplacePage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const fetchProducts = async (cat?: string, q?: string) => {
    setLoading(true);
    try {
      const params: { category?: string; search?: string } = {};
      if ((cat ?? category) !== "All") params.category = cat ?? category;
      if ((q ?? search).trim()) params.search = (q ?? search).trim();
      const res = await productsApi.list(params);
      setProducts(res.data.products);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleCategoryClick = (cat: string) => { setCategory(cat); fetchProducts(cat, search); };
  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchProducts(category, search); };

  return (
    <div className="landing-page">
      <Navbar />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "5.5rem 2rem 3rem", position: "relative", zIndex: 1 }}>
        {/* Back */}
        <Link href="/" className="back-link">← Back to Home</Link>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
              Fresh Marketplace
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
              {products.length} products from verified farmers across Bangladesh
            </p>
          </div>
          {user?.user_type === "farmer" && (
            <Link href="/marketplace/add" className="btn btn-primary" style={{ width: "auto", padding: "12px 28px", fontSize: "0.95rem" }}>
              ➕ List New Product
            </Link>
          )}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
          <input className="form-input" type="text" placeholder="Search by product name or description..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1 }} />
          <button className="btn btn-primary" type="submit" style={{ width: "auto", padding: "12px 24px" }}>🔍 Search</button>
        </form>

        {/* Category pills */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "2rem" }}>
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => handleCategoryClick(cat)} style={{
              padding: "8px 16px", borderRadius: 20,
              border: "1px solid", borderColor: category === cat ? "var(--accent-green)" : "var(--border-color)",
              background: category === cat ? "var(--tab-active-bg)" : "var(--bg-card)",
              color: category === cat ? "var(--accent-green-light)" : "var(--text-secondary)",
              fontSize: "13px", fontWeight: 600, cursor: "pointer", transition: "all 0.25s ease",
            }}>
              {CATEGORY_ICONS[cat]} {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "5rem" }}>
            <span className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
            <p style={{ color: "var(--text-muted)", marginTop: "1rem" }}>Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="dashboard-card" style={{ textAlign: "center", padding: "5rem 2rem" }}>
            <span style={{ fontSize: "3.5rem" }}>🌾</span>
            <h3 style={{ color: "var(--text-primary)", marginTop: "1rem", fontSize: "1.3rem" }}>No products found</h3>
            <p style={{ color: "var(--text-muted)", marginTop: "0.5rem", maxWidth: 400, margin: "0.5rem auto 0" }}>
              {category !== "All" ? `No products in "${category}" yet.` : "Check back soon for fresh listings."}
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
            {products.map((p) => (
              <Link key={p.id} href={`/marketplace/${p.id}`} style={{ textDecoration: "none" }}>
              <div className="feature-card" style={{ padding: 0, overflow: "hidden", cursor: "pointer" }}>
                {/* Image */}
                <div style={{
                  height: 160,
                  background: p.image_url ? `url(${p.image_url}) center/cover` : "linear-gradient(135deg, var(--mesh-1), var(--mesh-2))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: p.image_url ? "0" : "3rem", position: "relative",
                }}>
                  {!p.image_url && (CATEGORY_ICONS[p.category] || "📦")}
                  <span style={{
                    position: "absolute", top: 12, left: 12,
                    padding: "4px 10px", borderRadius: 8,
                    background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)",
                    color: "#e2e8f0", fontSize: "0.75rem", fontWeight: 600,
                  }}>
                    {CATEGORY_ICONS[p.category]} {p.category}
                  </span>
                </div>
                {/* Content */}
                <div style={{ padding: "1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem" }}>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)", margin: 0, lineHeight: 1.3 }}>{p.title}</h3>
                    <span style={{
                      padding: "5px 12px", borderRadius: 10,
                      background: "rgba(22,163,74,0.12)", color: "var(--accent-green-light)",
                      fontSize: "0.9rem", fontWeight: 800, whiteSpace: "nowrap", flexShrink: 0,
                    }}>৳{p.price}</span>
                  </div>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.83rem", marginTop: "0.6rem", lineHeight: 1.6 }}>
                    {p.description ? (p.description.length > 100 ? p.description.slice(0, 100) + "…" : p.description) : "No description"}
                  </p>
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border-color)",
                  }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>👨‍🌾 {p.farmer_name}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {p.quantity > 0 && p.quantity <= 10 && (
                        <span style={{ padding: "2px 6px", borderRadius: 6, fontSize: "0.65rem", fontWeight: 700, background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>Low Stock</span>
                      )}
                      <span style={{ fontSize: "0.75rem", color: p.quantity > 0 ? "var(--accent-green-light)" : "var(--accent-red)", fontWeight: 600 }}>
                        {p.quantity > 0 ? `${p.quantity} ${p.unit}` : "Sold out"}
                      </span>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.quantity > 0 ? "var(--accent-green-light)" : "var(--accent-red)", display: "inline-block" }} />
                    </div>
                  </div>
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
