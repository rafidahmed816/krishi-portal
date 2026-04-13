"""Pydantic DTOs for authentication requests and responses."""

from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field

from app.domain.entities.user import UserType


# ── Requests ────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    """Body for POST /api/auth/register."""

    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=2)
    phone_number: str = Field(..., min_length=10, description="+880XXXXXXXXXX")
    user_type: UserType
    farm_name: str | None = None      # only for farmer
    business_name: str | None = None   # only for buyer


class LoginRequest(BaseModel):
    """Body for POST /api/auth/login."""

    email: EmailStr
    password: str


class ConfirmRequest(BaseModel):
    """Body for POST /api/auth/confirm."""

    email: EmailStr
    confirmation_code: str = Field(..., min_length=6, max_length=6)


# ── Responses ───────────────────────────────────────────────────────
class AuthResponse(BaseModel):
    """Generic success envelope."""

    message: str
    data: dict | None = None


class TokenResponse(BaseModel):
    """Returned after successful sign-in."""

    access_token: str
    id_token: str
    refresh_token: str
    expires_in: int
    token_type: str


class UserProfileResponse(BaseModel):
    """Returned by GET /api/auth/me."""

    email: str
    name: str
    user_type: str
    email_verified: str
    sub: str
