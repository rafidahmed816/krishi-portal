"""Authentication use-cases — orchestrate Cognito operations."""

from __future__ import annotations

from app.application.dto.auth_dto import (
    ConfirmRequest,
    LoginRequest,
    RegisterRequest,
)
from app.domain.entities.user import UserType
from app.infrastructure.auth import cognito_service


# ── Register ────────────────────────────────────────────────────────
def register(request: RegisterRequest) -> dict:
    """Register a new farmer, buyer, or admin."""
    extra: dict[str, str] = {}
    if request.user_type == UserType.FARMER and request.farm_name:
        extra["farm_name"] = request.farm_name
    elif request.user_type == UserType.BUYER and request.business_name:
        extra["business_name"] = request.business_name

    result = cognito_service.sign_up(
        email=request.email,
        password=request.password,
        full_name=request.full_name,
        phone_number=request.phone_number,
        user_type=request.user_type.value,
        extra_attributes=extra if extra else None,
    )
    return {
        "message": f"Registration successful. Please check {request.email} for a verification code.",
        "user_sub": result["user_sub"],
    }


# ── Confirm ─────────────────────────────────────────────────────────
def confirm(request: ConfirmRequest) -> dict:
    """Confirm email with OTP code."""
    cognito_service.confirm_sign_up(
        email=request.email,
        confirmation_code=request.confirmation_code,
    )
    return {"message": "Email verified successfully. You can now log in."}


# ── Resend verification code ────────────────────────────────────────
def resend_verification(email: str) -> dict:
    """Resend the email verification code."""
    return cognito_service.resend_confirmation_code(email)


# ── Login ───────────────────────────────────────────────────────────
def login(request: LoginRequest) -> dict:
    """Authenticate and return tokens."""
    tokens = cognito_service.sign_in(
        email=request.email,
        password=request.password,
    )
    return tokens


# ── Get profile ─────────────────────────────────────────────────────
def get_profile(access_token: str) -> dict:
    """Fetch the current user's profile from Cognito."""
    return cognito_service.get_user(access_token)
