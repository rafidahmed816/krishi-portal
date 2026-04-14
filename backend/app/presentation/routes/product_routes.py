"""Product REST API routes."""

from __future__ import annotations

import traceback
from typing import Optional

from fastapi import APIRouter, Header, HTTPException, Query, status

from app.application.dto.product_dto import (
    CreateProductRequest,
    ProductListResponse,
    ProductResponse,
    UpdateProductRequest,
)
from app.application.use_cases import product_use_cases
from app.application.use_cases import auth_use_cases

router = APIRouter(prefix="/api/products", tags=["Products"])


def _get_farmer_info(authorization: str) -> tuple[str, str]:
    """Extract farmer email & name from JWT token."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header must start with 'Bearer '",
        )
    token = authorization.removeprefix("Bearer ").strip()
    profile = auth_use_cases.get_profile(token)
    return profile["email"], profile["name"]


# ── My products (farmer) — MUST be before /{product_id} ───────────
@router.get("/me/listings", response_model=ProductListResponse)
async def my_products(
    authorization: str = Header(..., description="Bearer <access_token>"),
):
    """List the authenticated farmer's products."""
    email, _ = _get_farmer_info(authorization)
    return product_use_cases.my_products(farmer_email=email)


# ── List all products (public) ─────────────────────────────────────
@router.get("", response_model=ProductListResponse)
async def list_products(
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search in title/description"),
):
    """List all marketplace products."""
    return product_use_cases.list_products(category=category, search=search)


# ── Create product (farmer only) ───────────────────────────────────
@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    body: CreateProductRequest,
    authorization: str = Header(..., description="Bearer <access_token>"),
):
    """Create a new product listing."""
    try:
        email, name = _get_farmer_info(authorization)
        result = product_use_cases.create_product(body, farmer_email=email, farmer_name=name)
        return result
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create product: {str(e)}",
        )


# ── Get single product (public) ────────────────────────────────────
@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str):
    """Get a single product by ID."""
    return product_use_cases.get_product(product_id)


# ── Update product (farmer only) ───────────────────────────────────
@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    body: UpdateProductRequest,
    authorization: str = Header(..., description="Bearer <access_token>"),
):
    """Update a product listing."""
    email, _ = _get_farmer_info(authorization)
    return product_use_cases.update_product(product_id, body, farmer_email=email)


# ── Delete product (farmer only) ───────────────────────────────────
@router.delete("/{product_id}")
async def delete_product(
    product_id: str,
    authorization: str = Header(..., description="Bearer <access_token>"),
):
    """Delete a product listing."""
    email, _ = _get_farmer_info(authorization)
    return product_use_cases.delete_product(product_id, farmer_email=email)
