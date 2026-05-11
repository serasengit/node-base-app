# AGENTS 🤖

## 🎯 Purpose

This repository is a TypeScript + Express backend skeleton organized by features and shared core layers.

Its main functional areas are:

- JWT authentication with refresh token rotation
- RBAC authorization with modules, roles and grants
- CRUD APIs for `users`, `cities` and `meteo-stations`
- PostgreSQL persistence using Knex + Objection
- OpenAPI generation and Swagger UI exposure
- Integration-style API tests with Mocha + Chai

## 🗂️ Project Structure

- `app/bootstrap`: startup wiring and runtime configuration
- `app/core`: reusable controllers, repositories, middlewares, route helpers and shared types
- `app/api-messages`: API codes and error classes
- `app/docs`: OpenAPI generation and route introspection
- `app/features`: business modules grouped by domain
- `db/*/migrations`: schema changes per environment
- `db/*/seeds`: seed data per environment
- `environments`: env files for `dev` and `test`

## 🧩 Feature Pattern

Each feature should follow this structure when applicable:

- `controllers`
- `dtos`
- `repositories`
- `routes`
- `schemas`
- `services`
- `tests`

Existing reference implementations:

- `app/features/cities`
- `app/features/meteo-stations`
- `app/features/users`

## 🔌 Endpoint Pattern

When adding or modifying endpoints, follow this order:

1. Add or update the route validation schema in `routes/*-route-schema.ts`
2. Add or update the route in `routes/*-route.ts`
3. Add or update the controller method
4. Add or update service logic
5. Add or update repository queries if persistence changes
6. Update DTO and schema mappings if response/request shape changes
7. Add or update tests
8. Update `app/docs/openapi.ts` for public API changes
9. Update `README.md` if the feature or behavior is externally relevant

## 🔐 Auth And RBAC Rules

- Protected route groups are mounted in `app/core/routes/api-routes.ts`
- Authentication uses `AuthMiddleware`
- Authorization uses `GrantMiddleware`
- CRUD route protection maps to `GrantType.CanRead|CanCreate|CanEdit|CanDelete`
- Module-level authorization must use `ModuleCode`

## 🕵️ Audit Rules

For writable resources that support audit fields:

- `createdById`
- `updatedById`

Populate them from the authenticated user id extracted from the access token.

Current resources using this pattern:

- `users`
- `cities`
- `meteo-stations`

## ⚙️ Service Conventions

- Services own business rules
- Services start and manage transactions when multiple repository actions are involved
- Services translate missing resources into `NotFoundError`
- Services translate uniqueness collisions into `ConflictError`
- Services should keep logging consistent with existing modules

## 🗄️ Repository Conventions

- Repositories own query construction
- Use `find`, `findById`, `save`, `update`, `delete` consistently when the resource is CRUD-based
- Use `applyRelations`, `applyFilters` and `applyOrder` for list endpoints when needed
- Keep relation includes explicit and validated at route-schema level

## 🧪 Testing Conventions

- Integration tests live next to the feature under `tests/*.spec.ts`
- Use seeded users for authentication helpers
- Use isolated test data with prefixes like `TEST_*`
- Clean up inserted data in `afterEach`
- Prefer verifying persisted DB state for create/update/delete flows

## 📘 Documentation Conventions

- Public endpoint changes should be reflected in `app/docs/openapi.ts`
- README updates are required when:
  - a new feature is exposed publicly
  - environment variables change
  - auth/RBAC behavior changes
  - test/bootstrap setup changes

## 🛠️ Commands

- Build: `npm.cmd run build`
- Tests: `npm.cmd run test`
- Coverage: `npm.cmd run test:coverage`
- Dev DB: `npm.cmd run db:dev`
- Test DB: `npm.cmd run db:test`
- Migrations: `npm.cmd run knex:migrate:latest --env=dev`
- Seeds: `npm.cmd run knex:seed:run --env=dev`

## 📌 Important Notes

- `users` live in the `rbac` schema
- `cities` and `meteo_stations` live in the `public` schema
- OpenAPI is partially route-discovered and partially manually described
- Avoid exposing password hashes in public responses
- Keep Sonar and NYC exclusions aligned when changing coverage scope
