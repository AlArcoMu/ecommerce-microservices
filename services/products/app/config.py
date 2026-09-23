from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./products.db"
    root_path: str = ""
    redis_url: str = ""            # vacío = caché desactivada
    cache_ttl: int = 60
    # Debe coincidir con el JWT_SECRET del servicio de usuarios para validar tokens
    jwt_secret: str = "cambia-esto-en-produccion"
    jwt_algorithm: str = "HS256"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
