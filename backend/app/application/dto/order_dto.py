"""Order DTOs — request/response models for the order system."""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel


class PlaceOrderRequest(BaseModel):
    product_id: str
    quantity: int


class UpdateOrderStatusRequest(BaseModel):
    status: str  # confirmed, shipped, delivered, cancelled


class OrderResponse(BaseModel):
    id: str
    product_id: str
    product_title: str
    product_image_url: Optional[str] = None
    quantity: int
    unit_price: float
    total_price: float
    unit: str
    buyer_email: str
    buyer_name: str
    farmer_email: str
    farmer_name: str
    status: str
    created_at: str
    updated_at: str


class OrderListResponse(BaseModel):
    orders: list[OrderResponse]
    total: int
