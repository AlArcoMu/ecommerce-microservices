from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # URL de la base de datos. Por defecto SQLite (para tests/local sin Docker).
    database_url: str = "sqlite:///./users.db"
    root_path: str = ""
    # Clave para firmar los JWT. En producción SIEMPRE por variable de entorno.
    jwt_secret: str = "cambia-esto-en-produccion"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
