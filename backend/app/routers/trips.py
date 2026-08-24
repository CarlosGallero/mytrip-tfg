import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.db.mongodb import get_database
from app.models.trips import GenerateTripRequest, TripResponse, RegenerateSlotRequest
from app.models.user import UserResponse
from app.routers.auth import get_current_user_token
from app.services.itinerary_service import ItineraryService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/trips", tags=["Viajes e Itinerarios"])

@router.post("/generate", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
async def generate_trip_itinerary(
    request: GenerateTripRequest,
    current_user: UserResponse = Depends(get_current_user_token),
    db = Depends(get_database)
):
    """
    Genera un itinerario 100% personalizado mediante IA (Gemini),
    enriquecido con enlaces de Google Maps,
    y lo almacena en la base de datos MongoDB del usuario.
    """
    try:
        user_id = str(current_user.id)
        return await ItineraryService.generate_itinerary(
            req=request,
            user_id=user_id,
            db=db
        )
    except Exception as e:
        logger.error(f"Error al generar itinerario: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al generar el itinerario: {str(e)}"
        )

@router.post("/{trip_id}/regenerate-slot", response_model=TripResponse)
async def regenerate_trip_slot(
    trip_id: str,
    request: RegenerateSlotRequest,
    current_user: UserResponse = Depends(get_current_user_token),
    db = Depends(get_database)
):
    """
    Regenera una actividad o restaurante individual de un día manteniendo la
    optimización de zona/distancia, presupuesto, accesibilidad y preferencias dietéticas.
    """
    try:
        user_id = str(current_user.id)
        updated_trip = await ItineraryService.regenerate_slot(
            trip_id=trip_id,
            day_number=request.day_number,
            slot_index=request.slot_index,
            replacement_type=request.replacement_type,
            user_id=user_id,
            db=db
        )
        if not updated_trip:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Viaje, día o actividad no encontrada."
            )
        return updated_trip
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error regenerando slot del viaje: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al cambiar la actividad: {str(e)}"
        )

@router.get("", response_model=List[TripResponse])
async def get_my_trips(
    current_user: UserResponse = Depends(get_current_user_token),
    db = Depends(get_database)
):
    """Obtiene todos los viajes generados y guardados del usuario actual."""
    try:
        user_id = str(current_user.id)
        return await ItineraryService.get_user_trips(user_id=user_id, db=db)
    except Exception as e:
        logger.error(f"Error al listar viajes del usuario: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al recuperar los viajes guardados."
        )

@router.get("/{trip_id}", response_model=TripResponse)
async def get_trip_details(
    trip_id: str,
    current_user: UserResponse = Depends(get_current_user_token),
    db = Depends(get_database)
):
    """Obtiene el detalle completo de un itinerario por su ID."""
    user_id = str(current_user.id)
    trip = await ItineraryService.get_trip_by_id(trip_id=trip_id, user_id=user_id, db=db)
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Viaje no encontrado o no pertenece a tu cuenta."
        )
    return trip

@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_trip(
    trip_id: str,
    current_user: UserResponse = Depends(get_current_user_token),
    db = Depends(get_database)
):
    """Elimina un viaje del usuario."""
    user_id = str(current_user.id)
    deleted = await ItineraryService.delete_trip(trip_id=trip_id, user_id=user_id, db=db)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se pudo eliminar el viaje (no encontrado o sin permisos)."
        )
    return None
