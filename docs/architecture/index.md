This is a Nestjs based project

# Naming conventions 
- In loops like forEach or  `return mapToPaginatedResponse(result, (u) => this.toDto(u));` single line variables should not be used. instead of the above example, you can do `return mapToPaginatedResponse(results, (uresult) => this.toDto(uresult));`. The entity in plural and then single is much more readable.

# Validations
- validations should be done using zod package.

# Type safe
- Code should be type safe. Always add types to function params, return types and other places where types are required.

# Function arguments
- Any function with multiple inputs or optional parameters must use a single object argument (destructured in the callee) instead of multiple positional arguments.

# Code architecture
- each module should have repositories which are responsible for database activities like select, insert, update and delete. No other place should directly have queries. 
- services should call repositories for data and return the data. if the data needs any kind of modification, service should do that.
- services should always return data in form of a dto. 
- each module should have a dto folder where dtos should be kept

# API request and response
- HTTP APIs use a standard success envelope (`ResponseApiDto`), NestJS error shape, Zod validation at the boundary, and Swagger DTOs for documentation.
- See [API request and response architecture](./api-req-resp.md) for envelopes, error formats, Swagger conventions, and the checklist for new endpoints.

# Events and background work
- Services emit in-process events via `EventEmitter2` with minimal payloads after successful writes; listeners enqueue jobs; queue processors perform side effects and load fresh data from repositories.
- See [Event architecture](./event-architecture.md) for the service → listener → queue → processor flow, payload rules, and `EventEmitter2` async/error-handling conventions.

# Configuration usage
- `ConfigService` is injected as `ConfigService<AppConfig, true>` (`AppConfig` from `src/config/index.ts`), never the bare untyped `ConfigService`.
- Never call `getOrThrow`/`get` with a dotted path (e.g. `getOrThrow('jwt.secret')`). Instead, fetch the whole namespace object once with the namespace key (e.g. `configService.getOrThrow('jwt')`), assign it to a locally named config object (e.g. `jwtConfig`), then access fields with plain property access (e.g. `jwtConfig.secret`).
- This keeps every access fully type-checked: the namespace key is checked against `AppConfig`'s top-level keys, and field access is checked by the namespace's own type — no manual generics, no per-call-site string paths.

```typescript
constructor(private readonly configService: ConfigService<AppConfig, true>) {
  const jwtConfig = this.configService.getOrThrow('jwt');
  this.secret = jwtConfig.secret;
  this.expiresIn = jwtConfig.expiresIn;
}
```
