"""Order use cases — business logic for the order system."""

from __future__ import annotations

from fastapi import HTTPException, status

from app.application.dto.order_dto import PlaceOrderRequest
from app.infrastructure.database import product_repo, order_repo


def place_order(request: PlaceOrderRequest, buyer_email: str, buyer_name: str) -> dict:
    """Place a new order for a product."""
    # Get the product
    product = product_repo.get_product(request.product_id)
    if not product:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found")

    if product.get("quantity", 0) < request.quantity:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Not enough stock available")

    if product.get("farmer_email") == buyer_email:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "You cannot order your own product")

    # Create order
    order_data = {
        "product_id": request.product_id,
        "product_title": product.get("title", ""),
        "product_image_url": product.get("image_url"),
        "quantity": request.quantity,
        "unit_price": float(product.get("price", 0)),
        "total_price": float(product.get("price", 0)) * request.quantity,
        "unit": product.get("unit", "kg"),
        "buyer_email": buyer_email,
        "buyer_name": buyer_name,
        "farmer_email": product.get("farmer_email", ""),
        "farmer_name": product.get("farmer_name", ""),
    }
    order = order_repo.create_order(order_data)

    # Reduce product stock
    new_qty = int(product.get("quantity", 0)) - request.quantity
    product_repo.update_product(request.product_id, {"quantity": new_qty})

    return order


def get_buyer_orders(buyer_email: str) -> dict:
    """Get all orders placed by a buyer."""
    orders = order_repo.list_orders_by_buyer(buyer_email)
    return {"orders": orders, "total": len(orders)}


def get_farmer_orders(farmer_email: str) -> dict:
    """Get all orders for a farmer's products."""
    orders = order_repo.list_orders_by_farmer(farmer_email)
    return {"orders": orders, "total": len(orders)}


def update_order_status(order_id: str, new_status: str, user_email: str) -> dict:
    """Update order status (farmer confirms/ships, buyer confirms delivery)."""
    valid_statuses = {"confirmed", "shipped", "delivered", "cancelled"}
    if new_status not in valid_statuses:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Invalid status. Must be: {', '.join(valid_statuses)}")

    order = order_repo.get_order(order_id)
    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")

    # Authorization check
    if user_email != order.get("farmer_email") and user_email != order.get("buyer_email"):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not authorized")

    updated = order_repo.update_order_status(order_id, new_status)
    if not updated:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Failed to update order")

    return updated
