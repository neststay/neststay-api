# Prisma Setup

## Purpose

Defines requirements for Prisma ORM configuration, the shared PrismaService lifecycle, and the npm tooling that keeps the generated client in sync.

## Requirements

### Requirement: Prisma is configured with a PostgreSQL provider
The system SHALL have a `prisma/schema.prisma` file with `provider = "postgresql"` and a `DATABASE_URL` environment variable as the datasource url.

#### Scenario: Schema file exists with correct provider
- **WHEN** a developer inspects `prisma/schema.prisma`
- **THEN** the datasource block SHALL declare `provider = "postgresql"` and `url = env("DATABASE_URL")`

#### Scenario: DATABASE_URL is documented but not committed
- **WHEN** a developer clones the repo and checks `.env.example`
- **THEN** `.env.example` SHALL contain a `DATABASE_URL` placeholder
- **AND** `.env` SHALL be listed in `.gitignore`

### Requirement: PrismaService manages the DB connection lifecycle
The system SHALL provide a `PrismaService` (extending `PrismaClient`) that connects on module init and disconnects on module destroy.

#### Scenario: Application starts up
- **WHEN** the NestJS application bootstraps
- **THEN** `PrismaService.onModuleInit()` SHALL call `this.$connect()`

#### Scenario: Application shuts down
- **WHEN** the NestJS application receives a shutdown signal
- **THEN** `PrismaService.onModuleDestroy()` SHALL call `this.$disconnect()`

### Requirement: PrismaModule is globally available
The system SHALL export `PrismaService` from a `PrismaModule` marked as `@Global()` so that any feature module can inject `PrismaService` without re-importing `PrismaModule`.

#### Scenario: Feature module injects PrismaService
- **WHEN** a repository class declares `PrismaService` as a constructor dependency
- **THEN** NestJS SHALL resolve it without requiring `PrismaModule` to be imported in the feature module

### Requirement: Prisma generate runs automatically after install
The system SHALL include a `postinstall` npm script that runs `prisma generate` so the Prisma client type stubs stay in sync after `npm install`.

#### Scenario: Developer runs npm install
- **WHEN** `npm install` completes
- **THEN** `prisma generate` SHALL execute automatically

### Requirement: Prisma npm scripts are available
The system SHALL expose npm scripts `prisma:migrate` (prisma migrate dev), `prisma:generate` (prisma generate), and `prisma:studio` (prisma studio) in `package.json`.

#### Scenario: Developer runs migration
- **WHEN** the developer runs `npm run prisma:migrate`
- **THEN** `prisma migrate dev` SHALL execute

#### Scenario: Developer runs studio
- **WHEN** the developer runs `npm run prisma:studio`
- **THEN** `prisma studio` SHALL open the Prisma data browser

### Requirement: Prisma seed command is registered in prisma.config.ts
The system SHALL have a `prisma.config.ts` file that registers the seed command as `npx tsx prisma/seed.ts` under `migrations.seed`, enabling `npx prisma db seed` to locate and execute the seed script.

#### Scenario: Developer runs prisma db seed
- **WHEN** a developer runs `npx prisma db seed` from the project root
- **THEN** Prisma SHALL execute `npx tsx prisma/seed.ts` as defined in `prisma.config.ts`

### Requirement: PrismaService uses PrismaPg adapter for Prisma v7 compatibility
The system SHALL construct `PrismaClient` with a `PrismaPg` adapter backed by a `pg.Pool` so that the NestJS application is compatible with the Prisma v7 driver adapter requirement. The pool SHALL be terminated in `onModuleDestroy`.

#### Scenario: Application starts with Prisma v7
- **WHEN** the NestJS application bootstraps
- **THEN** `PrismaService` SHALL construct `PrismaClient` passing `{ adapter: new PrismaPg(pool) }` and SHALL connect successfully

#### Scenario: Application shuts down cleanly
- **WHEN** the NestJS application receives a shutdown signal
- **THEN** `PrismaService.onModuleDestroy()` SHALL call `this.$disconnect()` and `this.pool.end()` to release all connections

### Requirement: PrismaService enables query event logging based on APP_DEBUG
The system SHALL construct `PrismaClient` with `log: [{ emit: 'event', level: 'query' }]` when `appConfig.debug` is `true`, and SHALL omit query logging entirely when `appConfig.debug` is `false`. When enabled, `PrismaService` SHALL register a `query` event handler (via `this.$on('query', ...)`) that makes each executed query's SQL, params, and duration available to any active request-scoped query-log context.

#### Scenario: PrismaService constructed with APP_DEBUG enabled
- **WHEN** the NestJS application bootstraps with `APP_DEBUG=true`
- **THEN** `PrismaService` SHALL construct `PrismaClient` with `log: [{ emit: 'event', level: 'query' }]`
- **AND** SHALL register a handler via `this.$on('query', ...)`

#### Scenario: PrismaService constructed with APP_DEBUG disabled
- **WHEN** the NestJS application bootstraps with `APP_DEBUG=false` (or unset)
- **THEN** `PrismaService` SHALL construct `PrismaClient` without the `log` option
- **AND** SHALL NOT register a `query` event handler
