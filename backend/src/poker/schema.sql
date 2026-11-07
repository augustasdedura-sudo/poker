-- Schema for stored hands. Applied idempotently on application startup so that
-- `docker compose up` needs no manual migration step.
CREATE TABLE IF NOT EXISTS hands (
    id          UUID PRIMARY KEY,
    stack       INTEGER NOT NULL,
    dealer      INTEGER NOT NULL,
    hole_cards  JSONB   NOT NULL,
    streets     JSONB   NOT NULL,
    winnings    JSONB   NOT NULL,
    pot         INTEGER NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    stacks      JSONB   NOT NULL DEFAULT '[]'::jsonb
);

-- Added after the first release: per-seat starting stacks for cash-game hands.
-- Harmless on a fresh database, brings an existing one up to date.
ALTER TABLE hands ADD COLUMN IF NOT EXISTS stacks JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS hands_created_at_idx ON hands (created_at DESC);
