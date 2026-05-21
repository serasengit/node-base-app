# Setup ⚙️

## 📋 Requirements

Before starting, install:

- Node.js `20.x`
- npm
- PostgreSQL
- Docker and Docker Compose if you want the provided local database/services workflow

## 📦 Install Dependencies

```bash
npm install
```

## 🌱 Environment Files

The project loads environment-specific files from:

- `environments/.env.dev`
- `environments/.env.test`
- `environments/.env.prod`

Scripts select the file through `--env=<environment>`.

Example:

```bash
npm run start --env=dev
```

This loads:

```text
environments/.env.dev
```

Important variable groups:

- server: `SERVER_HOST`, `SERVER_PORT`, `HEALTHCHECK_PORT`, `SERVER_API`
- database: `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
- auth: `JWT_ACCESS_SECRET_KEY`, `JWT_REFRESH_SECRET_KEY`, `JWT_ACCESS_EXPIRATION_TIME`, `JWT_REFRESH_EXPIRATION_TIME`, `JWT_MAX_INACTIVE_TIME`
- rate limit: `AUTH_RATE_LIMIT_WINDOW_MS`, `AUTH_RATE_LIMIT_MAX_REQUESTS`
- docs/logging: `ENABLE_API_DOCS`, `LOG_LEVEL`, `LOGS_FOLDER`

Test-only helpers in `environments/.env.test`:

- `TEST_SYSTEM_ADMIN_USERNAME`
- `TEST_SYSTEM_ADMIN_PASSWORD`
- `TEST_READONLY_USERNAME`
- `TEST_READONLY_PASSWORD`

## 🚀 Local Development Startup

Start PostgreSQL with Docker:

```bash
npm run db:dev
```

Apply migrations:

```bash
npm run knex:migrate:latest --env=dev
```

Run seeds:

```bash
npm run knex:seed:run --env=dev
```

Default seeded users:

- `system_admin / Admin123!`
- `readonly / Readonly123!`

Start the backend:

```bash
npm run start --env=dev
```

Live reload:

```bash
npm run start:live --env=dev
```

Debug mode:

```bash
npm run start:dev:debug
```

Debug mode enables the Node inspector on port `9229`.

Useful URLs:

- API: `http://localhost:3000/api/v1`
- Swagger UI: `http://localhost:3000/api/v1/docs`
- OpenAPI JSON: `http://localhost:3000/api/v1/openapi.json`
- Healthcheck: `http://localhost:3005/health`

## 🗄️ Database Commands

Create a migration:

```bash
npm run knex:migrate:make --file_name=create_example_table --env=dev
```

Run pending migrations:

```bash
npm run knex:migrate:latest --env=dev
```

Rollback latest migration batch:

```bash
npm run knex:migrate:rollback --env=dev
```

Create a seed:

```bash
npm run knex:seed:make --file_name=example_seed --env=dev
```

Run seeds:

```bash
npm run knex:seed:run --env=dev
```

## 🐳 Docker Shortcuts

Start PostgreSQL in development:

```bash
npm run db:dev
```

Start PostgreSQL in test:

```bash
npm run db:test
```

Direct docker-compose wrapper:

```bash
npm run dockerize --service=postgres --env=dev
npm run dockerize --service=postgres --env=test
```
