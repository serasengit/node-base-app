import { errorHandler, notFoundHandler } from '@middlewares/error-handler';
import { apiRouter } from '@routes/api-routes';
import cors, { CorsOptions } from 'cors';
import express, { json } from 'express';
import http from 'http';
import logger from 'logger/logger';

const normalizeBasePath = (basePath: string): string => `/${basePath.replace(/^\/+|\/+$/g, '')}`;

export const startApiRuntime = (): express.Express => {
  /* -------------------------------------------------------------------------- */
  /*                            HTTP API RUNTIME                                 */
  /* -------------------------------------------------------------------------- */

  const app = express();

  const rawEnv = (process.env.NODE_ENV || 'dev').trim().toLowerCase();
  const isProduction = rawEnv === 'prod' || rawEnv === 'production';

  const host = process.env.SERVER_HOST || '0.0.0.0';
  const port = Number.parseInt(process.env.SERVER_PORT || '3000', 10);
  const apiBasePath = normalizeBasePath(process.env.SERVER_API || 'api/v1');

  // In production, the API is expected to be behind a trusted reverse proxy that handles TLS termination and client certificate validation.
  const trustedProxies = (process.env.TRUSTED_PROXY_IPS || '')
    .split(',')
    .map((ip) => ip.trim())
    .filter(Boolean);

  // Trust only explicitly configured reverse proxies.
  // This allows req.ip, req.hostname and req.protocol to be resolved from X-Forwarded-* headers
  // only when the request comes through a trusted proxy.
  app.set('trust proxy', trustedProxies);

  // CORS configuration
  const allowedOrigins =
    process.env.DOMAIN_WHITELIST?.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean) ?? [];

  const corsOptions: CorsOptions = {
    origin: allowedOrigins.length > 0 ? allowedOrigins : !isProduction,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Language', 'language'],
    credentials: true,
    optionsSuccessStatus: 204
  };

  // Middlewares
  app.use(json());
  app.use(cors(corsOptions));
  app.use(apiBasePath, apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  // Create HTTP server
  http.createServer(app).listen(port, host, () => {
    logger.info(`🚀 API running at http://${host}:${port}${apiBasePath}`);
  });

  /* -------------------------------------------------------------------------- */
  /*                              HEALTHCHECK API                                */
  /* -------------------------------------------------------------------------- */

  const healthApp = express();

  healthApp.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });

  const healthPort = Number.parseInt(process.env.HEALTHCHECK_PORT || '3002', 10);

  http.createServer(healthApp).listen(healthPort, host, () => {
    logger.info(`❤️ Healthcheck running at http://${host}:${healthPort}/health`);
  });

  return app;
};
