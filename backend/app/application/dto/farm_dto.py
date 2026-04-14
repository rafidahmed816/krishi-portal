"""Farm DTOs — request/response models for farm management."""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel


class CreateFarmRequest(BaseModel):
    name: str
    location: str
    size_acres: float
    soil_type: str = ""
    description: str = ""
    image_url: str = ""


class UpdateFarmRequest(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    size_acres: Optional[float] = None
    soil_type: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None


class FarmResponse(BaseModel):
    id: str
    name: str
    location: str
    size_acres: float
    soil_type: str
    description: str
    image_url: str
    farmer_email: str
    farmer_name: str
    crop_count: int
    created_at: str
    updated_at: str


class FarmListResponse(BaseModel):
    farms: list[FarmResponse]
    total: int
