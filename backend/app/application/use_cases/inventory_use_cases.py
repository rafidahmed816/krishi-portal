"""Inventory use cases — business logic for farm inventory management."""

from __future__ import annotations

from datetime import datetime, timezone, timedelta

from fastapi import HTTPException, status

from app.application.dto.inventory_dto import CreateInventoryRequest, UpdateInventoryRequest, AdjustInventoryRequest
from app.infrastructure.database import inventory_repo, inventory_log_repo, farm_repo


def add_inventory(farm_id: str, request: CreateInventoryRequest, farmer_email: str) -> dict:
    """Add an inventory item to a farm."""
    farm = farm_repo.get_farm(farm_id)
    if not farm:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Farm not found")
    if farm["farmer_email"] != farmer_email:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your farm")

    data = {
        "farm_id": farm_id,
        "item_name": request.item_name,
        "category": request.category,
        "quantity": request.quantity,
        "unit": request.unit,
        "purchase_price": request.purchase_price,
        "purchase_date": request.purchase_date,
        "expiry_date": request.expiry_date,
        "supplier": request.supplier,
        "reorder_level": request.reorder_level,
        "linked_crop_id": request.linked_crop_id,
        "notes": request.notes,
    }
    result = inventory_repo.create_inventory(data)

    # Log the addition
    inventory_log_repo.log_activity(
        farm_id=farm_id,
        item_id=result["id"],
        item_name=result["item_name"],
        action="added",
        quantity_change=result["quantity"],
        quantity_after=result["quantity"],
        reason=f"Initial stock added",
        performed_by=farmer_email,
    )

    return result


def list_inventory(farm_id: str) -> dict:
    """List all inventory for a farm with statistics."""
    items = inventory_repo.list_inventory_by_farm(farm_id)
    low = sum(1 for i in items if i.get("low_stock"))
    total_value = sum(i.get("purchase_price", 0) * i.get("quantity", 0) for i in items)

    # Count items expiring within 30 days
    today = datetime.now(timezone.utc).date()
    threshold = today + timedelta(days=30)
    expiring_soon = 0
    for i in items:
        exp = i.get("expiry_date", "")
        if exp:
            try:
                exp_date = datetime.fromisoformat(exp).date() if "T" in exp else datetime.strptime(exp, "%Y-%m-%d").date()
                if exp_date <= threshold:
                    expiring_soon += 1
            except (ValueError, TypeError):
                pass

    return {
        "items": items,
        "total": len(items),
        "low_stock_count": low,
        "total_value": round(total_value, 2),
        "expiring_soon_count": expiring_soon,
    }


def update_inventory(item_id: str, request: UpdateInventoryRequest, farmer_email: str) -> dict:
    """Update inventory item metadata."""
    updates = request.model_dump(exclude_none=True)
    result = inventory_repo.update_inventory(item_id, updates)
    if not result:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Inventory item not found")

    # Log the edit
    inventory_log_repo.log_activity(
        farm_id=result["farm_id"],
        item_id=item_id,
        item_name=result["item_name"],
        action="edited",
        quantity_change=0,
        quantity_after=result["quantity"],
        reason="Item metadata updated",
        performed_by=farmer_email,
    )

    return result


def adjust_inventory(item_id: str, request: AdjustInventoryRequest, farmer_email: str) -> dict:
    """Add or deduct inventory quantity."""
    result = inventory_repo.adjust_inventory(item_id, request.adjustment)
    if not result:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Inventory item not found")

    action = "added" if request.adjustment > 0 else "removed"
    inventory_log_repo.log_activity(
        farm_id=result["farm_id"],
        item_id=item_id,
        item_name=result["item_name"],
        action=action,
        quantity_change=request.adjustment,
        quantity_after=result["quantity"],
        reason=request.reason or f"Manual {action}",
        performed_by=farmer_email,
    )

    return result


def use_for_crop(item_id: str, quantity: float, crop_name: str, farmer_email: str) -> dict:
    """Deduct inventory for crop usage (e.g., applying fertilizer)."""
    result = inventory_repo.adjust_inventory(item_id, -abs(quantity))
    if not result:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Inventory item not found")

    inventory_log_repo.log_activity(
        farm_id=result["farm_id"],
        item_id=item_id,
        item_name=result["item_name"],
        action="used_for_crop",
        quantity_change=-abs(quantity),
        quantity_after=result["quantity"],
        reason=f"Applied to crop: {crop_name}",
        performed_by=farmer_email,
    )

    return result


def deduct_for_order(item_id: str, quantity: float, order_id: str) -> dict | None:
    """Auto-deduct inventory when order is confirmed (marketplace sync)."""
    result = inventory_repo.adjust_inventory(item_id, -abs(quantity))
    if not result:
        return None

    inventory_log_repo.log_activity(
        farm_id=result["farm_id"],
        item_id=item_id,
        item_name=result["item_name"],
        action="order_deduction",
        quantity_change=-abs(quantity),
        quantity_after=result["quantity"],
        reason=f"Order fulfillment: {order_id}",
        performed_by="system",
    )

    return result


def link_product(item_id: str, product_id: str, farmer_email: str) -> dict:
    """Link an inventory item to a marketplace product for stock sync."""
    result = inventory_repo.update_inventory(item_id, {"linked_product_id": product_id})
    if not result:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Inventory item not found")

    inventory_log_repo.log_activity(
        farm_id=result["farm_id"],
        item_id=item_id,
        item_name=result["item_name"],
        action="edited",
        quantity_change=0,
        quantity_after=result["quantity"],
        reason=f"Linked to marketplace product: {product_id}",
        performed_by=farmer_email,
    )

    return result


def get_activity_logs(farm_id: str) -> dict:
    """Get inventory activity logs for a farm."""
    logs = inventory_log_repo.list_logs_by_farm(farm_id)
    return {"logs": logs, "total": len(logs)}


def get_item_logs(item_id: str) -> dict:
    """Get activity logs for a specific item."""
    logs = inventory_log_repo.list_logs_by_item(item_id)
    return {"logs": logs, "total": len(logs)}


def delete_inventory(item_id: str, farmer_email: str) -> bool:
    """Delete an inventory item."""
    # Get item info for logging before delete
    item = inventory_repo.get_inventory_item(item_id)
    if item:
        inventory_log_repo.log_activity(
            farm_id=item["farm_id"],
            item_id=item_id,
            item_name=item["item_name"],
            action="removed",
            quantity_change=-item["quantity"],
            quantity_after=0,
            reason="Item deleted",
            performed_by=farmer_email,
        )
    return inventory_repo.delete_inventory(item_id)
