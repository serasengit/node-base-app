# SKILL: Manage Endpoints 🧠

Use this file only as a lightweight endpoint-change checklist.

Repository-wide architecture, conventions and documentation rules live in `AGENTS.md` and `docs/`.

## 🚦 When To Use

Use this workflow when you need to add, modify or debug an API endpoint in this repository.

Typical cases:

- new CRUD endpoint
- validation changes in query, params or body
- auth or RBAC wiring
- relation `include` support
- OpenAPI updates
- endpoint integration tests

## 🔄 Fast Workflow

1. Check the target feature and reuse `cities`, `meteo-stations` or `users` as reference.
2. Update `routes/*-route-schema.ts`.
3. Update `routes/*-route.ts`.
4. Update controller, service and repository layers.
5. Update DTO or schema mappings if shapes changed.
6. Add or update integration tests.
7. Update `app/docs/openapi.ts`.
8. If behavior is user-facing, update the relevant file in `docs/` and, if needed, `README.md`.

## ✅ Endpoint Checklist

- validate query, params, body and allowed `include` values
- wire `AuthMiddleware` and `GrantMiddleware` when protected
- map CRUD verbs to the right `GrantType`
- read authenticated user id for audit-aware writes
- keep repositories responsible for query construction
- verify not-found and conflict paths
- verify persisted DB state in write flows
- avoid exposing password hashes or internal-only fields

## 📚 References

- operational rules: `AGENTS.md`
- architecture: `docs/architecture.md`
- testing: `docs/testing.md`
- CI and coverage context: `docs/ci-sonar.md`
