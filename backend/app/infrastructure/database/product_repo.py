"""DynamoDB repository for Product CRUD operations."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

import boto3
from botocore.exceptions import ClientError

from app.core.config import get_settings

settings = get_settings()

TABLE_NAME = "agrolink-products"

# ── DynamoDB resource ───────────────────────────────────────────────
_dynamodb = boto3.resource(
    "dynamodb",
    region_name=settings.AWS_REGION,
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    aws_session_token=settings.AWS_SESSION_TOKEN or None,
)

_table = _dynamodb.Table(TABLE_NAME)


def _to_product_dict(item: dict) -> dict:
    """Convert DynamoDB item (Decimal) to plain dict (float)."""
    return {
        "id": item["id"],
        "title": item["title"],
        "description": item.get("description", ""),
        "price": float(item.get("price", 0)),
        "unit": item.get("unit", "kg"),
        "category": item.get("category", ""),
        "quantity": int(item.get("quantity", 0)),
        "image_url": item.get("image_url", ""),
        "farmer_email": item.get("farmer_email", ""),
        "farmer_name": item.get("farmer_name", ""),
        "linked_inventory_id": item.get("linked_inventory_id", ""),
        "created_at": item.get("created_at", ""),
        "updated_at": item.get("updated_at", ""),
    }


# ── CREATE ──────────────────────────────────────────────────────────
def create_product(
    title: str,
    description: Optional[str],
    price: float,
    unit: str,
    category: str,
    quantity: int,
    farmer_email: str,
    farmer_name: str,
    image_url: Optional[str] = None,
    linked_inventory_id: Optional[str] = None,
) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    item = {
        "id": str(uuid.uuid4()),
        "title": title,
        "description": description or "",
        "price": Decimal(str(price)),
        "unit": unit,
        "category": category,
        "quantity": quantity,
        "farmer_email": farmer_email,
        "farmer_name": farmer_name,
        "image_url": image_url or "",
        "linked_inventory_id": linked_inventory_id or "",
        "created_at": now,
        "updated_at": now,
    }
    _table.put_item(Item=item)
    return _to_product_dict(item)


# ── READ ALL ────────────────────────────────────────────────────────
def list_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
) -> list[dict]:
    response = _table.scan()
    items = response.get("Items", [])

    # Handle pagination
    while "LastEvaluatedKey" in response:
        response = _table.scan(ExclusiveStartKey=response["LastEvaluatedKey"])
        items.extend(response.get("Items", []))

    # Filter
    if category:
        items = [i for i in items if i.get("category", "").lower() == category.lower()]
    if search:
        q = search.lower()
        items = [
            i for i in items
            if q in i.get("title", "").lower() or q in i.get("description", "").lower()
        ]

    # Sort by created_at descending
    items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return [_to_product_dict(i) for i in items]


# ── READ ONE ────────────────────────────────────────────────────────
def get_product(product_id: str) -> Optional[dict]:
    try:
        response = _table.get_item(Key={"id": product_id})
        item = response.get("Item")
        if item:
            return _to_product_dict(item)
        return None
    except ClientError:
        return None


# ── UPDATE ──────────────────────────────────────────────────────────
def update_product(product_id: str, updates: dict) -> Optional[dict]:
    # Filter out None values
    updates = {k: v for k, v in updates.items() if v is not None}
    if not updates:
        return get_product(product_id)

    updates["updated_at"] = datetime.now(timezone.utc).isoformat()

    # Convert float to Decimal for DynamoDB
    if "price" in updates:
        updates["price"] = Decimal(str(updates["price"]))

    expr_parts = []
    expr_values = {}
    expr_names = {}
    for i, (key, val) in enumerate(updates.items()):
        attr_name = f"#k{i}"
        attr_val = f":v{i}"
        expr_parts.append(f"{attr_name} = {attr_val}")
        expr_names[attr_name] = key
        expr_values[attr_val] = val

    try:
        response = _table.update_item(
            Key={"id": product_id},
            UpdateExpression="SET " + ", ".join(expr_parts),
            ExpressionAttributeNames=expr_names,
            ExpressionAttributeValues=expr_values,
            ReturnValues="ALL_NEW",
        )
        return _to_product_dict(response["Attributes"])
    except ClientError:
        return None


# ── DELETE ──────────────────────────────────────────────────────────
def delete_product(product_id: str) -> bool:
    try:
        _table.delete_item(Key={"id": product_id})
        return True
    except ClientError:
        return False


# ── LIST BY FARMER ──────────────────────────────────────────────────
def list_products_by_farmer(farmer_email: str) -> list[dict]:
    response = _table.scan(
        FilterExpression="farmer_email = :email",
        ExpressionAttributeValues={":email": farmer_email},
    )
    items = response.get("Items", [])
    items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return [_to_product_dict(i) for i in items]
