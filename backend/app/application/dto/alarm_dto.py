"""Crop Alarm DTOs — request/response models for crop reminders."""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel


class CreateAlarmRequest(BaseModel):
    crop_id: str
    title: str
    message: str
    alarm_date: str         # yyyy-mm-dd
    alarm_time: str = "09:00"  # HH:MM


class AlarmResponse(BaseModel):
    id: str
    farm_id: str
    crop_id: str
    crop_name: str
    title: str
    message: str
    alarm_date: str
    alarm_time: str
    sent: bool
    created_at: str


class AlarmListResponse(BaseModel):
    alarms: list[AlarmResponse]
    total: int
