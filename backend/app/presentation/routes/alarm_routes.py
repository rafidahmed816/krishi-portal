"""Alarm REST API routes — crop reminder management."""

from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException, status

from app.application.dto.alarm_dto import (
    CreateAlarmRequest,
    AlarmResponse,
    AlarmListResponse,
)
from app.application.use_cases import alarm_use_cases, auth_use_cases

router = APIRouter(prefix="/api/farms", tags=["Alarms"])


def _get_email(authorization: str) -> str:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid auth header")
    token = authorization.removeprefix("Bearer ").strip()
    profile = auth_use_cases.get_profile(token)
    return profile["email"]


@router.post("/{farm_id}/alarms", response_model=AlarmResponse, status_code=status.HTTP_201_CREATED)
async def create_alarm(
    farm_id: str,
    body: CreateAlarmRequest,
    authorization: str = Header(...),
):
    """Create a crop reminder alarm."""
    email = _get_email(authorization)
    return alarm_use_cases.create_alarm(farm_id, body, email)


@router.get("/{farm_id}/alarms", response_model=AlarmListResponse)
async def list_alarms(farm_id: str):
    """List all alarms for a farm."""
    return alarm_use_cases.list_alarms(farm_id)


@router.post("/{farm_id}/alarms/trigger")
async def trigger_alarms(farm_id: str, authorization: str = Header(...)):
    """Manually trigger due alarms for testing."""
    _get_email(authorization)
    count = alarm_use_cases.trigger_due_alarms()
    return {"sent": count}


@router.delete("/{farm_id}/alarms/{alarm_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_alarm(
    farm_id: str,
    alarm_id: str,
    authorization: str = Header(...),
):
    """Delete a reminder alarm."""
    email = _get_email(authorization)
    alarm_use_cases.delete_alarm(alarm_id, email)
