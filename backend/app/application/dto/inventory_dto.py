"""Inventory DTOs — request/response models for farm inventory tracking."""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel


class CreateInventoryRequest(BaseModel):
    item_name: str
    category: str  # Seed, Fertilizer, Pesticide, Equipment, Other
    quantity: float
    unit: str = "kg"  # kg, litre, piece, bag, bottle
    purchase_price: float = 0
    purchase_date: str = ""
    expiry_date: str = ""
    supplier: str = ""
    reorder_level: float = 10
    linked_crop_id: str = ""
    notes: str = ""


class UpdateInventoryRequest(BaseModel):
    item_name: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    purchase_price: Optional[float] = None
    expiry_date: Optional[str] = None
    supplier: Optional[str] = None
    reorder_level: Optional[float] = None
    linked_crop_id: Optional[str] = None
    linked_product_id: Optional[str] = None
    notes: Optional[str] = None


class AdjustInventoryRequest(BaseModel):
    """Add or deduct inventory quantity."""
    adjustment: float  # positive = add, negative = deduct
    reason: str = ""


class LinkProductRequest(BaseModel):
    """Link an inventory item to a marketplace product."""
    product_id: str


class InventoryResponse(BaseModel):
    id: str
    farm_id: str
    item_name: str
    category: str
    quantity: float
    unit: str
    purchase_price: float
    purchase_date: str
    expiry_date: str
    supplier: str
    reorder_level: float
    linked_crop_id: str
    linked_product_id: str
    notes: str
    low_stock: bool
    created_at: str
    updated_at: str


class InventoryListResponse(BaseModel):
    items: list[InventoryResponse]
    total: int
    low_stock_count: int
    total_value: float
    expiring_soon_count: int


class InventoryLogEntry(BaseModel):
    id: str
    farm_id: str
    item_id: str
    item_name: str
    action: str
    quantity_change: float
    quantity_after: float
    reason: str
    performed_by: str
    created_at: str


class InventoryLogListResponse(BaseModel):
    logs: list[InventoryLogEntry]
    total: int
