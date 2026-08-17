import json
import logging
import re
from typing import Optional
from google import genai
from google.genai import types
from app.core.config import settings
from app.models.destination import DestinationInfoResponse

logger = logging.getLogger(__name__)

AVAILABLE_MODELS = [
    "gemini-3.6-flash",
    "gemini-3.7-flash",
    "gemini-flash-latest",
    "gemini-2.5-flash"
]

class DestinationService:
    @staticmethod
    def _clean_json_text(text: str) -> str:
        """Limpia etiquetas de markdown si el modelo las incluye."""
        text = text.strip()
        # Eliminar bloques de código markdown ```json ... ```
        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?\s*", "", text)
            text = re.sub(r"\s*```$", "", text)
        return text.strip()

    @classmethod
    async def get_travel_info(cls, destination: str, origin_country: str) -> DestinationInfoResponse:
        """
        Consulta a la API de Gemini para obtener la bandera, moneda, requisitos de pasaporte
        (en función del país de origen del usuario), vacunas y alertas de conflicto/guerra.
        """
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            logger.warning("GEMINI_API_KEY no configurada. Usando fallback.")
            return cls._generate_fallback(destination, origin_country)

        client = genai.Client(api_key=api_key)

        prompt = f"""
Eres un asistente experto en viajes y relaciones internacionales.
Analiza la siguiente información:
- País de origen/residencia del viajero: "{origin_country}"
- Ciudad / Destino indicado por el viajero: "{destination}"

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
  "conflict_details": "Explicación concisa en español sobre la situación de paz, estabilidad o riesgos de conflicto bélico en el país."
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

                    return DestinationInfoResponse(
                        destination_city=str(data.get("destination_city", destination.split(",")[0].strip())),
                        country_name=str(data.get("country_name", "Desconocido")),
                        flag_emoji=str(data.get("flag_emoji", "🌍")),
                        currency=str(data.get("currency", "Moneda local")),
                        passport_required=bool(data.get("passport_required", True)),
                        passport_details=str(data.get("passport_details", "Verifica la documentación necesaria con las autoridades consulares.")),
                        vaccination_required=bool(data.get("vaccination_required", False)),
                        vaccination_details=str(data.get("vaccination_details", "No se han detectado vacunas obligatorias.")),
                        has_armed_conflict=bool(data.get("has_armed_conflict", False)),
                        conflict_details=str(data.get("conflict_details", "No hay alertas activas de conflicto armado.")),
                        origin_country=origin_country
                    )
            except Exception as e:
                logger.warning(f"Error con modelo {model_name}: {e}")
                last_exception = e
                continue

        logger.error(f"Fallo al contactar con Gemini tras probar modelos. Error: {last_exception}")
        return cls._generate_fallback(destination, origin_country)

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
