"""FastAPI application entry point.

Run with: ``uvicorn main:app`` (the Docker image and compose file do this).
The ``src/`` directory is on ``PYTHONPATH`` so ``poker`` imports resolve.
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from poker.api import router
from poker.bot import bot_router
from poker.db import create_pool, init_schema


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Open the connection pool and ensure the schema exists before serving.
    pool = create_pool()
    pool.open()
    init_schema(pool)
    app.state.pool = pool
    try:
        yield
    finally:
        pool.close()


app = FastAPI(title="Poker Hand API", version="0.1.0", lifespan=lifespan)

# The frontend reaches the API through a same-origin Next.js rewrite, so CORS is
# not strictly required; it is enabled to keep the API usable directly as well.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")
app.include_router(bot_router, prefix="/api")


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
