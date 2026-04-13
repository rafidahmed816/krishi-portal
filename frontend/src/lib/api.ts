/**
 * API client for communicating with the AgroLink FastAPI backend.
 */

import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// ── Auth API ────────────────────────────────────────────────────────

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  phone_number: string;
  user_type: "farmer" | "buyer" | "admin";
  farm_name?: string;
  business_name?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ConfirmPayload {
  email: string;
  confirmation_code: string;
}

export interface TokenResponse {
  access_token: string;
  id_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface UserProfile {
  email: string;
  name: string;
  user_type: string;
  email_verified: string;
  sub: string;
}

export const authApi = {
  register: (data: RegisterPayload) =>
    api.post<{ message: string; data: { user_sub: string } }>("/api/auth/register", data),

  confirm: (data: ConfirmPayload) =>
    api.post<{ message: string }>("/api/auth/confirm", data),

  login: (data: LoginPayload) =>
    api.post<TokenResponse>("/api/auth/login", data),

  getMe: (accessToken: string) =>
    api.get<UserProfile>("/api/auth/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
};

export default api;
