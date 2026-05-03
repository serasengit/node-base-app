# ---- Base Node ----
FROM node:20-slim AS base

WORKDIR /src

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# ---- Dependencies ----
FROM base AS dependencies

COPY package*.json ./
COPY tsconfig.json server.ts knexfile.ts .eslintrc.json .eslintignore .prettierrc ./

COPY app ./app
COPY db ./db
COPY environments ./environments

RUN npm install

# ---- Database migrations ----
FROM dependencies AS migrations

CMD sh -c "node -r dotenv/config ./node_modules/knex/bin/cli.js migrate:rollback dotenv_config_path=environments/.env.${NODE_ENV} && node -r dotenv/config ./node_modules/knex/bin/cli.js migrate:latest dotenv_config_path=environments/.env.${NODE_ENV} && node -r dotenv/config ./node_modules/knex/bin/cli.js seed:run dotenv_config_path=environments/.env.${NODE_ENV}"

# ---- Unit tests ----
FROM dependencies AS unit-tests

RUN npm run build

CMD sh -c "npm run lint && npm run test:coverage --env=${NODE_ENV} && npm run test:coverage:check"

# ---- Runtime app ----
FROM base AS app

COPY --from=dependencies /src/node_modules ./node_modules
COPY --from=dependencies /src/package*.json ./
COPY --from=dependencies /src/tsconfig.json ./
COPY --from=dependencies /src/knexfile.ts ./
COPY --from=dependencies /src/server.ts ./
COPY --from=dependencies /src/app ./app
COPY --from=dependencies /src/environments ./environments

RUN npm run build

CMD ["node", "dist/server.js"]
