# Spec: Helmet CORS Bootstrap

## Purpose

Defines requirements for registering Helmet security headers and CORS policy as Express middleware during application bootstrap, with allowed origins sourced from the `CORS_ORIGINS` environment variable.

## Requirements

### Requirement: Helmet security headers applied globally
The application SHALL register `helmet(...)` as Express middleware during bootstrap, before any route mounts. Every HTTP response MUST include Helmet security headers (e.g. `X-Content-Type-Options`, `X-Frame-Options` / frame-ancestors via CSP).

#### Scenario: Security headers present on API response
- **WHEN** a client sends any HTTP request to the application
- **THEN** the response includes standard Helmet security headers such as `X-Content-Type-Options: nosniff`

#### Scenario: Swagger UI loads without CSP errors in development
- **WHEN** `APP_ENV` is not `production` and a browser opens `/docs`
- **THEN** Swagger UI renders fully with no CSP console errors

#### Scenario: Bull Board loads without CSP errors when enabled
- **WHEN** Bull Board is enabled and a browser opens `/admin/queues`
- **THEN** Bull Board renders fully with no CSP console errors

### Requirement: CORS policy applied globally
The application SHALL register `cors(...)` as Express middleware during bootstrap, before any route mounts. Allowed origins MUST come from the `CORS_ORIGINS` env var.

#### Scenario: Request from allowed origin receives CORS headers
- **WHEN** a browser sends a request with an `Origin` header matching an entry in `CORS_ORIGINS`
- **THEN** the response includes `Access-Control-Allow-Origin` set to that origin

#### Scenario: Preflight from allowed origin succeeds
- **WHEN** a browser sends an `OPTIONS` preflight with an `Origin` matching `CORS_ORIGINS` and `Access-Control-Request-Method: POST`
- **THEN** the response has status `204` and includes appropriate CORS preflight headers

#### Scenario: Request from disallowed origin is rejected
- **WHEN** a browser sends a request with an `Origin` not in `CORS_ORIGINS`
- **THEN** the response does NOT include a permissive `Access-Control-Allow-Origin` header

### Requirement: CORS_ORIGINS validated at startup
The application SHALL validate `CORS_ORIGINS` using the Zod config schema at startup. In production, the value MUST be explicitly set; an empty or missing value SHALL fail startup with a descriptive Zod error.

#### Scenario: Missing CORS_ORIGINS in production fails fast
- **WHEN** `APP_ENV=production` and `CORS_ORIGINS` is not set
- **THEN** the application throws a startup validation error naming `CORS_ORIGINS`

#### Scenario: Valid CORS_ORIGINS parses to origins array
- **WHEN** `CORS_ORIGINS=http://localhost:5173,https://app.example.com`
- **THEN** the config exposes `['http://localhost:5173', 'https://app.example.com']` as the allowed origins

### Requirement: CORS_ORIGINS documented in .env.example
The `.env.example` file SHALL document `CORS_ORIGINS` with a dev-friendly default value and a short explanatory comment.

#### Scenario: Dev default is documented
- **WHEN** a developer reads `.env.example`
- **THEN** they see `CORS_ORIGINS=http://localhost:5173,http://localhost:3000` with a comment explaining its purpose
