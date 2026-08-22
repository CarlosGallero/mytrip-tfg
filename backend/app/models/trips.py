from datetime import datetime
from pydantic import BaseModel, Field
from typing import List, Optional

class ItineraryActivity(BaseModel):
    time_slot: str = Field(..., description="Franja horaria: morning, lunch, afternoon, dinner, night")
    time_range: str = Field(..., description="Horario sugerido (ej. '10:00 - 12:30')")
    title: str = Field(..., description="Nombre oficial del lugar o restaurante")
    type: str = Field(..., description="Tipo: activity, restaurant, monument, culture, beach, leisure")
    description: str = Field(..., description="Descripción detallada de la visita o gastronomía")
    estimated_cost: float = Field(..., description="Coste estimado por persona en la divisa del viaje")
    currency: str = Field(default="EUR", description="Moneda (ej. EUR)")
    address: str = Field(..., description="Dirección o barrio aproximado")
    maps_url: str = Field(..., description="Enlace universal directo a Google Maps con ubicación y web oficial")
    image_url: Optional[str] = Field(default=None, description="URL de imagen real verificada de Wikipedia/Wikimedia")
    selection_reasons: List[str] = Field(default_factory=list, description="Motivos concisos por los que se ha asignado esta actividad")

class ItineraryDay(BaseModel):
    day_number: int = Field(..., description="Número de día (1, 2, 3...)")
    date: str = Field(..., description="Fecha en formato YYYY-MM-DD")
    day_of_week: str = Field(..., description="Día de la semana en español (ej. Lunes, Martes)")
    zone_name: str = Field(..., description="Barrio o zona geográfica agrupada para este día")
    daily_estimated_cost: float = Field(..., description="Gasto total estimado para este día")
    pace: str = Field(default="moderate", description="Ritmo del día: relaxed, moderate, intense")
    slots: List[ItineraryActivity] = Field(default_factory=list, description="Actividades y comidas del día")

class DayPaceItem(BaseModel):
    dayNumber: int
    dateStr: str
    pace: str

class GenerateTripRequest(BaseModel):
    destination: str = Field(..., min_length=2, max_length=150)
    country_name: Optional[str] = Field(default=None)
    origin_country: Optional[str] = Field(default=None)
    start_date: str = Field(...)
    end_date: str = Field(...)
    total_days: int = Field(..., gt=0)
    total_nights: int = Field(default=0)
    budget: float = Field(..., gt=0)
    currency: str = Field(default="EUR")
    has_mobility_issues: Optional[bool] = Field(default=False)
    health_conditions: Optional[List[str]] = Field(default_factory=list)
    dietary_preferences: Optional[List[str]] = Field(default_factory=list)
    interests: Optional[List[str]] = Field(default_factory=list)
    custom_interests: Optional[List[str]] = Field(default_factory=list)
    specific_places: Optional[List[str]] = Field(default_factory=list)
    pace_type: Optional[str] = Field(default="global")
    global_pace: Optional[str] = Field(default="moderate")
    daily_pace: Optional[List[DayPaceItem]] = Field(default_factory=list)

class TripResponse(BaseModel):
    id: str
    user_id: str
    destination: str
    destination_city: str
    country_name: str
    start_date: str
    end_date: str
    total_days: int
    total_nights: int
    total_budget: float
    total_estimated_cost: float
    currency: str
    has_mobility_issues: bool
    health_conditions: List[str]
    dietary_preferences: List[str]
    interests: List[str]
    specific_places: List[str]
    pace_type: str
    global_pace: str
    days: List[ItineraryDay]
    created_at: datetime
    updated_at: datetime
