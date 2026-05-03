import { Router } from 'express';

import { ApiRouteMount } from '../docs/route-introspection';
import { createDocsRouter } from './docs-route';
import { meteoStationRouter } from './meteo-station-route';

export const apiRouter = Router();

/**
 * Route registry used by the API documentation generator.
 *
 * Each entry defines the base path, the router mounted under that path,
 * and whether the route should be considered protected.
 */
export const apiRouteMounts: ApiRouteMount[] = [{ path: '/meteo-stations', router: meteoStationRouter, protected: true }];

// API documentation.
// Disabled by default in production to avoid exposing the API surface publicly.
// Can be explicitly enabled with ENABLE_API_DOCS=true.
const isProduction = process.env.NODE_ENV === 'prod' || process.env.NODE_ENV === 'production';
const isApiDocsEnabled = process.env.ENABLE_API_DOCS === 'true';

if (!isProduction || isApiDocsEnabled) {
  apiRouter.use('/', createDocsRouter(apiRouteMounts));
}

// Mount meteo station routes.
apiRouter.use('/meteo-stations', meteoStationRouter);
