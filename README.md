<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Infrastructure (Docker)

`docker-compose.yml` provisions the supporting services the API needs. All containers are prefixed `rynok-` and publish their ports to the host so the app (running outside Docker) can connect to them.

| Service       | Container name       | Image                                       | Host port (default) |
| ------------- | --------------------- | -------------------------------------------- | -------------------- |
| `db`          | `rynok-db`            | `postgres:18.4-alpine`                       | `5432`                |
| `db-admin`    | `rynok-db-admin`      | `adminer:5.4.2`                              | `8080`                |
| `search`      | `rynok-search`        | `typesense/typesense:30.2`                   | `8108`                |
| `search-admin`| `rynok-search-admin`  | `ghcr.io/bfritscher/typesense-dashboard:2.4.8` | `8081`              |
| `redis`       | `rynok-redis`         | `redis:8.8.0-alpine`                         | `6379`                |

Start everything:

```bash
docker compose up -d
```

- **Postgres** — database name is `rynok` (see `POSTGRES_DB`/`DATABASE_URL` in `.env.example`).
- **Adminer** — open http://localhost:8080, System: `PostgreSQL`, Server: `db`, Username/Password/DB as configured (defaults: `postgres` / `password` / `rynok`).
- **Typesense** — API reachable at `http://localhost:8108`, API key defaults to `xyz` (`TYPESENSE_API_KEY`).
- **Typesense Dashboard** — open http://localhost:8081 and log in with host `localhost`, port `8108`, protocol `http`, and the same API key.
- **Redis** — reachable at `redis://localhost:6379` (no admin UI), used for both caching (`REDIS_URL`) and BullMQ queues (`REDIS_QUEUE_URL`).

All ports and credentials can be overridden via a `.env` file (see `.env.example`) — useful if `5432`/`8080`/`8108`/`8081`/`6379` are already taken on your machine.

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Database seeding

Populate the database with an admin user, fake users, Indian city locations, place types, and fake properties:

```bash
npm run prisma:seed
```

Configure the seeded data via `.env` (see `.env.example`):

- `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` — credentials for the ensured admin user
- `SEED_USER_COUNT` — number of fake users to generate (default `10`)
- `SEED_USER_PASSWORD` — password for fake users
- `SEED_PROPERTY_COUNT` — number of fake properties to generate (default `10`)

The seed script is safe to re-run — it uses `skipDuplicates`/`upsert` so existing users, locations, and place types won't be duplicated. It also refuses to run when `APP_ENV=production`.

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.
