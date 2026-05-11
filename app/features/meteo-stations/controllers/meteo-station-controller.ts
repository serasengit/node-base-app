import { BaseController } from '@core/controllers/base-controller';
import { QueryParams, QueryRelations, QueryResponse } from '@core/repositories/base-repository';
import { AuthenticatedRequest } from '@core/types/authenticated-request';
import { MeteoStationDTO } from '@features/meteo-stations/dtos/meteo-station-dto';
import MeteoStationService from '@features/meteo-stations/services/meteo-station-service';
import express from 'express';
import StatusCode from 'status-code-enum';
import { Inject, Service } from 'typedi';

@Service()
class MeteoStationController extends BaseController {
  @Inject(() => MeteoStationService) private readonly meteoStationService!: MeteoStationService;

  /**
   * Find meteo station by id
   */
  async findById(req: express.Request, res: express.Response): Promise<express.Response<MeteoStationDTO>> {
    // Query meteo station by id
    const meteoStation = await this.meteoStationService.findById(this.parseNumber(req.params.id), <QueryParams>{
      relations: <QueryRelations>{
        include: this.parseArray(req.query.include as string)
      }
    });
    return res.status(StatusCode.SuccessOK).send(meteoStation);
  }

  /**
   * Find meteo stations
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
   * Create meteo station
   */
  async create(req: express.Request, res: express.Response): Promise<express.Response<MeteoStationDTO>> {
    const authenticatedUserId = (req as AuthenticatedRequest).auth?.userId;

    const meteoStation = await this.meteoStationService.create(req.body, authenticatedUserId);
    return res.status(StatusCode.SuccessCreated).send(meteoStation);
  }

  /**
   * Update meteo station
   */
  async update(req: express.Request, res: express.Response): Promise<express.Response<MeteoStationDTO>> {
    const authenticatedUserId = (req as AuthenticatedRequest).auth?.userId;

    const meteoStation = await this.meteoStationService.update(
      {
        ...req.body,
        id: this.parseNumber(req.params.id)
      },
      authenticatedUserId
    );
    return res.status(StatusCode.SuccessOK).send(meteoStation);
  }

  /**
   * Delete meteo station
   */
  async delete(req: express.Request, res: express.Response): Promise<express.Response<void>> {
    await this.meteoStationService.delete(this.parseNumber(req.params.id));
    return res.status(StatusCode.SuccessNoContent).send();
  }
}

export default MeteoStationController;
