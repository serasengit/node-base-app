# Node Base App Backend

Reusable backend skeleton built with TypeScript, Express, Objection.js, Knex, TypeDI and PostgreSQL.

It provides a clean base architecture for building REST APIs with feature-based modules, shared core abstractions, database migrations, seeds, OpenAPI documentation, logging, testing, coverage, SonarQube analysis and Docker support.

## ℹ️ Summary

- Runtime: Node.js + TypeScript
- HTTP framework: Express
- Data access: Knex + Objection.js
- Database: PostgreSQL
- Dependency injection: TypeDI
- Authentication: JWT access token + HTTP-only refresh token
- Authorization: RBAC with roles, grants and modules
- Validation: express-validator
- API documentation: Swagger / OpenAPI
- Logging: Winston
- Testing: Mocha + Chai + Chai HTTP
- Coverage: NYC
- Code quality: ESLint, Prettier, SonarQube
- Security testing: OWASP ZAP
- Containerization: Docker + Docker Compose
- CI/CD: GitLab CI/CD

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
- `app/features/auth/`: authentication endpoints, token refresh and JWT handling
- `app/features/cities/`: example feature module for cities
- `app/features/grants/`: RBAC grant DTOs and database schemas
- `app/features/meteo-stations/`: example feature module for meteo stations
- `app/features/modules/`: RBAC module DTOs and database schemas
- `app/features/roles/`: RBAC role DTOs and database schemas
- `app/features/users/`: user CRUD, RBAC-aware validation, repositories, schemas and services
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
    auth/
      controllers/
      dtos/
      routes/
      services/
      tests/
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
    grants/
      dtos/
      schemas/
    modules/
      dtos/
      schemas/
    roles/
      dtos/
      schemas/
    users/
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
.gitlab-ci.yml
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
- GitLab Runner with Docker support, if using the provided GitLab CI/CD pipeline
- SonarQube Scanner, if using `npm run sonar` locally

> The GitLab pipeline uses the official `sonarsource/sonar-scanner-cli` image for SonarQube analysis, so a local SonarQube Scanner installation is only required for local analysis.

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

#### 🔐 Authentication and security

- `BCRYPT_SALT_ROUNDS`  
  Cost factor used when hashing user passwords.  
  Development value: `12`.

- `JWT_ACCESS_SECRET_KEY`  
  Secret used to sign short-lived access tokens.  
  Development value: `node_base_app_access_key`.

- `JWT_REFRESH_SECRET_KEY`  
  Secret used to sign refresh tokens stored in cookies.  
  Development value: `node_base_app_refresh_key`.

- `JWT_ACCESS_EXPIRATION_TIME`  
  Access token expiration window.  
  Development value: `15m`.

- `JWT_REFRESH_EXPIRATION_TIME`  
  Refresh token expiration window.  
  Development value: `7d`.

- `JWT_MAX_INACTIVE_TIME`  
  Maximum inactivity window, in milliseconds, used when rotating refresh tokens.  
  Development value: `1800000`.

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

### 📋 Variables defined in `environments/.env.test`

The test environment is used by automated tests, Docker Compose test profiles and the GitLab CI/CD security scan.

Typical values:

```env
# Environment mode: test
NODE_ENV=test

# Server host and port configuration
SERVER_HOST=0.0.0.0
SERVER_PORT=3001
HEALTHCHECK_PORT=3002

# API versioning prefix
SERVER_API=api/v1

# Allowed domains for CORS (comma separated)
DOMAIN_WHITELIST=http://localhost:8080

# PostgreSQL database connection settings
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5432
POSTGRES_DB=node_base_app_test
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# Bcrypt salt rounds for password hashing
BCRYPT_SALT_ROUNDS=12

# JWT secrets and expiration configuration
JWT_ACCESS_SECRET_KEY=node_base_app_access_key
JWT_REFRESH_SECRET_KEY=node_base_app_refresh_key
JWT_ACCESS_EXPIRATION_TIME=15m
JWT_REFRESH_EXPIRATION_TIME=7d
JWT_MAX_INACTIVE_TIME=1800000

# Seeded test user credentials
TEST_SYSTEM_ADMIN_USERNAME=system_admin
TEST_SYSTEM_ADMIN_PASSWORD=Admin123!
TEST_READONLY_USERNAME=readonly
TEST_READONLY_PASSWORD=Readonly123!

# Docker image and container names
DOCKER_IMAGE_NAME=node-base-app-test
DOCKER_CONTAINER_NAME=node-base-app-test

# Logging configuration
LOG_LEVEL=debug
LOGS_FOLDER=logs/test

# Enable API documentation route (Swagger UI).
ENABLE_API_DOCS=true
```

Additional test-only authentication helpers:

- `TEST_SYSTEM_ADMIN_USERNAME`: seeded username used by integration tests for admin authentication.
- `TEST_SYSTEM_ADMIN_PASSWORD`: seeded password used by integration tests for admin authentication.
- `TEST_READONLY_USERNAME`: seeded username used by integration tests for read-only authentication.
- `TEST_READONLY_PASSWORD`: seeded password used by integration tests for read-only authentication.

In GitLab CI/CD, the ZAP job loads `environments/.env.test` to dynamically build:

```text
http://app:${SERVER_PORT}/${SERVER_API}
```

With the values above, the target URL becomes:

```text
http://app:3001/api/v1
```

The healthcheck URL used inside the app container becomes:

```text
http://127.0.0.1:3002/health
```

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

# Bcrypt salt rounds for password hashing
BCRYPT_SALT_ROUNDS=12

# JWT secrets and expiration configuration
JWT_ACCESS_SECRET_KEY=node_base_app_access_key
JWT_REFRESH_SECRET_KEY=node_base_app_refresh_key
JWT_ACCESS_EXPIRATION_TIME=15m
JWT_REFRESH_EXPIRATION_TIME=7d
JWT_MAX_INACTIVE_TIME=1800000

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

Default seeded development users:

```text
system_admin / Admin123!
readonly / Readonly123!
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
- The manual OpenAPI specification currently documents `auth`, `users`, `cities` and `meteo-stations`.
- Protected route groups are marked with bearer authentication in Swagger UI.

## 🔐 Authentication and authorization

The backend includes a JWT-based authentication flow and RBAC authorization model.

Implemented pieces:

- `auth` feature with login and refresh-token endpoints.
- `users` feature support classes for identity lookup and active-user validation.
- `roles`, `grants` and `modules` schemas/DTOs for RBAC composition.
- security middlewares that validate the access token and load the authenticated user.

### Authentication flow

1. `POST /api/v1/auth` receives `username` and `password`.
2. The service validates the credentials and user status.
3. The API returns an access token in the response body.
4. The API stores the refresh token in an HTTP-only cookie named `refreshToken`.
5. Protected routes expect `Authorization: Bearer <accessToken>`.
6. `POST /api/v1/auth/refresh-token` rotates the refresh token cookie and returns a new access token.
7. `POST /api/v1/auth/logout` clears the refresh token cookie and ends the browser session.

### Access token payload

The access token stores only the minimum claims required by the API:

- `userId`
- `roleCode`
- `language`

The refresh token stores:

- `userId`
- `type=refresh`

### Authentication responses

Successful login returns:

- `accessToken`
- `isAuthenticated`
- `user`
- `permissions`

The `user` payload is intentionally reduced to safe UI-facing data such as `id`, `username`, `name`, `language` and `role`. Sensitive fields such as password hashes are never returned.

### RBAC model

The RBAC seed and schema model are organized as:

- `modules`: application areas such as `users`, `cities` or `meteo_stations`
- `grants`: CRUD-like capabilities bound to a module
- `roles`: named permission sets such as `system_administrator` and `read_only`
- `role_grants`: join table between roles and grants
- `users`: authenticated identities linked to one role

### Audit fields

The `users`, `cities` and `meteo_stations` tables support audit ownership fields:

- `created_by_id`
- `updated_by_id`

For create and update operations, these values are populated from the authenticated access token user.

### Protected routes

Routes mounted with the auth middleware:

- validate the bearer token signature and expiration
- verify that the authenticated user still exists and is active
- attach the authenticated user to the request lifecycle

### Implemented API modules

Current route groups exposed by the API:

- `POST /api/v1/auth`
- `POST /api/v1/auth/refresh-token`
- `POST /api/v1/auth/logout`
- `GET|POST|PUT|DELETE /api/v1/users`
- `GET|POST|PUT|DELETE /api/v1/cities`
- `GET|POST|PUT|DELETE /api/v1/meteo-stations`

Supported relation includes:

- `cities`: `meteoStations`, `createdBy`, `updatedBy`
- `meteo-stations`: `city`, `createdBy`, `updatedBy`
- `users`: `role`, `roleGrants`, `roleGrantsModule`, `createdBy`, `updatedBy`

### RBAC and seed layout

The migrations and seeds are organized in two groups:

- `rbac`: modules, roles, grants, role grants and users
- `public`: cities and meteo stations

Development and test environments both seed:

- modules for `users`, `cities` and `meteo_stations`
- roles `system_administrator` and `read_only`
- role grants for admin and read-only access patterns
- users `system_admin` and `readonly`

Default seeded users that can authenticate the application:

- `system_admin / Admin123!`
- `readonly / Readonly123!`

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

## 🔁 GitLab CI/CD pipeline

The project includes a GitLab CI/CD pipeline in:

```text
.gitlab-ci.yml
```

The pipeline is organized into the following stages:

```text
dependencies -> build -> test -> sonar -> zap
```

### Pipeline stages

#### `dependencies`

Installs project dependencies using Node.js 20:

```bash
npm ci --include=dev
```

The job stores `node_modules/` as an artifact for downstream jobs and caches dependencies based on `package-lock.json`.

#### `build`

Compiles the TypeScript project:

```bash
npm run build
```

The compiled output is stored as a pipeline artifact:

```text
dist/
```

#### `test`

Runs the Docker Compose test profile, including PostgreSQL, migrations and the unit test container.

This stage requires Docker-in-Docker because it starts Docker Compose services inside the GitLab job.

The GitLab runner must support:

```toml
[runners.docker]
  privileged = true
```

If the runner is not privileged, jobs using `docker:dind` may fail with errors such as:

```text
Cannot connect to the Docker daemon at tcp://docker:2375
Could not mount /sys/kernel/security
AppArmor detection and --privileged mode might break
```

#### `sonar`

Runs SonarQube static code analysis using the official SonarScanner image:

```yaml
image:
  name: sonarsource/sonar-scanner-cli:latest
  entrypoint: ['']
```

The scanner uses:

```text
sonar-project.properties
```

The job also downloads artifacts from the `test` stage, especially the coverage report.

If the SonarQube server uses an internal corporate certificate authority, the scanner container may need the corporate CA imported into the Java truststore.

Typical error when the CA is missing:

```text
certificate_unknown
The certificate chain is not trusted
```

#### `zap`

Runs OWASP ZAP baseline analysis against the containerized application.

The job:

1. Starts PostgreSQL with Docker Compose.
2. Runs migrations and seeds.
3. Starts the application container.
4. Waits for the healthcheck endpoint.
5. Runs `zaproxy/zap-stable` inside the same Docker Compose network.
6. Stores ZAP reports as pipeline artifacts.

The ZAP target is built dynamically from `environments/.env.test`:

```bash
export ZAP_TARGET_URL="http://app:${SERVER_PORT}/${SERVER_API}"
```

The application healthcheck URL is also built from `environments/.env.test`:

```bash
export HEALTHCHECK_URL="http://127.0.0.1:${HEALTHCHECK_PORT}/health"
```

Generated ZAP reports are uploaded from:

```text
zap-reports/
```

### Pipeline variables

Some variables are safe to keep in versioned `.env` files because they are part of reproducible local/test configuration.

Examples:

```text
NODE_ENV
SERVER_HOST
SERVER_PORT
HEALTHCHECK_PORT
SERVER_API
DOMAIN_WHITELIST
POSTGRES_HOST
POSTGRES_PORT
POSTGRES_DB
POSTGRES_USER
POSTGRES_PASSWORD
DOCKER_IMAGE_NAME
DOCKER_CONTAINER_NAME
LOG_LEVEL
LOGS_FOLDER
ENABLE_API_DOCS
BCRYPT_SALT_ROUNDS
JWT_ACCESS_SECRET_KEY
JWT_REFRESH_SECRET_KEY
JWT_ACCESS_EXPIRATION_TIME
JWT_REFRESH_EXPIRATION_TIME
JWT_MAX_INACTIVE_TIME
```

Sensitive, infrastructure-specific or corporate variables should be configured in GitLab, not committed to the repository.

Configure them in:

```text
Project > Settings > CI/CD > Variables
```

Recommended GitLab CI/CD variables:

```text
SONAR_HOST_URL
SONAR_TOKEN
MIN_COVERAGE_PERCENTAGE
```

Use GitLab variable protections where appropriate:

- Mark secrets as **Masked** or **Masked and hidden**.
- Use **Protected** variables for protected branches or tags.
- Use **File** variables for certificates such as `SONAR_CA_CERT`.

### Pipeline execution rules

The pipeline is intended to run on:

```text
merge_requests
develop
main
```

Typical behavior:

- `dependencies`, `build`, `test` and `zap` run on merge requests, `develop` and `main`.
- `sonar` runs on merge requests and `main`.

### ZAP report permissions

The ZAP container runs with its own internal user. The mounted report directory must be writable by that user.

The pipeline creates and opens permissions for the report directory:

```bash
mkdir -p zap-reports
chmod 777 zap-reports
```

The `-g gen.conf` option is intentionally omitted from `zap-baseline.py` to avoid writing an extra generated configuration file when it is not needed.

### Recommended commit messages for CI changes

```bash
git commit -m "ci: add GitLab pipeline"
git commit -m "ci: fix Docker Compose test and ZAP pipeline jobs"
git commit -m "ci: fix ZAP report permissions"
git commit -m "ci: use official SonarScanner image"
```

## 🧩 Main example modules

The skeleton includes example modules that can be reused as references when creating new features:

- `auth`
- `cities`
- `grants`
- `meteo-stations`
- `modules`
- `roles`
- `users`

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
