from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_instance = Database()

async def connect_to_mongo():
    if not settings.MONGODB_URL:
        print("ERROR: MONGODB_URL no está configurada en el archivo .env")
        return
    
    try:
        db_instance.client = AsyncIOMotorClient(settings.MONGODB_URL)
        db_instance.db = db_instance.client[settings.DATABASE_NAME]
        # Realizamos un ping para verificar la conexión real con el servidor
        await db_instance.client.admin.command('ping')
        print(f"Conexión establecida correctamente con MongoDB Atlas ({settings.DATABASE_NAME}).")
        
        # Crear índices necesarios
        await create_indexes()
    except Exception as e:
        print(f"Error al conectar con MongoDB Atlas: {e}")

async def close_mongo_connection():
    if db_instance.client:
        db_instance.client.close()
        print("Conexión con MongoDB Atlas cerrada.")

async def create_indexes():
    """Crea los índices necesarios en las colecciones."""
    try:
        # Índice único en el campo username
        await db_instance.db["users"].create_index("username", unique=True)
        
        # Índices para la caché de información de países y destinos
        await db_instance.db["country_travel_info"].create_index(
            [("origin_country", 1), ("destination_country", 1)]
        )
        await db_instance.db["country_travel_info"].create_index(
            [("origin_country", 1), ("destination_city", 1)]
        )
        await db_instance.db["country_travel_info"].create_index(
            [("origin_country", 1), ("search_query", 1)]
        )
        
        # Índice único para enlaces oficiales de pasaporte por país de origen
        await db_instance.db["passport_links"].create_index("country", unique=True)
        
        # Índices para la colección de costes diarios por ciudad
        await db_instance.db["city_daily_costs"].create_index(
            [("destination_city", 1), ("currency", 1)]
        )
        await db_instance.db["city_daily_costs"].create_index(
            [("destination_city", 1), ("destination_country", 1), ("currency", 1)]
        )
        print("Índices de base de datos creados correctamente.")
    except Exception as e:
        print(f"Error al crear índices: {e}")

def get_database():
    return db_instance.db