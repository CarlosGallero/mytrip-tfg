from fastapi import APIRouter, HTTPException, status, Depends
from app.models.user import UserResponse
from app.models.destination import DestinationInfoRequest, DestinationInfoResponse
from app.routers.auth import get_current_user_token
from app.db.mongodb import get_database
from app.services.destination_service import DestinationService

router = APIRouter(prefix="/api/v1/destinations", tags=["Destinos"])

@router.post("/travel-info", response_model=DestinationInfoResponse)
async def get_destination_travel_info(
    request: DestinationInfoRequest,
    current_user: UserResponse = Depends(get_current_user_token),
    db = Depends(get_database)
):
    """
    Obtiene la información de viaje del país destino:
    - Consulta primero la base de datos MongoDB para evitar llamadas a Gemini si ya existe para ese país de origen.
    - Si no existe, llama a la API de Gemini:
      - Bandera del país
      - Moneda oficial
      - Si hace falta pasaporte (en función del país de origen del usuario registrado)
      - Si hace falta vacunación
      - Si hay guerras o conflictos armados
      - Estimación de gasto diario (comidas y actividades) en la moneda del usuario (guardado en DB para futuro uso)
    - Almacena el resultado en la base de datos para reutilizarlo con otros usuarios del mismo país origen.
    """
    try:
        origin_country = current_user.country_of_residence or "España"
        user_currency = current_user.default_currency or "EUR"
        return await DestinationService.get_travel_info(
            destination=request.destination,
            origin_country=origin_country,
            user_currency=user_currency,
            db=db
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener información del país destino: {str(e)}"
        )
