import pytest
from app.utils.countries import (
    get_country_iso_code,
    get_flag_image_url,
    emoji_to_country_code,
    COUNTRIES_LIST,
    DEFAULT_CURRENCIES
)
from app.services.destination_service import normalize_text

def test_get_country_iso_code_by_name():
    assert get_country_iso_code("España") == "ES"
    assert get_country_iso_code("Japón") == "JP"
    assert get_country_iso_code("Francia") == "FR"
    assert get_country_iso_code("Argentina") == "AR"
    assert get_country_iso_code("Italia") == "IT"

def test_get_country_iso_code_by_emoji():
    assert get_country_iso_code("", flag_emoji="🇪🇸") == "ES"
    assert get_country_iso_code("", flag_emoji="🇯🇵") == "JP"
    assert get_country_iso_code("", flag_emoji="🇫🇷") == "FR"

def test_emoji_to_country_code():
    assert emoji_to_country_code("🇪🇸") == "ES"
    assert emoji_to_country_code("IT") == "IT"
    assert emoji_to_country_code("") == ""

def test_get_flag_image_url():
    url_es = get_flag_image_url("España")
    assert url_es == "https://flagcdn.com/w160/es.png"

    url_jp = get_flag_image_url("Japón")
    assert url_jp == "https://flagcdn.com/w160/jp.png"

def test_default_currencies():
    assert DEFAULT_CURRENCIES["España"] == "EUR"
    assert DEFAULT_CURRENCIES["Argentina"] == "ARS"
    assert DEFAULT_CURRENCIES["Japón"] == "JPY"
    assert DEFAULT_CURRENCIES["Estados Unidos"] == "USD"

def test_normalize_text():
    assert normalize_text("Cádiz") == "cadiz"
    assert normalize_text("  Málaga,   España  ") == "malaga, espana"
    assert normalize_text("PARÍS") == "paris"
    assert normalize_text("") == ""
