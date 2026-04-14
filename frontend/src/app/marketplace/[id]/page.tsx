"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { productsApi, ordersApi, type Product } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";

const CATEGORY_ICONS: Record<string, string> = {
  Rice: "🍚", Vegetables: "🥬", Fruits: "🍎", Fish: "🐟",
  Dairy: "🥛", Spices: "🌶️", Grains: "🌾", Poultry: "🐔", Other: "📦",
};

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, tokens } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderQty, setOrderQty] = useState(1);

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
      router.push("/marketplace");
    } catch {
      alert("Failed to delete product");
      setDeleting(false);
    }
  };

  const handleOrder = async () => {
    if (!tokens?.access_token || !product) return;
    setOrdering(true);
    try {
      await ordersApi.place({ product_id: product.id, quantity: orderQty }, tokens.access_token);
      setOrderSuccess(true);
      // Refresh product to show updated stock
      const res = await productsApi.get(product.id);
      setProduct(res.data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed to place order";
      alert(msg);
    } finally {
      setOrdering(false);
    }
  };

  if (loading) {
    return (
      <div className="landing-page"><Navbar />
        <div className="auth-bg" style={{ flexDirection: "column", gap: "1rem" }}>
          <span className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
          <p style={{ color: "var(--text-muted)" }}>Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="landing-page"><Navbar />
        <div className="auth-bg" style={{ flexDirection: "column", gap: "1rem" }}>
          <span style={{ fontSize: "3rem" }}>❌</span>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>Product not found</p>
          <Link href="/marketplace" className="btn btn-primary" style={{ width: "auto", padding: "12px 32px" }}>Back to Marketplace</Link>
        </div>
      </div>
    );
  }

  const isOwner = user?.email === product.farmer_email;
  const isBuyer = user?.user_type === "buyer";
  const inStock = product.quantity > 0;

  return (
    <div className="landing-page">
      <Navbar />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "5.5rem 2rem 3rem", position: "relative", zIndex: 1 }}>
        <Link href="/marketplace" className="back-link">← Back to Marketplace</Link>

        <div className="animate-fadeInUp" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", alignItems: "start" }}>
          {/* Left: Image */}
          <div style={{ borderRadius: 20, overflow: "hidden", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-card)" }}>
            <div style={{
              height: 400,
              background: product.image_url
                ? `url(${product.image_url}) center/cover`
                : "linear-gradient(135deg, rgba(22,163,74,0.15), rgba(14,165,233,0.1))",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: product.image_url ? 0 : "6rem", position: "relative",
            }}>
              {!product.image_url && (CATEGORY_ICONS[product.category] || "📦")}
              {/* Category badge */}
              <span style={{
                position: "absolute", top: 16, left: 16,
                padding: "8px 16px", borderRadius: 12,
                background: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)",
                color: "#fff", fontSize: "0.85rem", fontWeight: 700,
                display: "flex", alignItems: "center", gap: 6,
              }}>
                {CATEGORY_ICONS[product.category]} {product.category}
              </span>
              {/* Stock badge */}
              <span style={{
                position: "absolute", top: 16, right: 16,
                padding: "8px 14px", borderRadius: 12,
                background: inStock ? "rgba(22,163,74,0.85)" : "rgba(239,68,68,0.85)",
                color: "#fff", fontSize: "0.8rem", fontWeight: 700,
              }}>
                {inStock ? "✅ In Stock" : "❌ Sold Out"}
              </span>
            </div>
          </div>

          {/* Right: Details */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Title + Price */}
            <div>
              <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2, marginBottom: "0.75rem" }}>
                {product.title}
              </h1>
              <div style={{
                display: "inline-flex", alignItems: "baseline", gap: 6,
                padding: "10px 20px", borderRadius: 14,
                background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.2)",
              }}>
                <span style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--accent-green-light)" }}>৳{product.price}</span>
                <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>/ {product.unit}</span>
              </div>
            </div>

            {/* Description */}
            <div className="glass-card" style={{ padding: "1.25rem", borderRadius: 16 }}>
              <h3 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "0.5rem" }}>Description</h3>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.8, fontSize: "0.95rem" }}>
                {product.description || "No description provided for this product."}
              </p>
            </div>

            {/* Info cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
              <div className="glass-card" style={{ padding: "1rem", borderRadius: 14, textAlign: "center" }}>
                <div style={{ fontSize: "1.5rem", marginBottom: 4 }}>📦</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 2 }}>Stock</div>
                <div style={{ fontSize: "1rem", fontWeight: 800, color: inStock ? "var(--accent-green-light)" : "var(--accent-red)" }}>
                  {product.quantity} {product.unit}
                </div>
              </div>
              <div className="glass-card" style={{ padding: "1rem", borderRadius: 14, textAlign: "center" }}>
                <div style={{ fontSize: "1.5rem", marginBottom: 4 }}>👨‍🌾</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 2 }}>Farmer</div>
                <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>{product.farmer_name}</div>
              </div>
              <div className="glass-card" style={{ padding: "1rem", borderRadius: 14, textAlign: "center" }}>
                <div style={{ fontSize: "1.5rem", marginBottom: 4 }}>📅</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 2 }}>Listed</div>
                <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  {new Date(product.created_at).toLocaleDateString("en-BD", { month: "short", day: "numeric", year: "numeric" })}
                </div>
              </div>
            </div>

            {/* Order / Actions */}
            {isBuyer && inStock && (
              <div className="glass-card" style={{ padding: "1.25rem", borderRadius: 16 }}>
                <h3 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "0.75rem" }}>Place Order</h3>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Quantity ({product.unit})</label>
                    <input className="form-input" type="number" min={1} max={product.quantity} value={orderQty}
                      onChange={(e) => setOrderQty(Math.min(parseInt(e.target.value) || 1, product.quantity))}
                      style={{ width: 100, textAlign: "center" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 4 }}>Total Price</div>
                    <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--accent-green-light)" }}>
                      ৳{(product.price * orderQty).toLocaleString()}
                    </div>
                  </div>
                </div>
                <button className="btn btn-primary" onClick={handleOrder} disabled={ordering} style={{ fontSize: "1rem" }}>
                  {ordering ? "Placing Order..." : `🛒 Place Order · ৳${(product.price * orderQty).toLocaleString()}`}
                </button>
                {orderSuccess && (
                  <div style={{ marginTop: "0.75rem", padding: "12px 16px", borderRadius: 12, background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.2)", textAlign: "center" }}>
                    <span style={{ color: "var(--accent-green-light)", fontWeight: 700 }}>✅ Order placed successfully!</span>
                    <Link href="/orders" style={{ display: "block", marginTop: 6, fontSize: "0.85rem", color: "var(--accent-blue)", fontWeight: 600 }}>View My Orders →</Link>
                  </div>
                )}
              </div>
            )}

            {!user && inStock && (
              <Link href="/login" className="btn btn-primary" style={{ fontSize: "1rem" }}>
                🔐 Sign In to Place Order
              </Link>
            )}

            {isOwner && (
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button className="btn btn-danger" onClick={handleDelete} disabled={deleting} style={{ flex: 1 }}>
                  {deleting ? "Deleting..." : "🗑️ Delete Product"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
