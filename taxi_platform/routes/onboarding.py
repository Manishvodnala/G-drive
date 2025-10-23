"""Driver onboarding routes."""
from __future__ import annotations

from flask import Blueprint, current_app, jsonify, request

from ..models import DriverStatus, Role
from ..store import DataStore

onboarding_bp = Blueprint("onboarding", __name__, url_prefix="/onboarding")


def _store() -> DataStore:
    return current_app.config["STORE"]


@onboarding_bp.post("/driver")
def create_driver_profile() -> tuple:
    payload = request.get_json(force=True)
    try:
        user_id = int(payload["user_id"])
        vehicle = payload["vehicle"]
        license_number = payload["license_number"]
    except (KeyError, ValueError) as exc:
        return jsonify({"error": f"Invalid payload: {exc}"}), 400

    user = _store().get_user(user_id)
    if not user or user.role != Role.DRIVER:
        return jsonify({"error": "User must exist and have driver role"}), 400

    profile = _store().create_driver_profile(
        user_id=user_id, vehicle=vehicle, license_number=license_number
    )
    return jsonify(profile), 201


@onboarding_bp.patch("/driver/<int:driver_id>/status")
def update_driver_status(driver_id: int) -> tuple:
    payload = request.get_json(force=True)
    try:
        status = DriverStatus(payload["status"])
    except (KeyError, ValueError) as exc:
        return jsonify({"error": f"Invalid payload: {exc}"}), 400

    profile = _store().update_driver_status(driver_id, status)
    return jsonify(profile), 200


@onboarding_bp.get("/drivers")
def list_driver_profiles() -> tuple:
    return jsonify(_store().list_driver_profiles()), 200
