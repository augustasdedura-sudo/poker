"""Application configuration, read from the environment."""

from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime settings.

    ``database_url`` is read from the ``DATABASE_URL`` environment variable,
    which docker-compose sets to point at the ``db`` service.
    """

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql://poker:poker@localhost:5432/poker"


settings = Settings()
