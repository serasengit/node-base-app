import MeteoStationController from '@controllers/meteo-station-controller';
import { Router } from 'express';
import { checkSchema } from 'express-validator';
import { validateRequestParameters } from '@middlewares/error-handler';
import Container from 'typedi';
import { findResourceSchema, paginationSchema } from './schemas/common-route-schema';
import {
  findMeteoStationsSchema,
  meteoStationPaginationColumns,
  meteoStationRelationSchema,
  meteoStationSchema
} from './schemas/meteo-station-route-schema';

export const meteoStationRouter = Router();

const asyncHandler =
  (fn) =>
  (req, res, next): void => {
    Promise.resolve(fn(req, res)).catch(next);
  };

meteoStationRouter.get(
  '/',
  checkSchema({
    ...findMeteoStationsSchema(),
    ...meteoStationRelationSchema(),
    ...paginationSchema(meteoStationPaginationColumns)
  }),
  validateRequestParameters,

  asyncHandler((req, res) => Container.get(MeteoStationController).find(req, res))
);

meteoStationRouter.get(
  '/:id',
  checkSchema({
    ...findResourceSchema(),
    ...meteoStationRelationSchema()
  }),
  validateRequestParameters,
  asyncHandler((req, res) => Container.get(MeteoStationController).findById(req, res))
);

meteoStationRouter.post(
  '/',
  checkSchema(meteoStationSchema()),
  validateRequestParameters,
  asyncHandler((req, res) => Container.get(MeteoStationController).create(req, res))
);

meteoStationRouter.put(
  '/:id',
  checkSchema({
    ...findResourceSchema(),
    ...meteoStationSchema()
  }),
  validateRequestParameters,
  asyncHandler((req, res) => Container.get(MeteoStationController).update(req, res))
);

meteoStationRouter.delete(
  '/:id',
  checkSchema(findResourceSchema()),
  validateRequestParameters,
  asyncHandler((req, res) => Container.get(MeteoStationController).delete(req, res))
);
