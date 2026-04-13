"use client";

/**
 * AuthContext — manages authentication state across the app.
 * Tokens are stored in localStorage; on mount we try to restore session.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  authApi,
  type RegisterPayload,
  type LoginPayload,
  type ConfirmPayload,
  type UserProfile,
  type TokenResponse,
} from "@/lib/api";

// ── Types ───────────────────────────────────────────────────────────
interface AuthState {
  user: UserProfile | null;
  tokens: TokenResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  signUp: (payload: RegisterPayload) => Promise<string>;
  confirmSignUp: (payload: ConfirmPayload) => Promise<void>;
  signIn: (payload: LoginPayload) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ── Provider ────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    tokens: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Restore session on mount
  useEffect(() => {
    const stored = localStorage.getItem("agrolink_tokens");
    if (stored) {
      try {
        const tokens: TokenResponse = JSON.parse(stored);
        authApi
          .getMe(tokens.access_token)
          .then((res) =>
            setState({
              user: res.data,
              tokens,
              isLoading: false,
              isAuthenticated: true,
            })
          )
          .catch(() => {
            localStorage.removeItem("agrolink_tokens");
            setState((s) => ({ ...s, isLoading: false }));
          });
      } catch {
        localStorage.removeItem("agrolink_tokens");
        setState((s) => ({ ...s, isLoading: false }));
      }
    } else {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  const signUp = useCallback(async (payload: RegisterPayload) => {
    const res = await authApi.register(payload);
    return res.data.message;
  }, []);

  const confirmSignUp = useCallback(async (payload: ConfirmPayload) => {
    await authApi.confirm(payload);
  }, []);

  const signIn = useCallback(async (payload: LoginPayload) => {
    const res = await authApi.login(payload);
    const tokens = res.data;
    localStorage.setItem("agrolink_tokens", JSON.stringify(tokens));

    const profileRes = await authApi.getMe(tokens.access_token);
    setState({
      user: profileRes.data,
      tokens,
      isLoading: false,
      isAuthenticated: true,
    });
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem("agrolink_tokens");
    setState({ user: null, tokens: null, isLoading: false, isAuthenticated: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, signUp, confirmSignUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
