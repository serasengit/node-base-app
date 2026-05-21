# Architecture 🧱

## 🗂️ Main Structure

The project uses a `bootstrap + core + features` split:

- `app/bootstrap`: application startup, runtime config and module alias registration
- `app/core`: reusable controllers, repositories, route helpers, middlewares and shared request types
- `app/api-messages`: API messages and custom error classes
- `app/docs`: OpenAPI generation and route introspection
- `app/features`: domain modules grouped by business capability
- `app/logger`: Winston logger and request-context logging
- `app/middlewares`: app-level Express middlewares

Database assets are environment-specific:

- `db/dev/migrations`
- `db/dev/seeds`
- `db/test/migrations`
- `db/test/seeds`

## 🧩 Feature Structure

CRUD-oriented features should follow this shape when applicable:

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

Reference implementations:

- `app/features/cities`
- `app/features/meteo-stations`
- `app/features/users`

## 🎛️ Layer Responsibilities

- routes: declare endpoints, validation and middleware chain
- controllers: adapt HTTP requests/responses and delegate to services
- services: own business rules, transactions and domain checks
- repositories: own query construction and persistence details
- DTOs/schemas: define response/request shape and data mapping

## 🔄 Endpoint Workflow

When adding or changing endpoints, follow this order:

1. Update `routes/*-route-schema.ts`
2. Update `routes/*-route.ts`
3. Update the controller method
4. Update service logic
5. Update repository queries if persistence changes
6. Update DTO or schema mappings if shapes changed
7. Add or update tests
8. Update `app/docs/openapi.ts` for public API changes

## 🔐 Authentication And RBAC

Protected route groups are mounted in:

```text
app/core/routes/api-routes.ts
```

Rules:

- authentication uses `AuthMiddleware`
- authorization uses `GrantMiddleware`
- CRUD protection maps to `GrantType.CanRead|CanCreate|CanEdit|CanDelete`
- module-level authorization must use `ModuleCode`

Current main auth/RBAC pieces:

- JWT access token in the response body
- HTTP-only refresh token cookie
- refresh token rotation
- `roles`, `grants` and `modules` as RBAC building blocks

## 🕵️ Audit Rules

For writable resources that support audit fields:

- `createdById`
- `updatedById`

Populate them from the authenticated user id in the access token.

Current resources using this pattern:

- `users`
- `cities`
- `meteo-stations`

## 🗄️ Repository Conventions

- repositories own query construction
- use `find`, `findById`, `save`, `update`, `delete` consistently for CRUD resources
- use `applyRelations`, `applyFilters` and `applyOrder` for list endpoints when needed
- keep relation includes explicit and validated at route-schema level

## ⚙️ Service Conventions

- services own business rules
- start and manage transactions when multiple repository actions are involved
- translate missing resources into `NotFoundError`
- translate uniqueness collisions into `ConflictError`
- keep logging consistent with existing modules

## 📘 OpenAPI

Swagger/OpenAPI exposure is controlled by `ENABLE_API_DOCS`.

Important notes:

- OpenAPI is partially route-discovered and partially manually described
- public API changes should be reflected in `app/docs/openapi.ts`
- protected route groups should remain documented with bearer authentication

## 📝 Notes

- `users` live in the `rbac` schema
- `cities` and `meteo_stations` live in the `public` schema
- avoid exposing password hashes in public responses
