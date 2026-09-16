import pytest
from unittest.mock import AsyncMock, patch
from app.models.destination import ValidatePlaceResponse

def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "version" in data

def test_auth_countries_endpoint(client):
    response = client.get("/api/v1/auth/countries")
    assert response.status_code == 200
    countries = response.json()
    assert isinstance(countries, list)
    assert "España" in countries
    assert "Japón" in countries
    assert len(countries) > 100

def test_auth_register_validation_error_missing_fields(client):
    # Enviar payload vacío
    response = client.post("/api/v1/auth/register", json={})
    assert response.status_code == 422 # Unprocessable Entity

def test_auth_register_password_mismatch(client):
    payload = {
        "first_name": "Carlos",
        "last_name": "Gallero",
        "username": "cgallero",
        "password": "Password123!",
        "confirm_password": "DifferentPassword!",
        "country_of_residence": "España"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422
    assert "Las contraseñas no coinciden" in response.text

def test_auth_login_invalid_credentials(client):
    with patch("app.services.user_service.UserService.get_user_by_username", new_callable=AsyncMock, return_value=None):
        payload = {
            "username": "nonexistent_user",
            "password": "WrongPassword123!"
        }
        response = client.post("/api/v1/auth/login", json=payload)
        assert response.status_code == 401
        assert "incorrectos" in response.json()["detail"]
