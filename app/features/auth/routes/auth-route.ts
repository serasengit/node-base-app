import { appConfig } from '@bootstrap/config';
import { asyncHandler } from '@core/routes/async-handler';
import { createRateLimitMiddleware } from '@middlewares/rate-limit';
import { Router } from 'express';
import { checkSchema } from 'express-validator/lib/middlewares/schema';
import Container from 'typedi';
import AuthController from '../controllers/auth-controller';
import { authSchema } from './auth-route-schema';

// Create Router instance
export const authRouter = Router();

// Inject controller using typedi
const authController = Container.get(AuthController);
const authRateLimitMiddleware = createRateLimitMiddleware({
  maxRequests: () => appConfig.auth.rateLimitMaxRequests,
  windowMs: () => appConfig.auth.rateLimitWindowMs
});

// Define the auth route
authRouter.post('/', authRateLimitMiddleware, checkSchema(authSchema()), asyncHandler(authController.auth.bind(authController)));

// Define the refresh token route
authRouter.post('/refresh-token', authRateLimitMiddleware, asyncHandler(authController.refreshToken.bind(authController)));

// Define the logout route
authRouter.post('/logout', asyncHandler(authController.logout.bind(authController)));
