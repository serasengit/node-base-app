# ---- Base Node ----
    FROM node:20-slim AS base

    # Set working directory
    WORKDIR /src
    
    # Install curl (for potential use)
    RUN apt-get update && apt-get install -y curl
    
    # ---- Dependencies ----
    FROM base AS dependencies
    
    # Copy package files and configs
    COPY package*.json ./
    COPY tsconfig.json server.ts package.json package-lock.json* knexfile.ts ./
    
    # Copy application source files
    COPY app ./app
    
    # Install all dependencies (including dev)
    RUN npm install
    
    # ---- BBDD Migrations ----
    
    # Create a new stage named 'migrations' based on the 'dependencies' stage
    FROM dependencies AS migrations
    
    # Copy database scripts to /src/app and /src/db/${NODE_ENV}  respectively
    COPY /db/${NODE_ENV}  /src/db/${NODE_ENV} 
    
    # Execute database migrations with POSIX-compatible env expansion inside Linux containers
    CMD sh -c 'node -r dotenv/config ./node_modules/knex/bin/cli.js migrate:rollback dotenv_config_path=environments/.env.${NODE_ENV} && node -r dotenv/config ./node_modules/knex/bin/cli.js migrate:latest dotenv_config_path=environments/.env.${NODE_ENV} && node -r dotenv/config ./node_modules/knex/bin/cli.js seed:run dotenv_config_path=environments/.env.${NODE_ENV}'
    
    
    # ---- Unit Tests ----

    # Create a new stage named 'unit-tests' based on the 'dependencies' stage
    FROM dependencies AS unit-tests

    # Copy application sources to the container (including tests)
    COPY  app/api-messages /src/app/api-messages 
    COPY  app/bootstrap /src/app/bootstrap
    COPY  app/controllers /src/app/controllers 
    COPY  app/dtos /src/app/dtos 
    COPY  app/generators /src/app/generators
    COPY  app/jobs /src/app/jobs 
    COPY  app/public /src/app/public
    COPY  app/repositories /src/app/repositories 
    COPY  app/routes /src/app/routes
    COPY  app/schemas /src/app/schemas
    COPY  app/services /src/app/services
    COPY  app/jobs /src/app/jobs 
    COPY  app/utils /src/app/utils
    COPY  app/tests /src/app/tests
    COPY  certs /src/certs

    # Execute the build process
    RUN npm run build

    # Execute linter,unit tests and coverage reporting checking
    CMD sh -c "npm run lint && \
    npm run test:coverage --env=${NODE_ENV} && \
    npm run test:coverage:check -- --statements  ${MIN_COVERAGE_PERCENTAGE} --lines ${MIN_COVERAGE_PERCENTAGE} --functions ${MIN_COVERAGE_PERCENTAGE}"

    # ---- App ----
    FROM base AS app
    
    # Set working directory
    WORKDIR /src
    
    # Copy production node_modules from dependencies stage
    COPY --from=dependencies /src/node_modules ./node_modules
    
    # Copy necessary project files
    COPY --from=dependencies /src/package*.json ./
    COPY --from=dependencies /src/tsconfig.json ./
    COPY --from=dependencies /src/knexfile.ts ./
    COPY --from=dependencies /src/server.ts ./
    
    # Copy application folders from dependencies stage
    COPY --from=dependencies /src/app/api-messages ./app/api-messages
    COPY --from=dependencies /src/app/bootstrap ./app/bootstrap
    COPY --from=dependencies /src/app/controllers ./app/controllers
    COPY --from=dependencies /src/app/docs ./app/docs
    COPY --from=dependencies /src/app/dtos ./app/dtos
    COPY --from=dependencies /src/app/repositories ./app/repositories
    COPY --from=dependencies /src/app/public ./app/public
    COPY --from=dependencies /src/app/routes ./app/routes
    COPY --from=dependencies /src/app/schemas ./app/schemas
    COPY --from=dependencies /src/app/services ./app/services
    COPY --from=dependencies /src/app/logger ./app/logger
    COPY --from=dependencies /src/app/middlewares ./app/middlewares

    # Build the application
    RUN npm run build

    # Copy static asset required at runtime into the compiled dist tree
    COPY --from=dependencies /src/app/public/logo-consorcio-small.png ./dist/app/public/logo-consorcio-small.png
    
    # Specify default command to run the app
    CMD ["node", "dist/server.js"]
    
