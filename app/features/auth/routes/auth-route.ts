import { asyncHandler } from '@core/routes/async-handler';
import { Router } from 'express';
import { checkSchema } from 'express-validator/lib/middlewares/schema';
import Container from 'typedi';
import AuthController from '../controllers/auth-controller';
import { authSchema } from './auth-route-schema';

// Create Router instance
export const authRouter = Router();

// Inject controller using typedi
const authController = Container.get(AuthController);

// Define the auth route
authRouter.post('/', checkSchema(authSchema()), asyncHandler(authController.auth.bind(authController)));

// Define the refresh token route
authRouter.post('/refresh-token', asyncHandler(authController.refreshToken.bind(authController)));
