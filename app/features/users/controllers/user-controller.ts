import { BaseController } from '@core/controllers/base-controller';
import { QueryParams, QueryRelations, QueryResponse } from '@core/repositories/base-repository';
import { AuthenticatedRequest } from '@core/types/authenticated-request';
import { UserDTO } from '@features/users/dtos/user-dto';
import UserService from '@features/users/services/user-service';
import express from 'express';
import StatusCode from 'status-code-enum';
import { Inject, Service } from 'typedi';

@Service()
class UserController extends BaseController {
  @Inject(() => UserService) private readonly userService!: UserService;

  /**
   * Find user by id
   */
  async findById(req: express.Request, res: express.Response): Promise<express.Response<UserDTO>> {
    const user = await this.userService.findById(this.parseNumber(req.params.id), <QueryParams>{
      relations: <QueryRelations>{
        include: this.parseArray(req.query.include as string)
      }
    });

    return res.status(StatusCode.SuccessOK).send(user);
  }

  /**
   * Find users
   */
  async find(req: express.Request, res: express.Response): Promise<express.Response<QueryResponse<UserDTO>>> {
    const { total, records } = await this.userService.find(<QueryParams>{
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
   * Create user
   */
  async create(req: express.Request, res: express.Response): Promise<express.Response<UserDTO>> {
    const authenticatedUserId = (req as AuthenticatedRequest).auth?.userId;

    const user = await this.userService.create(req.body, authenticatedUserId);
    return res.status(StatusCode.SuccessCreated).send(user);
  }

  /**
   * Update user
   */
  async update(req: express.Request, res: express.Response): Promise<express.Response<UserDTO>> {
    const authenticatedUserId = (req as AuthenticatedRequest).auth?.userId;

    const user = await this.userService.update(
      {
        ...req.body,
        id: this.parseNumber(req.params.id)
      },
      authenticatedUserId
    );

    return res.status(StatusCode.SuccessOK).send(user);
  }

  /**
   * Delete user
   */
  async delete(req: express.Request, res: express.Response): Promise<express.Response<void>> {
    const authenticatedUserId = (req as AuthenticatedRequest).auth?.userId;

    await this.userService.delete(this.parseNumber(req.params.id), authenticatedUserId);
    return res.status(StatusCode.SuccessNoContent).send();
  }
}

export default UserController;
