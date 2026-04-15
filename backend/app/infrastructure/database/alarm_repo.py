"""Alarm repository — DynamoDB operations for crop reminders."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

import boto3
from botocore.exceptions import ClientError

from app.core.config import get_settings

settings = get_settings()

_dynamodb = None
ALARM_TABLE_NAME = "agrolink-alarms"


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
    table = _dynamodb.Table(ALARM_TABLE_NAME)
    try:
        table.load()
    except ClientError as e:
        if e.response["Error"]["Code"] == "ResourceNotFoundException":
            _dynamodb.create_table(
                TableName=ALARM_TABLE_NAME,
                KeySchema=[{"AttributeName": "id", "KeyType": "HASH"}],
                AttributeDefinitions=[{"AttributeName": "id", "AttributeType": "S"}],
                BillingMode="PAY_PER_REQUEST",
            )
            table = _dynamodb.Table(ALARM_TABLE_NAME)
            table.wait_until_exists()
    return table


def _to_alarm_dict(item: dict) -> dict:
    return {
        "id": item.get("id", ""),
        "farm_id": item.get("farm_id", ""),
        "crop_id": item.get("crop_id", ""),
        "crop_name": item.get("crop_name", ""),
        "farmer_email": item.get("farmer_email", ""),
        "title": item.get("title", ""),
        "message": item.get("message", ""),
        "alarm_date": item.get("alarm_date", ""),
        "alarm_time": item.get("alarm_time", "09:00"),
        "sent": item.get("sent", False),
        "created_at": item.get("created_at", ""),
    }


def create_alarm(data: dict) -> dict:
    table = _get_table()
    now = datetime.now(timezone.utc).isoformat()
    item = {
        "id": str(uuid.uuid4()),
        "farm_id": data.get("farm_id", ""),
        "crop_id": data.get("crop_id", ""),
        "crop_name": data.get("crop_name", ""),
        "farmer_email": data.get("farmer_email", ""),
        "title": data.get("title", ""),
        "message": data.get("message", ""),
        "alarm_date": data.get("alarm_date", ""),
        "alarm_time": data.get("alarm_time", "09:00"),
        "sent": False,
        "created_at": now,
    }
    table.put_item(Item=item)
    return _to_alarm_dict(item)


def list_alarms_by_farm(farm_id: str) -> list[dict]:
    table = _get_table()
    resp = table.scan(
        FilterExpression="farm_id = :f",
        ExpressionAttributeValues={":f": farm_id},
    )
    items = resp.get("Items", [])
    items.sort(key=lambda x: x.get("alarm_date", ""))
    return [_to_alarm_dict(i) for i in items]


def get_due_alarms() -> list[dict]:
    """Get alarms that are due today and not yet sent."""
    table = _get_table()
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    resp = table.scan(
        FilterExpression="alarm_date <= :today AND sent = :f",
        ExpressionAttributeValues={":today": today, ":f": False},
    )
    return [_to_alarm_dict(i) for i in resp.get("Items", [])]


def mark_sent(alarm_id: str) -> bool:
    table = _get_table()
    try:
        table.update_item(
            Key={"id": alarm_id},
            UpdateExpression="SET sent = :t",
            ExpressionAttributeValues={":t": True},
        )
        return True
    except ClientError:
        return False


def delete_alarm(alarm_id: str) -> bool:
    table = _get_table()
    try:
        table.delete_item(Key={"id": alarm_id})
        return True
    except ClientError:
        return False
