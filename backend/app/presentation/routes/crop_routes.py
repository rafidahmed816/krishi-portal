"""Crop REST API routes."""

from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException, status

from app.application.dto.crop_dto import (
    CreateCropRequest,
    UpdateCropRequest,
    CropResponse,
    CropListResponse,
)
from app.application.use_cases import crop_use_cases, auth_use_cases

router = APIRouter(prefix="/api/farms", tags=["Crops"])


def _get_email(authorization: str) -> str:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid auth header")
    token = authorization.removeprefix("Bearer ").strip()
    profile = auth_use_cases.get_profile(token)
    return profile["email"]


@router.post("/{farm_id}/crops", response_model=CropResponse, status_code=status.HTTP_201_CREATED)
async def add_crop(
    farm_id: str,
    body: CreateCropRequest,
    authorization: str = Header(...),
):
    """Add a crop to a farm."""
    email = _get_email(authorization)
    return crop_use_cases.create_crop(farm_id, body, email)


@router.get("/{farm_id}/crops", response_model=CropListResponse)
async def list_crops(farm_id: str):
    """List all crops for a farm."""
    return crop_use_cases.list_crops(farm_id)


@router.get("/{farm_id}/crops/{crop_id}", response_model=CropResponse)
async def get_crop(farm_id: str, crop_id: str):
    """Get a single crop."""
    return crop_use_cases.get_crop(crop_id)


@router.put("/{farm_id}/crops/{crop_id}", response_model=CropResponse)
async def update_crop(
    farm_id: str,
    crop_id: str,
    body: UpdateCropRequest,
    authorization: str = Header(...),
):
    """Update crop details or lifecycle stage."""
    email = _get_email(authorization)
    return crop_use_cases.update_crop(crop_id, body, email)


@router.delete("/{farm_id}/crops/{crop_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_crop(
    farm_id: str,
    crop_id: str,
    authorization: str = Header(...),
):
    """Delete a crop."""
    email = _get_email(authorization)
    crop_use_cases.delete_crop(crop_id, email)
