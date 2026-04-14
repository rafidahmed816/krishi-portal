"""Crop repository — DynamoDB operations for crop lifecycle."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from decimal import Decimal

import boto3
from botocore.exceptions import ClientError

from app.core.config import get_settings

settings = get_settings()

_dynamodb = None
CROP_TABLE_NAME = "agrolink-crops"


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
    table = _dynamodb.Table(CROP_TABLE_NAME)
    try:
        table.load()
    except ClientError as e:
        if e.response["Error"]["Code"] == "ResourceNotFoundException":
            _dynamodb.create_table(
                TableName=CROP_TABLE_NAME,
                KeySchema=[{"AttributeName": "id", "KeyType": "HASH"}],
                AttributeDefinitions=[{"AttributeName": "id", "AttributeType": "S"}],
                BillingMode="PAY_PER_REQUEST",
            )
            table = _dynamodb.Table(CROP_TABLE_NAME)
            table.wait_until_exists()
    return table


def _to_crop_dict(item: dict) -> dict:
    return {
        "id": item.get("id", ""),
        "farm_id": item.get("farm_id", ""),
        "name": item.get("name", ""),
        "variety": item.get("variety", ""),
        "planting_date": item.get("planting_date", ""),
        "expected_harvest_date": item.get("expected_harvest_date", ""),
        "area_acres": float(item.get("area_acres", 0)),
        "season": item.get("season", ""),
        "health_status": item.get("health_status", "Healthy"),
        "growth_stage": item.get("growth_stage", "Seedling"),
        "notes": item.get("notes", ""),
        "created_at": item.get("created_at", ""),
        "updated_at": item.get("updated_at", ""),
    }


def create_crop(crop_data: dict) -> dict:
    table = _get_table()
    now = datetime.now(timezone.utc).isoformat()
    item = {
        "id": str(uuid.uuid4()),
        "farm_id": crop_data.get("farm_id", ""),
        "name": crop_data.get("name", ""),
        "variety": crop_data.get("variety", ""),
        "planting_date": crop_data.get("planting_date", ""),
        "expected_harvest_date": crop_data.get("expected_harvest_date", ""),
        "area_acres": Decimal(str(crop_data.get("area_acres", 0))),
        "season": crop_data.get("season", ""),
        "health_status": "Healthy",
        "growth_stage": "Seedling",
        "notes": crop_data.get("notes", ""),
        "created_at": now,
        "updated_at": now,
    }
    table.put_item(Item=item)
    return _to_crop_dict(item)


def get_crop(crop_id: str) -> dict | None:
    table = _get_table()
    resp = table.get_item(Key={"id": crop_id})
    item = resp.get("Item")
    return _to_crop_dict(item) if item else None


def list_crops_by_farm(farm_id: str) -> list[dict]:
    table = _get_table()
    resp = table.scan(
        FilterExpression="farm_id = :f",
        ExpressionAttributeValues={":f": farm_id},
    )
    items = resp.get("Items", [])
    items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return [_to_crop_dict(i) for i in items]


def update_crop(crop_id: str, updates: dict) -> dict | None:
    table = _get_table()
    updates = {k: v for k, v in updates.items() if v is not None}
    if not updates:
        return get_crop(crop_id)

    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    if "area_acres" in updates:
        updates["area_acres"] = Decimal(str(updates["area_acres"]))

    expr_parts, expr_values, expr_names = [], {}, {}
    for i, (key, val) in enumerate(updates.items()):
        expr_parts.append(f"#k{i} = :v{i}")
        expr_names[f"#k{i}"] = key
        expr_values[f":v{i}"] = val

    try:
        resp = table.update_item(
            Key={"id": crop_id},
            UpdateExpression="SET " + ", ".join(expr_parts),
            ExpressionAttributeNames=expr_names,
            ExpressionAttributeValues=expr_values,
            ReturnValues="ALL_NEW",
        )
        return _to_crop_dict(resp["Attributes"])
    except ClientError:
        return None


def delete_crop(crop_id: str) -> bool:
    table = _get_table()
    try:
        table.delete_item(Key={"id": crop_id})
        return True
    except ClientError:
        return False
