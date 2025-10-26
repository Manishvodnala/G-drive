"""Admin specific routes."""
from __future__ import annotations

from flask import Blueprint, current_app, jsonify, request

from ..models import Role
from ..store import DataStore

admin_bp = Blueprint("admin", __name__, url_prefix="/admin")


def _store() -> DataStore:
    return current_app.config["STORE"]


@admin_bp.post("/users")
def create_user() -> tuple:
    payload = request.get_json(force=True)
    try:
        name = payload["name"]
        role = Role(payload["role"])
    except (KeyError, ValueError) as exc:  # noqa: PERF203 - readability over micro-opt
        return jsonify({"error": f"Invalid payload: {exc}"}), 400

    data = _store().create_user(name=name, role=role)
    return jsonify(data), 201


@admin_bp.get("/users")
def list_users() -> tuple:
    return jsonify(_store().list_users()), 200
