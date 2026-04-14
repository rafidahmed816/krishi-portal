"use client";

import React, { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const USER_TYPES = [
  { key: "farmer" as const, label: "Farmer", icon: "🌾" },
  { key: "buyer" as const, label: "Buyer", icon: "🛒" },
  { key: "admin" as const, label: "Admin", icon: "⚙️" },
];

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [activeTab, setActiveTab] = useState<"farmer" | "buyer" | "admin">("farmer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn({ email, password });
      router.push("/dashboard");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      const msg = axiosErr?.response?.data?.detail
        || (err instanceof Error ? err.message : "Login failed. Please try again.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <div className="glass-card" style={{ width: "100%", maxWidth: 460, padding: "2.5rem", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              background: "linear-gradient(135deg, #16a34a, #0ea5e9)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: "0.5rem",
            }}
          >
            Welcome Back
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.95rem" }}>
            Sign in to your AgroLink account
          </p>
        </div>

        {/* User-type tabs */}
        <div className="tab-bar" style={{ marginBottom: "1.5rem" }}>
          {USER_TYPES.map((t) => (
            <button
              key={t.key}
              className={`tab-btn ${activeTab === t.key ? "active" : ""}`}
              onClick={() => setActiveTab(t.key)}
              type="button"
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: "1rem" }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label className="form-label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              className="form-input"
              type="email"
              placeholder={`${activeTab}@example.com`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="form-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: "0.5rem" }}>
            {loading ? (
              <>
                <span className="spinner" /> Signing in…
              </>
            ) : (
              `Sign in as ${USER_TYPES.find((t) => t.key === activeTab)?.label}`
            )}
          </button>
        </form>

        {/* Footer */}
        <p
          style={{
            textAlign: "center",
            color: "#64748b",
            fontSize: "0.875rem",
            marginTop: "1.5rem",
          }}
        >
          Don&apos;t have an account?{" "}
          <Link href="/register" style={{ color: "#16a34a", fontWeight: 600, textDecoration: "none" }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
