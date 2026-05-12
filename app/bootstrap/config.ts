type NodeEnvironment = 'dev' | 'test' | 'prod' | 'production';

export type AppConfig = {
  // Normalized application environment.
  nodeEnv: NodeEnvironment;

  // Convenience flag used to enable production-specific behavior.
  isProduction: boolean;

  // HTTP server configuration.
  server: {
    host: string;
    port: number;
    apiBasePath: string;
    healthcheckPort: number;
  };

  // Cross-Origin Resource Sharing configuration.
  cors: {
    allowedOrigins: string[];
  };

  // Authentication and token configuration.
  auth: {
    bcryptSaltRounds: number;
    accessSecretKey: string;
    refreshSecretKey: string;
    accessExpirationTime: string;
    refreshExpirationTime: string;
    refreshMaxInactiveTimeMs: number;
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
  };

  // API documentation configuration.
  docs: {
    enabled: boolean;
  };

  // Application logging configuration.
  logging: {
    level?: string;
    folder?: string;
  };

  // PostgreSQL database configuration.
  database: {
    user: string;
    database: string;
    password: string;
    port: number;
    host: string;
    isDocker: boolean;
    dockerContainerName?: string;
  };
};

// List of supported NODE_ENV values.
const VALID_NODE_ENVS: NodeEnvironment[] = ['dev', 'test', 'prod', 'production'];

/**
 * Reads a required string environment variable.
 *
 * If the variable is not defined and no fallback is provided,
 * an error is thrown during application startup.
 */
const readString = (key: string, fallback?: string): string => {
  const value = process.env[key]?.trim() ?? fallback;

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

/**
 * Reads an optional string environment variable.
 *
 * Empty strings and whitespace-only values are normalized to undefined.
 */
const readOptionalString = (key: string): string => {
  const value = process.env[key]?.trim();
  return value ? value : undefined;
};

/**
 * Reads a boolean environment variable.
 *
 * Accepted values are "true" and "false".
 * If the variable is missing, the fallback value is returned.
 */
const readBoolean = (key: string, fallback = false): boolean => {
  const value = process.env[key]?.trim().toLowerCase();

  if (!value) return fallback;
  if (value === 'true') return true;
  if (value === 'false') return false;

  throw new Error(`Environment variable ${key} must be either "true" or "false"`);
};

/**
 * Reads an integer environment variable.
 *
 * If the variable is missing and no fallback is provided,
 * an error is thrown during application startup.
 */
const readInteger = (key: string, fallback?: number): number => {
  const rawValue = process.env[key]?.trim();

  if (!rawValue) {
    if (fallback === undefined) {
      throw new Error(`Missing required environment variable: ${key}`);
    }

    return fallback;
  }

  const parsed = Number.parseInt(rawValue, 10);

  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid integer`);
  }

  return parsed;
};

/**
 * Normalizes the API base path by removing leading and trailing slashes.
 *
 * This allows the rest of the application to safely compose paths using:
 * `/${appConfig.server.apiBasePath}`.
 */
const normalizeApiBasePath = (value: string): string => {
  let start = 0;
  let end = value.length;

  while (start < end && value[start] === '/') {
    start++;
  }

  while (end > start && value[end - 1] === '/') {
    end--;
  }

  return value.slice(start, end);
};

/**
 * Reads and validates the current Node.js environment.
 */
const readNodeEnvironment = (): NodeEnvironment => {
  const value = (process.env.NODE_ENV || 'dev').trim().toLowerCase() as NodeEnvironment;

  if (!VALID_NODE_ENVS.includes(value)) {
    throw new Error(`Environment variable NODE_ENV must be one of: ${VALID_NODE_ENVS.join(', ')}`);
  }

  return value;
};

// Resolve environment-level flags once during application startup.
const nodeEnv = readNodeEnvironment();

// Treat both "prod" and "production" as production environments.
const isProduction = nodeEnv === 'prod' || nodeEnv === 'production';

// Indicates whether the application is running inside a Docker environment.
const isDocker = readBoolean('IS_DOCKER', false);

// Optional Docker container name used by infrastructure or tooling.
const dockerContainerName = readOptionalString('DOCKER_CONTAINER_NAME');

// Enforce Docker-specific configuration only when Docker mode is enabled.
if (isDocker && !dockerContainerName) {
  throw new Error('Environment variable DOCKER_CONTAINER_NAME is required when IS_DOCKER=true');
}

/**
 * Centralized application configuration.
 *
 * All environment variables are read, normalized, validated, and exposed
 * through this object so the rest of the codebase does not access process.env directly.
 */
export const appConfig: AppConfig = {
  nodeEnv,
  isProduction,

  server: {
    // Host interface used by the API server.
    host: readString('SERVER_HOST', '0.0.0.0'),

    // Main API server port.
    port: readInteger('SERVER_PORT', 3000),

    // Base path where the API router is mounted.
    apiBasePath: normalizeApiBasePath(readString('SERVER_API', 'api/v1')),

    // Separate port used by the healthcheck server.
    healthcheckPort: readInteger('HEALTHCHECK_PORT', 3005)
  },

  cors: {
    // Comma-separated list of allowed frontend origins.
    // Example: https://app.example.com,https://admin.example.com
    allowedOrigins: (process.env.DOMAIN_WHITELIST || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
  },

  auth: {
    // Cost factor used by bcrypt when hashing passwords.
    bcryptSaltRounds: readInteger('BCRYPT_SALT_ROUNDS', 12),

    // Secret key used to sign and verify short-lived access tokens.
    accessSecretKey: readString('JWT_ACCESS_SECRET_KEY'),

    // Secret key used to sign and verify longer-lived refresh tokens.
    refreshSecretKey: readString('JWT_REFRESH_SECRET_KEY'),

    // Access token lifetime, for example "15m".
    accessExpirationTime: readString('JWT_ACCESS_EXPIRATION_TIME', '15m'),

    // Refresh token lifetime, for example "7d".
    refreshExpirationTime: readString('JWT_REFRESH_EXPIRATION_TIME', '7d'),

    // Maximum refresh cookie lifetime in milliseconds.
    refreshMaxInactiveTimeMs: readInteger('JWT_MAX_INACTIVE_TIME', 1800000),

    // Rolling auth rate limit window in milliseconds for login and refresh endpoints.
    rateLimitWindowMs: readInteger('AUTH_RATE_LIMIT_WINDOW_MS', 60000),

    // Maximum number of requests allowed per auth rate limit window.
    rateLimitMaxRequests: readInteger('AUTH_RATE_LIMIT_MAX_REQUESTS', 10)
  },

  docs: {
    // Enables or disables API documentation endpoints.
    enabled: readBoolean('ENABLE_API_DOCS', false)
  },

  logging: {
    // Optional log level override, for example "debug", "info", or "error".
    level: readOptionalString('LOG_LEVEL'),

    // Optional folder where log files are written.
    folder: readOptionalString('LOGS_FOLDER')
  },

  database: {
    // PostgreSQL username.
    user: readString('POSTGRES_USER'),

    // PostgreSQL database name.
    database: readString('POSTGRES_DB'),

    // PostgreSQL user password.
    password: readString('POSTGRES_PASSWORD'),

    // PostgreSQL server port.
    port: readInteger('POSTGRES_PORT', 5432),

    // PostgreSQL server host.
    host: readString('POSTGRES_HOST'),

    // Whether the database is expected to run in Docker.
    isDocker,

    // Docker container name, required only when IS_DOCKER=true.
    dockerContainerName
  }
};
