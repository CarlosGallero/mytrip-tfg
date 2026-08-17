from pydantic import BaseModel, Field
from typing import Optional

class DestinationInfoRequest(BaseModel):
    destination: str = Field(
        ...,
        min_length=2,
        max_length=150,
        description="Ciudad o destino de viaje (ej. 'Tokio, Japón' o 'París')"
    )

class DestinationInfoResponse(BaseModel):
    destination_city: str = Field(..., description="Ciudad destino identificada")
    country_name: str = Field(..., description="Nombre oficial del país destino en español")
    flag_emoji: str = Field(..., description="Emoji de la bandera del país")
    currency: str = Field(..., description="Moneda usada con su símbolo y código")
    passport_required: bool = Field(..., description="Si el usuario necesita pasaporte según su país origen")
    passport_details: str = Field(..., description="Detalles sobre requisitos de pasaporte y visado")
    vaccination_required: bool = Field(..., description="Si se exigen vacunas obligatorias para ingresar")
    vaccination_details: str = Field(..., description="Detalles sobre vacunación y consejos de salud")
    has_armed_conflict: bool = Field(..., description="Si existe guerra o conflicto armado activo")
    conflict_details: str = Field(..., description="Información de seguridad o situación bélica")
    origin_country: str = Field(..., description="País de origen del usuario registrado")
