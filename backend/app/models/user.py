from pydantic import BaseModel, Field, model_validator, field_validator
from typing import Optional
from app.utils.countries import COUNTRIES_LIST

class UserCreate(BaseModel):
    first_name: str = Field(
        ..., 
        min_length=1, 
        max_length=49, 
        description="Nombre obligatorio (menos de 50 caracteres)"
    )
    last_name: str = Field(
        ..., 
        min_length=1, 
        max_length=49, 
        description="Apellidos obligatorios (menos de 50 caracteres)"
    )
    username: str = Field(
        ..., 
        min_length=5, 
        max_length=49, 
        description="Nombre de usuario único (entre 5 y 49 caracteres)"
    )
    password: str = Field(
        ..., 
        min_length=6, 
        description="Contraseña obligatoria"
    )
    confirm_password: str = Field(
        ..., 
        description="Confirmación de contraseña"
    )
    country_of_residence: str = Field(
        ..., 
        description="País de residencia seleccionado del desplegable"
    )

    @field_validator("country_of_residence")
    @classmethod
    def validate_country(cls, v: str) -> str:
        """Verifica que el país recibido exista en la lista oficial."""
        if v not in COUNTRIES_LIST:
            raise ValueError("El país seleccionado no es válido.")
        return v

    @model_validator(mode="after")
    def check_passwords_match(self):
        """Valida que la contraseña y su confirmación coincidan exactamente."""
        if self.password != self.confirm_password:
            raise ValueError("Las contraseñas no coinciden.")
        return self

class UserResponse(BaseModel):
    id: str
    first_name: str
    last_name: str
    username: str
    country_of_residence: str
    default_currency: str

class UserLogin(BaseModel):
    username: str = Field(..., description="Nombre de usuario registrado")
    password: str = Field(..., description="Contraseña de la cuenta")

class UpdateUserProfile(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=49, description="Nombre del usuario")
    last_name: str = Field(..., min_length=1, max_length=49, description="Apellidos del usuario")
    username: str = Field(..., min_length=5, max_length=49, description="Nombre de usuario único")
    country_of_residence: str = Field(..., description="País del usuario")
    password: Optional[str] = Field(default=None, min_length=6, description="Nueva contraseña opcional")
    confirm_password: Optional[str] = Field(default=None, min_length=6, description="Confirmación de la nueva contraseña")

    @field_validator("country_of_residence")
    @classmethod
    def validate_country(cls, v: str) -> str:
        if v not in COUNTRIES_LIST:
            raise ValueError("El país seleccionado no es válido.")
        return v

    @model_validator(mode="after")
    def validate_password_change(self):
        if self.password is not None:
            self.password = self.password.strip()
        if self.confirm_password is not None:
            self.confirm_password = self.confirm_password.strip()

        has_password = self.password is not None and self.password != ""
        has_confirm = self.confirm_password is not None and self.confirm_password != ""

        if has_password != has_confirm:
            raise ValueError("Debes completar la nueva contraseña y su confirmación.")

        if has_password and self.password != self.confirm_password:
            raise ValueError("Las contraseñas no coinciden.")

        return self

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"