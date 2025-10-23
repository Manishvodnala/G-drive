"""Taxi hailing platform application factory."""
from __future__ import annotations

from flask import Flask

from .store import DataStore
from .routes.admin import admin_bp
from .routes.onboarding import onboarding_bp
from .routes.drivers import drivers_bp
from .routes.riders import riders_bp


def create_app(store: DataStore | None = None) -> Flask:
    """Create and configure a Flask application."""
    app = Flask(__name__)
    app.config.setdefault("STORE", store or DataStore())

    app.register_blueprint(admin_bp)
    app.register_blueprint(onboarding_bp)
    app.register_blueprint(drivers_bp)
    app.register_blueprint(riders_bp)

    @app.get("/")
    def index() -> dict[str, str]:
        return {"message": "Taxi Hailing Platform API"}

    return app
