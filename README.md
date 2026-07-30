# Neststay API

An ecommerce API built with [NestJS](https://nestjs.com), using Postgres for the database, Redis for caching and job queues (BullMQ), and Typesense for search and product listing.

## Installation

```bash
npm install
cp .env.example .env
```

Update `.env` as needed — it holds database, Redis, Typesense, JWT, CORS, and seed configuration.

## Docker setup

`docker-compose.yml` provisions the supporting services the API needs. Containers are prefixed `neststay-` and are part of the `neststay` Docker Compose project. All services publish their ports to the host so the app (running outside Docker) can connect to them.

Start everything:

```bash
docker compose -p neststay up -d
```

Stop everything:

```bash
docker compose -p neststay down
```

### Containers

| Service        | Container name        | Image                                          | Host port (default) |
| -------------- | ---------------------- | ----------------------------------------------- | -------------------- |
| `db`           | `neststay-db`           | `postgres:18.4-alpine`                          | `5432`                |
| `db-admin`     | `neststay-db-admin`     | `adminer:5.4.2`                                 | `8080`                |
| `search`       | `neststay-search`       | `typesense/typesense:30.2`                      | `8108`                |
| `search-admin` | `neststay-search-admin` | `ghcr.io/bfritscher/typesense-dashboard:2.4.8`  | `8081`                |
| `redis`        | `neststay-redis`        | `redis:8.8.0-alpine`                            | `6379`                |
| `dozzle`       | `neststay-dozzle`       | `amir20/dozzle:latest`                          | `9999`                |

- **Postgres** — database name defaults to `neststay` (see `POSTGRES_DB`/`DATABASE_URL` in `.env.example`).
- **Adminer** — open http://localhost:8080, System: `PostgreSQL`, Server: `db`, Username/Password/DB as configured (defaults: `postgres` / `password` / `neststay`).
- **Typesense** — API reachable at `http://localhost:8108`, API key defaults to `xyz` (`TYPESENSE_API_KEY`).
- **Typesense Dashboard** — open http://localhost:8081 and log in with host `localhost`, port `8108`, protocol `http`, and the same API key.
- **Redis** — reachable at `redis://localhost:6379` (no admin UI), used for both caching (`REDIS_URL`) and BullMQ queues (`REDIS_QUEUE_URL`).
- **Dozzle** — open http://localhost:9999 to view live logs from all containers.

All ports and credentials can be overridden via `.env` (see `.env.example`) — useful if the default ports are already taken on your machine.

## Running the app

```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

Once running:

- API Swagger docs: http://localhost:3000/docs (non-production only)
- BullMQ job dashboard: http://localhost:3000/admin/queues (non-production, or when `ENABLE_BULL_BOARD=true`)

## Database

```bash
# run migrations
npm run prisma:migrate

# seed the database
npm run prisma:seed

# open Prisma Studio
npm run prisma:studio
```

Seeding populates an admin user, fake users, Indian city locations, place types, and fake properties. It's configured via `.env` (`SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_USER_COUNT`, `SEED_USER_PASSWORD`, `SEED_PROPERTY_COUNT`), is safe to re-run (uses `skipDuplicates`/`upsert`), and refuses to run when `APP_ENV=production`.

## Tests

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```

## Makefile commands

A `Makefile` wraps the common Docker and Prisma workflows:

| Command       | Description                                          |
| ------------- | ----------------------------------------------------- |
| `make help`    | List available commands                               |
| `make up`      | Start Docker containers, then run the app (`start:dev`) |
| `make down`    | Stop the app's Docker containers                       |
| `make migrate` | Run database migrations                                |
| `make seed`    | Seed the database                                      |
| `make mrs`     | Drop, migrate, and seed the database (`prisma migrate reset --force`) |

## Example curls

Login to get an access token (use your seeded admin/user credentials):

```bash
curl -X POST http://localhost:3000/users/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password"}'
```

Search as a guest (no auth required):

```bash
curl "http://localhost:3000/search?q=beach+house"
```

Search as an authenticated user:

```bash
curl "http://localhost:3000/search?q=beach+house" \
  -H "Authorization: Bearer <accessToken>"
```

Search with facet filters:

```bash
curl "http://localhost:3000/search?q=apartment&locationName=Goa&placeTypeName=Apartment&numberOfGuests=2&numberOfBedrooms=1&numberOfBathrooms=1&minNightlyRate=50&maxNightlyRate=200&page=1&limit=10"
```
