import json
import logging
import re
from datetime import datetime, timedelta
from typing import Any, List, Optional
from bson import ObjectId
from google import genai
from google.genai import types

from app.core.config import settings
from app.models.trips import (
    GenerateTripRequest,
    TripResponse,
    ItineraryDay,
    ItineraryActivity,
)
from app.services.image_service import get_google_maps_url

logger = logging.getLogger(__name__)

AVAILABLE_MODELS = [
    "gemini-3.5-flash",
    "gemini-3.6-flash",
    "gemini-3.7-flash",
    "gemini-flash-latest",
    "gemini-flash-lite-latest",
]

SPANISH_WEEKDAYS = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo",
]

class ItineraryService:
    @staticmethod
    def _clean_json_text(text: str) -> str:
        """Limpia bloques de markdown si el modelo los incluye."""
        text = text.strip()
        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?\s*", "", text)
            text = re.sub(r"\s*```$", "", text)
        return text.strip()

    @staticmethod
    def _compute_trip_dates(start_date_str: str, total_days: int) -> List[dict]:
        """Calcula las fechas reales y el día de la semana para cada jornada."""
        try:
            start_dt = datetime.strptime(start_date_str, "%Y-%m-%d")
        except Exception:
            start_dt = datetime.utcnow()

        days_info = []
        for i in range(total_days):
            current_dt = start_dt + timedelta(days=i)
            weekday_name = SPANISH_WEEKDAYS[current_dt.weekday()]
            date_str = current_dt.strftime("%Y-%m-%d")
            days_info.append({
                "day_number": i + 1,
                "date": date_str,
                "day_of_week": weekday_name,
            })
        return days_info

    @classmethod
    async def generate_itinerary(
        cls,
        req: GenerateTripRequest,
        user_id: str,
        db: Any
    ) -> TripResponse:
        """
        Genera un itinerario 100% personalizado orquestado por Gemini y enriquecido
        con imágenes reales de Wikipedia y enlaces de Google Maps.
        """
        clean_destination = req.destination.strip()
        parts = [p.strip() for p in clean_destination.split(",") if p.strip()]
        city_name = parts[0] if parts else clean_destination
        country_name = req.country_name or (parts[-1] if len(parts) > 1 else "España")

        # 1. Calcular días y fechas reales
        computed_days = cls._compute_trip_dates(req.start_date, req.total_days)

        # Mapear ritmo por día si existe
        daily_pace_map = {}
        if req.daily_pace:
            for dp in req.daily_pace:
                daily_pace_map[dp.dayNumber] = dp.pace

        days_summary_for_prompt = []
        for d in computed_days:
            num = d["day_number"]
            pace = daily_pace_map.get(num, req.global_pace or "moderate")
            days_summary_for_prompt.append(
                f"- Día {num}: {d['date']} ({d['day_of_week']}) | Ritmo deseado: {pace}"
            )

        # 2. Construir prompt detallado para Gemini
        mobility_clause = (
            "🚨 REQUISITO DE ACCESIBILIDAD CRÍTICO: El usuario tiene MOVILIDAD REDUCIDA. "
            "El itinerario debe incluir ÚNICAMENTE atracciones, museos y rutas 100% accesibles en silla de ruedas, "
            "con rampas, ascensores y transporte adaptado. Quedan totalmente prohibidas escaleras sin alternativa o desniveles pronunciados."
            if req.has_mobility_issues
            else "Movilidad: Estándar (puede caminar y subir escaleras normalmente)."
        )

        health_clause = (
            f"Condiciones de salud o alertas médicas a tener en cuenta: {', '.join(req.health_conditions)}"
            if req.health_conditions
            else "Salud: Sin condiciones especiales."
        )

        diet_clause = (
            f"🚨 PREFERENCIAS DIETÉTICAS O ALERGIAS: {', '.join(req.dietary_preferences)}. "
            "Cada restaurante propuesto (almuerzos y cenas) DEBE contar obligatoriamente con opciones de alta calidad para esta dieta "
            f"y reflejarlo en sus motivos de selección (ej. 'Menú con opciones {req.dietary_preferences[0]}')."
            if req.dietary_preferences
            else "Dieta: Estándar (gastronomía local variada)."
        )

        interests_list = (req.interests or []) + (req.custom_interests or [])
        interests_clause = (
            f"Intereses y temáticas preferidas: {', '.join(interests_list)}"
            if interests_list and "Indiferente" not in interests_list
            else "Intereses: Variados (muestra lo más icónico y representativo de la ciudad)."
        )

        specific_places_clause = (
            f"🚨 MONUMENTOS/LUGARES ESPECÍFICOS OBLIGATORIOS: El usuario ha pedido visitar obligatoriamente: {', '.join(req.specific_places)}. "
            "Debes distribuir estos lugares a lo largo de los días de forma coherente según la zona geográfica."
            if req.specific_places
            else "Sin monumentos fijos preseleccionados."
        )

        prompt = f"""
Eres un guía turístico y planificador de itinerarios de élite a nivel mundial.
Genera un itinerario COMPLETO, REALISTA, DETALLADO y ALTAMENTE PERSONALIZADO para un viaje a:
📍 Ciudad: "{city_name}" ({country_name})
📅 Fechas: Del {req.start_date} al {req.end_date} (Total: {req.total_days} días, {req.total_nights} noches)
💰 Presupuesto total para comidas y actividades: {req.budget} {req.currency}

REQUISITOS OBLIGATORIOS DEL VIAJERO:
1. {mobility_clause}
2. {health_clause}
3. {diet_clause}
4. {interests_clause}
5. {specific_places_clause}

CALENDARIO Y DÍAS DE LA SEMANA:
{chr(10).join(days_summary_for_prompt)}

DIRECTRICES CLAVE DE PLANIFICACIÓN:
A. HORARIOS Y DÍAS DE CIERRE:
   - Presta máxima atención a qué día de la semana cae cada jornada (por ejemplo, muchos museos cierran los lunes, tiendas los domingos).
   - No programes monumentos en sus días de cierre habituales.

B. OPTIMIZACIÓN GEOGRÁFICA (MISMA ZONA / BARRIO):
   - Las actividades de la mañana, el restaurante del almuerzo y las visitas de la tarde de un mismo día DEBEN estar en el mismo barrio o zona geográfica ("zone_name") para que el viajero pueda ir a pie o en trayectos cortos de menos de 10-15 minutos.

C. ESTRUCTURA POR FRANJAS HORARIAS:
   - Cada día debe contener bloques cronológicos claros en 'slots':
     * 'morning' (Mañana: ~09:30 - 13:00)
     * 'lunch' (Comida / Almuerzo en restaurante local adaptado a la dieta: ~13:30 - 15:30)
     * 'afternoon' (Tarde: ~16:00 - 19:30)
     * 'dinner' (Cena en restaurante o taberna típica: ~20:30 - 22:30)
     * 'night' (Paseo nocturno o espectáculo, si el ritmo del día es moderado/intenso).
   - Si el ritmo del día es 'relaxed', incluye menos actividades con tiempos más pausados. Si es 'intense', añade más visitas culturales.

D. DISTRIBUCIÓN DEL PRESUPUESTO ({req.budget} {req.currency}):
   - Distribuye el gasto total de forma flexible y equilibrada entre todos los días del viaje.
   - Cada actividad y restaurante debe tener su coste estimado aproximado por persona en 'estimated_cost'. La suma total de 'daily_estimated_cost' debe ser coherente con el presupuesto total.

E. MOTIVOS DE SELECCIÓN ('selection_reasons'):
   - Cada slot debe incluir una lista de 2 a 4 motivos concretos en formato etiqueta (ej. ["Historia y patrimonio", "Lugar solicitado", "Accesible en silla de ruedas", "Opciones Veganas", "A 5 min de la Catedral"]).

Responde ÚNICAMENTE con un objeto JSON válido con la siguiente estructura exacta:
{{
  "days": [
    {{
      "day_number": (entero: 1, 2...),
      "date": "YYYY-MM-DD",
      "day_of_week": "Nombre del día (ej. Lunes)",
      "zone_name": "Nombre del barrio o zona principal del día (ej. Centro Histórico y Barrio de Santa Cruz)",
      "daily_estimated_cost": (float con la suma de costes del día),
      "pace": "relaxed | moderate | intense",
      "slots": [
        {{
          "time_slot": "morning | lunch | afternoon | dinner | night",
          "time_range": "Horario estimado (ej. '10:00 - 12:30')",
          "title": "Nombre oficial y real del monumento, museo o restaurante (ej. 'Torre Tavira', 'Restaurante El Faro')",
          "type": "activity | restaurant | monument | culture | beach | leisure",
          "description": "Descripción amena y detallada de la visita o la experiencia gastronómica (2-3 frases).",
          "estimated_cost": (float aproximado por persona en {req.currency}),
          "currency": "{req.currency}",
          "address": "Dirección real o calle/plaza representativa en {city_name}",
          "selection_reasons": ["Motivo 1", "Motivo 2"]
        }}
      ]
    }}
  ]
}}
"""

        api_key = settings.GEMINI_API_KEY
        if not api_key:
            raise ValueError("GEMINI_API_KEY no configurada en el backend.")

        client = genai.Client(api_key=api_key)
        raw_days_data = None
        last_err = None

        for model_name in AVAILABLE_MODELS:
            try:
                logger.info(f"Generando itinerario con modelo {model_name} para {city_name} ({req.total_days} días)...")
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.2
                    )
                )

                if response and response.text:
                    clean_text = cls._clean_json_text(response.text)
                    parsed_json = json.loads(clean_text)
                    raw_days_data = parsed_json.get("days", [])
                    if raw_days_data:
                        break
            except Exception as e:
                logger.warning(f"Error generando itinerario con modelo {model_name}: {e}")
                last_err = e
                continue

        if not raw_days_data:
            raise RuntimeError(f"No se pudo generar el itinerario con IA: {last_err}")

        # 3. Enriquecer actividades con fotos de Wikipedia y enlaces de Google Maps en paralelo
        all_activities_to_enrich = []
        parsed_days: List[ItineraryDay] = []
        total_estimated_calc = 0.0

        for d_raw in raw_days_data:
            slots_list: List[ItineraryActivity] = []
            day_cost = 0.0

            for slot_raw in d_raw.get("slots", []):
                cost = float(slot_raw.get("estimated_cost", 0.0))
                day_cost += cost
                title = str(slot_raw.get("title", "Visita turística")).strip()

                activity_dict = {
                    "time_slot": str(slot_raw.get("time_slot", "morning")),
                    "time_range": str(slot_raw.get("time_range", "09:30 - 11:30")),
                    "title": title,
                    "type": str(slot_raw.get("type", "activity")),
                    "description": str(slot_raw.get("description", "")),
                    "estimated_cost": cost,
                    "currency": req.currency,
                    "address": str(slot_raw.get("address", city_name)),
                    "maps_url": get_google_maps_url(title, city_name),
                    "image_url": None,
                    "selection_reasons": [str(r) for r in slot_raw.get("selection_reasons", [])]
                }
                slots_list.append(ItineraryActivity(**activity_dict))

            daily_total = float(d_raw.get("daily_estimated_cost", day_cost)) or day_cost
            total_estimated_calc += daily_total

            parsed_days.append(ItineraryDay(
                day_number=int(d_raw.get("day_number", len(parsed_days) + 1)),
                date=str(d_raw.get("date", req.start_date)),
                day_of_week=str(d_raw.get("day_of_week", "Día")),
                zone_name=str(d_raw.get("zone_name", f"Centro de {city_name}")),
                daily_estimated_cost=daily_total,
                pace=str(d_raw.get("pace", req.global_pace or "moderate")),
                slots=slots_list
            ))

        # 4. Guardar el viaje en MongoDB colección 'trips'
        now = datetime.utcnow()
        trip_doc = {
            "user_id": user_id,
            "destination": clean_destination,
            "destination_city": city_name,
            "country_name": country_name,
            "start_date": req.start_date,
            "end_date": req.end_date,
            "total_days": req.total_days,
            "total_nights": req.total_nights,
            "total_budget": req.budget,
            "total_estimated_cost": total_estimated_calc,
            "currency": req.currency,
            "has_mobility_issues": bool(req.has_mobility_issues),
            "health_conditions": req.health_conditions or [],
            "dietary_preferences": req.dietary_preferences or [],
            "interests": interests_list,
            "specific_places": req.specific_places or [],
            "pace_type": req.pace_type or "global",
            "global_pace": req.global_pace or "moderate",
            "days": [d.model_dump() for d in parsed_days],
            "created_at": now,
            "updated_at": now
        }

        result = await db["trips"].insert_one(trip_doc)
        trip_id = str(result.inserted_id)

        return TripResponse(
            id=trip_id,
            user_id=user_id,
            destination=clean_destination,
            destination_city=city_name,
            country_name=country_name,
            start_date=req.start_date,
            end_date=req.end_date,
            total_days=req.total_days,
            total_nights=req.total_nights,
            total_budget=req.budget,
            total_estimated_cost=total_estimated_calc,
            currency=req.currency,
            has_mobility_issues=bool(req.has_mobility_issues),
            health_conditions=req.health_conditions or [],
            dietary_preferences=req.dietary_preferences or [],
            interests=interests_list,
            specific_places=req.specific_places or [],
            pace_type=req.pace_type or "global",
            global_pace=req.global_pace or "moderate",
            days=parsed_days,
            created_at=now,
            updated_at=now
        )

    @classmethod
    async def get_user_trips(cls, user_id: str, db: Any) -> List[TripResponse]:
        """Recupera la lista de viajes guardados para un usuario."""
        cursor = db["trips"].find({"user_id": user_id}).sort("created_at", -1)
        trips = []
        async for doc in cursor:
            doc["id"] = str(doc["_id"])
            trips.append(TripResponse(**doc))
        return trips

    @classmethod
    async def get_trip_by_id(cls, trip_id: str, user_id: str, db: Any) -> Optional[TripResponse]:
        """Obtiene el detalle de un viaje específico por ID."""
        if not ObjectId.is_valid(trip_id):
            return None
        doc = await db["trips"].find_one({"_id": ObjectId(trip_id), "user_id": user_id})
        if not doc:
            return None
        doc["id"] = str(doc["_id"])
        return TripResponse(**doc)

    @classmethod
    async def delete_trip(cls, trip_id: str, user_id: str, db: Any) -> bool:
        """Elimina un viaje por ID."""
        if not ObjectId.is_valid(trip_id):
            return False
        result = await db["trips"].delete_one({"_id": ObjectId(trip_id), "user_id": user_id})
        return result.deleted_count > 0
