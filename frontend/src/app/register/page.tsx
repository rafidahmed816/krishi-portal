"use client";

import React, { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const USER_TYPES = [
  { key: "farmer" as const, label: "Farmer", icon: "🌾", extra: "farm_name" },
  { key: "buyer" as const, label: "Buyer", icon: "🛒", extra: "business_name" },
  { key: "admin" as const, label: "Admin", icon: "⚙️", extra: null },
];

export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [activeTab, setActiveTab] = useState<"farmer" | "buyer" | "admin">("farmer");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [extraField, setExtraField] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const currentType = USER_TYPES.find((t) => t.key === activeTab)!;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPw) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await signUp({
        email,
        password,
        full_name: fullName,
        phone_number: phoneNumber.startsWith("+") ? phoneNumber : `+88${phoneNumber}`,
        user_type: activeTab,
        ...(activeTab === "farmer" && extraField ? { farm_name: extraField } : {}),
        ...(activeTab === "buyer" && extraField ? { business_name: extraField } : {}),
      });
      router.push(`/verify?email=${encodeURIComponent(email)}`);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      const msg = axiosErr?.response?.data?.detail
        || (err instanceof Error ? err.message : "Registration failed.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <div
        className="glass-card"
        style={{ width: "100%", maxWidth: 480, padding: "2.5rem", position: "relative", zIndex: 1 }}
      >
        {/* Header with decorative line */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ marginBottom: "1rem" }}>
            <span style={{ fontSize: "2.5rem" }}>🌿</span>
          </div>
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
            Create Account
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
            Join AgroLink as a {currentType.label.toLowerCase()}
          </p>
        </div>

        {/* User-type tabs */}
        <div className="tab-bar" style={{ marginBottom: "1.5rem" }}>
          {USER_TYPES.map((t) => (
            <button
              key={t.key}
              className={`tab-btn ${activeTab === t.key ? "active" : ""}`}
              onClick={() => { setActiveTab(t.key); setExtraField(""); }}
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
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label className="form-label" htmlFor="reg-name">Full Name</label>
              <input
                id="reg-name"
                className="form-input"
                type="text"
                placeholder="Your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                minLength={2}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="reg-phone">Phone Number</label>
              <input
                id="reg-phone"
                className="form-input"
                type="tel"
                placeholder="+8801XXXXXXXXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                minLength={10}
              />
            </div>
          </div>

          <div>
            <label className="form-label" htmlFor="reg-email">Email Address</label>
            <input
              id="reg-email"
              className="form-input"
              type="email"
              placeholder={`${activeTab}@example.com`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Extra field based on user type */}
          {currentType.extra && (
            <div>
              <label className="form-label" htmlFor="reg-extra">
                {activeTab === "farmer" ? "🏡 Farm Name" : "🏢 Business Name"}
              </label>
              <input
                id="reg-extra"
                className="form-input"
                type="text"
                placeholder={activeTab === "farmer" ? "Green Valley Farm" : "AgroBuy Trading Co."}
                value={extraField}
                onChange={(e) => setExtraField(e.target.value)}
              />
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label className="form-label" htmlFor="reg-password">Password</label>
              <input
                id="reg-password"
                className="form-input"
                type="password"
                placeholder="Min 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="reg-confirm">Confirm Password</label>
              <input
                id="reg-confirm"
                className="form-input"
                type="password"
                placeholder="••••••••"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                required
                minLength={8}
              />
            </div>
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: "0.5rem" }}>
            {loading ? (
              <>
                <span className="spinner" /> Creating account…
              </>
            ) : (
              `Create ${currentType.label} Account`
            )}
          </button>
        </form>

        {/* Footer */}
        <p
          style={{
            textAlign: "center",
            color: "#64748b",
            fontSize: "0.85rem",
            marginTop: "1.5rem",
          }}
        >
          Already have an account?{" "}
          <Link href="/login" style={{ color: "#16a34a", fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
