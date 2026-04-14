"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ordersApi, type Order } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  pending:   { color: "#fbbf24", bg: "rgba(251,191,36,0.1)", label: "⏳ Pending" },
  confirmed: { color: "#38bdf8", bg: "rgba(56,189,248,0.1)", label: "✅ Confirmed" },
  shipped:   { color: "#a78bfa", bg: "rgba(167,139,250,0.1)", label: "🚚 Shipped" },
  delivered: { color: "#4ade80", bg: "rgba(74,222,128,0.1)", label: "📦 Delivered" },
  cancelled: { color: "#f87171", bg: "rgba(248,113,113,0.1)", label: "❌ Cancelled" },
};

export default function OrdersPage() {
  const { user, tokens, isLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    if (!tokens?.access_token) return;
    setLoading(true);
    try {
      const res = await ordersApi.myOrders(tokens.access_token);
      setOrders(res.data.orders);
    } catch { setOrders([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (tokens?.access_token) fetchOrders(); }, [tokens]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    if (!tokens?.access_token) return;
    setUpdatingId(orderId);
    try {
      await ordersApi.updateStatus(orderId, newStatus, tokens.access_token);
      await fetchOrders();
    } catch { alert("Failed to update order status"); }
    finally { setUpdatingId(null); }
  };

  const isFarmer = user?.user_type === "farmer";

  if (isLoading) {
    return (
      <div className="landing-page"><Navbar />
        <div className="auth-bg" style={{ flexDirection: "column", gap: "1rem" }}>
          <span className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
          <p style={{ color: "var(--text-muted)" }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="landing-page"><Navbar />
        <div className="auth-bg" style={{ flexDirection: "column", gap: "1rem" }}>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>Sign in to view your orders.</p>
          <Link href="/login" className="btn btn-primary" style={{ width: "auto", padding: "12px 32px" }}>Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-page">
      <Navbar />
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "5.5rem 2rem 3rem", position: "relative", zIndex: 1 }}>
        <Link href="/dashboard" className="back-link">← Back to Dashboard</Link>

        <div className="animate-fadeInUp" style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
            {isFarmer ? "Incoming Orders" : "My Orders"}
          </h1>
          <p style={{ color: "var(--text-muted)" }}>
            {isFarmer ? "Orders placed by buyers for your products" : "Track your purchase history"}
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "5rem" }}>
            <span className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
            <p style={{ color: "var(--text-muted)", marginTop: "1rem" }}>Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="dashboard-card" style={{ textAlign: "center", padding: "5rem 2rem" }}>
            <span style={{ fontSize: "3.5rem" }}>📋</span>
            <h3 style={{ color: "var(--text-primary)", marginTop: "1rem", fontSize: "1.3rem" }}>No orders yet</h3>
            <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>
              {isFarmer ? "Orders will appear here when buyers purchase your products." : "Browse the marketplace to place your first order!"}
            </p>
            <Link href="/marketplace" className="btn btn-primary" style={{ width: "auto", padding: "12px 28px", margin: "1.5rem auto 0" }}>
              {isFarmer ? "View Marketplace" : "🛒 Browse Products"}
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {orders.map((order) => {
              const st = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const isUpdating = updatingId === order.id;
              return (
                <div key={order.id} className="glass-card animate-fadeInUp" style={{ borderRadius: 16, overflow: "hidden" }}>
                  <div style={{ display: "flex", gap: "1.25rem", padding: "1.25rem", alignItems: "center" }}>
                    {/* Product image */}
                    <div style={{
                      width: 72, height: 72, borderRadius: 14, flexShrink: 0,
                      background: order.product_image_url
                        ? `url(${order.product_image_url}) center/cover`
                        : "linear-gradient(135deg, var(--mesh-1), var(--mesh-2))",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: order.product_image_url ? 0 : "1.8rem",
                      border: "1px solid var(--border-color)",
                    }}>
                      {!order.product_image_url && "📦"}
                    </div>

                    {/* Order info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                        <Link href={`/marketplace/${order.product_id}`} style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)" }}>
                          {order.product_title}
                        </Link>
                        <span style={{ padding: "5px 12px", borderRadius: 10, fontSize: "0.78rem", fontWeight: 700, color: st.color, background: st.bg, border: `1px solid ${st.color}22` }}>
                          {st.label}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginTop: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                        <span>📦 {order.quantity} {order.unit}</span>
                        <span>💰 ৳{Number(order.total_price).toLocaleString()}</span>
                        <span>{isFarmer ? `🛒 ${order.buyer_name}` : `👨‍🌾 ${order.farmer_name}`}</span>
                        <span>📅 {new Date(order.created_at).toLocaleDateString("en-BD", { month: "short", day: "numeric" })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  {order.status !== "delivered" && order.status !== "cancelled" && (
                    <div style={{ display: "flex", gap: "0.5rem", padding: "0 1.25rem 1rem", flexWrap: "wrap" }}>
                      {isFarmer && order.status === "pending" && (
                        <>
                          <button className="btn btn-primary" onClick={() => handleStatusUpdate(order.id, "confirmed")} disabled={isUpdating}
                            style={{ width: "auto", padding: "8px 18px", fontSize: "0.82rem" }}>
                            {isUpdating ? "..." : "✅ Confirm"}
                          </button>
                          <button className="btn btn-danger" onClick={() => handleStatusUpdate(order.id, "cancelled")} disabled={isUpdating}
                            style={{ width: "auto", padding: "8px 18px", fontSize: "0.82rem" }}>
                            {isUpdating ? "..." : "❌ Reject"}
                          </button>
                        </>
                      )}
                      {isFarmer && order.status === "confirmed" && (
                        <button className="btn btn-primary" onClick={() => handleStatusUpdate(order.id, "shipped")} disabled={isUpdating}
                          style={{ width: "auto", padding: "8px 18px", fontSize: "0.82rem" }}>
                          {isUpdating ? "..." : "🚚 Mark Shipped"}
                        </button>
                      )}
                      {!isFarmer && order.status === "shipped" && (
                        <button className="btn btn-primary" onClick={() => handleStatusUpdate(order.id, "delivered")} disabled={isUpdating}
                          style={{ width: "auto", padding: "8px 18px", fontSize: "0.82rem" }}>
                          {isUpdating ? "..." : "📦 Confirm Delivery"}
                        </button>
                      )}
                      {!isFarmer && order.status === "pending" && (
                        <button className="btn btn-danger" onClick={() => handleStatusUpdate(order.id, "cancelled")} disabled={isUpdating}
                          style={{ width: "auto", padding: "8px 18px", fontSize: "0.82rem" }}>
                          {isUpdating ? "..." : "❌ Cancel Order"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
