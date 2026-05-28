import 'reflect-metadata';

import { APICode, Language } from '@api-messages/api-messages';
import chai, { expect } from 'chai';
import chaiHttp, { request } from 'chai-http';
import http from 'http';
import { afterEach, describe, it } from 'mocha';
import { createRequire } from 'module';
import { Container } from 'typedi';

chai.use(chaiHttp);

const moduleRequire = createRequire(__filename);

type EnvMap = Record<string, string>;

const BASE_ENV: EnvMap = {
  NODE_ENV: 'test',
  SERVER_HOST: '127.0.0.1',
  SERVER_PORT: '3100',
  HEALTHCHECK_PORT: '3101',
  SERVER_API: 'api/v1',
  DOMAIN_WHITELIST: '',
  BCRYPT_SALT_ROUNDS: '12',
  JWT_ACCESS_SECRET_KEY: 'access-secret',
  JWT_REFRESH_SECRET_KEY: 'refresh-secret',
  JWT_ACCESS_EXPIRATION_TIME: '15m',
  JWT_REFRESH_EXPIRATION_TIME: '7d',
  JWT_MAX_INACTIVE_TIME: '1800000',
  AUTH_RATE_LIMIT_WINDOW_MS: '60000',
  AUTH_RATE_LIMIT_MAX_REQUESTS: '10',
  ENABLE_API_DOCS: 'false',
  POSTGRES_USER: 'postgres',
  POSTGRES_DB: 'node_base_app_test',
  POSTGRES_PASSWORD: 'postgres',
  POSTGRES_PORT: '5432',
  POSTGRES_HOST: '127.0.0.1',
  IS_DOCKER: 'false'
};

const MODULES_TO_RESET = ['../config', '../api-runtime', '../application-context', '../../core/routes/api-routes'];

function withFreshRuntime<T>(overrides: EnvMap, callback: (runtime: typeof import('../api-runtime')) => Promise<T> | T): Promise<T> | T {
  const originalEnv = process.env;
  process.env = Object.fromEntries(
    Object.entries({ ...BASE_ENV, ...overrides }).filter(([, value]) => value !== undefined)
  ) as NodeJS.ProcessEnv;

  for (const modulePath of MODULES_TO_RESET) {
    delete moduleRequire.cache[moduleRequire.resolve(modulePath)];
  }

  try {
    const { initializeApplicationContext } = moduleRequire('../application-context') as typeof import('../application-context');
    initializeApplicationContext();

    const runtime = moduleRequire('../api-runtime') as typeof import('../api-runtime');
    return callback(runtime);
  } finally {
    process.env = originalEnv;

    for (const modulePath of MODULES_TO_RESET) {
      delete moduleRequire.cache[moduleRequire.resolve(modulePath)];
    }
  }
}

describe('API Runtime Bootstrap', () => {
  const originalContainerGet = Container.get.bind(Container);

  afterEach(() => {
    Container.get = originalContainerGet as typeof Container.get;
  });

  it('should expose docs in non-production environments and apply runtime headers', async () =>
    withFreshRuntime({}, async ({ createApiApp }) => {
      const app = createApiApp();
      const response = await request.execute(app).get('/api/v1/openapi.json').set('Origin', 'https://frontend.local');

      expect(response).to.have.status(200);
      expect(response).to.have.header('x-request-id');
      expect(response).to.have.header('cache-control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      expect(response).to.have.header('x-content-type-options', 'nosniff');
      expect(response).to.have.header('x-frame-options', 'DENY');
      expect(response).to.have.header('referrer-policy', 'no-referrer');
      expect(response).to.have.header('x-dns-prefetch-control', 'off');
      expect(response).to.not.have.header('x-powered-by');
      expect(response).to.have.header('access-control-allow-origin', 'https://frontend.local');
      expect(response.body).to.have.property('openapi', '3.0.3');
    }));

  it('should honor the configured CORS whitelist', async () =>
    withFreshRuntime(
      {
        DOMAIN_WHITELIST: 'https://allowed.example.com,https://other.example.com'
      },
      async ({ createApiApp }) => {
        const app = createApiApp();
        const response = await request.execute(app).get('/api/v1/openapi.json').set('Origin', 'https://allowed.example.com');

        expect(response).to.have.status(200);
        expect(response).to.have.header('access-control-allow-origin', 'https://allowed.example.com');
      }
    ));

  it('should disable docs in production when ENABLE_API_DOCS is false', async () =>
    withFreshRuntime(
      {
        NODE_ENV: 'prod',
        ENABLE_API_DOCS: 'false'
      },
      async ({ createApiApp }) => {
        const app = createApiApp();

        Container.get = (() => ({
          findTranslationTextByCodeAndLanguage: async (code: string, language: Language = Language.Spanish): Promise<string> =>
            `translated:${language}:${code}`
        })) as typeof Container.get;

        const response = await request.execute(app).get('/api/v1/openapi.json');

        expect(response).to.have.status(404);
        expect(response.body).to.deep.include({
          code: APICode.ClientErrorNotFound,
          status: 404,
          message: `translated:${Language.Spanish}:${APICode.ClientErrorNotFound}`
        });
      }
    ));

  it('should enable docs in production when explicitly configured', async () =>
    withFreshRuntime(
      {
        NODE_ENV: 'prod',
        ENABLE_API_DOCS: 'true'
      },
      async ({ createApiApp }) => {
        const app = createApiApp();
        const response = await request.execute(app).get('/api/v1/docs');

        expect(response).to.have.status(200);
        expect(response.text).to.include('SwaggerUIBundle');
      }
    ));

  it('should build the healthcheck app with the expected payload', async () =>
    withFreshRuntime({}, async ({ createHealthcheckApp }) => {
      const app = createHealthcheckApp();
      const response = await request.execute(app).get('/health');

      expect(response).to.have.status(200);
      expect(response.body).to.have.property('status', 'ok');
      expect(response.body).to.have.property('uptime').that.is.a('number');
      expect(response.body).to.have.property('timestamp').that.is.a('string');
      expect(response).to.not.have.header('x-powered-by');
    }));

  it('should start both http servers with the configured host and ports', () =>
    withFreshRuntime({}, ({ createApiApp, createHealthcheckApp, startHttpServers }) => {
      const logger = moduleRequire('@logger/logger').default as typeof import('@logger/logger').default;
      const originalLoggerInfo = logger.info.bind(logger);
      const listens: Array<{ port: number; host: string }> = [];
      const createdServers: http.Server[] = [];
      const originalCreateServer = http.createServer;

      logger.info = (() => logger) as typeof logger.info;
      http.createServer = (() => {
        const server = {
          listen(port: number, host: string, callback?: () => void) {
            listens.push({ port, host });
            callback?.();
            return this;
          }
        } as Partial<http.Server>;

        createdServers.push(server as http.Server);
        return server as http.Server;
      }) as unknown as typeof http.createServer;

      try {
        const apiApp = createApiApp();
        const healthApp = createHealthcheckApp();
        const servers = startHttpServers(apiApp, healthApp);

        expect(servers.apiServer).to.equal(createdServers[0]);
        expect(servers.healthServer).to.equal(createdServers[1]);
        expect(listens).to.deep.equal([
          { port: 3100, host: '127.0.0.1' },
          { port: 3101, host: '127.0.0.1' }
        ]);
      } finally {
        logger.info = originalLoggerInfo;
        http.createServer = originalCreateServer;
      }
    }));

  it('should create and start the runtime in a single call', () =>
    withFreshRuntime({}, ({ startApiRuntime }) => {
      const logger = moduleRequire('@logger/logger').default as typeof import('@logger/logger').default;
      const originalLoggerInfo = logger.info.bind(logger);
      const originalCreateServer = http.createServer;
      let listenCount = 0;

      logger.info = (() => logger) as typeof logger.info;
      http.createServer = (() => {
        return {
          listen(_port: number, _host: string, callback?: () => void) {
            listenCount += 1;
            callback?.();
            return this;
          }
        } as http.Server;
      }) as unknown as typeof http.createServer;

      try {
        const app = startApiRuntime();

        expect(app).to.have.property('use');
        expect(listenCount).to.equal(2);
      } finally {
        logger.info = originalLoggerInfo;
        http.createServer = originalCreateServer;
      }
    }));
});
