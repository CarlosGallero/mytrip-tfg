from fastapi import APIRouter, HTTPException, status, Depends
from app.models.user import UserResponse
from app.models.destination import DestinationInfoRequest, DestinationInfoResponse
from app.routers.auth import get_current_user_token
from app.services.destination_service import DestinationService

router = APIRouter(prefix="/api/v1/destinations", tags=["Destinos"])

@router.post("/travel-info", response_model=DestinationInfoResponse)
async def get_destination_travel_info(
    request: DestinationInfoRequest,
    current_user: UserResponse = Depends(get_current_user_token)
):
    """
    Obtiene la información de viaje del país destino mediante la API de Gemini:
    - Bandera del país
    - Moneda oficial
    - Si hace falta pasaporte (en función del país de origen del usuario registrado)
    - Si hace falta vacunación
    - Si hay guerras o conflictos armados
    """
    try:
        origin_country = current_user.country_of_residence or "España"
        return await DestinationService.get_travel_info(
            destination=request.destination,
            origin_country=origin_country
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener información del país destino: {str(e)}"
        )
