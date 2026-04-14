"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function Navbar() {
  const { user, isAuthenticated } = useAuth();

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
              <Link href="/marketplace/add">Sell</Link>
            )}
            <Link href="/dashboard" className="nav-cta">
              Dashboard
            </Link>
          </>
        ) : (
          <>
            <Link href="/login">Sign In</Link>
            <Link href="/register" className="nav-cta">
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
