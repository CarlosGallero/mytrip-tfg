import pytest
from pydantic import ValidationError
from app.models.user import UserCreate, UserLogin
from app.models.trips import GenerateTripRequest
from app.models.destination import (
    DestinationInfoRequest,
    ValidatePlaceRequest,
    EstimatedDailyCost,
    TransportInfo,
    AccommodationInfo,
    DestinationInfoResponse
)

def test_user_create_valid():
    user = UserCreate(
        first_name="Carlos",
        last_name="Gallero",
        username="cgallero",
        password="SecretPassword123",
        confirm_password="SecretPassword123",
        country_of_residence="España"
    )
    assert user.username == "cgallero"
    assert user.country_of_residence == "España"

def test_user_create_password_mismatch():
    with pytest.raises(ValidationError) as exc_info:
        UserCreate(
            first_name="Carlos",
            last_name="Gallero",
            username="cgallero",
            password="Password1",
            confirm_password="Password2",
            country_of_residence="España"
        )
    assert "Las contraseñas no coinciden" in str(exc_info.value)

def test_user_create_invalid_country():
    with pytest.raises(ValidationError) as exc_info:
        UserCreate(
            first_name="Carlos",
            last_name="Gallero",
            username="cgallero",
            password="Password123",
            confirm_password="Password123",
            country_of_residence="PaisInexistente123"
        )
    assert "El país seleccionado no es válido" in str(exc_info.value)

def test_user_create_short_username():
    with pytest.raises(ValidationError):
        UserCreate(
            first_name="Carlos",
            last_name="Gallero",
            username="abc", # Mínimo 5
            password="Password123",
            confirm_password="Password123",
            country_of_residence="España"
        )

def test_generate_trip_request_valid(sample_trip_request_data):
    req = GenerateTripRequest(**sample_trip_request_data)
    assert req.destination == "Cádiz, España"
    assert req.total_days == 3
    assert req.budget == 200
    assert "Vegana" in req.dietary_preferences
    assert "Actividades para niños" in req.interests

def test_destination_transport_and_accommodation_models():
    transport = TransportInfo(
        how_to_arrive="Vuelo directo o tren alta velocidad (50€)",
        local_mobility="Metro y autobús urbano (1.50€ el billete)",
        price_variation_factors="Aumenta en julio y agosto",
        estimated_range="40€ - 120€"
    )
    assert transport.estimated_range == "40€ - 120€"

    accom = AccommodationInfo(
        average_price_per_night="70€ - 120€ / noche",
        category_breakdown="Hostels: 25€ | Hoteles 3★: 80€ | Apartamentos: 95€",
        seasonal_variation="Más caro en verano y fines de semana"
    )
    assert "70€ - 120€" in accom.average_price_per_night

    daily_cost = EstimatedDailyCost(
        currency="EUR",
        total_daily_cost=32.0,
        food_daily_cost=22.0,
        activities_daily_cost=10.0,
        breakdown_details="Desayuno + comida + museo"
    )
    assert daily_cost.total_daily_cost == 32.0

    dest_response = DestinationInfoResponse(
        destination_city="Cádiz",
        country_name="España",
        flag_emoji="🇪🇸",
        currency="Euro (€ / EUR)",
        passport_required=False,
        passport_details="Viaje nacional",
        vaccination_required=False,
        vaccination_details="Ninguna obligatoria",
        has_armed_conflict=False,
        conflict_details="Zona pacífica",
        origin_country="España",
        estimated_daily_cost=daily_cost,
        transport_info=transport,
        accommodation_info=accom
    )
    assert dest_response.destination_city == "Cádiz"
    assert dest_response.transport_info.estimated_range == "40€ - 120€"
    assert dest_response.accommodation_info.average_price_per_night == "70€ - 120€ / noche"
