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
    total_daily_cost: float = Field(..., description="Gasto diario aproximado total por persona en esa ciudad")
    food_daily_cost: float = Field(..., description="Gasto diario estimado en 1 desayuno y 1 comida en restaurante")
    activities_daily_cost: float = Field(..., description="Gasto diario estimado en 1 actividad turística/cultural")
    breakdown_details: str = Field(..., description="Explicación del desglose del coste estimado diario para la ciudad")

class DestinationInfoResponse(BaseModel):
    destination_city: str = Field(..., description="Ciudad destino identificada")
    country_name: str = Field(..., description="Nombre oficial del país destino en español")
    flag_emoji: str = Field(..., description="Emoji o código de la bandera del país")
    flag_image_url: Optional[str] = Field(default=None, description="URL de alta resolución de la bandera oficial")
    country_code: Optional[str] = Field(default=None, description="Código ISO-2 del país destino (ej. 'ES', 'JP')")
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
    estimated_daily_cost: Optional[EstimatedDailyCost] = Field(
        default=None,
        description="Presupuesto diario medio estimado por persona en esa ciudad (1 desayuno + 1 comida + 1 actividad)"
    )

class PassportLinkInDB(BaseModel):
    country: str = Field(..., description="Nombre del país de origen")
    passport_application_url: str = Field(..., description="URL oficial del portal de tramitación/cita previa")
    authority_name: str = Field(..., description="Organismo público oficial")
    instructions: Optional[str] = Field(default=None, description="Instrucciones del trámite")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CityDailyCostInDB(BaseModel):
    destination_city: str = Field(..., description="Nombre de la ciudad")
    destination_country: str = Field(..., description="Nombre del país")
    currency: str = Field(..., description="Moneda en la que se calcula el coste (ej. EUR, USD)")
    total_daily_cost: float = Field(..., description="Coste total diario por persona")
    food_daily_cost: float = Field(..., description="Coste en 1 desayuno + 1 comida en restaurante")
    activities_daily_cost: float = Field(..., description="Coste en 1 actividad o entrada cultural")
    breakdown_details: str = Field(..., description="Detalle del cálculo para la ciudad")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CountryTravelInfoInDB(BaseModel):
    origin_country: str
    destination_country: str
    destination_city: str
    search_query: str
    flag_emoji: str
    flag_image_url: Optional[str] = None
    country_code: Optional[str] = None
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
