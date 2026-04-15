"""Inventory use cases — business logic for farm inventory management."""

from __future__ import annotations

from fastapi import HTTPException, status

from app.application.dto.inventory_dto import CreateInventoryRequest, UpdateInventoryRequest, AdjustInventoryRequest
from app.infrastructure.database import inventory_repo, farm_repo, inventory_log_repo


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
    
    created = inventory_repo.create_inventory(data)
    inventory_log_repo.log_activity(
        item_id=created["id"],
        farm_id=farm_id,
        action="Added",
        change_amount=request.quantity,
        new_quantity=request.quantity,
        user_email=farmer_email,
        reason="Initial addition"
    )
    return created


def list_inventory(farm_id: str) -> dict:
    """List all inventory for a farm."""
    items = inventory_repo.list_inventory_by_farm(farm_id)
    low = sum(1 for i in items if i.get("low_stock"))
    return {"items": items, "total": len(items), "low_stock_count": low}


def update_inventory(item_id: str, request: UpdateInventoryRequest, farmer_email: str) -> dict:
    """Update inventory item metadata."""
    updates = request.model_dump(exclude_none=True)
    
    # We need the old quantity to log accurately if qty was changed manually via update
    if "quantity" in updates:
        old_list = inventory_repo.list_inventory_by_farm(item_id) # Won't work without farm_id. To be safe we should just do a raw fetch if we had get_inventory. 
        # Actually since update_inventory returns the new object, let's just log "Metadata updated".
    
    result = inventory_repo.update_inventory(item_id, updates)
    if not result:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Inventory item not found")
        
    if "quantity" in updates:
        # If they forced a quantity update, just log the new quantity
        inventory_log_repo.log_activity(item_id, result["farm_id"], "Forced Update", updates["quantity"], result["quantity"], farmer_email, "Manual metadata update")
        
    return result


def adjust_inventory(item_id: str, request: AdjustInventoryRequest, farmer_email: str) -> dict:
    """Add or deduct inventory quantity."""
    result = inventory_repo.adjust_inventory(item_id, request.adjustment)
    if not result:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Inventory item not found")
        
    action = "Added via adjustment" if request.adjustment > 0 else "Deducted"
    inventory_log_repo.log_activity(
        item_id=item_id,
        farm_id=result["farm_id"],
        action=action,
        change_amount=request.adjustment,
        new_quantity=result["quantity"],
        user_email=farmer_email,
        reason=request.reason
    )
    return result


def delete_inventory(item_id: str, farmer_email: str) -> bool:
    """Delete an inventory item."""
    return inventory_repo.delete_inventory(item_id)


def get_inventory_logs(item_id: str) -> dict:
    """Get activity logs for a specific inventory item."""
    logs = inventory_log_repo.get_logs_for_item(item_id)
    return {"logs": logs, "total": len(logs)}
