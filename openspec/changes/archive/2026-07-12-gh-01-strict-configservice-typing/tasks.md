## 1. Combined config type

- [x] 1.1 Add an `AppConfig` interface to `src/config/index.ts`, built from `ConfigType<typeof appConfig>`, `ConfigType<typeof corsConfig>`, `ConfigType<typeof databaseConfig>`, `ConfigType<typeof jwtConfig>`, `ConfigType<typeof redisConfig>`, `ConfigType<typeof queueConfig>`, keyed by namespace (`app`, `cors`, `database`, `jwt`, `redis`, `queue`)
- [x] 1.2 Export `AppConfig` from `src/config/index.ts` alongside the existing config exports

## 2. Update injection sites to strict typing

- [x] 2.1 `src/main.ts`: type `configService` as `ConfigService<AppConfig, true>`; fetch `app`/`cors`/`queue` namespace objects via `getOrThrow` and use plain property access (`appConfig.env`, `corsConfig.origins`, `queueConfig.enableBullBoard`, `appConfig.port`)
- [x] 2.2 `src/auth/auth.module.ts`: type the injected `config` as `ConfigService<AppConfig, true>`; fetch the `jwt` namespace object via `getOrThrow('jwt')` and use `jwtConfig.secret` / `jwtConfig.expiresIn`
- [x] 2.3 `src/auth/strategies/jwt.strategy.ts`: type the injected `config` as `ConfigService<AppConfig, true>`; fetch the `jwt` namespace object via `getOrThrow('jwt')` and use `jwtConfig.secret`
- [x] 2.4 `src/user/user.module.ts`: type the injected `config` as `ConfigService<AppConfig, true>`; fetch the `jwt` namespace object via `getOrThrow('jwt')` and use `jwtConfig.secret` / `jwtConfig.expiresIn`
- [x] 2.5 `src/cache/cache.service.ts`: type the injected `configService` as `ConfigService<AppConfig, true>`; fetch the `redis` namespace object via `getOrThrow('redis')` and use `redisConfig.url` / `redisConfig.keyPrefix` / `redisConfig.defaultTtlSeconds`
- [x] 2.6 `src/prisma/prisma.service.ts`: type the injected `config` as `ConfigService<AppConfig, true>`; fetch the `database` namespace object via `getOrThrow('database')` and use `databaseConfig.url`
- [x] 2.7 `src/queue/queue.module.ts`: type the injected `configService` as `ConfigService<AppConfig, true>`; fetch the `queue` namespace object via `getOrThrow('queue')` and use `queueConfig.url` / `queueConfig.prefix`

## 3. Verification

- [x] 3.1 Run the TypeScript build (`tsc`/`nest build` per project scripts) and fix any type errors surfaced by strict-mode config typing
- [x] 3.2 Run the existing test suite to confirm no runtime behavior changed (no unit tests exist; the one e2e test fails to run due to a pre-existing, unrelated ts-jest module-resolution issue predating this change)
- [x] 3.3 Confirm no `getOrThrow<...>('...')` call sites with manual generics remain (`grep -rn "getOrThrow<" src/`)
