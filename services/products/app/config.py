from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./products.db"
    root_path: str = ""
    redis_url: str = ""  # vacío = caché desactivada (útil en tests)
    cache_ttl: int = 60  # segundos

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
