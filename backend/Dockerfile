FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    POETRY_VIRTUALENVS_CREATE=false \
    POETRY_NO_INTERACTION=1 \
    # main.py (at /app) imports the package from /app/src
    PYTHONPATH=/app/src

WORKDIR /app

RUN pip install "poetry==1.8.4"

# Install dependencies first (better layer caching). README is referenced by pyproject.
COPY pyproject.toml README.md ./
RUN poetry install --no-root --only main

# Application code
COPY main.py ./
COPY src ./src

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
