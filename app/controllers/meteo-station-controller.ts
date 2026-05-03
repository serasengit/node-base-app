import { Language } from '@api-messages/api-messages';
import { MeteoStationDTO } from '@dtos/meteo-station-dto';
import { QueryFilters, QueryParams, QueryRelations, QueryResponse } from '@repositories/base-repository';
import MeteoStationService from '@services/meteo-station-service';
import express from 'express';
import StatusCode from 'status-code-enum';
import { Inject, Service } from 'typedi';
import { BaseController } from './base-controller';

@Service()
class MeteoStationController extends BaseController {
  @Inject(() => MeteoStationService) private readonly meteoStationService!: MeteoStationService;

  /**
   * @summary Find meteo station by id
   */
  async findById(req: express.Request, res: express.Response): Promise<express.Response<MeteoStationDTO>> {
    // Query meteo station by id
    const meteoStation = await this.meteoStationService.findById(this.parseNumber(req.params.id), <QueryParams>{
      relations: <QueryRelations>{
        include: this.parseArray(req.query.include as string)
      },
      filters: <QueryFilters>{ language: (req.headers.language ?? Language.Spanish) as Language }
    });
    return res.status(StatusCode.SuccessOK).send(meteoStation);
  }

  /**
   * @summary Find meteo stations
   */
  async find(req: express.Request, res: express.Response): Promise<express.Response<QueryResponse<MeteoStationDTO>>> {
    // Query paged meteo stations
    const { total, records } = await this.meteoStationService.find(<QueryParams>{
      filters: {
        ...this.getDefaultFilters(req)
      },
      relations: <QueryRelations>{
        include: this.parseArray(req.query.include as string)
      },
      pagination: this.getDefaultPaginatorOptions(req)
    });

    return res.status(StatusCode.SuccessOK).send({ total, records });
  }

  /**
   * @summary Create meteo station
   */
  async create(req: express.Request, res: express.Response): Promise<express.Response<MeteoStationDTO>> {
    const meteoStation = await this.meteoStationService.create(req.body);
    return res.status(StatusCode.SuccessCreated).send(meteoStation);
  }

  /**
   * @summary Update meteo station
   */
  async update(req: express.Request, res: express.Response): Promise<express.Response<MeteoStationDTO>> {
    const meteoStation = await this.meteoStationService.update({
      ...req.body,
      id: this.parseNumber(req.params.id)
    });
    return res.status(StatusCode.SuccessOK).send(meteoStation);
  }

  /**
   * @summary Delete meteo station
   */
  async delete(req: express.Request, res: express.Response): Promise<express.Response<void>> {
    await this.meteoStationService.delete(this.parseNumber(req.params.id));
    return res.status(StatusCode.SuccessNoContent).send();
  }
}

export default MeteoStationController;
