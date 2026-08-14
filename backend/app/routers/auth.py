from fastapi import APIRouter, HTTPException, status, Depends
from app.models.user import UserCreate, UserResponse, UserLogin, Token
from app.db.mongodb import get_database
from app.services.user_service import UserService
from app.core.security import create_access_token
from app.utils.countries import COUNTRIES_LIST

router = APIRouter(prefix="/api/v1/auth", tags=["Autenticación"])

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

    # Ahora UserService.verify_user_password no requiere await (es sincrónico)
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