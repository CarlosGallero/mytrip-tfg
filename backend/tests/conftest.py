import sys
import os
import pytest
from fastapi.testclient import TestClient

# Asegurar que el directorio raíz del backend esté en sys.path
backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

from app.main import app

@pytest.fixture
def client():
    """Cliente HTTP de prueba para interactuar con los endpoints de FastAPI."""
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c

@pytest.fixture
def sample_user_data():
    return {
        "username": "testuser_qa",
        "email": "testuser_qa@example.com",
        "password": "Password123!",
        "origin_country": "España",
        "preferred_currency": "EUR"
    }

@pytest.fixture
def sample_trip_request_data():
    return {
        "destination": "Cádiz, España",
        "country_name": "España",
        "origin_country": "España",
        "start_date": "2026-10-10",
        "end_date": "2026-10-12",
        "total_days": 3,
        "total_nights": 2,
        "budget": 200,
        "currency": "EUR",
        "has_mobility_issues": False,
        "health_conditions": [],
        "dietary_preferences": ["Vegana"],
        "interests": ["Actividades para niños", "Historia y patrimonio"],
        "custom_interests": [],
        "specific_places": [],
        "pace_type": "global",
        "global_pace": "moderate",
        "daily_pace": []
    }
