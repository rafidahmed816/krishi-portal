"""Product use-cases — business logic for marketplace operations."""

from __future__ import annotations

from fastapi import HTTPException, status

from app.application.dto.product_dto import (
    CreateProductRequest,
    UpdateProductRequest,
    ProductResponse,
    ProductListResponse,
)
from app.infrastructure.database import product_repo


# ── Create product ──────────────────────────────────────────────────
def create_product(body: CreateProductRequest, farmer_email: str, farmer_name: str) -> ProductResponse:
    """Create a new product listing (farmer only)."""
    product = product_repo.create_product(
        title=body.title,
        description=body.description,
        price=body.price,
        unit=body.unit,
        category=body.category,
        quantity=body.quantity,
        farmer_email=farmer_email,
        farmer_name=farmer_name,
        image_url=body.image_url,
    )
    return ProductResponse(**product)


# ── List products ───────────────────────────────────────────────────
def list_products(category: str | None = None, search: str | None = None) -> ProductListResponse:
    """List all products, optionally filtered by category or search query."""
    items = product_repo.list_products(category=category, search=search)
    products = [ProductResponse(**item) for item in items]
    return ProductListResponse(products=products, total=len(products))


# ── Get single product ─────────────────────────────────────────────
def get_product(product_id: str) -> ProductResponse:
    """Get a single product by ID."""
    product = product_repo.get_product(product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return ProductResponse(**product)


# ── Update product ──────────────────────────────────────────────────
def update_product(product_id: str, body: UpdateProductRequest, farmer_email: str) -> ProductResponse:
    """Update a product (only the owning farmer can update)."""
    existing = product_repo.get_product(product_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    if existing["farmer_email"] != farmer_email:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only edit your own products")

    updates = body.model_dump(exclude_unset=True)
    updated = product_repo.update_product(product_id, updates)
    if not updated:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update product")
    return ProductResponse(**updated)


# ── Delete product ──────────────────────────────────────────────────
def delete_product(product_id: str, farmer_email: str) -> dict:
    """Delete a product (only the owning farmer can delete)."""
    existing = product_repo.get_product(product_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    if existing["farmer_email"] != farmer_email:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own products")

    product_repo.delete_product(product_id)
    return {"message": "Product deleted successfully"}


# ── My products (farmer) ───────────────────────────────────────────
def my_products(farmer_email: str) -> ProductListResponse:
    """List all products belonging to a specific farmer."""
    items = product_repo.list_products_by_farmer(farmer_email)
    products = [ProductResponse(**item) for item in items]
    return ProductListResponse(products=products, total=len(products))
