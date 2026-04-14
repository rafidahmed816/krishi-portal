"""Farm REST API routes."""

from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException, status

from app.application.dto.farm_dto import (
    CreateFarmRequest,
    UpdateFarmRequest,
    FarmResponse,
    FarmListResponse,
)
from app.application.use_cases import farm_use_cases, auth_use_cases

router = APIRouter(prefix="/api/farms", tags=["Farms"])


def _get_user_info(authorization: str) -> tuple[str, str, str]:
    """Extract email, name, user_type from JWT."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid auth header")
    token = authorization.removeprefix("Bearer ").strip()
    profile = auth_use_cases.get_profile(token)
    return profile["email"], profile["name"], profile.get("user_type", "buyer")


@router.post("", response_model=FarmResponse, status_code=status.HTTP_201_CREATED)
async def create_farm(
    body: CreateFarmRequest,
    authorization: str = Header(..., description="Bearer <access_token>"),
):
    """Create a new farm (farmer only)."""
    email, name, user_type = _get_user_info(authorization)
    if user_type != "farmer":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only farmers can create farms")
    return farm_use_cases.create_farm(body, farmer_email=email, farmer_name=name)


@router.get("", response_model=FarmListResponse)
async def list_farms():
    """List all farms (public)."""
    return farm_use_cases.list_all_farms()


@router.get("/my", response_model=FarmListResponse)
async def my_farms(
    authorization: str = Header(..., description="Bearer <access_token>"),
):
    """List the authenticated farmer's farms."""
    email, _, _ = _get_user_info(authorization)
    return farm_use_cases.list_my_farms(email)


@router.get("/{farm_id}", response_model=FarmResponse)
async def get_farm(farm_id: str):
    """Get a single farm by ID (public)."""
    return farm_use_cases.get_farm(farm_id)


@router.put("/{farm_id}", response_model=FarmResponse)
async def update_farm(
    farm_id: str,
    body: UpdateFarmRequest,
    authorization: str = Header(..., description="Bearer <access_token>"),
):
    """Update a farm (owner only)."""
    email, _, _ = _get_user_info(authorization)
    return farm_use_cases.update_farm(farm_id, body, email)


@router.delete("/{farm_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_farm(
    farm_id: str,
    authorization: str = Header(..., description="Bearer <access_token>"),
):
    """Delete a farm (owner only)."""
    email, _, _ = _get_user_info(authorization)
    farm_use_cases.delete_farm(farm_id, email)
