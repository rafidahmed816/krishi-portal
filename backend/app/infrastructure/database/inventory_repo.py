"""Inventory repository — DynamoDB operations for farm inventory."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from decimal import Decimal

import boto3
from botocore.exceptions import ClientError

from app.core.config import get_settings

settings = get_settings()

_dynamodb = None
INVENTORY_TABLE_NAME = "agrolink-inventory"


def _get_table():
    global _dynamodb
    if _dynamodb is None:
        _dynamodb = boto3.resource(
            "dynamodb",
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            aws_session_token=settings.AWS_SESSION_TOKEN,
        )
    table = _dynamodb.Table(INVENTORY_TABLE_NAME)
    try:
        table.load()
    except ClientError as e:
        if e.response["Error"]["Code"] == "ResourceNotFoundException":
            _dynamodb.create_table(
                TableName=INVENTORY_TABLE_NAME,
                KeySchema=[{"AttributeName": "id", "KeyType": "HASH"}],
                AttributeDefinitions=[{"AttributeName": "id", "AttributeType": "S"}],
                BillingMode="PAY_PER_REQUEST",
            )
            table = _dynamodb.Table(INVENTORY_TABLE_NAME)
            table.wait_until_exists()
    return table


def _to_inventory_dict(item: dict) -> dict:
    qty = float(item.get("quantity", 0))
    return {
        "id": item.get("id", ""),
        "farm_id": item.get("farm_id", ""),
        "item_name": item.get("item_name", ""),
        "category": item.get("category", ""),
        "quantity": qty,
        "unit": item.get("unit", "kg"),
        "purchase_price": float(item.get("purchase_price", 0)),
        "purchase_date": item.get("purchase_date", ""),
        "expiry_date": item.get("expiry_date", ""),
        "supplier": item.get("supplier", ""),
        "reorder_level": float(item.get("reorder_level", 10)),
        "linked_crop_id": item.get("linked_crop_id", ""),
        "notes": item.get("notes", ""),
        "low_stock": qty <= float(item.get("reorder_level", 10)),
        "created_at": item.get("created_at", ""),
        "updated_at": item.get("updated_at", ""),
    }


def create_inventory(data: dict) -> dict:
    table = _get_table()
    now = datetime.now(timezone.utc).isoformat()
    item = {
        "id": str(uuid.uuid4()),
        "farm_id": data.get("farm_id", ""),
        "item_name": data.get("item_name", ""),
        "category": data.get("category", ""),
        "quantity": Decimal(str(data.get("quantity", 0))),
        "unit": data.get("unit", "kg"),
        "purchase_price": Decimal(str(data.get("purchase_price", 0))),
        "purchase_date": data.get("purchase_date", ""),
        "expiry_date": data.get("expiry_date", ""),
        "supplier": data.get("supplier", ""),
        "reorder_level": Decimal(str(data.get("reorder_level", 10))),
        "linked_crop_id": data.get("linked_crop_id", ""),
        "notes": data.get("notes", ""),
        "created_at": now,
        "updated_at": now,
    }
    table.put_item(Item=item)
    return _to_inventory_dict(item)


def list_inventory_by_farm(farm_id: str) -> list[dict]:
    table = _get_table()
    resp = table.scan(
        FilterExpression="farm_id = :f",
        ExpressionAttributeValues={":f": farm_id},
    )
    items = resp.get("Items", [])
    items.sort(key=lambda x: x.get("item_name", ""))
    return [_to_inventory_dict(i) for i in items]


def adjust_inventory(item_id: str, adjustment: float) -> dict | None:
    """Add or deduct stock. adjustment > 0 = add, < 0 = deduct."""
    table = _get_table()
    now = datetime.now(timezone.utc).isoformat()
    try:
        resp = table.update_item(
            Key={"id": item_id},
            UpdateExpression="SET quantity = quantity + :adj, updated_at = :u",
            ExpressionAttributeValues={
                ":adj": Decimal(str(adjustment)),
                ":u": now,
            },
            ReturnValues="ALL_NEW",
        )
        return _to_inventory_dict(resp["Attributes"])
    except ClientError:
        return None


def update_inventory(item_id: str, updates: dict) -> dict | None:
    """Update inventory item metadata (name, category, unit, price, notes)."""
    table = _get_table()
    updates = {k: v for k, v in updates.items() if v is not None}
    if not updates:
        return None

    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    if "purchase_price" in updates:
        updates["purchase_price"] = Decimal(str(updates["purchase_price"]))
    if "quantity" in updates:
        updates["quantity"] = Decimal(str(updates["quantity"]))
    if "reorder_level" in updates:
        updates["reorder_level"] = Decimal(str(updates["reorder_level"]))

    expr_parts, expr_values, expr_names = [], {}, {}
    for i, (key, val) in enumerate(updates.items()):
        expr_parts.append(f"#k{i} = :v{i}")
        expr_names[f"#k{i}"] = key
        expr_values[f":v{i}"] = val

    try:
        resp = table.update_item(
            Key={"id": item_id},
            UpdateExpression="SET " + ", ".join(expr_parts),
            ExpressionAttributeNames=expr_names,
            ExpressionAttributeValues=expr_values,
            ReturnValues="ALL_NEW",
        )
        return _to_inventory_dict(resp["Attributes"])
    except ClientError:
        return None


def delete_inventory(item_id: str) -> bool:
    table = _get_table()
    try:
        table.delete_item(Key={"id": item_id})
        return True
    except ClientError:
        return False

