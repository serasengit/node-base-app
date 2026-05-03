# Node Base App Backend

Reusable backend skeleton built with TypeScript, Express, Objection.js, Knex, TypeDI and PostgreSQL.

It provides a clean base architecture for building REST APIs with feature-based modules, shared core abstractions, database migrations, seeds, OpenAPI documentation, logging, testing, coverage, SonarQube analysis and Docker support.

## ℹ️ Summary

- Runtime: Node.js + TypeScript
- HTTP framework: Express
- Data access: Knex + Objection.js
- Database: PostgreSQL
- Dependency injection: TypeDI
- Validation: express-validator
- API documentation: Swagger / OpenAPI
- Logging: Winston
- Testing: Mocha + Chai + Chai HTTP
- Coverage: NYC
- Code quality: ESLint, Prettier, SonarQube
- Containerization: Docker + Docker Compose

## 🗂️ Main structure

The project follows a `core + features` organization:

- `app/`: main source code
- `app/api-messages/`: shared API codes, messages and error classes
- `app/bootstrap/`: application startup and runtime wiring
- `app/core/`: reusable technical building blocks
- `app/core/controllers/`: base controller abstractions
- `app/core/repositories/`: base repository abstractions
- `app/core/routes/`: shared routing utilities
- `app/core/routes/schemas/`: shared route validation schemas
- `app/docs/`: OpenAPI generation and route introspection
- `app/features/`: business modules grouped by domain
- `app/features/cities/`: example feature module for cities
- `app/features/meteo-stations/`: example feature module for meteo stations
- `app/logger/`: Winston logger setup
- `app/middlewares/`: Express middlewares
- `db/dev/migrations/`: development database migrations
- `db/dev/seeds/`: development database seeds
- `environments/`: environment variable files
- `logs/`: runtime log files, depending on `LOGS_FOLDER`
- `docs/`: additional project documentation

Example full structure:

```text
app/
  api-messages/
  bootstrap/
  core/
    controllers/
    repositories/
    routes/
      schemas/
  docs/
  features/
    cities/
      controllers/
      dtos/
      repositories/
      routes/
      schemas/
      services/
      tests/
    meteo-stations/
      controllers/
      dtos/
      repositories/
      routes/
      schemas/
      services/
      tests/
  logger/
  middlewares/
db/
  dev/
    migrations/
    seeds/
environments/
  .env.dev
  .env.test
  .env.prod
logs/
docs/
Dockerfile
docker-compose.yml
package.json
tsconfig.json
```

Example feature structure:

```text
app/features/<feature>/
  controllers/
  dtos/
  repositories/
  routes/
  schemas/
  services/
  tests/
```

## ✅ Requirements

- Node.js `20.x`
- npm
- PostgreSQL
- Docker and Docker Compose, if running the database or services with containers
- SonarQube Scanner, if using `npm run sonar`

## 🌱 Environment variables

Environment files are defined in:

- `environments/.env.dev`
- `environments/.env.test`
- `environments/.env.prod`

The selected environment is loaded by passing `--env=<environment>` to the npm scripts.

Example:

```bash
npm run start --env=dev
```

This loads:

```text
environments/.env.dev
```

### 📋 Variables defined in `environments/.env.dev`

#### ⚙️ Runtime environment

- `NODE_ENV`  
  Defines the application runtime environment. In development, this value is `dev`.

#### 🔐 Server configuration

- `SERVER_HOST`  
  Host where the API server listens.  
  Development value: `0.0.0.0`.

- `SERVER_PORT`  
  Port where the API server listens.  
  Development value: `3000`.

- `HEALTHCHECK_PORT`  
  Port used by the healthcheck server.  
  Development value: `3005`.

- `SERVER_API`  
  Base API prefix. Main routes are mounted under this segment.  
  Development value: `api/v1`.

#### 🌍 CORS

- `DOMAIN_WHITELIST`  
  Comma-separated list of origins allowed by CORS.  
  Development value: `https://localhost:4200`.

#### 🗄️ PostgreSQL database

- `POSTGRES_HOST`  
  PostgreSQL host.  
  Development value: `127.0.0.1`.

- `POSTGRES_PORT`  
  PostgreSQL port.  
  Development value: `5432`.

- `POSTGRES_DB`  
  Main PostgreSQL database name.  
  Development value: `node_base_app_dev`.

- `POSTGRES_USER`  
  PostgreSQL connection user.  
  Development value: `postgres`.

- `POSTGRES_PASSWORD`  
  PostgreSQL user password.  
  Development value: `postgres`.

#### 🐳 Docker

- `DOCKER_IMAGE_NAME`  
  Base Docker image name for the project.  
  Development value: `node-base-app`.

- `DOCKER_CONTAINER_NAME`  
  Base Docker container name for the project.  
  Development value: `node-base-app`.

#### 🪵 Logging

- `LOG_LEVEL`  
  Application logger level.  
  Development value: `debug`.

- `LOGS_FOLDER`  
  Folder where application logs are written.  
  Development value: `logs/dev`.

#### 📘 API documentation

- `ENABLE_API_DOCS`  
  Enables or disables the API documentation route, including Swagger UI and OpenAPI JSON.  
  Development value: `true`.

### Example `.env.dev`

```env
# Environment mode: development
NODE_ENV=dev

# Server host and port configuration
SERVER_HOST=0.0.0.0
SERVER_PORT=3000
HEALTHCHECK_PORT=3005

# API versioning prefix
SERVER_API=api/v1

# Allowed domains for CORS (comma separated)
DOMAIN_WHITELIST=https://localhost:4200

# PostgreSQL database connection settings
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5432
POSTGRES_DB=node_base_app_dev
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# Docker image and container names
DOCKER_IMAGE_NAME=node-base-app
DOCKER_CONTAINER_NAME=node-base-app

# Logging configuration
LOG_LEVEL=debug
LOGS_FOLDER=logs/dev

# Enable API documentation route (Swagger UI).
ENABLE_API_DOCS=true
```

## 🚀 Development startup

Install dependencies:

```bash
npm install
```

Start PostgreSQL with Docker:

```bash
npm run db:dev
```

Apply database migrations:

```bash
npm run knex:migrate:latest --env=dev
```

Run database seeds:

```bash
npm run knex:seed:run --env=dev
```

Start the backend:

```bash
npm run start --env=dev
```

Start the backend in live reload mode:

```bash
npm run start:live --env=dev
```

Start the backend in debug mode:

```bash
npm run start:dev:debug
```

Debug mode starts Node.js with the inspector enabled on port `9229`.

Healthcheck endpoint:

```text
http://localhost:3005/health
```

API base URL:

```text
http://localhost:3000/api/v1
```

## 📘 Swagger / OpenAPI

The API documentation is exposed by the backend when `ENABLE_API_DOCS=true`.

Common endpoints:

```text
http://localhost:3000/api/v1/docs
http://localhost:3000/api/v1/openapi.json
```

Notes:

- OpenAPI documentation is generated from the registered routes.
- Route introspection is handled under `app/docs`.
- The documentation routes are enabled only when `ENABLE_API_DOCS=true`.
- The final API prefix depends on the value of `SERVER_API`.

## 📦 Available scripts

### 🛠️ Development

- `npm run build`  
  Compiles TypeScript and generates the output in `dist/`.

- `npm run prestart`  
  Runs `lint` and `build` before the standard startup.

- `npm run start --env=dev`  
  Starts the API using `ts-node`, loading `environments/.env.dev`.

- `npm run start:live --env=dev`  
  Starts the API in development mode with `nodemon`, restarting the `start` script when changes are detected.

- `npm run start:dev:debug`  
  Starts the API in development debug mode with `nodemon`, `ts-node`, `tsconfig-paths`, `dotenv` and Node Inspector on port `9229`.

### 🐳 Docker

- `npm run dockerize --env=dev --service=app`  
  Runs Docker Compose using `environments/.env.dev` and the selected profile.

Internally, the command executed is:

```bash
docker compose --env-file environments/.env.%npm_config_env% --profile %npm_config_service% up --build -d
```

Common profiles may include:

- `postgres`  
  Starts only the PostgreSQL database.

- `migrations`  
  Runs database migrations.

- `unit-tests`  
  Runs the test container.

- `app`  
  Starts the main application stack.

Database shortcuts:

```bash
npm run db:dev
npm run db:test
```

These commands are equivalent to:

```bash
npm run dockerize --service=postgres --env=dev
npm run dockerize --service=postgres --env=test
```

### 🗄️ Database

- `npm run knex:migrate:make --file_name=name --env=dev`  
  Creates a new Knex migration.

- `npm run knex:migrate:latest --env=dev`  
  Runs all pending migrations.

- `npm run knex:migrate:rollback --env=dev`  
  Rolls back the latest migration batch.

- `npm run knex:seed:make --file_name=name --env=dev`  
  Creates a new Knex seed.

- `npm run knex:seed:run --env=dev`  
  Runs all available seeds for the selected environment.

Examples:

```bash
npm run knex:migrate:make --file_name=create_users_table --env=dev
npm run knex:migrate:latest --env=dev
npm run knex:migrate:rollback --env=dev
npm run knex:seed:make --file_name=users_seed --env=dev
npm run knex:seed:run --env=dev
```

### ✨ Code quality

- `npm run lint`  
  Runs ESLint over the project.

- `npm run lint:fix`  
  Runs ESLint and automatically fixes supported issues.

- `npm run format`  
  Formats the codebase with Prettier.

- `npm run sonar`  
  Runs static analysis with SonarQube Scanner.

### 🧪 Tests and coverage

- `npm run test`  
  Builds the project and runs all `app/**/*.spec.ts` tests with Mocha.

- `npm run test:coverage`  
  Builds the project and runs the test suite with NYC coverage enabled.

- `npm run test:coverage:check`  
  Checks coverage thresholds using NYC.

Coverage thresholds can be passed as arguments to NYC:

```bash
npm run test:coverage:check -- --statements=80 --lines=80 --functions=80 --branches=80
```

This command fails if the generated coverage report does not meet the configured minimum percentages.

In GitLab CI/CD, the same command can be parameterized with an environment variable:

```bash
npm run test:coverage:check -- --statements=${MIN_COVERAGE_PERCENTAGE} --lines=${MIN_COVERAGE_PERCENTAGE} --functions=${MIN_COVERAGE_PERCENTAGE} --branches=${MIN_COVERAGE_PERCENTAGE}
```

Example GitLab variable:

```yaml
variables:
  MIN_COVERAGE_PERCENTAGE: '80'
```

## 🧪 Testing

Test files follow this pattern:

```text
app/**/*.spec.ts
```

Run tests with:

```bash
npm run test
```

Run tests with coverage:

```bash
npm run test:coverage
```

Check coverage thresholds:

```bash
npm run test:coverage:check -- --statements=80 --lines=80 --functions=80 --branches=80
```

The project is prepared to support integration-style tests against the application stack and database.

### Coverage configuration

Coverage is configured through the `nyc` section in `package.json`.

Included files:

```text
app/**/*.ts
```

Excluded files:

```text
app/docs/**
app/**/tests/**
app/**/*.spec.ts
app/test-setup.ts
```

The project does not hardcode minimum coverage thresholds in `package.json`.

Thresholds are provided at execution time, which allows local development and CI/CD pipelines to use different minimum percentages.

Example local coverage check:

```bash
npm run test:coverage:check -- --statements=80 --lines=80 --functions=80 --branches=80
```

Example CI/CD coverage check:

```bash
npm run test:coverage:check -- --statements=${MIN_COVERAGE_PERCENTAGE} --lines=${MIN_COVERAGE_PERCENTAGE} --functions=${MIN_COVERAGE_PERCENTAGE} --branches=${MIN_COVERAGE_PERCENTAGE}
```

## 🧩 Main example modules

The skeleton includes example modules that can be reused as references when creating new features:

- `cities`
- `meteo-stations`

Each feature follows the same internal structure:

- `controllers`
- `dtos`
- `repositories`
- `routes`
- `schemas`
- `services`
- `tests`

## 🧭 Import aliases

The project uses `module-alias` with aliases resolved against the compiled `dist` folder.

Configured aliases:

```ts
@models         -> dist/app/models
@controllers    -> dist/app/controllers
@services       -> dist/app/services
@routes         -> dist/app/routes
@dtos           -> dist/app/dtos
@repositories   -> dist/app/repositories
@schemas        -> dist/app/schemas
@api-messages   -> dist/app/api-messages
```

Examples:

```ts
import { BaseRepository } from '@repositories/base-repository';
import { ApiError } from '@api-messages/api-error';
```

> If source-level aliases such as `@core/*` or `@features/*` are used during development, they must also be configured consistently in `tsconfig.json`, `tsconfig-paths` and `module-alias`.

## 📚 Main dependencies

Runtime dependencies:

- `express`: HTTP API framework.
- `cors`: CORS middleware.
- `dotenv`: environment variable loading.
- `express-validator`: request validation.
- `knex`: SQL query builder and migrations.
- `objection`: ORM built on top of Knex.
- `pg`: PostgreSQL driver.
- `typedi`: dependency injection container.
- `reflect-metadata`: metadata support required by decorators.
- `module-alias`: runtime import aliases.
- `winston`: application logging.
- `status-code-enum`: HTTP status code constants.

Development dependencies:

- `typescript`: TypeScript compiler.
- `ts-node`: TypeScript execution for local development.
- `nodemon`: live reload during development.
- `mocha`: test runner.
- `chai`: assertion library.
- `chai-http`: HTTP assertions for integration tests.
- `nyc`: test coverage.
- `eslint`: static linting.
- `prettier`: code formatting.
- `sonarqube-scanner`: SonarQube analysis.
- `faker`: test data generation.

## 🧱 Architecture conventions

- Put domain-specific code inside `app/features/<feature>`.
- Put shared abstractions in `app/core`.
- Keep bootstrap and infrastructure concerns out of feature folders.
- Keep feature modules internally consistent: controller, service, repository, schema, DTOs and routes.
- Use TypeDI for dependency injection.
- Use Objection.js models as database schemas.
- Use repositories for data access.
- Use services for business logic.
- Use controllers only for request/response orchestration.
- Keep routes declarative and close to their feature module.
- Prefer configured import aliases over long relative imports.

## 🏗️ Creating a new feature

To create a new feature, copy the structure of an existing example module such as `cities` or `meteo-stations`.

Recommended structure:

```text
app/features/example/
  controllers/
    example-controller.ts
  dtos/
    example-dto.ts
  repositories/
    example-repository.ts
    example-repository-impl.ts
  routes/
    example-routes.ts
  schemas/
    example-schema.ts
  services/
    example-service.ts
    example-service-impl.ts
  tests/
    example.spec.ts
```

Recommended steps:

1. Create the Objection.js schema/model.
2. Create the DTOs exposed by the API.
3. Create the repository interface and implementation.
4. Create the service interface and implementation.
5. Create the controller.
6. Create and register the routes.
7. Add migrations and seeds if the feature requires database tables.
8. Add tests for the expected behavior.

## 🗄️ Database conventions

- Use Knex migrations for schema changes.
- Use Knex seeds for initial or reference data.
- Use Objection.js models to represent database tables.
- Keep database table definitions aligned with model schemas.
- Avoid embedding business logic in migrations, seeds or models.
- Keep data access logic inside repositories.

Typical migration flow:

```bash
npm run knex:migrate:make --file_name=create_example_table --env=dev
npm run knex:migrate:latest --env=dev
```

Typical rollback flow:

```bash
npm run knex:migrate:rollback --env=dev
```

Typical seed flow:

```bash
npm run knex:seed:make --file_name=example_seed --env=dev
npm run knex:seed:run --env=dev
```

## 🧪 Test conventions

- Use `*.spec.ts` as the test file suffix.
- Place feature tests close to the corresponding feature module.
- Prefer integration-style tests when validating API and persistence behavior.
- Keep test data isolated.
- Use the `test` environment configuration for automated tests.
- Run the full suite before opening a pull request.

```bash
npm run test
```

For coverage:

```bash
npm run test:coverage
```

For coverage threshold validation:

```bash
npm run test:coverage:check -- --statements=80 --lines=80 --functions=80 --branches=80
```

## 📝 Notes

- The API prefix is controlled by `SERVER_API`.
- API documentation routes are controlled by `ENABLE_API_DOCS`.
- The project is intended to be reused as a backend starter template.
- Example modules can be removed or renamed when creating a new project.
- Database migrations and seeds are environment-specific.
- Docker Compose uses the selected environment file from `environments/`.
- Runtime aliases are resolved against the compiled `dist/` folder.
- If aliases are used in TypeScript source files, ensure they are aligned across `tsconfig.json`, `tsconfig-paths` and `_moduleAliases`.
- Before creating a new feature, copy the structure of `cities` or `meteo-stations` and adapt names, DTOs, schemas, repositories and routes.
