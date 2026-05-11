import { Router } from 'express';

import { AuthMiddleware } from '@core/middlewares/auth-middleware';
import { ApiRouteMount } from '@docs/route-introspection';
import { authRouter } from '@features/auth/routes/auth-route';
import { cityRouter } from '@features/cities/routes/city-route';
import { meteoStationRouter } from '@features/meteo-stations/routes/meteo-station-route';
import { userRouter } from '@features/users/routes/user-route';
import Container from 'typedi';
import { createDocsRouter } from './docs-route';

export const apiRouter = Router();
const authMiddleware = Container.get(AuthMiddleware);

/**
 * Route registry used by the API documentation generator.
 *
 * Each entry defines the base path, the router mounted under that path,
 * and whether the route should be considered protected.
 */
export const apiRouteMounts: ApiRouteMount[] = [
  { path: '/auth', router: authRouter, protected: false },
  { path: '/users', router: userRouter, protected: true },
  { path: '/cities', router: cityRouter, protected: true },
  { path: '/meteo-stations', router: meteoStationRouter, protected: true }
];

// API documentation.
// Disabled by default in production to avoid exposing the API surface publicly.
// Can be explicitly enabled with ENABLE_API_DOCS=true.
const isProduction = process.env.NODE_ENV === 'prod' || process.env.NODE_ENV === 'production';
const isApiDocsEnabled = process.env.ENABLE_API_DOCS === 'true';

if (!isProduction || isApiDocsEnabled) {
  apiRouter.use('/', createDocsRouter(apiRouteMounts));
}

// Authentication route
apiRouter.use(`/auth`, authRouter);

// Mount city routes.
apiRouter.use('/cities', authMiddleware.validateToken.bind(authMiddleware), authMiddleware.validateUser.bind(authMiddleware), cityRouter);

// Mount user routes.
apiRouter.use('/users', authMiddleware.validateToken.bind(authMiddleware), authMiddleware.validateUser.bind(authMiddleware), userRouter);

// Mount meteo station routes.
apiRouter.use(
  '/meteo-stations',
  authMiddleware.validateToken.bind(authMiddleware),
  authMiddleware.validateUser.bind(authMiddleware),
  meteoStationRouter
);
