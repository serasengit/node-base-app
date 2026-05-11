# SKILL: Manage Endpoints 🧠

## 🚦 When To Use

Use this workflow when you need to add, modify or debug an API endpoint in this repository.

Typical cases:

- new CRUD endpoint
- add `include` relation support
- add validation for query/body/params
- wire auth and RBAC checks
- update Swagger/OpenAPI docs
- add endpoint integration tests

## 🧭 Recommended Reference Features

Use these folders as the primary examples:

- `app/features/cities`
- `app/features/meteo-stations`
- `app/features/users`

## 🔄 Workflow

1. Identify the target feature and whether it already exists
2. Define request validation in `routes/*-route-schema.ts`
3. Register or update the route in `routes/*-route.ts`
4. Implement the controller method
5. Implement or update service behavior
6. Implement or update repository queries
7. Update DTO and Objection schema mappings if needed
8. Add or update integration tests
9. Update `app/docs/openapi.ts`
10. Update `README.md` if the public behavior changed

## ✅ File-Level Checklist

### 🧾 Route Schema

Update:

- query filters
- `include` relations
- body validation
- pagination fields
- path parameter validation

Patterns to reuse:

- `findResourceSchema()`
- `paginationSchema(...)`
- feature-specific `find*Schema()`

### 🛣️ Route

Define:

- HTTP verb
- path
- `checkSchema(...)`
- `validateRequestParameters`
- `GrantMiddleware.hasGrantTypeOverModule(...)`
- `asyncHandler(...)`

Grant mapping:

- `GET`: `GrantType.CanRead`
- `POST`: `GrantType.CanCreate`
- `PUT`: `GrantType.CanEdit`
- `DELETE`: `GrantType.CanDelete`

### 🎮 Controller

Controller responsibilities:

- parse route ids
- parse `include`
- parse filters/pagination
- extract authenticated user id when needed
- delegate to service
- return correct HTTP status

Writable endpoints should read:

- `(req as AuthenticatedRequest).auth?.userId`

### ⚙️ Service

Service responsibilities:

- business rules
- transactions
- conflict detection
- existence checks
- audit field assignment
- role/module/grant validation if required
- password hashing when user data is involved

For create/update flows with audit support:

- set `createdById` on create
- set `updatedById` on create/update

### 🗄️ Repository

Repository responsibilities:

- build queries
- eager-load supported relations
- implement text search and sorting
- keep uniqueness checks accurate for self-updates

For list endpoints, prefer helper methods:

- `applyRelations`
- `applyFilters`
- `applyOrder`

## 🔐 Auth And RBAC

Protected features are mounted in:

- `app/core/routes/api-routes.ts`

Use:

- `AuthMiddleware.validateToken`
- `AuthMiddleware.validateUser`
- `GrantMiddleware.hasGrantTypeOverModule`

Module codes currently available:

- `users`
- `cities`
- `meteo_stations`

## 🧪 Testing Checklist

For a CRUD endpoint, add coverage for:

- list success
- get by id success
- create success
- update success
- delete success
- not found
- validation failure
- conflict failure when applicable
- relation include behavior
- audit field persistence when applicable
- auth/grant behavior when applicable

Test helpers and conventions:

- authenticate using seeded users
- insert isolated records with `TEST_*` prefixes
- verify DB persistence directly
- clean inserted data in `afterEach`

## 📘 Swagger Checklist

If the endpoint is public or consumer-facing, update `app/docs/openapi.ts`:

- tag
- path item
- summary/description
- parameters
- request body
- response schemas
- conflict/not-found/auth responses
- examples

## ⚠️ Common Pitfalls

- forgetting to add the route mount to `api-routes.ts`
- allowing `include` values in Swagger/tests but not loading them in repository
- marking self-updates as duplicate conflicts
- exposing password hashes in DTO responses
- missing `createdById` / `updatedById`
- forgetting to update OpenAPI after adding a route
- changing env/test helpers without updating README

## 🧱 Quick Endpoint Template

For a new CRUD resource:

1. `feature-route-schema.ts`
2. `feature-route.ts`
3. `feature-controller.ts`
4. `feature-service.ts`
5. `feature-repository.ts`
6. `feature-repository-impl.ts`
7. `feature-dto.ts`
8. `feature-schema.ts`
9. `feature.spec.ts`
10. `app/docs/openapi.ts`
