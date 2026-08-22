import asyncio
import logging
import urllib.parse
from typing import Optional, Dict
import httpx

logger = logging.getLogger(__name__)

# Caché en memoria para evitar peticiones duplicadas durante la generación
_wiki_image_cache: Dict[str, Optional[str]] = {}

def get_google_maps_url(place_name: str, city_name: str) -> str:
    """Genera la URL universal oficial de búsqueda en Google Maps sin riesgo de 404."""
    query = f"{place_name.strip()} {city_name.strip()}".strip()
    encoded_query = urllib.parse.quote(query)
    return f"https://www.google.com/maps/search/?api=1&query={encoded_query}"

async def fetch_wikipedia_image(place_name: str, city_name: str = "") -> Optional[str]:
    """
    Obtiene de forma asíncrona la imagen oficial verificada de Wikipedia / Wikimedia Commons.
    1. Intento directo por título en Wikipedia en español.
    2. Búsqueda semántica en español.
    3. Búsqueda semántica en inglés como respaldo internacional.
    """
    clean_place = place_name.strip()
    cache_key = f"{clean_place.lower()}--{city_name.lower()}"
    if cache_key in _wiki_image_cache:
        return _wiki_image_cache[cache_key]

    headers = {
        "User-Agent": "MyTrip-TFG/1.0 (academic travel assistant project; contact@mytrip.app)"
    }

    async with httpx.AsyncClient(timeout=5.0, headers=headers) as client:
        # 1. Intento directo en Wikipedia en español
        try:
            encoded_title = urllib.parse.quote(clean_place.replace(" ", "_"))
            r = await client.get(f"https://es.wikipedia.org/api/rest_v1/page/summary/{encoded_title}")
            if r.status_code == 200:
                data = r.json()
                img = data.get("thumbnail", {}).get("source") or data.get("originalimage", {}).get("source")
                if img:
                    _wiki_image_cache[cache_key] = img
                    return img
        except Exception as e:
            logger.debug(f"Direct ES lookup failed for {clean_place}: {e}")

        # 2. Búsqueda semántica en español
        try:
            search_query = f"{clean_place} {city_name}".strip()
            encoded_query = urllib.parse.quote(search_query)
            sr = await client.get(
                f"https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch={encoded_query}&format=json"
            )
            if sr.status_code == 200:
                results = sr.json().get("query", {}).get("search", [])
                if results:
                    best_title = results[0]["title"]
                    enc_best = urllib.parse.quote(best_title.replace(" ", "_"))
                    r2 = await client.get(f"https://es.wikipedia.org/api/rest_v1/page/summary/{enc_best}")
                    if r2.status_code == 200:
                        data2 = r2.json()
                        img2 = data2.get("thumbnail", {}).get("source") or data2.get("originalimage", {}).get("source")
                        if img2:
                            _wiki_image_cache[cache_key] = img2
                            return img2
        except Exception as e:
            logger.debug(f"Search ES lookup failed for {clean_place}: {e}")

        # 3. Búsqueda semántica en inglés
        try:
            search_query_en = f"{clean_place} {city_name}".strip()
            encoded_query_en = urllib.parse.quote(search_query_en)
            sr_en = await client.get(
                f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={encoded_query_en}&format=json"
            )
            if sr_en.status_code == 200:
                results_en = sr_en.json().get("query", {}).get("search", [])
                if results_en:
                    best_title_en = results_en[0]["title"]
                    enc_best_en = urllib.parse.quote(best_title_en.replace(" ", "_"))
                    r3 = await client.get(f"https://en.wikipedia.org/api/rest_v1/page/summary/{enc_best_en}")
                    if r3.status_code == 200:
                        data3 = r3.json()
                        img3 = data3.get("thumbnail", {}).get("source") or data3.get("originalimage", {}).get("source")
                        if img3:
                            _wiki_image_cache[cache_key] = img3
                            return img3
        except Exception as e:
            logger.debug(f"Search EN lookup failed for {clean_place}: {e}")

    _wiki_image_cache[cache_key] = None
    return None

async def enrich_activities_with_images_and_links(
    activities: list,
    city_name: str
):
    """
    Enriquece en paralelo las actividades del itinerario con imágenes de Wikipedia
    y URLs universales de Google Maps.
    """
    tasks = []
    for act in activities:
        tasks.append(_enrich_single_activity(act, city_name))
    await asyncio.gather(*tasks, return_exceptions=True)

async def _enrich_single_activity(act: dict, city_name: str):
    title = act.get("title", "")
    act["maps_url"] = get_google_maps_url(title, city_name)
    if not act.get("image_url"):
        img = await fetch_wikipedia_image(title, city_name)
        if img:
            act["image_url"] = img
