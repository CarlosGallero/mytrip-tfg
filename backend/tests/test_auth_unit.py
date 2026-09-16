from datetime import timedelta
import pytest
from jose import jwt, JWTError
from jose.exceptions import ExpiredSignatureError
from app.core.security import hash_password, verify_password, create_access_token
from app.core.config import settings

def test_password_hashing_and_verification():
    raw_pass = "MySecretPassword2026!"
    hashed = hash_password(raw_pass)

    assert hashed != raw_pass
    assert hashed.startswith("$") or hashed.startswith("$")

    # Verificación correcta
    assert verify_password(raw_pass, hashed) is True

    # Verificación incorrecta
    assert verify_password("WrongPassword!", hashed) is False
    assert verify_password("", hashed) is False

def test_password_hash_uniqueness():
    raw = "SamePassword123"
    hash1 = hash_password(raw)
    hash2 = hash_password(raw)

    # Debido al salt aleatorio de bcrypt, deben ser distintos
    assert hash1 != hash2
    assert verify_password(raw, hash1) is True
    assert verify_password(raw, hash2) is True

def test_create_access_token():
    payload = {"sub": "user_id_12345", "role": "traveler"}
    token = create_access_token(payload, expires_delta=timedelta(minutes=15))

    assert isinstance(token, str)
    assert len(token) > 20

    # Decodificar y verificar claims
    decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert decoded["sub"] == "user_id_12345"
    assert decoded["role"] == "traveler"
    assert "exp" in decoded

def test_expired_token():
    payload = {"sub": "expired_user"}
    token = create_access_token(payload, expires_delta=timedelta(minutes=-5))

    with pytest.raises(ExpiredSignatureError):
        jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])

def test_invalid_signature_token():
    payload = {"sub": "tampered_user"}
    token = create_access_token(payload)

    # Intentar decodificar con clave errónea
    with pytest.raises(JWTError):
        jwt.decode(token, "wrong_secret_key_99999", algorithms=[settings.ALGORITHM])