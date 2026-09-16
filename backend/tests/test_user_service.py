import pytest
from bson import ObjectId
from unittest.mock import AsyncMock, MagicMock
from fastapi import HTTPException

from app.models.user import UserCreate, UpdateUserProfile
from app.services.user_service import UserService
from app.core.security import hash_password

@pytest.mark.asyncio
async def test_create_user_success():
    mock_db = MagicMock()
    mock_users_collection = MagicMock()
    mock_db.__getitem__.side_effect = lambda k: mock_users_collection if k == "users" else MagicMock()
    
    # User does not exist
    mock_users_collection.find_one = AsyncMock(return_value=None)
    fake_id = ObjectId()
    mock_users_collection.insert_one = AsyncMock(return_value=MagicMock(inserted_id=fake_id))
    
    user_in = UserCreate(
        first_name="Carlos",
        last_name="Gallero",
        username="cgallero",
        password="password123",
        confirm_password="password123",
        country_of_residence="España"
    )
    
    resp = await UserService.create_user(mock_db, user_in)
    assert resp.id == str(fake_id)
    assert resp.username == "cgallero"
    assert resp.default_currency == "EUR"
    mock_users_collection.insert_one.assert_called_once()

@pytest.mark.asyncio
async def test_create_user_duplicate_raises_400():
    mock_db = MagicMock()
    mock_users_collection = MagicMock()
    mock_db.__getitem__.side_effect = lambda k: mock_users_collection if k == "users" else MagicMock()
    
    mock_users_collection.find_one = AsyncMock(return_value={"_id": ObjectId(), "username": "existing_user"})
    
    user_in = UserCreate(
        first_name="Juan",
        last_name="Perez",
        username="existing_user",
        password="password123",
        confirm_password="password123",
        country_of_residence="España"
    )
    
    with pytest.raises(HTTPException) as exc_info:
        await UserService.create_user(mock_db, user_in)
    
    assert exc_info.value.status_code == 400
    assert "ya está en uso" in exc_info.value.detail

@pytest.mark.asyncio
async def test_get_user_by_id_valid_and_invalid():
    mock_db = MagicMock()
    mock_users_collection = MagicMock()
    mock_db.__getitem__.side_effect = lambda k: mock_users_collection if k == "users" else MagicMock()
    
    valid_id = str(ObjectId())
    mock_users_collection.find_one = AsyncMock(return_value={"_id": ObjectId(valid_id), "username": "testuser"})
    
    # Valid id
    res = await UserService.get_user_by_id(mock_db, valid_id)
    assert res is not None
    assert res["username"] == "testuser"
    
    # Invalid id string should return None without raising exception
    res_invalid = await UserService.get_user_by_id(mock_db, "not-a-valid-objectid")
    assert res_invalid is None

def test_verify_user_password():
    raw_pass = "secret123"
    hashed = hash_password(raw_pass)
    user_doc = {"username": "carlos", "hashed_password": hashed}
    
    assert UserService.verify_user_password(user_doc, "secret123") is True
    assert UserService.verify_user_password(user_doc, "wrongpassword") is False
    assert UserService.verify_user_password(None, "secret123") is False
    assert UserService.verify_user_password({}, "secret123") is False

@pytest.mark.asyncio
async def test_update_user_profile_success():
    mock_db = MagicMock()
    mock_users_collection = MagicMock()
    mock_db.__getitem__.side_effect = lambda k: mock_users_collection if k == "users" else MagicMock()
    
    user_id = str(ObjectId())
    original_user = {
        "_id": ObjectId(user_id),
        "first_name": "Carlos",
        "last_name": "Gallero",
        "username": "cgallero",
        "country_of_residence": "España",
        "default_currency": "EUR"
    }
    
    updated_doc = {
        "_id": ObjectId(user_id),
        "first_name": "Carlos Updated",
        "last_name": "Gallero",
        "username": "cgallero",
        "country_of_residence": "Estados Unidos",
        "default_currency": "USD"
    }
    
    # First find_one checks existence, second checks duplicate username, third retrieves updated
    mock_users_collection.find_one = AsyncMock(side_effect=[original_user, None, updated_doc])
    mock_users_collection.update_one = AsyncMock()
    
    profile_update = UpdateUserProfile(
        first_name="Carlos Updated",
        last_name="Gallero",
        username="cgallero",
        country_of_residence="Estados Unidos",
        password="newpassword123",
        confirm_password="newpassword123"
    )
    
    resp = await UserService.update_user_profile(mock_db, user_id, profile_update)
    assert resp.first_name == "Carlos Updated"
    assert resp.default_currency == "USD"
    mock_users_collection.update_one.assert_called_once()
