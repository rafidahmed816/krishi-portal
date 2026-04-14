"""Order repository — DynamoDB operations for orders."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from decimal import Decimal

import boto3
from botocore.exceptions import ClientError

from app.core.config import get_settings

settings = get_settings()

_dynamodb = None
ORDER_TABLE_NAME = "agrolink-orders"


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
    table = _dynamodb.Table(ORDER_TABLE_NAME)
    # Auto-create table if not exists
    try:
        table.load()
    except ClientError as e:
        if e.response["Error"]["Code"] == "ResourceNotFoundException":
            _dynamodb.create_table(
                TableName=ORDER_TABLE_NAME,
                KeySchema=[{"AttributeName": "id", "KeyType": "HASH"}],
                AttributeDefinitions=[{"AttributeName": "id", "AttributeType": "S"}],
                BillingMode="PAY_PER_REQUEST",
            )
            table = _dynamodb.Table(ORDER_TABLE_NAME)
            table.wait_until_exists()
    return table


def _to_order_dict(item: dict) -> dict:
    """Convert DynamoDB item (Decimal) to plain dict (float/int)."""
    return {
        "id": item.get("id", ""),
        "product_id": item.get("product_id", ""),
        "product_title": item.get("product_title", ""),
        "product_image_url": item.get("product_image_url"),
        "quantity": int(item.get("quantity", 0)),
        "unit_price": float(item.get("unit_price", 0)),
        "total_price": float(item.get("total_price", 0)),
        "unit": item.get("unit", "kg"),
        "buyer_email": item.get("buyer_email", ""),
        "buyer_name": item.get("buyer_name", ""),
        "farmer_email": item.get("farmer_email", ""),
        "farmer_name": item.get("farmer_name", ""),
        "status": item.get("status", "pending"),
        "created_at": item.get("created_at", ""),
        "updated_at": item.get("updated_at", ""),
    }


def create_order(order_data: dict) -> dict:
    """Create a new order."""
    table = _get_table()
    now = datetime.now(timezone.utc).isoformat()
    item = {
        "id": str(uuid.uuid4()),
        "product_id": order_data.get("product_id", ""),
        "product_title": order_data.get("product_title", ""),
        "product_image_url": order_data.get("product_image_url") or "",
        "quantity": order_data.get("quantity", 0),
        "unit_price": Decimal(str(order_data.get("unit_price", 0))),
        "total_price": Decimal(str(order_data.get("total_price", 0))),
        "unit": order_data.get("unit", "kg"),
        "buyer_email": order_data.get("buyer_email", ""),
        "buyer_name": order_data.get("buyer_name", ""),
        "farmer_email": order_data.get("farmer_email", ""),
        "farmer_name": order_data.get("farmer_name", ""),
        "status": "pending",
        "created_at": now,
        "updated_at": now,
    }
    table.put_item(Item=item)
    return _to_order_dict(item)


def get_order(order_id: str) -> dict | None:
    """Get a single order by ID."""
    table = _get_table()
    resp = table.get_item(Key={"id": order_id})
    item = resp.get("Item")
    return _to_order_dict(item) if item else None


def list_orders_by_buyer(buyer_email: str) -> list[dict]:
    """List all orders placed by a buyer."""
    table = _get_table()
    resp = table.scan(
        FilterExpression="buyer_email = :e",
        ExpressionAttributeValues={":e": buyer_email},
    )
    items = resp.get("Items", [])
    items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return [_to_order_dict(i) for i in items]


def list_orders_by_farmer(farmer_email: str) -> list[dict]:
    """List all orders for a farmer's products."""
    table = _get_table()
    resp = table.scan(
        FilterExpression="farmer_email = :e",
        ExpressionAttributeValues={":e": farmer_email},
    )
    items = resp.get("Items", [])
    items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return [_to_order_dict(i) for i in items]


def update_order_status(order_id: str, new_status: str) -> dict | None:
    """Update an order's status."""
    table = _get_table()
    now = datetime.now(timezone.utc).isoformat()
    try:
        resp = table.update_item(
            Key={"id": order_id},
            UpdateExpression="SET #s = :s, updated_at = :u",
            ExpressionAttributeNames={"#s": "status"},
            ExpressionAttributeValues={":s": new_status, ":u": now},
            ReturnValues="ALL_NEW",
        )
        item = resp.get("Attributes")
        return _to_order_dict(item) if item else None
    except ClientError:
        return None
