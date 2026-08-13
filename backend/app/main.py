from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.db.mongodb import connect_to_mongo, close_mongo_connection
from app.core.config import settings
from app.routers import auth

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Evento de inicio: Conectar a MongoDB
    await connect_to_mongo()
    yield
    # Evento de cierre: Desconectar
    await close_mongo_connection()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar routers
app.include_router(auth.router)

@app.get("/")
async def root():
    return {
        "message": "API de MyTrip funcionando correctamente",
        "version": settings.VERSION
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}