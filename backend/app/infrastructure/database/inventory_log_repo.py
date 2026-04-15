"""Inventory Activity Log — DynamoDB repo for tracking all inventory changes."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

import boto3
from botocore.exceptions import ClientError

from app.core.config import get_settings

settings = get_settings()

_dynamodb = None
LOG_TABLE_NAME = "agrolink-inventory-logs"


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
    table = _dynamodb.Table(LOG_TABLE_NAME)
    try:
        table.load()
    except ClientError as e:
        if e.response["Error"]["Code"] == "ResourceNotFoundException":
            _dynamodb.create_table(
                TableName=LOG_TABLE_NAME,
                KeySchema=[{"AttributeName": "id", "KeyType": "HASH"}],
                AttributeDefinitions=[{"AttributeName": "id", "AttributeType": "S"}],
                BillingMode="PAY_PER_REQUEST",
            )
            table = _dynamodb.Table(LOG_TABLE_NAME)
            table.wait_until_exists()
    return table


def _to_log_dict(item: dict) -> dict:
    return {
        "id": item.get("id", ""),
        "farm_id": item.get("farm_id", ""),
        "item_id": item.get("item_id", ""),
        "item_name": item.get("item_name", ""),
        "action": item.get("action", ""),          # added | removed | adjusted | edited | used_for_crop | order_deduction
        "quantity_change": float(item.get("quantity_change", 0)),
        "quantity_after": float(item.get("quantity_after", 0)),
        "reason": item.get("reason", ""),
        "performed_by": item.get("performed_by", ""),
        "created_at": item.get("created_at", ""),
    }


def log_activity(
    farm_id: str,
    item_id: str,
    item_name: str,
    action: str,
    quantity_change: float,
    quantity_after: float,
    reason: str = "",
    performed_by: str = "",
) -> dict:
    """Log an inventory activity."""
    from decimal import Decimal
    table = _get_table()
    now = datetime.now(timezone.utc).isoformat()
    item = {
        "id": str(uuid.uuid4()),
        "farm_id": farm_id,
        "item_id": item_id,
        "item_name": item_name,
        "action": action,
        "quantity_change": Decimal(str(quantity_change)),
        "quantity_after": Decimal(str(quantity_after)),
        "reason": reason,
        "performed_by": performed_by,
        "created_at": now,
    }
    table.put_item(Item=item)
    return _to_log_dict(item)


def list_logs_by_farm(farm_id: str, limit: int = 50) -> list[dict]:
    """Get recent activity logs for a farm."""
    table = _get_table()
    resp = table.scan(
        FilterExpression="farm_id = :f",
        ExpressionAttributeValues={":f": farm_id},
    )
    items = resp.get("Items", [])
    items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return [_to_log_dict(i) for i in items[:limit]]


def list_logs_by_item(item_id: str, limit: int = 30) -> list[dict]:
    """Get activity logs for a specific item."""
    table = _get_table()
    resp = table.scan(
        FilterExpression="item_id = :i",
        ExpressionAttributeValues={":i": item_id},
    )
    items = resp.get("Items", [])
    items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return [_to_log_dict(i) for i in items[:limit]]
