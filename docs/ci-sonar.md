# CI And Sonar 🔁

## 🛠️ GitLab Pipeline

The pipeline is defined in:

```text
.gitlab-ci.yml
```

Current stages:

```text
dependencies -> build -> test -> sonar -> zap
```

## 🚦 Stage Behavior

### 📦 `dependencies`

Runs:

```bash
npm ci --include=dev
```

Stores `node_modules/` as an artifact and caches dependencies by `package-lock.json`.

### 🏗️ `build`

Runs:

```bash
npm run build
```

Stores:

```text
dist/
```

### 🧪 `test`

Uses Docker-in-Docker and starts the test stack with Docker Compose.

Main behavior:

- starts the `unit-tests` profile with `environments/.env.test`
- waits for the `unit-tests` container to finish
- prints container logs
- uploads `coverage/` as an artifact

The runner must support Docker privileged mode for `docker:dind`.

### 📈 `sonar`

Runs SonarScanner using the official `sonarsource/sonar-scanner-cli` image.

It consumes:

- `sonar-project.properties`
- `coverage/lcov.info` from the test job artifacts

Current behavior:

- runs for merge requests and `main`
- uses `SONAR_TOKEN`
- is marked with `allow_failure: true`

### 🛡️ `zap`

Runs OWASP ZAP baseline analysis against the containerized application.

Main flow:

1. load `environments/.env.test`
2. compute `ZAP_TARGET_URL`
3. start PostgreSQL
4. run migrations and seeds
5. start the app container
6. wait for the healthcheck endpoint
7. run `zap-baseline.py`
8. upload reports from `zap-reports/`

## 🔐 Required GitLab Variables

Configure in:

```text
Project > Settings > CI/CD > Variables
```

Main variables:

- `SONAR_HOST_URL`
- `SONAR_TOKEN`
- `MIN_COVERAGE_PERCENTAGE`

Recommended handling:

- mark `SONAR_TOKEN` as masked
- protect sensitive variables when needed
- keep infrastructure-specific secrets out of the repository

## 📈 SonarQube

Configuration file:

```text
sonar-project.properties
```

Current setup:

- `app` as sources
- `app` as tests
- `**/*.spec.ts` as test inclusion
- `coverage/lcov.info` as coverage input
- `app/docs/**` excluded from coverage calculations
- `sonar.qualitygate.wait=true`

## 📌 Pipeline Scope

Current pipeline intent:

- `dependencies`, `build`, `test` and `zap` run on merge requests, `develop` and `main`
- `sonar` runs on merge requests and `main`
