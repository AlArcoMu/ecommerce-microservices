from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./orders.db"
    root_path: str = ""
    # URL interna del servicio de productos (nombre del servicio en docker-compose)
    products_service_url: str = "http://products:8000"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
