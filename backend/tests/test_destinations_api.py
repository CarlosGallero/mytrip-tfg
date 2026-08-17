import asyncio
import sys
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.routers.auth import get_current_user_token
from app.models.user import UserResponse

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

async def mock_current_user():
    return UserResponse(
        id="651a2b3c4d5e6f7a8b9c0d1e",
        first_name="Carlos",
        last_name="García",
        username="testuser_es",
        country_of_residence="España",
        default_currency="EUR"
    )

async def run_tests():
    # Override de dependencia de autenticación para pruebas controladas
    app.dependency_overrides[get_current_user_token] = mock_current_user

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        test_destinations = [
            ("Tokio, Japón", "Japón", True),
            ("París, Francia", "Francia", False),
            ("Kiev, Ucrania", "Ucrania", True),
        ]

        for dest, expected_country, expected_passport in test_destinations:
            print(f"\n==============================")
            print(f"Probando destino: {dest}")
            print(f"==============================")
            response = await ac.post(
                "/api/v1/destinations/travel-info",
                json={"destination": dest}
            )

            assert response.status_code == 200, f"Error {response.status_code}: {response.text}"
            data = response.json()

            print("-> Destino identificado:", data.get("destination_city"))
            print("-> País:", data.get("country_name"))
            print("-> Bandera:", data.get("flag_emoji"))
            print("-> Moneda:", data.get("currency"))
            print("-> Pasaporte necesario:", data.get("passport_required"))
            print("-> Detalle pasaporte:", data.get("passport_details"))
            print("-> Vacunación necesaria:", data.get("vaccination_required"))
            print("-> Detalle vacunación:", data.get("vaccination_details"))
            print("-> Conflicto armado / Guerra:", data.get("has_armed_conflict"))
            print("-> Detalle conflicto:", data.get("conflict_details"))

            assert expected_country.lower() in data.get("country_name").lower(), f"Expected {expected_country} in {data.get('country_name')}"
            assert data.get("flag_emoji") != "", "Flag emoji is empty"
            assert data.get("currency") != "", "Currency is empty"
            assert data.get("passport_required") == expected_passport, f"Expected passport_required {expected_passport} for {dest}"
            assert isinstance(data.get("vaccination_required"), bool)
            assert isinstance(data.get("has_armed_conflict"), bool)

        print("\n✅ ¡Todos los tests del endpoint de Gemini pasaron exitosamente!")

    app.dependency_overrides.clear()

if __name__ == "__main__":
    asyncio.run(run_tests())
