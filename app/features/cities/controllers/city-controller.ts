import { BaseController } from '@core/controllers/base-controller';
import { QueryParams, QueryRelations, QueryResponse } from '@core/repositories/base-repository';
import { AuthenticatedRequest } from '@core/types/authenticated-request';
import { CityDTO } from '@features/cities/dtos/city-dto';
import CityService from '@features/cities/services/city-service';
import express from 'express';
import StatusCode from 'status-code-enum';
import { Inject, Service } from 'typedi';

@Service()
class CityController extends BaseController {
  @Inject(() => CityService) private readonly cityService!: CityService;

  /**
   * Find city by id
   */
  async findById(req: express.Request, res: express.Response): Promise<express.Response<CityDTO>> {
    // Query city by id
    const city = await this.cityService.findById(this.parseNumber(req.params.id), <QueryParams>{
      relations: <QueryRelations>{
        include: this.parseArray(req.query.include as string)
      }
    });

    return res.status(StatusCode.SuccessOK).send(city);
  }

  /**
   * Find cities
   */
  async find(req: express.Request, res: express.Response): Promise<express.Response<QueryResponse<CityDTO>>> {
    // Query paged cities
    const { total, records } = await this.cityService.find(<QueryParams>{
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
   * Create city
   */
  async create(req: express.Request, res: express.Response): Promise<express.Response<CityDTO>> {
    const authenticatedUserId = (req as AuthenticatedRequest).auth?.userId;

    const city = await this.cityService.create(req.body, authenticatedUserId);
    return res.status(StatusCode.SuccessCreated).send(city);
  }

  /**
   * Update city
   */
  async update(req: express.Request, res: express.Response): Promise<express.Response<CityDTO>> {
    const authenticatedUserId = (req as AuthenticatedRequest).auth?.userId;

    const city = await this.cityService.update(
      {
        ...req.body,
        id: this.parseNumber(req.params.id)
      },
      authenticatedUserId
    );

    return res.status(StatusCode.SuccessOK).send(city);
  }

  /**
   * Delete city
   */
  async delete(req: express.Request, res: express.Response): Promise<express.Response<void>> {
    await this.cityService.delete(this.parseNumber(req.params.id));
    return res.status(StatusCode.SuccessNoContent).send();
  }
}

export default CityController;
