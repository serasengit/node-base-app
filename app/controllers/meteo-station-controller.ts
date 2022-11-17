import { Service } from 'typedi';
import { StatusCode } from 'status-code-enum';
import express from 'express';
import { BaseError } from '@api-messages/errors/base-error';
import { Language } from '@api-messages/api-messages';
import { MeteoStationDTO } from '@dtos/meteo-station-dto';
import MeteoStationService from '@services/meteo-station-service';
import { BaseController } from './base-controller';

@Service()
class MeteoStationController extends BaseController {
  constructor(private readonly meteoStationService: MeteoStationService) {
    super();
  }

  /**
   * @summary Find all meteo stations
   * @description Find all meteo stations
   * @param req {object} Express req object
   * @param res {object} Express res object
   * @returns MeteoStationDTO[]
   *
   */
  async findAll(req: express.Request, res: express.Response): Promise<express.Response<MeteoStationDTO[]>> {
    try {
      // Express-validator request errors
      this.validateRequest(req);
      const meteoStations: MeteoStationDTO[] = await this.meteoStationService.findAll();
      return res.status(StatusCode.SuccessOK).send(meteoStations);
    } catch (error) {
      return res
        .status(error.status ?? StatusCode.ServerErrorInternal)
        .send(new BaseError(error.code, error.status, req.headers?.language as Language, error?.errors));
    }
  }

  /**
   * @summary Find  meteo station by id
   * @description Find  meteo station by id
   * @param req {object} Express req object
   * @param res {object} Express res object
   * @returns MeteoStationDTO
   *
   */
  async findById(req: express.Request, res: express.Response): Promise<express.Response<MeteoStationDTO[]>> {
    try {
      // Express-validator request errors
      this.validateRequest(req);
      const meteoStations: MeteoStationDTO = await this.meteoStationService.findById(req.params.meteoStationId);
      return res.status(StatusCode.SuccessOK).send(meteoStations);
    } catch (error) {
      return res
        .status(error.status ?? StatusCode.ServerErrorInternal)
        .send(new BaseError(error.code, error.status, req.headers?.language as Language, error?.errors));
    }
  }
}
export default MeteoStationController;
