import { appConfig } from '@bootstrap/config';
import { errorHandler, notFoundHandler } from '@middlewares/error-handler';
import { requestContextMiddleware } from '@middlewares/request-context';
import { noStoreCacheHeaders, securityHeadersMiddleware } from '@middlewares/response-headers';
import cookieParser from 'cookie-parser';
import cors, { CorsOptions } from 'cors';
import express, { json } from 'express';
import http from 'http';
import logger from 'logger/logger';
import { createRequire } from 'module';

// Creates a CommonJS-compatible require function.
// This is useful when dynamically loading modules from an ES module context.
const loadModule = createRequire(__filename);

export const createApiApp = (): express.Express => {
  // Loads the API router dynamically to avoid early initialization issues.
  const { apiRouter } = loadModule('@core/routes/api-routes') as typeof import('@core/routes/api-routes');

  // Creates the main Express application used by the API server.
  const app = express();

  // Prevent Express from exposing framework information through the X-Powered-By header.
  app.disable('x-powered-by');

  // Prevent API responses from being cached by browsers, proxies, or shared caches.
  app.use(noStoreCacheHeaders);

  // Applies common HTTP response hardening headers for API traffic.
  app.use(securityHeadersMiddleware);

  // CORS configuration.
  const corsOptions: CorsOptions = {
    // Allows only configured origins in production.
    // In non-production environments, allows requests when no explicit origin whitelist is configured.
    origin: appConfig.cors.allowedOrigins.length > 0 ? appConfig.cors.allowedOrigins : !appConfig.isProduction,

    // Defines which HTTP methods are accepted for cross-origin requests.
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],

    // Defines which request headers clients are allowed to send.
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-Id', 'Language', 'language'],

    // Exposes the request ID header so frontend clients can read it.
    exposedHeaders: ['X-Request-Id'],

    // Allows cookies and authorization credentials to be sent in cross-origin requests.
    credentials: true,

    // Returns HTTP 204 for successful preflight OPTIONS requests.
    optionsSuccessStatus: 204
  };

  // Middlewares.

  // Initializes request-scoped context such as request ID, method, and path.
  app.use(requestContextMiddleware);

  // Parses cookies from the Cookie header and exposes them through req.cookies.
  // Required when refresh tokens are stored in HTTP-only cookies.
  app.use(cookieParser());

  // Parses incoming JSON request bodies and exposes them through req.body.
  app.use(json());

  // Applies the configured CORS policy to incoming requests.
  app.use(cors(corsOptions));

  // API routes.

  // Mounts all API routes under the configured API base path.
  app.use(`/${appConfig.server.apiBasePath}`, apiRouter);

  // Error handlers.

  // Handles requests that do not match any registered route.
  app.use(notFoundHandler);

  // Handles all application errors in a centralized way.
  // This must be registered after routes and other middlewares.
  app.use(errorHandler);

  return app;
};

export const createHealthcheckApp = (): express.Express => {
  // Creates a separate Express application dedicated to health checks.
  const healthApp = express();

  // Prevent Express from exposing framework information through the X-Powered-By header.
  healthApp.disable('x-powered-by');

  // Lightweight endpoint used by monitoring systems, containers, and load balancers.
  healthApp.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });

  return healthApp;
};

export const startHttpServers = (
  app: express.Express,
  healthApp = createHealthcheckApp()
): { apiServer: http.Server; healthServer: http.Server } => {
  // Creates the HTTP server for the main API application.
  const apiServer = http.createServer(app);

  // Creates the HTTP server for the healthcheck application.
  const healthServer = http.createServer(healthApp);

  // Starts the main API server on the configured host and port.
  apiServer.listen(appConfig.server.port, appConfig.server.host, () => {
    logger.info(`🚀 API running at http://${appConfig.server.host}:${appConfig.server.port}`);
  });

  // Starts the healthcheck server on a separate configured port.
  healthServer.listen(appConfig.server.healthcheckPort, appConfig.server.host, () => {
    logger.info(`❤️ Healthcheck running at http://${appConfig.server.host}:${appConfig.server.healthcheckPort}/health`);
  });

  return { apiServer, healthServer };
};

export const startApiRuntime = (): express.Express => {
  // Builds the API application.
  const app = createApiApp();

  // Starts both the API server and the healthcheck server.
  startHttpServers(app);

  return app;
};
