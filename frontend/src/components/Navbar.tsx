"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";

export default function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="navbar">
      <Link href="/" className="navbar-logo">
        🌿 AgroLink
      </Link>
      <div className="navbar-links">
        <Link href="/marketplace">Marketplace</Link>
        {isAuthenticated && user ? (
          <>
            {user.user_type === "farmer" && (
              <>
                <Link href="/farms">Farms</Link>
                <Link href="/marketplace/add">Sell</Link>
              </>
            )}
            <Link href="/orders">Orders</Link>
            <Link href="/dashboard">Dashboard</Link>
          </>
        ) : (
          <>
            <Link href="/login">Sign In</Link>
            <Link href="/register" className="nav-cta">
              Get Started
            </Link>
          </>
        )}
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
      </div>
    </nav>
  );
}
