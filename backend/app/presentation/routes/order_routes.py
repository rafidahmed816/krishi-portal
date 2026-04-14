"""Order REST API routes."""

from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException, status

from app.application.dto.order_dto import (
    PlaceOrderRequest,
    UpdateOrderStatusRequest,
    OrderListResponse,
    OrderResponse,
)
from app.application.use_cases import order_use_cases, auth_use_cases

router = APIRouter(prefix="/api/orders", tags=["Orders"])


def _get_user_info(authorization: str) -> tuple[str, str, str]:
    """Extract email, name, user_type from JWT."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid auth header")
    token = authorization.removeprefix("Bearer ").strip()
    profile = auth_use_cases.get_profile(token)
    return profile["email"], profile["name"], profile.get("user_type", "buyer")


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def place_order(
    body: PlaceOrderRequest,
    authorization: str = Header(..., description="Bearer <access_token>"),
):
    """Place a new order (buyer only)."""
    email, name, user_type = _get_user_info(authorization)
    if user_type != "buyer":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only buyers can place orders")
    return order_use_cases.place_order(body, buyer_email=email, buyer_name=name)


@router.get("/my", response_model=OrderListResponse)
async def my_orders(
    authorization: str = Header(..., description="Bearer <access_token>"),
):
    """Get the authenticated user's orders (buyer or farmer)."""
    email, _, user_type = _get_user_info(authorization)
    if user_type == "farmer":
        return order_use_cases.get_farmer_orders(email)
    return order_use_cases.get_buyer_orders(email)


@router.put("/{order_id}/status", response_model=OrderResponse)
async def update_status(
    order_id: str,
    body: UpdateOrderStatusRequest,
    authorization: str = Header(..., description="Bearer <access_token>"),
):
    """Update order status."""
    email, _, _ = _get_user_info(authorization)
    return order_use_cases.update_order_status(order_id, body.status, email)
