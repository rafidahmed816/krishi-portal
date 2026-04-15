"""Alarm use cases — business logic for crop reminders."""

from __future__ import annotations

from fastapi import HTTPException, status

from app.application.dto.alarm_dto import CreateAlarmRequest
from app.infrastructure.database import alarm_repo, crop_repo, farm_repo
from app.infrastructure.external import sns_service


def create_alarm(farm_id: str, request: CreateAlarmRequest, farmer_email: str) -> dict:
    """Create a crop reminder alarm."""
    farm = farm_repo.get_farm(farm_id)
    if not farm:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Farm not found")
    if farm["farmer_email"] != farmer_email:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your farm")

    crop = crop_repo.get_crop(request.crop_id)
    if not crop:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Crop not found")

    # Subscribe farmer email to SNS topic (idempotent)
    sns_service.subscribe_email(farmer_email)

    data = {
        "farm_id": farm_id,
        "crop_id": request.crop_id,
        "crop_name": crop["name"],
        "farmer_email": farmer_email,
        "title": request.title,
        "message": request.message,
        "alarm_date": request.alarm_date,
        "alarm_time": request.alarm_time,
    }
    return alarm_repo.create_alarm(data)


def list_alarms(farm_id: str) -> dict:
    """List all alarms for a farm."""
    alarms = alarm_repo.list_alarms_by_farm(farm_id)
    return {"alarms": alarms, "total": len(alarms)}


def trigger_due_alarms() -> int:
    """Check and send all due alarms. Returns count of sent notifications."""
    due = alarm_repo.get_due_alarms()
    sent_count = 0
    for alarm in due:
        success = sns_service.notify_crop_reminder(
            farmer_email=alarm["farmer_email"],
            crop_name=alarm["crop_name"],
            farm_name=alarm.get("farm_id", ""),
            reminder_message=f"{alarm['title']}: {alarm['message']}",
        )
        if success:
            alarm_repo.mark_sent(alarm["id"])
            sent_count += 1
    return sent_count


def delete_alarm(alarm_id: str, farmer_email: str) -> bool:
    return alarm_repo.delete_alarm(alarm_id)
