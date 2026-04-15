"""Inventory REST API routes."""

from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException, status

from app.application.dto.inventory_dto import (
    CreateInventoryRequest,
    UpdateInventoryRequest,
    AdjustInventoryRequest,
    LinkProductRequest,
    InventoryResponse,
    InventoryListResponse,
    InventoryLogListResponse,
)
from app.application.use_cases import inventory_use_cases, auth_use_cases

router = APIRouter(prefix="/api/farms", tags=["Inventory"])


def _get_email(authorization: str) -> str:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid auth header")
    token = authorization.removeprefix("Bearer ").strip()
    profile = auth_use_cases.get_profile(token)
    return profile["email"]


@router.post("/{farm_id}/inventory", response_model=InventoryResponse, status_code=status.HTTP_201_CREATED)
async def add_inventory(
    farm_id: str,
    body: CreateInventoryRequest,
    authorization: str = Header(...),
):
    """Add an inventory item to a farm."""
    email = _get_email(authorization)
    return inventory_use_cases.add_inventory(farm_id, body, email)


@router.get("/{farm_id}/inventory", response_model=InventoryListResponse)
async def list_inventory(farm_id: str):
    """List all inventory for a farm with statistics."""
    return inventory_use_cases.list_inventory(farm_id)


@router.put("/{farm_id}/inventory/{item_id}", response_model=InventoryResponse)
async def update_inventory(
    farm_id: str,
    item_id: str,
    body: UpdateInventoryRequest,
    authorization: str = Header(...),
):
    """Update inventory item metadata."""
    email = _get_email(authorization)
    return inventory_use_cases.update_inventory(item_id, body, email)


@router.put("/{farm_id}/inventory/{item_id}/adjust", response_model=InventoryResponse)
async def adjust_inventory(
    farm_id: str,
    item_id: str,
    body: AdjustInventoryRequest,
    authorization: str = Header(...),
):
    """Adjust inventory quantity (add or deduct)."""
    email = _get_email(authorization)
    return inventory_use_cases.adjust_inventory(item_id, body, email)


@router.post("/{farm_id}/inventory/{item_id}/use-for-crop", response_model=InventoryResponse)
async def use_for_crop(
    farm_id: str,
    item_id: str,
    body: AdjustInventoryRequest,
    authorization: str = Header(...),
):
    """Deduct inventory for crop usage (e.g., fertilizer applied to a crop)."""
    email = _get_email(authorization)
    return inventory_use_cases.use_for_crop(item_id, abs(body.adjustment), body.reason or "Crop usage", email)


@router.put("/{farm_id}/inventory/{item_id}/link-product", response_model=InventoryResponse)
async def link_product(
    farm_id: str,
    item_id: str,
    body: LinkProductRequest,
    authorization: str = Header(...),
):
    """Link an inventory item to a marketplace product for stock sync."""
    email = _get_email(authorization)
    return inventory_use_cases.link_product(item_id, body.product_id, email)


@router.get("/{farm_id}/inventory/logs", response_model=InventoryLogListResponse)
async def get_activity_logs(farm_id: str):
    """Get inventory activity logs for a farm."""
    return inventory_use_cases.get_activity_logs(farm_id)


@router.get("/{farm_id}/inventory/{item_id}/logs", response_model=InventoryLogListResponse)
async def get_item_logs(farm_id: str, item_id: str):
    """Get activity logs for a specific inventory item."""
    return inventory_use_cases.get_item_logs(item_id)


@router.delete("/{farm_id}/inventory/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_inventory(
    farm_id: str,
    item_id: str,
    authorization: str = Header(...),
):
    """Delete an inventory item."""
    email = _get_email(authorization)
    inventory_use_cases.delete_inventory(item_id, email)
