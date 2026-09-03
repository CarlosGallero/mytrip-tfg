import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

PLACES_API_URL = "https://places.googleapis.com/v1/places:searchText"
CACHE_TTL_DAYS = 14

class PlacesService:
    @classmethod
    async def get_verified_places(
        cls,
        city_name: str,
        zone_name: str,
        db: Any,
        category: str = "all",
        max_results: int = 15
    ) -> List[Dict[str, Any]]:
        """
        Obtiene lugares 100% reales, verificados y operativos de Google Places API (New),
        utilizando una caché inteligente en MongoDB para minimizar costes y latencia.
        """
        clean_city = city_name.strip().title()
        clean_zone = zone_name.strip()
        cache_key = f"{clean_city.lower()}:{clean_zone.lower()}:{category.lower()}"

        # 1. Comprobar si existe en MongoDB Caché
        try:
            if db is not None:
                cached_doc = await db["places_cache"].find_one({"cache_key": cache_key})
                if cached_doc:
                    cached_at = cached_doc.get("cached_at")
                    if cached_at and (datetime.utcnow() - cached_at) < timedelta(days=CACHE_TTL_DAYS):
                        logger.info(f"⚡ [Caché MongoDB HIT] Recuperados {len(cached_doc.get('places', []))} lugares para '{cache_key}' (Coste: 0,00 $)")
                        return cached_doc.get("places", [])
        except Exception as e:
            logger.warning(f"Error consultando caché de Places en MongoDB: {e}")

        # 2. Consultar Google Places API (New)
        api_key = settings.GOOGLE_PLACES_API_KEY or settings.GEMINI_API_KEY
        if not api_key:
            logger.warning("GOOGLE_PLACES_API_KEY no configurada. Saltando consulta a Places.")
            return []

        # Construir query según categoría solicitada
        if category.startswith("diet:"):
            raw_diet = category.split(":", 1)[1].strip()
            diet_lower = raw_diet.lower()
            if "vegan" in diet_lower:
                clean_diet = "veganos y restaurantes con opciones veganas"
            elif "vegetar" in diet_lower:
                clean_diet = "vegetarianos y restaurantes con opciones vegetarianas"
            elif "gluten" in diet_lower or "celia" in diet_lower:
                clean_diet = "sin gluten y restaurantes aptos para celiacos"
            elif "lactos" in diet_lower:
                clean_diet = "sin lactosa"
            elif "halal" in diet_lower:
                clean_diet = "halal"
            elif "kosher" in diet_lower:
                clean_diet = "kosher"
            elif "pescatar" in diet_lower:
                clean_diet = "pescados y mariscos frescos"
            else:
                clean_diet = raw_diet

            query_text = f"mejores restaurantes {clean_diet} en {clean_city}"
        elif category in ("kids_activities", "kids", "family"):
            query_text = f"atracciones para niños, acuarios, parques infantiles, museos interactivos de ciencias y actividades para familias en {clean_city}"
        elif category == "breakfast_cafe":
            query_text = f"cafeterias de especialidad y bares de desayuno en {clean_zone}, {clean_city}"
        elif category == "restaurant":
            query_text = f"mejores restaurantes, mesones y tabernas en {clean_zone}, {clean_city}"
        elif category == "nightlife":
            query_text = f"pubs, bares de copas y coctelerias nocturnas en {clean_zone}, {clean_city}"
        elif category == "activity":
            query_text = f"monumentos, museos, miradores y atracciones turisticas en {clean_zone}, {clean_city}"
        else:
            query_text = f"monumentos, mejores restaurantes y locales de copas en {clean_zone}, {clean_city}"

        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": api_key,
            "X-Goog-FieldMask": (
                "places.id,places.displayName,places.formattedAddress,"
                "places.businessStatus,places.types,places.primaryType,"
                "places.rating,places.userRatingCount,places.regularOpeningHours,"
                "places.googleMapsUri,places.priceLevel"
            ),
        }
        payload = {
            "textQuery": query_text,
            "languageCode": "es",
            "maxResultCount": max_results,
        }

        verified_places: List[Dict[str, Any]] = []

        try:
            logger.info(f"🌐 [Google Places API] Consultando: '{query_text}'...")
            async with httpx.AsyncClient(timeout=12.0) as client:
                resp = await client.post(PLACES_API_URL, headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    raw_places = data.get("places", [])

                    for p in raw_places:
                        status = p.get("businessStatus", "OPERATIONAL")
                        # Solo incluir negocios operativos
                        if status != "OPERATIONAL":
                            continue

                        name = p.get("displayName", {}).get("text", "").strip()
                        if not name:
                            continue

                        address = p.get("formattedAddress", f"{clean_zone}, {clean_city}")
                        maps_url = p.get("googleMapsUri") or f"https://www.google.com/maps/search/?api=1&query={name}+{clean_city}"
                        types_list = p.get("types", [])
                        rating = float(p.get("rating", 0.0))
                        hours = p.get("regularOpeningHours", {}).get("weekdayDescriptions", [])

                        verified_places.append({
                            "place_id": p.get("id", ""),
                            "name": name,
                            "address": address,
                            "rating": rating,
                            "user_ratings_count": p.get("userRatingCount", 0),
                            "maps_url": maps_url,
                            "types": types_list,
                            "primary_type": p.get("primaryType", ""),
                            "opening_hours": hours,
                            "zone": clean_zone,
                            "city": clean_city,
                        })

                    logger.info(f"✅ [Google Places API] {len(verified_places)} lugares operativos recuperados para '{clean_zone}, {clean_city}'.")

                    # 3. Guardar en Caché MongoDB
                    if db is not None and verified_places:
                        await db["places_cache"].update_one(
                            {"cache_key": cache_key},
                            {
                                "$set": {
                                    "cache_key": cache_key,
                                    "city": clean_city,
                                    "zone": clean_zone,
                                    "category": category,
                                    "places": verified_places,
                                    "cached_at": datetime.utcnow(),
                                }
                            },
                            upsert=True
                        )
                        logger.info(f"💾 Guardados en caché MongoDB para '{cache_key}'.")

                else:
                    logger.warning(f"Error Places API status {resp.status_code}: {resp.text}")

        except Exception as e:
            logger.error(f"Excepción consultando Google Places API: {e}", exc_info=True)

        return verified_places
