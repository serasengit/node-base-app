# Troubleshooting 🛠️

## ❗ `npm run test` Fails Because PostgreSQL Is Not Ready

Make sure the test database is available before running flows that depend on it.

Start the test database:

```bash
npm run db:test
```

If needed, rerun migrations and seeds:

```bash
npm run knex:migrate:latest --env=test
npm run knex:seed:run --env=test
```

## ❗ Docker Compose Fails In CI With Docker Daemon Errors

Typical symptoms:

```text
Cannot connect to the Docker daemon at tcp://docker:2375
Could not mount /sys/kernel/security
AppArmor detection and --privileged mode might break
```

The GitLab runner usually needs Docker privileged mode enabled for `docker:dind`.

## ❗ Swagger Or OpenAPI Is Not Available

Check that:

- `ENABLE_API_DOCS=true`
- the app is running with the expected environment file
- you are using the correct API prefix from `SERVER_API`

Common local URLs:

- `http://localhost:3000/api/v1/docs`
- `http://localhost:3000/api/v1/openapi.json`

## ❗ SonarQube Scanner Fails With Certificate Errors

Typical symptoms:

```text
certificate_unknown
The certificate chain is not trusted
```

If the SonarQube server uses an internal CA, import that CA into the scanner container truststore or provide it through the CI environment expected by your organization.

## ❗ ZAP Job Cannot Write Reports

The mounted `zap-reports/` directory must be writable by the ZAP container user.

The pipeline currently handles this with:

```bash
mkdir -p zap-reports
chmod 777 zap-reports
```

## ❗ Coverage And Sonar Drift Out Of Sync

If you change coverage scope, keep these aligned:

- `package.json` NYC exclusions
- `sonar-project.properties` coverage exclusions

This is especially important for `app/docs/**` and any future generated or low-signal files.
