# ---- Base Node ----
FROM node:alpine as base
# Set working directory
WORKDIR src/
# Install prerequisites
RUN apk --no-cache add curl

# ---- Dependencies ----
FROM base AS dependencies
# Copy configs to /app folder
COPY ["package.json", "package-lock.json*",".eslintrc.json",".eslintignore","tsconfig.json","server.ts", "./"]
COPY app /src/app

# ---- Unit Tests ----
# Run linters, setup and tests
FROM dependencies AS unit-tests
# Copy necessary config files for unit tests execution
COPY ["package.json", "package-lock.json*",".eslintrc.json",".eslintignore","tsconfig.json","server.ts", "./"] --from=dependencies
# Clean cached node_modules
RUN npm cache clean --force
# Install ALL node_modules, including 'devDependencies'
RUN npm install
# Execute build
RUN npm run build
# Copy App sources
COPY . .
# Execute tests
CMD  sh -c 'npm run test'

# ---- App ----
FROM base AS app
# Copy production node_modules (excepting unit-tests and migrations configuration files)
COPY ["package.json", "package-lock.json*","tsconfig.json","server.ts", "./"] --from=dependencies
# Copy proyect folders (excepting test, migrations and environments folders)
COPY --from=dependencies /src/app/api-messages /src/app/api-messages 
COPY --from=dependencies /src/app/controllers /src/app/controllers 
COPY --from=dependencies /src/app/dtos /src/app/dtos 
COPY --from=dependencies /src/app/repositories /src/app/repositories 
COPY --from=dependencies /src/app/routes /src/app/routes
COPY --from=dependencies /src/app/schemas /src/app/schemas
COPY --from=dependencies /src/app/services /src/app/services
COPY --from=dependencies /src/app/mappers /src/app/mappers
# Clean cached node_modules
RUN npm cache clean --force
# Install app dependencies
RUN npm install --silent --production && mv node_modules ./
# Execute build
RUN  npm run build
# Specify what command it'll execute when container is created
CMD node dist/server.js
