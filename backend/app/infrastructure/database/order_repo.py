"""Order repository — DynamoDB operations for orders."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

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


def create_order(order_data: dict) -> dict:
    """Create a new order."""
    table = _get_table()
    now = datetime.now(timezone.utc).isoformat()
    item = {
        "id": str(uuid.uuid4()),
        **order_data,
        "status": "pending",
        "created_at": now,
        "updated_at": now,
    }
    table.put_item(Item=item)
    return item


def get_order(order_id: str) -> dict | None:
    """Get a single order by ID."""
    table = _get_table()
    resp = table.get_item(Key={"id": order_id})
    return resp.get("Item")


def list_orders_by_buyer(buyer_email: str) -> list[dict]:
    """List all orders placed by a buyer."""
    table = _get_table()
    resp = table.scan(
        FilterExpression="buyer_email = :e",
        ExpressionAttributeValues={":e": buyer_email},
    )
    items = resp.get("Items", [])
    items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return items


def list_orders_by_farmer(farmer_email: str) -> list[dict]:
    """List all orders for a farmer's products."""
    table = _get_table()
    resp = table.scan(
        FilterExpression="farmer_email = :e",
        ExpressionAttributeValues={":e": farmer_email},
    )
    items = resp.get("Items", [])
    items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return items


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
        return resp.get("Attributes")
    except ClientError:
        return None
