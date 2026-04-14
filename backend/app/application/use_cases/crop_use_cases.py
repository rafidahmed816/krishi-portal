"""Crop use cases — business logic for crop lifecycle management."""

from __future__ import annotations

from fastapi import HTTPException, status

from app.application.dto.crop_dto import CreateCropRequest, UpdateCropRequest
from app.infrastructure.database import crop_repo, farm_repo

VALID_HEALTH = {"Healthy", "Stressed", "Diseased", "Harvested"}
VALID_STAGES = {"Seedling", "Vegetative", "Flowering", "Fruiting", "Mature", "Harvested"}


def create_crop(farm_id: str, request: CreateCropRequest, farmer_email: str) -> dict:
    """Add a crop to a farm (owner only)."""
    farm = farm_repo.get_farm(farm_id)
    if not farm:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Farm not found")
    if farm["farmer_email"] != farmer_email:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your farm")

    crop_data = {
        "farm_id": farm_id,
        "name": request.name,
        "variety": request.variety,
        "planting_date": request.planting_date,
        "expected_harvest_date": request.expected_harvest_date,
        "area_acres": request.area_acres,
        "season": request.season,
        "notes": request.notes,
    }
    crop = crop_repo.create_crop(crop_data)

    # Update farm's crop count
    current_crops = crop_repo.list_crops_by_farm(farm_id)
    farm_repo.update_farm(farm_id, {"crop_count": len(current_crops)})

    return crop


def list_crops(farm_id: str) -> dict:
    """List all crops for a farm."""
    crops = crop_repo.list_crops_by_farm(farm_id)
    return {"crops": crops, "total": len(crops)}


def get_crop(crop_id: str) -> dict:
    crop = crop_repo.get_crop(crop_id)
    if not crop:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Crop not found")
    return crop


def update_crop(crop_id: str, request: UpdateCropRequest, farmer_email: str) -> dict:
    """Update crop details / transition lifecycle stage."""
    crop = crop_repo.get_crop(crop_id)
    if not crop:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Crop not found")

    # Verify ownership via farm
    farm = farm_repo.get_farm(crop["farm_id"])
    if not farm or farm["farmer_email"] != farmer_email:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your crop")

    updates = request.model_dump(exclude_none=True)

    # Validate health status
    if "health_status" in updates and updates["health_status"] not in VALID_HEALTH:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Invalid health status. Must be one of: {VALID_HEALTH}")

    # Validate growth stage
    if "growth_stage" in updates and updates["growth_stage"] not in VALID_STAGES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Invalid growth stage. Must be one of: {VALID_STAGES}")

    updated = crop_repo.update_crop(crop_id, updates)
    if not updated:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Failed to update crop")
    return updated


def delete_crop(crop_id: str, farmer_email: str) -> bool:
    crop = crop_repo.get_crop(crop_id)
    if not crop:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Crop not found")
    farm = farm_repo.get_farm(crop["farm_id"])
    if not farm or farm["farmer_email"] != farmer_email:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your crop")

    result = crop_repo.delete_crop(crop_id)

    # Update farm crop count
    remaining = crop_repo.list_crops_by_farm(crop["farm_id"])
    farm_repo.update_farm(crop["farm_id"], {"crop_count": len(remaining)})

    return result
