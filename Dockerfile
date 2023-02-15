# ---- Base Node ----

# Use the official Node.js Alpine image as the base image
FROM node:alpine as base

# Set the working directory inside the container to /src/
WORKDIR src/

# ---- Dependencies ----

# Create a new stage named 'dependencies' based on the 'base' stage
FROM base AS dependencies

# Copy necessary configuration files and scripts to /app folder
COPY ["package.json", "package-lock.json*",".eslintrc.json",".eslintignore","tsconfig.json","server.ts", "./"] --from=dependencies

# Clean the cached 'node_modules'
RUN npm cache clean --force

# Install development and production dependencies
RUN npm install

# ---- Unit Tests ----

# Create a new stage named 'unit-tests' based on the 'dependencies' stage
FROM dependencies AS unit-tests

# Copy application sources to the container (including tests)
COPY  app/api-messages /src/app/api-messages 
COPY  app/controllers /src/app/controllers 
COPY  app/dtos /src/app/dtos 
COPY  app/repositories /src/app/repositories 
COPY  app/routes /src/app/routes
COPY  app/schemas /src/app/schemas
COPY  app/services /src/app/services
COPY  app/mappers /src/app/mappers
COPY  app/tests /src/app/tests

# Execute the build process
RUN npm run build

# Execute linter,unit tests and coverage reporting checking
CMD sh -c "npm run lint && \
npm run test:coverage --env=${NODE_ENV} && \
npm run test:coverage:check -- --statements  ${MIN_COVERAGE_PERCENTAGE} --lines ${MIN_COVERAGE_PERCENTAGE}"


# ---- App ----

# Create a new stage named 'app' based on the 'base' stage
FROM base AS app

# Copy production 'node_modules' (excluding configuration files for unit tests) from the 'dependencies' stage
COPY ["package.json", "package-lock.json*","tsconfig.json","server.ts", "./"]

# Copy project folders
COPY  app/api-messages /src/app/api-messages 
COPY  app/controllers /src/app/controllers 
COPY  app/dtos /src/app/dtos 
COPY  app/repositories /src/app/repositories 
COPY  app/routes /src/app/routes
COPY  app/schemas /src/app/schemas
COPY  app/services /src/app/services
COPY  app/mappers /src/app/mappers

# Clean the cached 'node_modules'
RUN npm cache clean --force

# Install only production app dependencies
RUN npm install --silent --production && mv node_modules ./

# Execute the build process
RUN npm run build

# Specify the command to execute when the container is created
CMD node dist/server.js
