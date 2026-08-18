from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional

class DestinationInfoRequest(BaseModel):
    destination: str = Field(
        ...,
        min_length=2,
        max_length=150,
        description="Ciudad o destino de viaje (ej. 'Tokio, Japón' o 'París')"
    )

class EstimatedDailyCost(BaseModel):
    currency: str = Field(..., description="Moneda del país del usuario (ej. 'EUR', 'USD', 'MXN')")
    total_daily_cost: float = Field(..., description="Gasto diario aproximado total por persona")
    food_daily_cost: float = Field(..., description="Gasto diario estimado en restaurantes y comidas")
    activities_daily_cost: float = Field(..., description="Gasto diario estimado en actividades, tours, museos y parques")
    breakdown_details: str = Field(..., description="Explicación del desglose del coste estimado diario")

class DestinationInfoResponse(BaseModel):
    destination_city: str = Field(..., description="Ciudad destino identificada")
    country_name: str = Field(..., description="Nombre oficial del país destino en español")
    flag_emoji: str = Field(..., description="Emoji de la bandera del país")
    currency: str = Field(..., description="Moneda usada con su símbolo y código en el país destino")
    passport_required: bool = Field(..., description="Si el usuario necesita pasaporte según su país origen")
    passport_details: str = Field(..., description="Detalles sobre requisitos de pasaporte y visado")
    vaccination_required: bool = Field(..., description="Si se exigen vacunas obligatorias para ingresar")
    vaccination_details: str = Field(..., description="Detalles sobre vacunación y consejos de salud")
    has_armed_conflict: bool = Field(..., description="Si existe guerra o conflicto armado activo")
    conflict_details: str = Field(..., description="Información de seguridad o situación bélica")
    origin_country: str = Field(..., description="País de origen del usuario registrado")
    passport_application_url: Optional[str] = Field(
        default=None,
        description="Enlace web oficial gubernamental para solicitar o renovar el pasaporte en el país de origen"
    )
    passport_authority_name: Optional[str] = Field(
        default=None,
        description="Nombre del organismo oficial emisor del pasaporte en el país de origen"
    )
    passport_instructions: Optional[str] = Field(
        default=None,
        description="Instrucciones breves oficiales para tramitar el pasaporte"
    )

class PassportLinkInDB(BaseModel):
    country: str = Field(..., description="Nombre del país de origen")
    passport_application_url: str = Field(..., description="URL oficial del portal de tramitación/cita previa")
    authority_name: str = Field(..., description="Organismo público oficial")
    instructions: Optional[str] = Field(default=None, description="Instrucciones del trámite")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CountryTravelInfoInDB(BaseModel):
    origin_country: str
    destination_country: str
    destination_city: str
    search_query: str
    flag_emoji: str
    currency: str
    passport_required: bool
    passport_details: str
    vaccination_required: bool
    vaccination_details: str
    has_armed_conflict: bool
    conflict_details: str
    estimated_daily_cost: Optional[EstimatedDailyCost] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
