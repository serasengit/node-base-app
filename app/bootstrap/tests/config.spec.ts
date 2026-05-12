import { expect } from 'chai';
import { describe, it } from 'mocha';
import { createRequire } from 'module';

type EnvMap = Record<string, string>;

const moduleRequire = createRequire(__filename);

const BASE_ENV: EnvMap = {
  NODE_ENV: 'test',
  SERVER_HOST: '127.0.0.1',
  SERVER_PORT: '3100',
  HEALTHCHECK_PORT: '3101',
  SERVER_API: '/api/v1/',
  DOMAIN_WHITELIST: 'https://app.example.com, https://admin.example.com ',
  BCRYPT_SALT_ROUNDS: '12',
  JWT_ACCESS_SECRET_KEY: 'access-secret',
  JWT_REFRESH_SECRET_KEY: 'refresh-secret',
  JWT_ACCESS_EXPIRATION_TIME: '15m',
  JWT_REFRESH_EXPIRATION_TIME: '7d',
  JWT_MAX_INACTIVE_TIME: '1800000',
  AUTH_RATE_LIMIT_WINDOW_MS: '60000',
  AUTH_RATE_LIMIT_MAX_REQUESTS: '10',
  ENABLE_API_DOCS: 'true',
  LOG_LEVEL: 'debug',
  LOGS_FOLDER: 'logs/test',
  POSTGRES_USER: 'postgres',
  POSTGRES_DB: 'node_base_app_test',
  POSTGRES_PASSWORD: 'postgres',
  POSTGRES_PORT: '5432',
  POSTGRES_HOST: '127.0.0.1',
  IS_DOCKER: 'false',
  DOCKER_CONTAINER_NAME: undefined
};

function loadFreshConfig(overrides: EnvMap = {}): typeof import('../config') {
  const originalEnv = process.env;
  const mergedEnv = { ...BASE_ENV, ...overrides };

  process.env = Object.fromEntries(Object.entries(mergedEnv).filter(([, value]) => value !== undefined)) as NodeJS.ProcessEnv;

  const configModulePath = moduleRequire.resolve('../config');
  delete moduleRequire.cache[configModulePath];

  try {
    return moduleRequire('../config') as typeof import('../config');
  } finally {
    process.env = originalEnv;
    delete moduleRequire.cache[configModulePath];
  }
}

describe('Bootstrap Config', () => {
  it('should normalize and expose validated application configuration', () => {
    const { appConfig } = loadFreshConfig();

    expect(appConfig.nodeEnv).to.equal('test');
    expect(appConfig.isProduction).to.equal(false);
    expect(appConfig.server).to.deep.include({
      host: '127.0.0.1',
      port: 3100,
      apiBasePath: 'api/v1',
      healthcheckPort: 3101
    });
    expect(appConfig.cors.allowedOrigins).to.deep.equal(['https://app.example.com', 'https://admin.example.com']);
    expect(appConfig.auth).to.deep.include({
      bcryptSaltRounds: 12,
      accessSecretKey: 'access-secret',
      refreshSecretKey: 'refresh-secret',
      accessExpirationTime: '15m',
      refreshExpirationTime: '7d',
      refreshMaxInactiveTimeMs: 1800000,
      rateLimitWindowMs: 60000,
      rateLimitMaxRequests: 10
    });
    expect(appConfig.docs.enabled).to.equal(true);
    expect(appConfig.logging).to.deep.equal({
      level: 'debug',
      folder: 'logs/test'
    });
    expect(appConfig.database).to.deep.include({
      user: 'postgres',
      database: 'node_base_app_test',
      password: 'postgres',
      port: 5432,
      host: '127.0.0.1',
      isDocker: false
    });
  });

  it('should treat production as a production environment and keep optional values undefined', () => {
    const { appConfig } = loadFreshConfig({
      NODE_ENV: 'production',
      DOMAIN_WHITELIST: '   ',
      ENABLE_API_DOCS: 'false',
      LOG_LEVEL: '   ',
      LOGS_FOLDER: '   '
    });

    expect(appConfig.nodeEnv).to.equal('production');
    expect(appConfig.isProduction).to.equal(true);
    expect(appConfig.cors.allowedOrigins).to.deep.equal([]);
    expect(appConfig.docs.enabled).to.equal(false);
    expect(appConfig.logging.level).to.equal(undefined);
    expect(appConfig.logging.folder).to.equal(undefined);
  });

  it('should require a docker container name when docker mode is enabled', () => {
    expect(() =>
      loadFreshConfig({
        IS_DOCKER: 'true',
        DOCKER_CONTAINER_NAME: undefined
      })
    ).to.throw('Environment variable DOCKER_CONTAINER_NAME is required when IS_DOCKER=true');
  });

  it('should reject invalid NODE_ENV values', () => {
    expect(() => loadFreshConfig({ NODE_ENV: 'staging' })).to.throw(
      'Environment variable NODE_ENV must be one of: dev, test, prod, production'
    );
  });

  it('should reject invalid boolean environment variables', () => {
    expect(() => loadFreshConfig({ ENABLE_API_DOCS: 'maybe' })).to.throw(
      'Environment variable ENABLE_API_DOCS must be either "true" or "false"'
    );
  });

  it('should reject invalid integer environment variables', () => {
    expect(() => loadFreshConfig({ SERVER_PORT: 'not-a-number' })).to.throw('Environment variable SERVER_PORT must be a valid integer');
  });

  it('should reject missing required string environment variables', () => {
    expect(() => loadFreshConfig({ JWT_ACCESS_SECRET_KEY: undefined })).to.throw(
      'Missing required environment variable: JWT_ACCESS_SECRET_KEY'
    );
  });
});
