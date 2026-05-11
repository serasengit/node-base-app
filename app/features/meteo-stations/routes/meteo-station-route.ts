import { GrantMiddleware } from '@core/middlewares/grant-middleware';
import { asyncHandler } from '@core/routes/async-handler';
import { findResourceSchema, paginationSchema } from '@core/routes/common-route-schema';
import { GrantType } from '@features/grants/schemas/grant-schema';
import MeteoStationController from '@features/meteo-stations/controllers/meteo-station-controller';
import {
  findMeteoStationsSchema,
  meteoStationPaginationColumns,
  meteoStationRelationSchema,
  meteoStationSchema
} from '@features/meteo-stations/routes/meteo-station-route-schema';
import { ModuleCode } from '@features/modules/schemas/module-schema';
import { validateRequestParameters } from '@middlewares/error-handler';
import { Router } from 'express';
import { checkSchema } from 'express-validator';
import Container from 'typedi';

export const meteoStationRouter = Router();
const meteostationController = Container.get(MeteoStationController);
const grantMiddleware = Container.get(GrantMiddleware);

// Get all meteo stations with optional filters, pagination, and relation inclusion
meteoStationRouter.get(
  '/',
  checkSchema({
    ...findMeteoStationsSchema(),
    ...meteoStationRelationSchema(),
    ...paginationSchema(meteoStationPaginationColumns)
  }),
  validateRequestParameters,
  grantMiddleware.hasGrantTypeOverModule(ModuleCode.MeteoStations, GrantType.CanRead),
  asyncHandler((req, res) => meteostationController.find(req, res))
);

// Get a single meteo station by ID with optional relation inclusion
meteoStationRouter.get(
  '/:id',
  checkSchema({
    ...findResourceSchema(),
    ...meteoStationRelationSchema()
  }),
  validateRequestParameters,
  grantMiddleware.hasGrantTypeOverModule(ModuleCode.MeteoStations, GrantType.CanRead),
  asyncHandler((req, res) => meteostationController.findById(req, res))
);

// Create a new meteo station
meteoStationRouter.post(
  '/',
  checkSchema(meteoStationSchema()),
  validateRequestParameters,
  grantMiddleware.hasGrantTypeOverModule(ModuleCode.MeteoStations, GrantType.CanCreate),
  asyncHandler((req, res) => meteostationController.create(req, res))
);

// Update an existing meteo station by ID
meteoStationRouter.put(
  '/:id',
  checkSchema({
    ...findResourceSchema(),
    ...meteoStationSchema()
  }),
  validateRequestParameters,
  grantMiddleware.hasGrantTypeOverModule(ModuleCode.MeteoStations, GrantType.CanEdit),
  asyncHandler((req, res) => meteostationController.update(req, res))
);

// Delete a meteo station by ID
meteoStationRouter.delete(
  '/:id',
  checkSchema(findResourceSchema()),
  validateRequestParameters,
  grantMiddleware.hasGrantTypeOverModule(ModuleCode.MeteoStations, GrantType.CanDelete),
  asyncHandler((req, res) => meteostationController.delete(req, res))
);
