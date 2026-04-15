"""Inventory log repository — DynamoDB operations for tracking inventory usage/activity."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

import boto3
from botocore.exceptions import ClientError

from app.core.config import get_settings

settings = get_settings()

_dynamodb = None
LOGS_TABLE_NAME = "agrolink-inventory-logs"


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
    table = _dynamodb.Table(LOGS_TABLE_NAME)
    try:
        table.load()
    except ClientError as e:
        if e.response["Error"]["Code"] == "ResourceNotFoundException":
            _dynamodb.create_table(
                TableName=LOGS_TABLE_NAME,
                KeySchema=[{"AttributeName": "id", "KeyType": "HASH"}],
                AttributeDefinitions=[
                    {"AttributeName": "id", "AttributeType": "S"},
                    {"AttributeName": "item_id", "AttributeType": "S"}
                ],
                GlobalSecondaryIndexes=[
                    {
                        "IndexName": "ItemIdIndex",
                        "KeySchema": [{"AttributeName": "item_id", "KeyType": "HASH"}],
                        "Projection": {"ProjectionType": "ALL"},
                        "ProvisionedThroughput": {"ReadCapacityUnits": 1, "WriteCapacityUnits": 1},
                    }
                ],
                BillingMode="PAY_PER_REQUEST",
            )
            table = _dynamodb.Table(LOGS_TABLE_NAME)
            table.wait_until_exists()
    return table


def log_activity(item_id: str, farm_id: str, action: str, change_amount: float, new_quantity: float, user_email: str, reason: str = "") -> dict:
    """Log an inventory action (e.g., added, deducted, adjusted)."""
    table = _get_table()
    now = datetime.now(timezone.utc).isoformat()
    log_item = {
        "id": str(uuid.uuid4()),
        "item_id": item_id,
        "farm_id": farm_id,
        "action": action,
        "change_amount": str(change_amount),
        "new_quantity": str(new_quantity),
        "user_email": user_email,
        "reason": reason,
        "timestamp": now,
    }
    table.put_item(Item=log_item)
    return log_item


def get_logs_for_item(item_id: str) -> list[dict]:
    """Get activity logs for a specific inventory item."""
    table = _get_table()
    try:
        resp = table.query(
            IndexName="ItemIdIndex",
            KeyConditionExpression="item_id = :i",
            ExpressionAttributeValues={":i": item_id}
        )
        items = resp.get("Items", [])
        # Sort by timestamp descending
        items.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        return items
    except ClientError:
        return []
