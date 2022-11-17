import { Router } from 'express';
import { meteoStationRouter } from './meteo-station-route';

export const apiRouter = Router();
// Meteo station route
apiRouter.use(`/meteo-stations`, meteoStationRouter);
