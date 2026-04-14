"""Authentication REST API routes."""

from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException, status

from app.application.dto.auth_dto import (
    AuthResponse,
    ConfirmRequest,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserProfileResponse,
)
from app.application.use_cases import auth_use_cases

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


# ── Register ────────────────────────────────────────────────────────
@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest):
    """Register a new farmer, buyer, or admin account."""
    result = auth_use_cases.register(body)
    return AuthResponse(message=result["message"], data={"user_sub": result["user_sub"]})


# ── Confirm email ───────────────────────────────────────────────────
@router.post("/confirm", response_model=AuthResponse)
async def confirm_email(body: ConfirmRequest):
    """Confirm email address with the 6-digit verification code."""
    result = auth_use_cases.confirm(body)
    return AuthResponse(message=result["message"])


# ── Resend verification code ───────────────────────────────────────
@router.post("/resend-code", response_model=AuthResponse)
async def resend_code(body: ConfirmRequest):
    """Resend the email verification code (only needs email, code is ignored)."""
    result = auth_use_cases.resend_verification(body.email)
    return AuthResponse(message=result["message"])


# ── Login ───────────────────────────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    """Authenticate and receive JWT tokens."""
    return auth_use_cases.login(body)


# ── Current user ────────────────────────────────────────────────────
@router.get("/me", response_model=UserProfileResponse)
async def get_me(authorization: str = Header(..., description="Bearer <access_token>")):
    """Return the authenticated user's profile."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header must start with 'Bearer '",
        )
    token = authorization.removeprefix("Bearer ").strip()
    return auth_use_cases.get_profile(token)
