"""Product DTOs – request / response schemas for the product API."""

from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Optional


# ── Request DTOs ────────────────────────────────────────────────────
class CreateProductRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = None
    price: float = Field(..., gt=0)
    unit: str = Field("kg", max_length=50)
    category: str = Field(..., min_length=2, max_length=100)
    quantity: int = Field(..., ge=0)
    image_url: Optional[str] = None


class UpdateProductRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=200)
    description: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    unit: Optional[str] = Field(None, max_length=50)
    category: Optional[str] = Field(None, min_length=2, max_length=100)
    quantity: Optional[int] = Field(None, ge=0)
    image_url: Optional[str] = None


# ── Response DTOs ───────────────────────────────────────────────────
class ProductResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    price: float
    unit: str
    category: str
    quantity: int
    image_url: Optional[str] = None
    farmer_email: str
    farmer_name: str
    created_at: str
    updated_at: str


class ProductListResponse(BaseModel):
    products: list[ProductResponse]
    total: int
