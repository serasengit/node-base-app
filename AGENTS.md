# AGENTS 🤖

## 🎯 Purpose

This file is for assistants and coding agents working inside the repository.

Use `README.md` and `docs/` for human onboarding. Use this file for operational rules, boundaries and edit guidance.

## 🗂️ Architecture Boundaries

- `app/bootstrap`: startup wiring and runtime configuration
- `app/core`: reusable controllers, repositories, middlewares, route helpers and shared types
- `app/api-messages`: API codes and error classes
- `app/docs`: OpenAPI generation and route introspection
- `app/features`: business modules grouped by domain
- `db/*/migrations`: schema changes per environment
- `db/*/seeds`: seed data per environment
- `environments`: env files for `dev` and `test`

Keep feature code in `app/features`. Keep shared technical abstractions in `app/core`. Do not blur those boundaries without a concrete reason.

## 🧩 Feature Rules

Each feature should follow this structure when applicable:

- `controllers`
- `dtos`
- `repositories`
- `routes`
- `schemas`
- `services`
- `tests`

Reference implementations:

- `app/features/cities`
- `app/features/meteo-stations`
- `app/features/users`

## 🔄 Endpoint Change Workflow

When adding or modifying endpoints, follow this order:

1. Add or update the route validation schema in `routes/*-route-schema.ts`
2. Add or update the route in `routes/*-route.ts`
3. Add or update the controller method
4. Add or update service logic
5. Add or update repository queries if persistence changes
6. Update DTO and schema mappings if response or request shape changes
7. Add or update tests
8. Update `app/docs/openapi.ts` for public API changes
9. Update `README.md` or `docs/` if externally relevant behavior changed

## 🔐 Auth And RBAC Rules

- protected route groups are mounted in `app/core/routes/api-routes.ts`
- authentication uses `AuthMiddleware`
- authorization uses `GrantMiddleware`
- CRUD route protection maps to `GrantType.CanRead|CanCreate|CanEdit|CanDelete`
- module-level authorization must use `ModuleCode`

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

- services own business rules
- services start and manage transactions when multiple repository actions are involved
- services translate missing resources into `NotFoundError`
- services translate uniqueness collisions into `ConflictError`
- services should keep logging consistent with existing modules

## 🗄️ Repository Conventions

- repositories own query construction
- use `find`, `findById`, `save`, `update`, `delete` consistently when the resource is CRUD-based
- use `applyRelations`, `applyFilters` and `applyOrder` for list endpoints when needed
- keep relation includes explicit and validated at route-schema level

## 🧪 Testing Rules

- integration tests live next to the feature under `tests/*.spec.ts`
- use seeded users for authentication helpers
- use isolated test data with prefixes like `TEST_*`
- clean up inserted data in `afterEach`
- prefer verifying persisted DB state for create, update and delete flows

## 📘 Documentation Rules

When behavior changes, update the right document instead of growing `README.md` again:

- `README.md` for onboarding, execution, structure, testing and CI overview
- `docs/setup.md` for environment and startup changes
- `docs/architecture.md` for structure, auth or feature-pattern changes
- `docs/testing.md` for test strategy or helper changes
- `docs/ci-sonar.md` for CI, Sonar or ZAP changes
- `docs/troubleshooting.md` for recurring operational issues

## 📌 Important Notes

- `users` live in the `rbac` schema
- `cities` and `meteo_stations` live in the `public` schema
- OpenAPI is partially route-discovered and partially manually described
- avoid exposing password hashes in public responses
- keep Sonar and NYC exclusions aligned when changing coverage scope
