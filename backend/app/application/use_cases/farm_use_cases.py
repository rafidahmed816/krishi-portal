"""Farm use cases — business logic for farm management."""

from __future__ import annotations

from fastapi import HTTPException, status

from app.application.dto.farm_dto import CreateFarmRequest, UpdateFarmRequest
from app.infrastructure.database import farm_repo


def create_farm(request: CreateFarmRequest, farmer_email: str, farmer_name: str) -> dict:
    """Create a new farm for a farmer."""
    farm_data = {
        "name": request.name,
        "location": request.location,
        "size_acres": request.size_acres,
        "soil_type": request.soil_type,
        "description": request.description,
        "image_url": request.image_url,
        "farmer_email": farmer_email,
        "farmer_name": farmer_name,
    }
    return farm_repo.create_farm(farm_data)


def get_farm(farm_id: str) -> dict:
    """Get a farm by ID."""
    farm = farm_repo.get_farm(farm_id)
    if not farm:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Farm not found")
    return farm


def list_my_farms(farmer_email: str) -> dict:
    """List all farms for a farmer."""
    farms = farm_repo.list_farms_by_farmer(farmer_email)
    return {"farms": farms, "total": len(farms)}


def list_all_farms() -> dict:
    """List all farms (public)."""
    farms = farm_repo.list_all_farms()
    return {"farms": farms, "total": len(farms)}


def update_farm(farm_id: str, request: UpdateFarmRequest, farmer_email: str) -> dict:
    """Update a farm (only owner allowed)."""
    farm = farm_repo.get_farm(farm_id)
    if not farm:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Farm not found")
    if farm["farmer_email"] != farmer_email:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your farm")

    updates = request.model_dump(exclude_none=True)
    updated = farm_repo.update_farm(farm_id, updates)
    if not updated:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Failed to update farm")
    return updated


def delete_farm(farm_id: str, farmer_email: str) -> bool:
    """Delete a farm (only owner allowed)."""
    farm = farm_repo.get_farm(farm_id)
    if not farm:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Farm not found")
    if farm["farmer_email"] != farmer_email:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your farm")
    return farm_repo.delete_farm(farm_id)
