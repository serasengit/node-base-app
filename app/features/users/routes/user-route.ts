import { GrantMiddleware } from '@core/middlewares/grant-middleware';
import { asyncHandler } from '@core/routes/async-handler';
import { findResourceSchema, paginationSchema } from '@core/routes/common-route-schema';
import UserController from '@features/users/controllers/user-controller';
import { findUsersSchema, userPaginationColumns, userRelationSchema, userSchema } from '@features/users/routes/user-route-schema';
import { GrantType } from '@features/grants/schemas/grant-schema';
import { ModuleCode } from '@features/modules/schemas/module-schema';
import { validateRequestParameters } from '@middlewares/error-handler';
import { Router } from 'express';
import { checkSchema } from 'express-validator';
import Container from 'typedi';

export const userRouter = Router();
const userController = Container.get(UserController);
const grantMiddleware = Container.get(GrantMiddleware);

// Get all users with optional filters, pagination, and relation inclusion
userRouter.get(
  '/',
  checkSchema({
    ...findUsersSchema(),
    ...userRelationSchema(),
    ...paginationSchema(userPaginationColumns)
  }),
  validateRequestParameters,
  grantMiddleware.hasGrantTypeOverModule(ModuleCode.Users, GrantType.CanRead),
  asyncHandler((req, res) => userController.find(req, res))
);

// Get a single user by ID with optional relation inclusion
userRouter.get(
  '/:id',
  checkSchema({
    ...findResourceSchema(),
    ...userRelationSchema()
  }),
  validateRequestParameters,
  grantMiddleware.hasGrantTypeOverModule(ModuleCode.Users, GrantType.CanRead),
  asyncHandler((req, res) => userController.findById(req, res))
);

// Create a new user
userRouter.post(
  '/',
  checkSchema(userSchema()),
  validateRequestParameters,
  grantMiddleware.hasGrantTypeOverModule(ModuleCode.Users, GrantType.CanCreate),
  asyncHandler((req, res) => userController.create(req, res))
);

// Update an existing user by ID
userRouter.put(
  '/:id',
  checkSchema({
    ...findResourceSchema(),
    ...userSchema()
  }),
  validateRequestParameters,
  grantMiddleware.hasGrantTypeOverModule(ModuleCode.Users, GrantType.CanEdit),
  asyncHandler((req, res) => userController.update(req, res))
);

// Delete a user by ID
userRouter.delete(
  '/:id',
  checkSchema(findResourceSchema()),
  validateRequestParameters,
  grantMiddleware.hasGrantTypeOverModule(ModuleCode.Users, GrantType.CanDelete),
  asyncHandler((req, res) => userController.delete(req, res))
);
