import { errorHandler, notFoundHandler } from '@middlewares/error-handler';
import cors, { CorsOptions } from 'cors';
import express, { json, NextFunction, Request, Response } from 'express';
import http from 'http';
import logger from 'logger/logger';
import { createRequire } from 'module';

const loadModule = createRequire(__filename);

/**
 * Applies strict cache prevention headers.
 *
 * This is appropriate for API responses that may contain sensitive,
 * user-specific, session-specific, or operational information.
 */
const noStoreCacheHeaders = (_req: Request, res: Response, next: NextFunction): void => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
};

export const startApiRuntime = (): express.Express => {
  const { apiRouter } = loadModule('@core/routes/api-routes') as typeof import('@core/routes/api-routes');

  /* -------------------------------------------------------------------------- */
  /*                              HTTP API RUNTIME                              */
  /* -------------------------------------------------------------------------- */

  const app = express();

  // Prevent Express from exposing framework information through the X-Powered-By header.
  app.disable('x-powered-by');

  // Prevent API responses from being cached by browsers, proxies, or shared caches.
  app.use(noStoreCacheHeaders);

  const rawEnv = (process.env.NODE_ENV || 'dev').trim().toLowerCase();
  const isProduction = rawEnv === 'prod' || rawEnv === 'production';

  const host = process.env.SERVER_HOST || '0.0.0.0';
  const port = Number.parseInt(process.env.SERVER_PORT || '3000', 10);
  const serverApi = process.env.SERVER_API || 'api/v1';

  // CORS configuration.
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

  // Middlewares.
  app.use(json());
  app.use(cors(corsOptions));

  // Prevent API responses from being cached by browsers, proxies, or shared caches.
  app.use(`/${serverApi}`);

  // API routes.
  app.use(`/${serverApi}`, apiRouter);

  // Error handlers.
  app.use(notFoundHandler);
  app.use(errorHandler);

  // Main HTTP server.
  http.createServer(app).listen(port, host, () => {
    logger.info(`🚀 API running at http://${host}:${port}`);
  });

  /* -------------------------------------------------------------------------- */
  /*                              HEALTHCHECK API                               */
  /* -------------------------------------------------------------------------- */

  const healthApp = express();
  const healthPort = Number.parseInt(process.env.HEALTHCHECK_PORT || '3005', 10);

  // Prevent Express from exposing framework information through the X-Powered-By header.
  healthApp.disable('x-powered-by');

  healthApp.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });

  http.createServer(healthApp).listen(healthPort, host, () => {
    logger.info(`❤️ Healthcheck running at http://${host}:${healthPort}/health`);
  });

  return app;
};
