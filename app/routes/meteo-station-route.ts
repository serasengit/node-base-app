import Container from 'typedi';
import { Router } from 'express';
import MeteoStationController from '@controllers/meteo-station-controller';
import { APICode, getAPIMessage, Language } from '@api-messages/api-messages';
import { check } from 'express-validator';

// Router
export const meteoStationRouter = Router();
// Dependency classes injection handled with 'typedi' library
const meteoStationController = Container.get(MeteoStationController);

// Find all meteo stations
meteoStationRouter.get(`/`, (req, res) => meteoStationController.findAll(req, res));
// Find  meteo station by id
meteoStationRouter.get(
  `/:meteoStationId`,
  [
    check('meteoStationId')
      .notEmpty()
      .isInt({ min: 1 })
      .withMessage((value, { req }) => {
        return {
          code: APICode.InvalidParameter,
          message: `${getAPIMessage(APICode.InvalidParameter, req.headers?.language as Language)}:meteoStationId`
        };
      })
  ],
  (req, res) => meteoStationController.findById(req, res)
);
