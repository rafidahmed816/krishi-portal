"use client";

import React, { useState, useRef, FormEvent, KeyboardEvent, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";
import Navbar from "@/components/Navbar";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { confirmSignUp } = useAuth();

  const emailFromQuery = searchParams.get("email") || "";
  const [email, setEmail] = useState(emailFromQuery);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState("");

  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (emailFromQuery) setEmail(emailFromQuery);
  }, [emailFromQuery]);

  const handleChange = (idx: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[idx] = value.slice(-1);
    setOtp(next);
    if (value && idx < 5) inputs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const code = otp.join("");
    if (code.length < 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    setLoading(true);
    try {
      await confirmSignUp({ email, confirmation_code: code });
      setSuccess("Email verified! Redirecting to login…");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
            "Verification failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email.trim()) {
      setError("Please enter your email address first.");
      return;
    }
    setError("");
    setResendSuccess("");
    setResending(true);
    try {
      await api.post("/api/auth/resend-code", { email, confirmation_code: "000000" });
      setResendSuccess("✅ New verification code sent! Check your inbox.");
      setOtp(Array(6).fill(""));
      inputs.current[0]?.focus();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed to resend code.";
      setError(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="landing-page">
      <Navbar />
      <div className="auth-bg" style={{ paddingTop: "5rem" }}>
        <div
          className="glass-card"
          style={{ width: "100%", maxWidth: 460, padding: "2.5rem", position: "relative", zIndex: 1 }}
        >
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>✉️</div>
            <h1
              style={{
                fontSize: "1.75rem", fontWeight: 800,
                background: "linear-gradient(135deg, #16a34a, #0ea5e9)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                marginBottom: "0.5rem",
              }}
            >
              Verify Your Email
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
              Enter the 6-digit code sent to your email
            </p>
          </div>

          {error && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{error}</div>}
          {success && <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.2)", color: "var(--accent-green-light)", fontWeight: 600, fontSize: "0.87rem", marginBottom: "1rem", textAlign: "center" }}>{success}</div>}
          {resendSuccess && <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.2)", color: "var(--accent-blue)", fontWeight: 600, fontSize: "0.87rem", marginBottom: "1rem", textAlign: "center" }}>{resendSuccess}</div>}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Email — always editable so user can type it */}
            <div>
              <label className="form-label" htmlFor="verify-email">Email Address</label>
              <input
                id="verify-email"
                className="form-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* OTP inputs */}
            <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { inputs.current[idx] = el; }}
                  style={{
                    width: 48, height: 56, textAlign: "center", fontSize: "1.3rem", fontWeight: 700,
                    borderRadius: 12, border: "1px solid var(--border-color)",
                    background: "var(--bg-input)", color: "var(--text-primary)",
                    outline: "none", transition: "border-color 0.25s",
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--accent-green)"; }}
                  onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--border-color)"; }}
                  aria-label={`Digit ${idx + 1}`}
                />
              ))}
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? (<><span className="spinner" /> Verifying…</>) : "Verify Email"}
            </button>
          </form>

          {/* Resend Code */}
          <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
              Didn&apos;t receive the code?
            </p>
            <button
              onClick={handleResendCode}
              disabled={resending}
              style={{
                padding: "10px 24px", borderRadius: 12,
                background: "var(--bg-card)", border: "1px solid var(--border-color)",
                color: "var(--accent-blue)", fontWeight: 600, fontSize: "0.88rem",
                cursor: resending ? "not-allowed" : "pointer",
                transition: "all 0.25s ease", opacity: resending ? 0.6 : 1,
              }}
            >
              {resending ? "Sending..." : "📧 Resend Verification Code"}
            </button>
          </div>

          <p style={{ textAlign: "center", color: "var(--text-dim)", fontSize: "0.85rem", marginTop: "1.5rem" }}>
            <Link href="/login" style={{ color: "var(--accent-green-light)", fontWeight: 600 }}>← Back to Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="auth-bg"><div className="spinner" /></div>}>
      <VerifyContent />
    </Suspense>
  );
}
