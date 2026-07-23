# redis-cache

## Purpose

Global Redis-backed cache service for the application, providing a standardized caching layer with fail-open error handling and no-op mode support.

## Requirements

### Requirement: CacheModule is globally injectable
The system SHALL provide a `@Global()` NestJS `CacheModule` that exports `CacheService`, making it injectable in any module without re-importing `CacheModule`.

#### Scenario: Injecting CacheService without re-importing CacheModule
- **WHEN** a feature module injects `CacheService` in its constructor
- **THEN** NestJS resolves the dependency without requiring `CacheModule` in the feature module's imports array

### Requirement: cacheGet returns typed data or null
The system SHALL provide `cacheGet<T>({ key })` which returns the cached value deserialized as `T` when the key exists and has not expired, or `null` when the key is absent or expired.

#### Scenario: Cache hit — key exists and is not expired
- **WHEN** `cacheGet` is called with a key that has a valid, unexpired Redis entry
- **THEN** the method returns the JSON-deserialized value typed as `T`

#### Scenario: Cache miss — key does not exist
- **WHEN** `cacheGet` is called with a key that has no Redis entry
- **THEN** the method returns `null`

#### Scenario: Cache miss — key is expired
- **WHEN** `cacheGet` is called with a key whose Redis TTL has elapsed
- **THEN** the method returns `null` (Redis TTL handles expiry; no stale data is returned)

### Requirement: cachePut stores data with TTL
The system SHALL provide `cachePut<T>({ key, data, config? })` which serializes `data` as JSON and stores it in Redis with a TTL. When `config.expirySeconds` is provided it MUST be used; otherwise the TTL MUST fall back to `REDIS_DEFAULT_TTL_SECONDS`.

#### Scenario: cachePut with explicit expirySeconds
- **WHEN** `cachePut` is called with `config: { expirySeconds: 300 }`
- **THEN** the value is stored in Redis with a 300-second TTL

#### Scenario: cachePut with no config — uses default TTL
- **WHEN** `cachePut` is called without a `config` argument
- **THEN** the value is stored using the `REDIS_DEFAULT_TTL_SECONDS` env var as the TTL

### Requirement: cacheForget removes a key
The system SHALL provide `cacheForget({ key })` which deletes the specified key from Redis. If the key does not exist the operation MUST complete without error.

#### Scenario: cacheForget on an existing key
- **WHEN** `cacheForget` is called with a key that exists in Redis
- **THEN** the key is removed from Redis and subsequent `cacheGet` calls for that key return `null`

#### Scenario: cacheForget on a non-existent key
- **WHEN** `cacheForget` is called with a key that does not exist in Redis
- **THEN** the method completes without throwing

### Requirement: All keys are automatically namespaced
The system SHALL prepend `REDIS_KEY_PREFIX` to every logical key passed by callers before issuing any Redis command. Callers MUST NOT apply the prefix themselves.

#### Scenario: Key stored with prefix
- **WHEN** `cachePut` is called with logical key `user-profile:abc123` and `REDIS_KEY_PREFIX=content-owl:`
- **THEN** the key stored in Redis is `content-owl:user-profile:abc123`

#### Scenario: cacheGet retrieves using the same prefix
- **WHEN** `cacheGet` is called with logical key `user-profile:abc123`
- **THEN** the system looks up `content-owl:user-profile:abc123` in Redis

### Requirement: Fail-open on Redis errors
The system SHALL treat Redis errors as non-fatal. `cacheGet` MUST return `null` on read errors. `cachePut` and `cacheForget` MUST log a warning and return without throwing on write/delete errors.

#### Scenario: Redis unavailable on cacheGet
- **WHEN** `cacheGet` is called and Redis is unreachable or throws
- **THEN** the method returns `null` and logs a warning; no exception propagates to the caller

#### Scenario: Redis unavailable on cachePut
- **WHEN** `cachePut` is called and Redis is unreachable or throws
- **THEN** the method logs a warning and returns; no exception propagates to the caller

#### Scenario: Redis unavailable on cacheForget
- **WHEN** `cacheForget` is called and Redis is unreachable or throws
- **THEN** the method logs a warning and returns; no exception propagates to the caller

### Requirement: No-op mode when REDIS_URL is absent
The system SHALL log a warning at startup and operate in no-op mode when `REDIS_URL` is not configured. In no-op mode `cacheGet` MUST return `null`, and `cachePut` / `cacheForget` MUST be silent no-ops.

#### Scenario: REDIS_URL not set — cacheGet returns null
- **WHEN** `REDIS_URL` is not set in the environment and `cacheGet` is called
- **THEN** the method returns `null` without attempting a Redis connection

#### Scenario: REDIS_URL not set — cachePut is a no-op
- **WHEN** `REDIS_URL` is not set in the environment and `cachePut` is called
- **THEN** the method returns without storing anything and without throwing

### Requirement: Redis connection managed via module lifecycle
The system SHALL establish the `ioredis` client connection on module init and disconnect on module destroy, mirroring the `PrismaService` lifecycle pattern.

#### Scenario: Connection established on application start
- **WHEN** the NestJS application boots and `CacheModule` is loaded
- **THEN** `CacheService` connects to Redis using `REDIS_URL`

#### Scenario: Connection closed on application shutdown
- **WHEN** the NestJS application receives a shutdown signal
- **THEN** `CacheService` disconnects the `ioredis` client cleanly

### Requirement: Environment variables documented in .env.example
The system SHALL document `REDIS_URL`, `REDIS_KEY_PREFIX`, and `REDIS_DEFAULT_TTL_SECONDS` in `.env.example` with example values.

#### Scenario: Developer clones the repo and checks .env.example
- **WHEN** a developer reads `.env.example`
- **THEN** they see `REDIS_URL`, `REDIS_KEY_PREFIX`, and `REDIS_DEFAULT_TTL_SECONDS` with example values and brief comments
