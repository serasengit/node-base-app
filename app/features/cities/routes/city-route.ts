import { asyncHandler } from '@core/routes/async-handler';
import { findResourceSchema, paginationSchema } from '@core/routes/common-route-schema';
import CityController from '@features/cities/controllers/city-controller';
import { cityPaginationColumns, cityRelationSchema, citySchema, findCitiesSchema } from '@features/cities/routes/city-route-schema';
import { validateRequestParameters } from '@middlewares/error-handler';
import { Router } from 'express';
import { checkSchema } from 'express-validator';
import Container from 'typedi';

export const cityRouter = Router();
const cityController = Container.get(CityController);

// Get all cities with optional filters, pagination, and relation inclusion
cityRouter.get(
  '/',
  checkSchema({
    ...findCitiesSchema(),
    ...cityRelationSchema(),
    ...paginationSchema(cityPaginationColumns)
  }),
  validateRequestParameters,
  asyncHandler((req, res) => cityController.find(req, res))
);

// Get a single city by ID with optional relation inclusion
cityRouter.get(
  '/:id',
  checkSchema({
    ...findResourceSchema(),
    ...cityRelationSchema()
  }),
  validateRequestParameters,
  asyncHandler((req, res) => cityController.findById(req, res))
);

// Create a new city
cityRouter.post(
  '/',
  checkSchema(citySchema()),
  validateRequestParameters,
  asyncHandler((req, res) => cityController.create(req, res))
);

// Update an existing city by ID
cityRouter.put(
  '/:id',
  checkSchema({
    ...findResourceSchema(),
    ...citySchema()
  }),
  validateRequestParameters,
  asyncHandler((req, res) => cityController.update(req, res))
);

// Delete a city by ID
cityRouter.delete(
  '/:id',
  checkSchema(findResourceSchema()),
  validateRequestParameters,
  asyncHandler((req, res) => cityController.delete(req, res))
);
