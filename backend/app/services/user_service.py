from bson.objectid import ObjectId
from fastapi import HTTPException, status
from app.models.user import UserCreate, UserResponse
from app.core.security import hash_password, verify_password
from app.utils.countries import DEFAULT_CURRENCIES

class UserService:
    """Servicio para operaciones relacionadas con usuarios."""
    
    @staticmethod
    async def create_user(db, user: UserCreate) -> UserResponse:
        """
        Crea un nuevo usuario en la base de datos.
        
        Args:
            db: Instancia de base de datos
            user: Datos del usuario a crear
            
        Returns:
            UserResponse con los datos del usuario creado
            
        Raises:
            HTTPException: Si el username ya existe
        """
        existing_user = await db["users"].find_one({"username": user.username})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El nombre de usuario ya está en uso."
            )

        default_currency = DEFAULT_CURRENCIES.get(user.country_of_residence, "EUR")

        user_dict = {
            "first_name": user.first_name,
            "last_name": user.last_name,
            "username": user.username,
            "hashed_password": hash_password(user.password),
            "country_of_residence": user.country_of_residence,
            "default_currency": default_currency,
            "is_active": True
        }

        result = await db["users"].insert_one(user_dict)
        
        return UserResponse(
            id=str(result.inserted_id),
            first_name=user.first_name,
            last_name=user.last_name,
            username=user.username,
            country_of_residence=user.country_of_residence,
            default_currency=default_currency
        )
    
    @staticmethod
    async def get_user_by_username(db, username: str):
        """Obtiene un usuario por su nombre de usuario."""
        return await db["users"].find_one({"username": username})
    
    @staticmethod
    async def get_user_by_id(db, user_id: str):
        """Obtiene un usuario por su ID."""
        try:
            return await db["users"].find_one({"_id": ObjectId(user_id)})
        except Exception:
            return None
    
    @staticmethod
    async def verify_user_password(user: dict, password: str) -> bool:
        """Verifica la contraseña de un usuario."""
        if not user or "hashed_password" not in user:
            return False
        return verify_password(password, user["hashed_password"])
