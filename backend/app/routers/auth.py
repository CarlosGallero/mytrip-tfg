from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.core.config import settings
from app.models.user import UserCreate, UserResponse, UserLogin, UpdateUserProfile, Token
from app.db.mongodb import get_database
from app.services.user_service import UserService
from app.core.security import create_access_token
from app.utils.countries import COUNTRIES_LIST

router = APIRouter(prefix="/api/v1/auth", tags=["Autenticación"])
security = HTTPBearer()

@router.get("/countries", response_model=list[str])
async def get_countries():
    """Endpoint que suministra la lista de países para alimentar el desplegable del frontend."""
    return COUNTRIES_LIST

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user: UserCreate, db = Depends(get_database)):
    """Registra un usuario mediante el servicio de negocio."""
    try:
        return await UserService.create_user(db, user)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al registrar el usuario. Por favor, intente más tarde."
        )

@router.post("/login", response_model=Token)
async def login_user(credentials: UserLogin, db = Depends(get_database)):
    """Autentica un usuario y genera un token JWT."""
    user = await UserService.get_user_by_username(db, credentials.username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nombre de usuario o contraseña incorrectos."
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="La cuenta está desactivada."
        )

    if not UserService.verify_user_password(user, credentials.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nombre de usuario o contraseña incorrectos."
        )

    access_token = create_access_token(
        data={
            "sub": str(user["_id"]),
            "username": user["username"],
            "first_name": user.get("first_name", ""),
            "last_name": user.get("last_name", "")
        }
    )

    return Token(access_token=access_token, token_type="bearer")


async def get_current_user_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db = Depends(get_database)
):
    try:
        payload = jwt.decode(credentials.credentials, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido."
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado."
        )

    user = await UserService.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado."
        )

    return UserResponse(
        id=str(user["_id"]),
        first_name=user.get("first_name", ""),
        last_name=user.get("last_name", ""),
        username=user.get("username", ""),
        country_of_residence=user.get("country_of_residence", ""),
        default_currency=user.get("default_currency", "EUR")
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: UserResponse = Depends(get_current_user_token)):
    """Devuelve el perfil real del usuario autenticado."""
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_current_user_profile(
    profile_data: UpdateUserProfile,
    current_user: UserResponse = Depends(get_current_user_token),
    db = Depends(get_database),
):
    """Actualiza los datos del perfil del usuario autenticado."""
    try:
        return await UserService.update_user_profile(db, current_user.id, profile_data)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar el perfil. Por favor, inténtelo de nuevo."
        )