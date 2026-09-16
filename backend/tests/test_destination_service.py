import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.destination_service import DestinationService
from app.models.destination import TransportInfo, AccommodationInfo, EstimatedDailyCost

def test_destination_service_fallback():
    fallback = DestinationService._generate_fallback(
        destination="Tokio, Japón",
        origin_country="España",
        user_currency="EUR"
    )

    assert fallback.destination_city == "Tokio"
    assert fallback.country_name == "Japón"
    assert fallback.passport_required is True
    assert fallback.estimated_daily_cost is not None
    assert fallback.transport_info is not None
    assert fallback.accommodation_info is not None

def test_destination_service_fallback_national():
    fallback = DestinationService._generate_fallback(
        destination="Sevilla, España",
        origin_country="España",
        user_currency="EUR"
    )

    assert fallback.destination_city == "Sevilla"
    assert fallback.passport_required is False
    assert "nacional" in fallback.passport_details.lower()

@pytest.mark.asyncio
async def test_destination_service_lazy_migration_updates_db():
    # Simular documento antiguo de MongoDB sin transporte ni alojamiento
    old_doc = {
        "_id": "doc_id_123",
        "origin_country": "España",
        "destination_country": "Francia",
        "destination_city": "París",
        "search_query": "París, Francia",
        "flag_emoji": "🇫🇷",
        "currency": "EUR",
        "passport_required": False,
        "passport_details": "Espacio Schengen",
        "vaccination_required": False,
        "vaccination_details": "Sin vacunas",
        "has_armed_conflict": False,
        "conflict_details": "País seguro",
        # transport_info y accommodation_info ausentes
    }

    mock_col_country = MagicMock()
    mock_col_country.find_one = AsyncMock(return_value=old_doc)
    mock_col_country.update_one = AsyncMock(return_value=None)

    mock_col_city = MagicMock()
    mock_col_city.find_one = AsyncMock(return_value=None)

    cols = {
        "country_travel_info": mock_col_country,
        "city_daily_costs": mock_col_city,
        "passport_links": MagicMock()
    }

    mock_db = MagicMock()
    mock_db.__getitem__.side_effect = lambda k: cols.get(k, MagicMock())

    fake_transport = TransportInfo(
        how_to_arrive="Vuelo directo Madrid-París (75€)",
        local_mobility="Metro de París (2.15€ billete)",
        price_variation_factors="Sube en verano",
        estimated_range="50€ - 150€"
    )
    fake_accom = AccommodationInfo(
        average_price_per_night="85€ - 160€ / noche",
        category_breakdown="Hostels: 35€ | Hoteles: 110€ | Apartamentos: 130€",
        seasonal_variation="Tarifas superiores en temporada alta"
    )

    with patch.object(DestinationService, "get_transport_and_accommodation_info", new_callable=AsyncMock, return_value=(fake_transport, fake_accom)):
        with patch.object(DestinationService, "get_city_daily_cost", new_callable=AsyncMock, return_value=None):
            result = await DestinationService.get_travel_info(
                destination="París, Francia",
                origin_country="España",
                user_currency="EUR",
                db=mock_db
            )

    # Verificar que el resultado ahora incluye transporte y alojamiento
    assert result.destination_city == "París"
    assert result.transport_info is not None
    assert result.transport_info.how_to_arrive == "Vuelo directo Madrid-París (75€)"
    assert result.accommodation_info is not None
    assert result.accommodation_info.average_price_per_night == "85€ - 160€ / noche"

    # Verificar que se llamó a update_one para persistir en MongoDB Atlas
    mock_col_country.update_one.assert_called_once()
    call_args = mock_col_country.update_one.call_args[0]
    assert call_args[0] == {"_id": "doc_id_123"}
    update_dict = call_args[1].get('$set', {})
    assert "transport_info" in update_dict
    assert "accommodation_info" in update_dict