from __future__ import annotations

import sys
from pathlib import Path

import pytest

# Ensure the application package is importable when tests run without installation.
sys.path.append(str(Path(__file__).resolve().parents[1]))

from taxi_platform import create_app
from taxi_platform.models import DriverStatus, Role
from taxi_platform.store import DataStore


@pytest.fixture()
def client():
    store = DataStore()
    app = create_app(store)
    app.config.update(TESTING=True)
    with app.test_client() as client:
        yield client


def test_full_flow(client):
    # create users
    admin_resp = client.post("/admin/users", json={"name": "Alice", "role": Role.ADMIN.value})
    assert admin_resp.status_code == 201
    driver_resp = client.post("/admin/users", json={"name": "Bob", "role": Role.DRIVER.value})
    rider_resp = client.post("/admin/users", json={"name": "Carol", "role": Role.RIDER.value})
    driver_id = driver_resp.get_json()["id"]
    rider_id = rider_resp.get_json()["id"]

    # onboard driver
    onboard_resp = client.post(
        "/onboarding/driver",
        json={"user_id": driver_id, "vehicle": "Toyota Prius", "license_number": "XYZ123"},
    )
    assert onboard_resp.status_code == 201

    # activate driver
    status_resp = client.patch(
        "/onboarding/driver/1/status", json={"status": DriverStatus.ACTIVE.value}
    )
    assert status_resp.status_code == 200

    # rider requests ride
    ride_resp = client.post(
        f"/riders/{rider_id}/ride-request",
        json={"pickup": "Downtown", "dropoff": "Airport"},
    )
    assert ride_resp.status_code == 201
    ride_id = ride_resp.get_json()["id"]

    # driver views available rides
    available = client.get("/drivers/1/rides/available")
    assert available.status_code == 200
    assert len(available.get_json()) == 1

    # driver accepts ride
    accept_resp = client.post(f"/drivers/1/rides/{ride_id}/accept")
    assert accept_resp.status_code == 200
    assert accept_resp.get_json()["driver_id"] == 1

    # rider sees ride history
    history = client.get(f"/riders/{rider_id}/rides")
    assert history.status_code == 200
    assert history.get_json()[0]["status"] == "accepted"
