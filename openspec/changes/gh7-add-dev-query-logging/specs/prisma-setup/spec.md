## ADDED Requirements

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
