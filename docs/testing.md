# Testing 🧪

## 🗂️ Test Layout

Integration-style API tests live next to features:

```text
app/features/**/tests/*.spec.ts
```

Other repo-level specs also live under `app/**/*.spec.ts`.

Examples:

- `app/features/auth/tests/auth.spec.ts`
- `app/features/users/tests/user.spec.ts`
- `app/features/cities/tests/city.spec.ts`
- `app/features/meteo-stations/tests/meteo-station.spec.ts`

## 🛠️ Commands

Run tests:

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

## 🔄 How Tests Run

The test script:

- builds the project first
- loads `environments/.env.test`
- runs Mocha over `app/**/*.spec.ts`

Coverage uses NYC and writes:

```text
coverage/lcov.info
```

## 📊 Coverage Configuration

Coverage is configured in the `nyc` section of `package.json`.

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

Thresholds are not hardcoded in `package.json`; they are passed at execution time so local and CI runs can use different limits.

## 📏 Test Conventions

- use seeded users for authentication helpers
- use isolated test data with prefixes such as `TEST_*`
- clean inserted data in `afterEach`
- prefer verifying persisted DB state for create, update and delete flows
- cover validation, auth and grant behavior when relevant

Authentication helpers live under:

```text
app/test-setup/auth-test-helper.ts
```

## ✅ What To Test When Changing Features

Typical checklist for CRUD and protected endpoints:

- list success
- get by id success
- create, update and delete success
- not found paths
- validation failures
- conflict failures when applicable
- include/relation behavior when applicable
- persisted audit fields when applicable
- auth and RBAC behavior
