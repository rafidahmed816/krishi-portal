"""Product domain entity – SQLAlchemy model."""

from __future__ import annotations

import datetime
import uuid

from sqlalchemy import Column, DateTime, Float, Integer, String, Text
from app.infrastructure.database.engine import Base


class Product(Base):
    """Represents a farm product listing in the marketplace."""

    __tablename__ = "products"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    unit = Column(String(50), nullable=False, default="kg")  # kg, piece, dozen, etc.
    category = Column(String(100), nullable=False, index=True)
    quantity = Column(Integer, nullable=False, default=0)
    image_url = Column(String(500), nullable=True)

    # Farmer info (from Cognito token)
    farmer_email = Column(String(255), nullable=False, index=True)
    farmer_name = Column(String(200), nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
