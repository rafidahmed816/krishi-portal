"""Farm repository — DynamoDB operations for farms."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from decimal import Decimal

import boto3
from botocore.exceptions import ClientError

from app.core.config import get_settings

settings = get_settings()

_dynamodb = None
FARM_TABLE_NAME = "agrolink-farms"


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
    table = _dynamodb.Table(FARM_TABLE_NAME)
    try:
        table.load()
    except ClientError as e:
        if e.response["Error"]["Code"] == "ResourceNotFoundException":
            _dynamodb.create_table(
                TableName=FARM_TABLE_NAME,
                KeySchema=[{"AttributeName": "id", "KeyType": "HASH"}],
                AttributeDefinitions=[{"AttributeName": "id", "AttributeType": "S"}],
                BillingMode="PAY_PER_REQUEST",
            )
            table = _dynamodb.Table(FARM_TABLE_NAME)
            table.wait_until_exists()
    return table


def _to_farm_dict(item: dict) -> dict:
    """Convert DynamoDB item (Decimal) to plain dict."""
    return {
        "id": item.get("id", ""),
        "name": item.get("name", ""),
        "location": item.get("location", ""),
        "size_acres": float(item.get("size_acres", 0)),
        "soil_type": item.get("soil_type", ""),
        "description": item.get("description", ""),
        "image_url": item.get("image_url", ""),
        "farmer_email": item.get("farmer_email", ""),
        "farmer_name": item.get("farmer_name", ""),
        "crop_count": int(item.get("crop_count", 0)),
        "created_at": item.get("created_at", ""),
        "updated_at": item.get("updated_at", ""),
    }


def create_farm(farm_data: dict) -> dict:
    """Create a new farm."""
    table = _get_table()
    now = datetime.now(timezone.utc).isoformat()
    item = {
        "id": str(uuid.uuid4()),
        "name": farm_data.get("name", ""),
        "location": farm_data.get("location", ""),
        "size_acres": Decimal(str(farm_data.get("size_acres", 0))),
        "soil_type": farm_data.get("soil_type", ""),
        "description": farm_data.get("description", ""),
        "image_url": farm_data.get("image_url", ""),
        "farmer_email": farm_data.get("farmer_email", ""),
        "farmer_name": farm_data.get("farmer_name", ""),
        "crop_count": 0,
        "created_at": now,
        "updated_at": now,
    }
    table.put_item(Item=item)
    return _to_farm_dict(item)


def get_farm(farm_id: str) -> dict | None:
    """Get a single farm by ID."""
    table = _get_table()
    resp = table.get_item(Key={"id": farm_id})
    item = resp.get("Item")
    return _to_farm_dict(item) if item else None


def list_farms_by_farmer(farmer_email: str) -> list[dict]:
    """List all farms owned by a farmer."""
    table = _get_table()
    resp = table.scan(
        FilterExpression="farmer_email = :e",
        ExpressionAttributeValues={":e": farmer_email},
    )
    items = resp.get("Items", [])
    items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return [_to_farm_dict(i) for i in items]


def list_all_farms() -> list[dict]:
    """List all farms (for marketplace/public view)."""
    table = _get_table()
    resp = table.scan()
    items = resp.get("Items", [])
    items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return [_to_farm_dict(i) for i in items]


def update_farm(farm_id: str, updates: dict) -> dict | None:
    """Update a farm's details."""
    table = _get_table()
    updates = {k: v for k, v in updates.items() if v is not None}
    if not updates:
        return get_farm(farm_id)

    updates["updated_at"] = datetime.now(timezone.utc).isoformat()

    if "size_acres" in updates:
        updates["size_acres"] = Decimal(str(updates["size_acres"]))

    expr_parts, expr_values, expr_names = [], {}, {}
    for i, (key, val) in enumerate(updates.items()):
        attr_name = f"#k{i}"
        attr_val = f":v{i}"
        expr_parts.append(f"{attr_name} = {attr_val}")
        expr_names[attr_name] = key
        expr_values[attr_val] = val

    try:
        resp = table.update_item(
            Key={"id": farm_id},
            UpdateExpression="SET " + ", ".join(expr_parts),
            ExpressionAttributeNames=expr_names,
            ExpressionAttributeValues=expr_values,
            ReturnValues="ALL_NEW",
        )
        return _to_farm_dict(resp["Attributes"])
    except ClientError:
        return None


def delete_farm(farm_id: str) -> bool:
    """Delete a farm."""
    table = _get_table()
    try:
        table.delete_item(Key={"id": farm_id})
        return True
    except ClientError:
        return False
