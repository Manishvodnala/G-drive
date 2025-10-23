"""Data models for the taxi platform."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Literal


class Role(str, Enum):
    ADMIN = "admin"
    DRIVER = "driver"
    RIDER = "rider"


class DriverStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    INACTIVE = "inactive"
    ON_TRIP = "on_trip"


class RideStatus(str, Enum):
    REQUESTED = "requested"
    ACCEPTED = "accepted"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


UserRole = Literal["admin", "driver", "rider"]


@dataclass(slots=True)
class User:
    name: str
    role: Role
    id: int = field(init=False)


@dataclass(slots=True)
class DriverProfile:
    user_id: int
    vehicle: str
    license_number: str
    status: DriverStatus = DriverStatus.PENDING
    id: int = field(init=False)


@dataclass(slots=True)
class RideRequest:
    rider_id: int
    pickup: str
    dropoff: str
    status: RideStatus = RideStatus.REQUESTED
    driver_id: int | None = None
    requested_at: datetime = field(default_factory=datetime.utcnow)
    id: int = field(init=False)
