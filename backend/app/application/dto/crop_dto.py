"""Crop DTOs — request/response models for crop lifecycle management."""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel


class CreateCropRequest(BaseModel):
    name: str
    variety: str = ""
    planting_date: str  # ISO date
    expected_harvest_date: str = ""
    area_acres: float
    season: str = ""  # Kharif, Rabi, Zaid
    notes: str = ""


class UpdateCropRequest(BaseModel):
    name: Optional[str] = None
    variety: Optional[str] = None
    planting_date: Optional[str] = None
    expected_harvest_date: Optional[str] = None
    area_acres: Optional[float] = None
    season: Optional[str] = None
    health_status: Optional[str] = None  # Healthy, Stressed, Diseased, Harvested
    growth_stage: Optional[str] = None   # Seedling, Vegetative, Flowering, Fruiting, Mature, Harvested
    notes: Optional[str] = None


class CropResponse(BaseModel):
    id: str
    farm_id: str
    name: str
    variety: str
    planting_date: str
    expected_harvest_date: str
    area_acres: float
    season: str
    health_status: str
    growth_stage: str
    notes: str
    created_at: str
    updated_at: str


class CropListResponse(BaseModel):
    crops: list[CropResponse]
    total: int
