# Taxi Hailing Platform

A simple Flask-based taxi hailing platform that demonstrates the interaction between admin, onboarding, driver, and rider flows. The app uses an in-memory data store and is intended for experimentation or as a starting point for a fuller implementation.

## Features

- **Admin**: create and list users with roles (admin, driver, rider).
- **Onboarding**: create driver profiles and manage their status.
- **Driver**: view available ride requests, accept rides, and update availability status.
- **Rider**: request rides and review ride history.

## Getting Started

1. Create a virtual environment (optional but recommended):

   ```bash
   python -m venv .venv
   source .venv/bin/activate
   ```

2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Run the development server:

   ```bash
   flask --app app run --debug
   ```

4. Interact with the API using a REST client or `curl`.

## Example Workflow

1. Create users for an admin, a driver, and a rider:

   ```bash
   curl -X POST http://localhost:5000/admin/users \
     -H "Content-Type: application/json" \
     -d '{"name": "Alice", "role": "admin"}'

   curl -X POST http://localhost:5000/admin/users \
     -H "Content-Type: application/json" \
     -d '{"name": "Bob", "role": "driver"}'

   curl -X POST http://localhost:5000/admin/users \
     -H "Content-Type: application/json" \
     -d '{"name": "Carol", "role": "rider"}'
   ```

2. Onboard the driver and activate them:

   ```bash
   curl -X POST http://localhost:5000/onboarding/driver \
     -H "Content-Type: application/json" \
     -d '{"user_id": 2, "vehicle": "Toyota Prius", "license_number": "XYZ123"}'

   curl -X PATCH http://localhost:5000/onboarding/driver/1/status \
     -H "Content-Type: application/json" \
     -d '{"status": "active"}'
   ```

3. Rider requests a trip:

   ```bash
   curl -X POST http://localhost:5000/riders/3/ride-request \
     -H "Content-Type: application/json" \
     -d '{"pickup": "Downtown", "dropoff": "Airport"}'
   ```

4. Driver views and accepts the request:

   ```bash
   curl http://localhost:5000/drivers/1/rides/available

   curl -X POST http://localhost:5000/drivers/1/rides/1/accept
   ```

5. Check ride history for the rider:

   ```bash
   curl http://localhost:5000/riders/3/rides
   ```

## Running Tests

```bash
pytest
```
