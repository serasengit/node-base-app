import { Router } from 'express';

import { ApiRouteMount } from '../docs/route-introspection';
import { createDocsRouter } from './docs-route';
import { meteoStationRouter } from './meteo-station-route';

export const apiRouter = Router();

export const apiRouteMounts: ApiRouteMount[] = [{ path: '/meteo-stations', router: meteoStationRouter, protected: true }];

export function asyncHandler(fn) {
  return (req, res, next): void => {
    Promise.resolve(fn(req, res)).catch(next);
  };
}

// API documentation.
// Disabled by default in production to avoid exposing API surface publicly.
// Can be explicitly enabled with ENABLE_API_DOCS=true.
const isProduction = process.env.NODE_ENV === 'prod' || process.env.NODE_ENV === 'production';
const isApiDocsEnabled = process.env.ENABLE_API_DOCS === 'true';

if (!isProduction || isApiDocsEnabled) {
  apiRouter.use('/', createDocsRouter(apiRouteMounts));
}

// Meteo station route
apiRouter.use(`/meteo-stations`, meteoStationRouter);
