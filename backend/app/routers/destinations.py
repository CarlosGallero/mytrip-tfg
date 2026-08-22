from fastapi import APIRouter, HTTPException, status, Depends
from app.models.user import UserResponse
from app.models.destination import DestinationInfoRequest, DestinationInfoResponse, ValidatePlaceRequest, ValidatePlaceResponse
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
    Obtiene la información de viaje del país destino.
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

@router.post("/validate-place", response_model=ValidatePlaceResponse)
async def validate_destination_place(
    request: ValidatePlaceRequest,
    current_user: UserResponse = Depends(get_current_user_token)
):
    """
    Verifica mediante IA si un monumento o lugar específico se encuentra
    dentro de la ciudad destino indicada.
    """
    try:
        return await DestinationService.validate_place_location(
            place_name=request.place_name,
            destination_city=request.destination_city,
            destination_country=request.destination_country
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al validar lugar del destino: {str(e)}"
        )
