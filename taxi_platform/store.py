"""In-memory data store for the taxi platform."""
from __future__ import annotations

from collections.abc import Iterable
from dataclasses import asdict
from typing import Any

from .models import DriverProfile, DriverStatus, RideRequest, RideStatus, Role, User


class DataStore:
    """Simple in-memory persistence layer."""

    def __init__(self) -> None:
        self._users: dict[int, User] = {}
        self._drivers: dict[int, DriverProfile] = {}
        self._rides: dict[int, RideRequest] = {}
        self._user_counter = 0
        self._driver_counter = 0
        self._ride_counter = 0

    # --- helpers -----------------------------------------------------------------
    def _next_user_id(self) -> int:
        self._user_counter += 1
        return self._user_counter

    def _next_driver_id(self) -> int:
        self._driver_counter += 1
        return self._driver_counter

    def _next_ride_id(self) -> int:
        self._ride_counter += 1
        return self._ride_counter

    # --- users -------------------------------------------------------------------
    def create_user(self, name: str, role: Role) -> dict[str, Any]:
        user = User(name=name, role=role)
        user.id = self._next_user_id()
        self._users[user.id] = user
        return asdict(user)

    def list_users(self) -> list[dict[str, Any]]:
        return [asdict(user) for user in self._users.values()]

    def get_user(self, user_id: int) -> User | None:
        return self._users.get(user_id)

    # --- drivers -----------------------------------------------------------------
    def create_driver_profile(
        self, user_id: int, vehicle: str, license_number: str
    ) -> dict[str, Any]:
        driver = DriverProfile(user_id=user_id, vehicle=vehicle, license_number=license_number)
        driver.id = self._next_driver_id()
        self._drivers[driver.id] = driver
        return asdict(driver)

    def list_driver_profiles(self) -> list[dict[str, Any]]:
        return [asdict(driver) for driver in self._drivers.values()]

    def get_driver(self, driver_id: int) -> DriverProfile | None:
        return self._drivers.get(driver_id)

    def update_driver_status(self, driver_id: int, status: DriverStatus) -> dict[str, Any]:
        driver = self._drivers[driver_id]
        driver.status = status
        return asdict(driver)

    def assign_driver_to_ride(self, driver_id: int, ride_id: int) -> dict[str, Any]:
        driver = self._drivers[driver_id]
        ride = self._rides[ride_id]
        if ride.status != RideStatus.REQUESTED:
            msg = f"Ride {ride_id} is not available"
            raise ValueError(msg)
        ride.driver_id = driver_id
        ride.status = RideStatus.ACCEPTED
        driver.status = DriverStatus.ON_TRIP
        return asdict(ride)

    # --- rides -------------------------------------------------------------------
    def create_ride_request(self, rider_id: int, pickup: str, dropoff: str) -> dict[str, Any]:
        ride = RideRequest(rider_id=rider_id, pickup=pickup, dropoff=dropoff)
        ride.id = self._next_ride_id()
        self._rides[ride.id] = ride
        return asdict(ride)

    def list_rides(
        self, *, rider_id: int | None = None, status: RideStatus | None = None
    ) -> list[dict[str, Any]]:
        rides: Iterable[RideRequest] = self._rides.values()
        if rider_id is not None:
            rides = (ride for ride in rides if ride.rider_id == rider_id)
        if status is not None:
            rides = (ride for ride in rides if ride.status == status)
        return [asdict(ride) for ride in rides]

    def get_available_rides(self) -> list[dict[str, Any]]:
        return self.list_rides(status=RideStatus.REQUESTED)
