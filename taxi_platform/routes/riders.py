"""Rider specific routes."""
from __future__ import annotations

from flask import Blueprint, current_app, jsonify, request

from ..models import Role
from ..store import DataStore

riders_bp = Blueprint("riders", __name__, url_prefix="/riders")


def _store() -> DataStore:
    return current_app.config["STORE"]


def _rider_exists(rider_id: int) -> bool:
    user = _store().get_user(rider_id)
    return bool(user and user.role == Role.RIDER)


@riders_bp.post("/<int:rider_id>/ride-request")
def request_ride(rider_id: int) -> tuple:
    if not _rider_exists(rider_id):
        return jsonify({"error": "Rider not found"}), 404
    payload = request.get_json(force=True)
    try:
        pickup = payload["pickup"]
        dropoff = payload["dropoff"]
    except KeyError as exc:
        return jsonify({"error": f"Invalid payload: {exc}"}), 400

    ride = _store().create_ride_request(rider_id, pickup, dropoff)
    return jsonify(ride), 201


@riders_bp.get("/<int:rider_id>/rides")
def list_rides(rider_id: int) -> tuple:
    if not _rider_exists(rider_id):
        return jsonify({"error": "Rider not found"}), 404
    rides = _store().list_rides(rider_id=rider_id)
    return jsonify(rides), 200


@riders_bp.get("/rides")
def list_all_rides() -> tuple:
    rides = _store().list_rides()
    return jsonify(rides), 200
