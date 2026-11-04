"""Database connection pool and schema bootstrap."""

from __future__ import annotations

from pathlib import Path

from psycopg_pool import ConnectionPool

from .config import settings

_SCHEMA_PATH = Path(__file__).with_name("schema.sql")


def create_pool() -> ConnectionPool:
    """Create a (not yet opened) connection pool for the configured database."""
    return ConnectionPool(conninfo=settings.database_url, open=False)


def init_schema(pool: ConnectionPool) -> None:
    """Apply schema.sql. Idempotent (uses CREATE TABLE IF NOT EXISTS)."""
    sql = _SCHEMA_PATH.read_text(encoding="utf-8")
    with pool.connection() as conn:
        conn.execute(sql)
        conn.commit()
