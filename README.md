# 🚀 Node Base App

Reusable backend skeleton built with TypeScript, Express, Objection.js, Knex, TypeDI and PostgreSQL.

It includes JWT authentication with refresh token rotation, RBAC authorization, CRUD examples, OpenAPI exposure, integration-style API tests, Docker support and GitLab CI tooling.

## 📋 Quick Start

Requirements:

- Node.js `20.x`
- npm
- PostgreSQL
- Docker and Docker Compose for containerized database/services

Install dependencies:

```bash
npm install
```

Start PostgreSQL for development:

```bash
npm run db:dev
```

Run migrations and seeds:

```bash
npm run knex:migrate:latest --env=dev
npm run knex:seed:run --env=dev
```

Start the API:

```bash
npm run start --env=dev
```

Useful local URLs:

- API: `http://localhost:3000/api/v1`
- Swagger UI: `http://localhost:3000/api/v1/docs`
- OpenAPI JSON: `http://localhost:3000/api/v1/openapi.json`
- Healthcheck: `http://localhost:3005/health`

Default seeded development users:

- `system_admin / Admin123!`
- `readonly / Readonly123!`

## 🗂️ Project Structure

Main areas:

- `app/bootstrap`: startup and runtime wiring
- `app/core`: reusable technical building blocks
- `app/api-messages`: API codes and error types
- `app/docs`: OpenAPI generation and route introspection
- `app/features`: business modules grouped by domain
- `db/*/migrations`: schema changes per environment
- `db/*/seeds`: seed data per environment
- `environments`: environment files for `dev` and `test`

Feature examples:

- `app/features/auth`
- `app/features/users`
- `app/features/cities`
- `app/features/meteo-stations`

## 🛠️ Commands

- Start dev server: `npm run start --env=dev`
- Start with live reload: `npm run start:live --env=dev`
- Start with debugger: `npm run start:dev:debug`
- Build: `npm run build`
- Lint: `npm run lint`
- Format: `npm run format`
- Run tests: `npm run test`
- Run coverage: `npm run test:coverage`
- Check coverage threshold: `npm run test:coverage:check -- --statements=80 --lines=80 --functions=80 --branches=80`
- Start dev DB: `npm run db:dev`
- Start test DB: `npm run db:test`

## 📚 Documentation

Detailed documentation is split into focused files:

- [docs/setup.md](docs/setup.md): requirements, environments, startup and database workflow
- [docs/architecture.md](docs/architecture.md): `bootstrap/core/features`, auth, RBAC and feature conventions
- [docs/testing.md](docs/testing.md): test layout, helpers, coverage and test expectations
- [docs/ci-sonar.md](docs/ci-sonar.md): GitLab pipeline, SonarQube and ZAP
- [docs/troubleshooting.md](docs/troubleshooting.md): common local, Docker and CI issues

## 🧪 Testing

Run the full suite:

```bash
npm run test
```

Run coverage:

```bash
npm run test:coverage
```

## 🔁 CI

The GitLab pipeline currently uses these stages:

```text
dependencies -> build -> test -> sonar -> zap
```

Common CI variables:

- `SONAR_HOST_URL`
- `SONAR_TOKEN`
- `MIN_COVERAGE_PERCENTAGE`

## 📝 Notes

- `users` live in the `rbac` schema.
- `cities` and `meteo_stations` live in the `public` schema.
- Public API documentation depends on `ENABLE_API_DOCS=true`.
- `cities`, `meteo-stations` and `users` are good reference features when creating new modules.
