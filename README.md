# Simplified 6-max Texas Hold'em

Play a single simplified 6-max Texas Hold'em hand from start to finish. One user acts for all six
players by pressing buttons. The left panel logs the action; when the hand ends it is saved to
PostgreSQL and appears in the hand-history panel on the right.

- **Frontend:** Next.js (App Router) + React + TypeScript + shadcn/ui. Game logic is a pure,
  UI-free TypeScript engine.
- **Backend:** FastAPI + PostgreSQL, repository pattern with raw SQL (no ORM), `@dataclass` domain
  models. Win/loss is computed with [`pokerkit`](https://pokerkit.readthedocs.io/).

## Run it

Requires Docker. From the repository root:

```bash
docker compose up -d --build
```

Then open **http://localhost:3000**. No other configuration is needed. The frontend talks to the
backend through a same-origin Next.js rewrite (`/api/*` → the `backend` service), and the backend
creates its schema on startup.

Stop and reset:

```bash
docker compose down -v
```

## How to play

1. Set the **Stacks** value (default 10000) and press **Apply** to set every player's stack.
2. Press **Start** to deal a hand. (The button is renamed **Reset** after the first action.)
3. Act for each player with **Fold / Check / Call / Bet / Raise / Allin**. All six are always shown
   and illegal ones are disabled. The Bet/Raise amount has `-` / `+` controls that step by the big
   blind (40), plus quick sizes (Min, ½ Pot, ¾ Pot, Pot, Max), a slider and a typed amount.
4. When the hand ends it is POSTed to the backend, which computes each player's win/loss, stores it,
   and the frontend refreshes the hand-history panel.

The page opens in **Manual** mode, the game described above. **You vs AI** is an extra mode where
you play Player 1 as a cash game against five bots.

Blinds are small blind 20 / big blind 40. Players are `Player 1`..`Player 6`.

Backend style check (PEP 8, 99-character lines as configured in `backend/setup.cfg`):
`pip install pycodestyle && pycodestyle src tests main.py` from `backend/`.

## Tests

Backend (no database required — the API tests inject an in-memory repository and the winnings tests
call `pokerkit` directly):

```bash
cd backend
poetry install
poetry run pytest
```

Frontend (unit tests for the game engine + one integration test that plays a full hand through the
UI with the network mocked):

```bash
cd frontend
npm install
npm test
```

## Architecture

```
poker/
  docker-compose.yml        # db + backend (:8000) + frontend (:3000)
  backend/                  # FastAPI + PostgreSQL
    main.py                 # app entry point (uvicorn main:app)
    src/poker/
      domain.py             # @dataclass models (Hand, StreetPlay, Action)
      schemas.py            # pydantic DTOs <-> domain (camelCase JSON)
      winnings.py           # pokerkit replay -> net payoffs + pot
      repository.py         # HandRepository (Protocol) + PostgreSQL raw-SQL impl
      db.py / schema.sql     # connection pool + idempotent schema
      api.py                # REST: POST/GET /api/hands
    tests/
  frontend/                 # Next.js + React + TypeScript + shadcn/ui
    src/lib/poker/          # pure game logic: cards, engine, format, types
    src/lib/api.ts          # REST client
    src/components/         # PokerApp, HandHistory, poker/ (table, ActionBar, LogPanel), ui/
    src/app/                # single-page App Router entry
```

### REST API (hand resource)

| Method | Path               | Purpose                                                        |
| ------ | ------------------ | -------------------------------------------------------------- |
| `POST` | `/api/hands`       | Create a hand; the server computes winnings + pot and stores it |
| `GET`  | `/api/hands`       | List hands, newest first                                       |
| `GET`  | `/api/hands/{id}`  | Fetch one hand (404 if unknown)                                |

The client posts the full hand (starting stack, dealer, hole cards, and the actions per street). The
server **does not trust** any winnings from the client: it replays the hand in `pokerkit` and reads
the net payoff per player. Because `pokerkit` enforces the rules during replay, an illegal hand is
rejected — this is the server-side validation that mirrors the client engine.

### Key design decisions

- **Shared contract.** The TypeScript engine's `toRecord()` output is exactly the JSON the backend
  replays, so the client and server validate the same rules. Both compute the pot identically.
- **Seat mapping for pokerkit.** pokerkit uses positions (0 = small blind … last = button). Our
  players have a rotating dealer, so we order them `[D+1, D+2, …, D]` (small blind first, dealer
  last), replay, and remap payoffs back to player index. See `winnings.py`.
- **Pot = contested pot.** An uncalled bet (a bet/blind nobody matches) is returned to its owner,
  matching pokerkit's own behaviour, so `pot = sum(contributions) − (max − second_max)`.
- **Repository pattern.** Endpoints reach the database only through `HandRepository`; it is a
  `Protocol`, so tests swap in an in-memory implementation and need no database.
- **Short action format** (history card): `f` fold, `x` check, `c` call, `b<amt>` bet, `r<amt>`
  raise, `allin`; actions within a street joined by `:`, streets separated by spaces, board cards
  shown between streets, e.g. `f:f:f:r300:c:f 3hKdQs x:b100:c Ac x:x Th b80:r160:c`.

## Notes / caveats

- The full `docker compose up -d --build` path has been run end to end: all three containers come
  up, the site serves on http://localhost:3000, and hands post and reload through the database.
- The log phrasing follows the brief's example. The brief's example is internally inconsistent about
  a trailing "chips" on raises (`raises to 300 chips` vs `raises to 160`); this app is consistent and
  omits "chips" on bet/raise/call lines (blind-posting lines keep it, as in the example).

## License

Personal, non-commercial project — see [LICENSE](LICENSE). All rights reserved; shared for
evaluation and personal, non-commercial use only.
