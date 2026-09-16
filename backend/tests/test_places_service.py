import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.places_service import PlacesService

@pytest.mark.asyncio
async def test_places_service_operational_filtering_and_price_labels():
    # Simular respuesta de Google Places API
    mock_places_data = {
        "places": [
            {
                "id": "place_1",
                "displayName": {"text": "Restaurante Vegano Bio"},
                "formattedAddress": "Calle Real 1, Cádiz",
                "businessStatus": "OPERATIONAL",
                "priceLevel": "PRICE_LEVEL_INEXPENSIVE",
                "rating": 4.8,
                "userRatingCount": 150,
                "googleMapsUri": "https://maps.google.com/?cid=1"
            },
            {
                "id": "place_2",
                "displayName": {"text": "Local Cerrado"},
                "formattedAddress": "Calle Falsa 123",
                "businessStatus": "CLOSED_PERMANENTLY",
                "priceLevel": "PRICE_LEVEL_MODERATE"
            },
            {
                "id": "place_3",
                "displayName": {"text": "Parque Infantil Genovés"},
                "formattedAddress": "Parque Genovés, Cádiz",
                "businessStatus": "OPERATIONAL",
                "priceLevel": "PRICE_LEVEL_FREE",
                "rating": 4.6,
                "userRatingCount": 500,
                "googleMapsUri": "https://maps.google.com/?cid=3"
            },
            {
                "id": "place_4",
                "displayName": {"text": "Restaurante Gourmet Alta Cocina"},
                "formattedAddress": "Paseo Marítimo 10, Cádiz",
                "businessStatus": "OPERATIONAL",
                "priceRange": {
                    "startPrice": {"units": "40", "currencyCode": "EUR"},
                    "endPrice": {"units": "75", "currencyCode": "EUR"}
                },
                "rating": 4.9,
                "googleMapsUri": "https://maps.google.com/?cid=4"
            }
        ]
    }

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = mock_places_data

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_response):
        with patch("app.services.places_service.settings.GOOGLE_PLACES_API_KEY", "fake_key_123"):
            results = await PlacesService.get_verified_places(
                city_name="Cádiz",
                zone_name="Centro",
                db=None,
                category="restaurant",
                max_results=5
            )

    # Solo deben estar los 3 operativos (el cerrado permanentemente se descarta)
    assert len(results) == 3

    # Comprobar lugar 1 (Inexpensive)
    p1 = next(p for p in results if p["name"] == "Restaurante Vegano Bio")
    assert "Económico" in p1["price_level_label"]
    assert p1["rating"] == 4.8

    # Comprobar lugar 3 (Free)
    p3 = next(p for p in results if p["name"] == "Parque Infantil Genovés")
    assert "GRATUITO" in p3["price_level_label"]

    # Comprobar lugar 4 (priceRange)
    p4 = next(p for p in results if p["name"] == "Restaurante Gourmet Alta Cocina")
    assert "40-75 EUR" in p4["price_level_label"]

@pytest.mark.asyncio
async def test_places_service_diet_and_kids_query_construction():
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"places": []}

    captured_payloads = []

    async def fake_post(url, headers=None, json=None):
        captured_payloads.append(json)
        return mock_response

    with patch("httpx.AsyncClient.post", side_effect=fake_post):
        with patch("app.services.places_service.settings.GOOGLE_PLACES_API_KEY", "fake_key_123"):
            # 1. Búsqueda de dieta
            await PlacesService.get_verified_places(
                city_name="Cádiz",
                zone_name="Centro",
                db=None,
                category="diet:Sin gluten (Celiaquía)"
            )

            # 2. Búsqueda de niños
            await PlacesService.get_verified_places(
                city_name="Cádiz",
                zone_name="Centro",
                db=None,
                category="kids_activities"
            )

    assert len(captured_payloads) == 2
    # El primer payload debe incluir la búsqueda sin gluten
    assert "sin gluten" in captured_payloads[0]["textQuery"].lower()
    # El segundo payload debe incluir actividades para niños
    assert "niños" in captured_payloads[1]["textQuery"].lower() or "familias" in captured_payloads[1]["textQuery"].lower()