# node-base-app

Backend skeleton in TypeScript with Express, Objection.js, Knex, Typedi and PostgreSQL.

## Project structure

The codebase follows a `core + features` organization:

```text
app/
  api-messages/   Shared API codes and error classes
  bootstrap/      Application startup and runtime wiring
  core/           Reusable technical building blocks
    controllers/
    repositories/
    routes/
      schemas/
  docs/           OpenAPI generation and route introspection
  features/       Business modules grouped by domain
    meteo-stations/
      controllers/
      dtos/
      repositories/
      routes/
      schemas/
      services/
      tests/
    users/
      dtos/
      schemas/
  logger/         Winston logger setup
  middlewares/    Express middlewares
```

## Conventions

- Put domain-specific code inside `app/features/<feature>`.
- Put shared abstractions in `app/core`.
- Keep bootstrap and infrastructure concerns out of feature folders.
- Prefer aliases such as `@core/*` and `@features/*` over long relative imports.

## Development

Install dependencies:

```bash
npm install
```

Run the API with the development environment:

```bash
npm run start --env=dev
```

Run in watch mode:

```bash
npm run start:live --env=dev
```

## Database

Start PostgreSQL for development:

```bash
npm run db:dev
```

Run migrations:

```bash
npm run knex:migrate:latest --env=dev
```

Run seeds:

```bash
npm run knex:seed:run --env=dev
```

## Tests

```bash
npm run test
```

## Docker

The `Dockerfile` is multi-stage and supports:

- `dependencies`
- `migrations`
- `unit-tests`
- `app`

The compose stack reads environment files from `environments/.env.<NODE_ENV>`.
