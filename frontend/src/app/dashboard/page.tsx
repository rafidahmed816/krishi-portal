"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, signOut } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="auth-bg">
        <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3, color: "#16a34a" }} />
      </div>
    );
  }

  if (!user) return null;

  const roleColors: Record<string, string> = {
    farmer: "#16a34a",
    buyer: "#0ea5e9",
    admin: "#f59e0b",
  };

  const roleIcons: Record<string, string> = {
    farmer: "🌾",
    buyer: "🛒",
    admin: "⚙️",
  };

  const handleSignOut = () => {
    document.cookie = "agrolink_authenticated=; path=/; max-age=0";
    signOut();
    router.replace("/login");
  };

  return (
    <div
      className="auth-bg"
      style={{ alignItems: "flex-start", paddingTop: "3rem" }}
    >
      <div className="dashboard-container" style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 800 }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "2rem",
          }}
        >
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              background: "linear-gradient(135deg, #16a34a, #0ea5e9)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            AgroLink Dashboard
          </h1>
          <button className="btn btn-secondary" onClick={handleSignOut} style={{ width: "auto", padding: "10px 20px" }}>
            Sign Out
          </button>
        </div>

        {/* User card */}
        <div className="glass-card" style={{ padding: "2rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${roleColors[user.user_type] || "#16a34a"}, ${roleColors[user.user_type] || "#16a34a"}88)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
              }}
            >
              {roleIcons[user.user_type] || "👤"}
            </div>
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#f1f5f9" }}>
                {user.name}
              </h2>
              <p style={{ color: "#94a3b8", fontSize: "0.875rem" }}>{user.email}</p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem",
            }}
          >
            <InfoCard label="Role" value={user.user_type.toUpperCase()} color={roleColors[user.user_type] || "#16a34a"} />
            <InfoCard label="Email Verified" value={user.email_verified === "true" ? "Yes ✅" : "No ❌"} color="#94a3b8" />
            <InfoCard label="User ID" value={user.sub.slice(0, 12) + "…"} color="#94a3b8" />
          </div>
        </div>

        {/* Placeholder cards */}
        <div
          className="glass-card"
          style={{
            padding: "2rem",
            textAlign: "center",
            color: "#64748b",
          }}
        >
          <p style={{ fontSize: "1rem" }}>
            🚧 Dashboard features coming soon — crop management, marketplace, analytics, and more.
          </p>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      style={{
        background: "rgba(0,0,0,0.2)",
        borderRadius: 12,
        padding: "1rem",
        borderLeft: `3px solid ${color}`,
      }}
    >
      <p style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>
        {label}
      </p>
      <p style={{ fontSize: "1rem", fontWeight: 600, color: "#e2e8f0" }}>{value}</p>
    </div>
  );
}
