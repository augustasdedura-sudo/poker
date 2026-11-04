# Poker backend

FastAPI + PostgreSQL backend for the simplified 6-max Texas Hold'em app.

- `src/poker/` — application package (`src/` layout; `main.py` is the entry point at the project root).
- `tests/` — pytest suite (mirrors `src/`), runnable without a live database.

## Run (standalone, without Docker)

```bash
poetry install
export DATABASE_URL=postgresql://poker:poker@localhost:5432/poker
poetry run uvicorn main:app --reload --port 8000
```

## Test

```bash
poetry install
poetry run pytest
```

The API tests inject an in-memory repository, and the winnings tests call `pokerkit` directly, so
neither needs a running PostgreSQL instance.
