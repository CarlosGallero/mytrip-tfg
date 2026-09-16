import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.image_service import (
    get_google_maps_url,
    fetch_wikipedia_image,
    enrich_activities_with_images_and_links,
    _wiki_image_cache
)

def test_get_google_maps_url():
    url = get_google_maps_url("Sagrada Familia", "Barcelona")
    assert "https://www.google.com/maps/search/?api=1&query=" in url
    assert "Sagrada" in url
    assert "Barcelona" in url

@pytest.mark.asyncio
async def test_fetch_wikipedia_image_direct_success():
    _wiki_image_cache.clear()
    
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "thumbnail": {"source": "https://upload.wikimedia.org/test_colosseum.jpg"}
    }
    
    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_response
        img_url = await fetch_wikipedia_image("Coliseo", "Roma")
        
        assert img_url == "https://upload.wikimedia.org/test_colosseum.jpg"
        # Second call should use cache without calling httpx again
        mock_get.reset_mock()
        img_cached = await fetch_wikipedia_image("Coliseo", "Roma")
        assert img_cached == "https://upload.wikimedia.org/test_colosseum.jpg"
        mock_get.assert_not_called()

@pytest.mark.asyncio
async def test_fetch_wikipedia_image_not_found():
    _wiki_image_cache.clear()
    
    mock_response_404 = MagicMock()
    mock_response_404.status_code = 404
    
    mock_response_empty_search = MagicMock()
    mock_response_empty_search.status_code = 200
    mock_response_empty_search.json.return_value = {"query": {"search": []}}
    
    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        # 1st call direct -> 404, 2nd call search es -> empty, 3rd call search en -> empty
        mock_get.side_effect = [mock_response_404, mock_response_empty_search, mock_response_empty_search]
        img_url = await fetch_wikipedia_image("LugarInexistente123XYZ", "CiudadX")
        assert img_url is None

@pytest.mark.asyncio
async def test_enrich_activities_with_images_and_links():
    _wiki_image_cache.clear()
    
    activities = [
        {"title": "Museo del Prado", "description": "Museo de arte"},
        {"title": "Parque del Retiro", "description": "Paseo en barca", "image_url": "https://existing.url/img.jpg"}
    ]
    
    with patch("app.services.image_service.fetch_wikipedia_image", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.return_value = "https://wiki.org/prado.jpg"
        
        await enrich_activities_with_images_and_links(activities, "Madrid")
        
        # Museo del Prado gets both maps_url and new image_url
        assert "maps_url" in activities[0]
        assert activities[0]["image_url"] == "https://wiki.org/prado.jpg"
        
        # Parque del Retiro keeps its existing image_url but gets maps_url
        assert "maps_url" in activities[1]
        assert activities[1]["image_url"] == "https://existing.url/img.jpg"
