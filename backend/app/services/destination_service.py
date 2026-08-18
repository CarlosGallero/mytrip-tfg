import json
import logging
import re
import unicodedata
from datetime import datetime
from typing import Optional, Any
from google import genai
from google.genai import types
from app.core.config import settings
from app.models.destination import DestinationInfoResponse, EstimatedDailyCost

logger = logging.getLogger(__name__)

AVAILABLE_MODELS = [
    "gemini-3.6-flash",
    "gemini-3.7-flash",
    "gemini-flash-latest",
    "gemini-2.5-flash"
]

def normalize_text(text: str) -> str:
    """Normaliza texto eliminando acentos, espacios extra y pasando a minúsculas."""
    if not text:
        return ""
    text = text.strip().lower()
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", " ", text).strip()

class DestinationService:
    @staticmethod
    def _clean_json_text(text: str) -> str:
        """Limpia etiquetas de markdown si el modelo las incluye."""
        text = text.strip()
        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?\s*", "", text)
            text = re.sub(r"\s*```$", "", text)
        return text.strip()

    @classmethod
    async def get_travel_info(
        cls,
        destination: str,
        origin_country: str,
        user_currency: str = "EUR",
        db: Optional[Any] = None
    ) -> DestinationInfoResponse:
        """
        Obtiene la información de viaje para un destino según el país origen del usuario.
        1. Consulta primero la base de datos (MongoDB) para evitar llamadas redundantes a Gemini.
        2. Si no existe en la base de datos, consulta la API de Gemini, calcula el gasto diario estimado
           en la moneda del usuario (comidas + actividades) y persiste el resultado en MongoDB.
        """
        clean_dest = destination.strip()
        norm_query = normalize_text(clean_dest)
        norm_origin = normalize_text(origin_country)

        # 1. Comprobar en base de datos si ya está guardado
        if db is not None:
            try:
                cached_doc = await cls._find_in_cache(db, clean_dest, origin_country, norm_query, norm_origin)
                if cached_doc:
                    logger.info(
                        f"Caché hit en MongoDB: recuperando datos para origen '{origin_country}' y destino '{clean_dest}'"
                    )
                    return DestinationInfoResponse(
                        destination_city=str(cached_doc.get("destination_city", clean_dest.split(",")[0].strip())),
                        country_name=str(cached_doc.get("destination_country", cached_doc.get("country_name", "Desconocido"))),
                        flag_emoji=str(cached_doc.get("flag_emoji", "🌍")),
                        currency=str(cached_doc.get("currency", "Moneda local")),
                        passport_required=bool(cached_doc.get("passport_required", True)),
                        passport_details=str(cached_doc.get("passport_details", "")),
                        vaccination_required=bool(cached_doc.get("vaccination_required", False)),
                        vaccination_details=str(cached_doc.get("vaccination_details", "")),
                        has_armed_conflict=bool(cached_doc.get("has_armed_conflict", False)),
                        conflict_details=str(cached_doc.get("conflict_details", "")),
                        origin_country=origin_country
                    )
            except Exception as e:
                logger.warning(f"Error consultando la caché de MongoDB: {e}")

        # 2. Si no está en caché, llamar a la API de Gemini
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            logger.warning("GEMINI_API_KEY no configurada. Usando fallback.")
            return cls._generate_fallback(clean_dest, origin_country)

        client = genai.Client(api_key=api_key)

        prompt = f"""
Eres un asistente experto en viajes, relaciones internacionales y presupuestos de viaje.
Analiza la siguiente información:
- País de origen/residencia del viajero: "{origin_country}"
- Moneda oficial del país del viajero: "{user_currency}"
- Ciudad / Destino indicado por el viajero: "{clean_dest}"

Determina con precisión el país al que pertenece dicho destino y responde ÚNICAMENTE con un objeto JSON válido con la siguiente estructura exacta:
{{
  "destination_city": "Nombre de la ciudad destino",
  "country_name": "Nombre oficial en español del país destino",
  "flag_emoji": "Emoji de la bandera del país destino (ej. 🇯🇵, 🇫🇷, 🇪🇸)",
  "currency": "Nombre oficial de la moneda del país destino junto con su símbolo o código (ej. Yen japonés (¥ / JPY), Euro (€ / EUR), Dólar estadounidense ($ / USD))",
  "passport_required": true o false (booleano que indica si un ciudadano/residente proveniente de '{origin_country}' necesita obligatoriamente pasaporte para entrar al país destino, teniendo en cuenta acuerdos como Unión Europea / Espacio Schengen / Mercosur si aplican),
  "passport_details": "Explicación concisa y clara en español de los requisitos de documentación (DNI vs pasaporte, visado o autorización electrónica) para viajar desde '{origin_country}' al país destino.",
  "vaccination_required": true o false (booleano que indica si existen vacunas obligatorias para ingresar al país destino desde '{origin_country}'),
  "vaccination_details": "Explicación concisa en español sobre vacunas obligatorias o recomendadas y precauciones sanitarias.",
  "has_armed_conflict": true o false (booleano que indica si hay guerra, conflicto armado activo o alerta grave de seguridad en el país destino),
  "conflict_details": "Explicación concisa en español sobre la situación de paz, estabilidad o riesgos de conflicto bélico en el país.",
  "estimated_daily_cost": {{
    "currency": "{user_currency}",
    "total_daily_cost": 85.0 (número flotante aproximado del coste diario medio por persona en {user_currency}),
    "food_daily_cost": 50.0 (número flotante aproximado de comidas y restaurantes diarios en {user_currency}),
    "activities_daily_cost": 35.0 (número flotante aproximado de ocio y actividades diarias en {user_currency}: visitas guiadas, entradas a museos, monumentos y parques),
    "breakdown_details": "Explicación concisa en español del presupuesto diario medio estimado en {user_currency} considerando restaurantes, comidas y actividades turísticas."
  }}
}}
"""

        last_exception: Optional[Exception] = None

        for model_name in AVAILABLE_MODELS:
            try:
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
                    data = json.loads(clean_text)

                    dest_city = str(data.get("destination_city", clean_dest.split(",")[0].strip()))
                    dest_country = str(data.get("country_name", "Desconocido"))
                    flag_emoji = str(data.get("flag_emoji", "🌍"))
                    currency = str(data.get("currency", "Moneda local"))
                    passport_req = bool(data.get("passport_required", True))
                    passport_det = str(data.get("passport_details", "Verifica la documentación necesaria con las autoridades consulares."))
                    vaccination_req = bool(data.get("vaccination_required", False))
                    vaccination_det = str(data.get("vaccination_details", "No se han detectado vacunas obligatorias."))
                    has_conflict = bool(data.get("has_armed_conflict", False))
                    conflict_det = str(data.get("conflict_details", "No hay alertas activas de conflicto armado."))

                    # Coste diario estimado
                    daily_cost_raw = data.get("estimated_daily_cost", {})
                    daily_cost_obj = None
                    if isinstance(daily_cost_raw, dict):
                        try:
                            daily_cost_obj = EstimatedDailyCost(
                                currency=str(daily_cost_raw.get("currency", user_currency)),
                                total_daily_cost=float(daily_cost_raw.get("total_daily_cost", 0.0)),
                                food_daily_cost=float(daily_cost_raw.get("food_daily_cost", 0.0)),
                                activities_daily_cost=float(daily_cost_raw.get("activities_daily_cost", 0.0)),
                                breakdown_details=str(daily_cost_raw.get("breakdown_details", "Estimación de gasto diario."))
                            )
                        except Exception as parse_err:
                            logger.warning(f"No se pudo parsear el gasto diario estimado: {parse_err}")

                    # 3. Guardar en base de datos MongoDB para futuros usuarios
                    if db is not None:
                        try:
                            await cls._save_to_cache(
                                db=db,
                                origin_country=origin_country,
                                destination_country=dest_country,
                                destination_city=dest_city,
                                search_query=clean_dest,
                                flag_emoji=flag_emoji,
                                currency=currency,
                                passport_required=passport_req,
                                passport_details=passport_det,
                                vaccination_required=vaccination_req,
                                vaccination_details=vaccination_det,
                                has_armed_conflict=has_conflict,
                                conflict_details=conflict_det,
                                estimated_daily_cost=daily_cost_obj
                            )
                        except Exception as save_err:
                            logger.warning(f"Error al guardar información en base de datos: {save_err}")

                    return DestinationInfoResponse(
                        destination_city=dest_city,
                        country_name=dest_country,
                        flag_emoji=flag_emoji,
                        currency=currency,
                        passport_required=passport_req,
                        passport_details=passport_det,
                        vaccination_required=vaccination_req,
                        vaccination_details=vaccination_det,
                        has_armed_conflict=has_conflict,
                        conflict_details=conflict_det,
                        origin_country=origin_country
                    )
            except Exception as e:
                logger.warning(f"Error con modelo {model_name}: {e}")
                last_exception = e
                continue

        logger.error(f"Fallo al contactar con Gemini tras probar modelos. Error: {last_exception}")
        return cls._generate_fallback(clean_dest, origin_country)

    @classmethod
    async def _find_in_cache(
        cls,
        db: Any,
        destination: str,
        origin_country: str,
        norm_query: str,
        norm_origin: str
    ) -> Optional[dict]:
        """Busca en la colección country_travel_info coincidencias para el origen y destino."""
        parts = [p.strip() for p in destination.split(",") if p.strip()]
        city_name = parts[0] if parts else destination
        country_name = parts[-1] if len(parts) > 1 else ""

        # Consulta con regex insensible a mayúsculas/minúsculas para el país de origen
        origin_filter = {"$regex": f"^{re.escape(origin_country)}$", "$options": "i"}

        # 1. Búsqueda por query exacta o ciudad
        query_candidates = [
            {"origin_country": origin_filter, "search_query": {"$regex": f"^{re.escape(destination)}$", "$options": "i"}},
            {"origin_country": origin_filter, "destination_city": {"$regex": f"^{re.escape(city_name)}$", "$options": "i"}}
        ]

        if country_name:
            query_candidates.append({
                "origin_country": origin_filter,
                "destination_country": {"$regex": f"^{re.escape(country_name)}$", "$options": "i"},
                "destination_city": {"$regex": f"^{re.escape(city_name)}$", "$options": "i"}
            })

        for q in query_candidates:
            doc = await db["country_travel_info"].find_one(q)
            if doc:
                return doc

        return None

    @classmethod
    async def _save_to_cache(
        cls,
        db: Any,
        origin_country: str,
        destination_country: str,
        destination_city: str,
        search_query: str,
        flag_emoji: str,
        currency: str,
        passport_required: bool,
        passport_details: str,
        vaccination_required: bool,
        vaccination_details: str,
        has_armed_conflict: bool,
        conflict_details: str,
        estimated_daily_cost: Optional[EstimatedDailyCost]
    ):
        """Guarda o actualiza la información en la colección country_travel_info de MongoDB."""
        now = datetime.utcnow()
        doc_data = {
            "origin_country": origin_country,
            "destination_country": destination_country,
            "destination_city": destination_city,
            "search_query": search_query,
            "flag_emoji": flag_emoji,
            "currency": currency,
            "passport_required": passport_required,
            "passport_details": passport_details,
            "vaccination_required": vaccination_required,
            "vaccination_details": vaccination_details,
            "has_armed_conflict": has_armed_conflict,
            "conflict_details": conflict_details,
            "estimated_daily_cost": estimated_daily_cost.model_dump() if estimated_daily_cost else None,
            "updated_at": now
        }

        # Actualizar si ya existía para ese origen y ciudad/país, o insertar uno nuevo
        await db["country_travel_info"].update_one(
            {
                "origin_country": {"$regex": f"^{re.escape(origin_country)}$", "$options": "i"},
                "destination_city": {"$regex": f"^{re.escape(destination_city)}$", "$options": "i"}
            },
            {
                "$set": doc_data,
                "$setOnInsert": {"created_at": now}
            },
            upsert=True
        )
        logger.info(f"Guardada información de viaje en MongoDB para {destination_city}, {destination_country} (Origen: {origin_country})")

    @staticmethod
    def _generate_fallback(destination: str, origin_country: str) -> DestinationInfoResponse:
        """Respuesta de respaldo en caso de indisponibilidad temporal de la API."""
        parts = [p.strip() for p in destination.split(",") if p.strip()]
        city = parts[0] if parts else destination
        country = parts[-1] if len(parts) > 1 else city

        is_same_country = (origin_country.lower() in country.lower()) or (country.lower() in origin_country.lower())

        return DestinationInfoResponse(
            destination_city=city,
            country_name=country,
            flag_emoji="🌍",
            currency="Moneda local",
            passport_required=not is_same_country,
            passport_details=f"Viaje desde {origin_country} hacia {country}. " + (
                "Al ser viaje nacional no necesitas pasaporte." if is_same_country else "Consulta si requieres pasaporte o visado según convenios internacionales."
            ),
            vaccination_required=False,
            vaccination_details="Se recomienda consultar los requisitos sanitarios actualizados para el destino.",
            has_armed_conflict=False,
            conflict_details="Sin registros de conflicto crítico en este momento.",
            origin_country=origin_country
        )
