"""Driver centric routes."""
from __future__ import annotations

from flask import Blueprint, current_app, jsonify, request

from ..models import DriverStatus
from ..store import DataStore


drivers_bp = Blueprint("drivers", __name__, url_prefix="/drivers")


def _store() -> DataStore:
    return current_app.config["STORE"]


def _driver_exists(driver_id: int) -> bool:
    return _store().get_driver(driver_id) is not None


@drivers_bp.get("/<int:driver_id>/rides/available")
def available_rides(driver_id: int) -> tuple:
    if not _driver_exists(driver_id):
        return jsonify({"error": "Driver not found"}), 404
    rides = _store().get_available_rides()
    return jsonify(rides), 200


@drivers_bp.post("/<int:driver_id>/rides/<int:ride_id>/accept")
def accept_ride(driver_id: int, ride_id: int) -> tuple:
    if not _driver_exists(driver_id):
        return jsonify({"error": "Driver not found"}), 404
    try:
        ride = _store().assign_driver_to_ride(driver_id, ride_id)
    except KeyError:
        return jsonify({"error": "Ride not found"}), 404
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    return jsonify(ride), 200


@drivers_bp.post("/<int:driver_id>/status")
def update_status(driver_id: int) -> tuple:
    if not _driver_exists(driver_id):
        return jsonify({"error": "Driver not found"}), 404
    payload = request.get_json(force=True)
    try:
        status = DriverStatus(payload["status"])
    except (KeyError, ValueError) as exc:
        return jsonify({"error": f"Invalid payload: {exc}"}), 400
    profile = _store().update_driver_status(driver_id, status)
    return jsonify(profile), 200
