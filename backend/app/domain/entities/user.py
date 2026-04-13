"""User domain entity and user-type enumeration."""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class UserType(str, Enum):
    """The three roles supported by AgroLink."""

    FARMER = "farmer"
    BUYER = "buyer"
    ADMIN = "admin"

    @property
    def cognito_group(self) -> str:
        """Return the matching Cognito group name."""
        return f"{self.value}s"          # farmers / buyers / admins


@dataclass
class User:
    """Lightweight domain entity representing an authenticated user."""

    email: str
    full_name: str
    user_type: UserType
    cognito_sub: str = ""
    email_verified: bool = False
