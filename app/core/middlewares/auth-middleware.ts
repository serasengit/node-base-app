import { APICode } from '@api-messages/api-messages';
import { ForbiddenError } from '@api-messages/errors/forbidden-error';
import { UnauthorizedError } from '@api-messages/errors/unauthorized-error';
import { AuthenticatedRequest } from '@core/types/authenticated-request';
import { getBearerTokenFromAuthHeader, toAccessTokenPayload } from '@features/auth/dtos/auth-dto';
import UserService from '@features/users/services/user-service';
import express from 'express';
import { TokenExpiredError, verify } from 'jsonwebtoken';
import { Inject, Service } from 'typedi';

@Service()
export class AuthMiddleware {
  @Inject(() => UserService) private readonly userService!: UserService;

  /**
   * Validates the presence and validity of a JWT token.
   *
   * Flow:
   * - Extracts the token from the Authorization header.
   * - Returns Unauthorized error if the token is missing.
   * - Verifies the token's signature and expiration using the secret key.
   * - Returns Unauthorized error if token verification fails.
   * - Calls next() middleware if the token is valid.
   */
  async validateToken(req: express.Request, res: express.Response, next: express.NextFunction): Promise<express.Response | void> {
    void res;

    try {
      const authenticatedRequest = req as AuthenticatedRequest;
      const accessToken = getBearerTokenFromAuthHeader(req.headers['authorization']);
      authenticatedRequest.auth = toAccessTokenPayload(verify(accessToken, process.env.JWT_ACCESS_SECRET_KEY as string));
      next();
    } catch (error) {
      if (error instanceof UnauthorizedError) return next(error);
      if (error instanceof TokenExpiredError) return next(new UnauthorizedError(APICode.SessionExpired));
      return next(new UnauthorizedError(APICode.InvalidAccessToken));
    }
  }
  /**
   * Middleware to validate that the request comes from a valid and active user.
   *
   * Flow:
   * - Reads the validated access token payload stored by the token middleware.
   * - Uses the `userId` claim to load the current user from the database.
   * - Rejects inactive users before the route handler runs.
   */
  async validateUser(req: express.Request, res: express.Response, next: express.NextFunction): Promise<express.Response | void> {
    void res;

    try {
      const authenticatedRequest = req as AuthenticatedRequest;
      const userId = authenticatedRequest.auth?.userId;

      if (!userId) throw new ForbiddenError(APICode.InvalidAccessToken);

      // Deny access if user does not exist
      const user = await this.userService.findById(userId);

      // Deny access if user is inactive
      if (!user.isActive) throw new UnauthorizedError(APICode.InactiveUser);

      // Attach user to request object for future use
      authenticatedRequest.user = user;
      authenticatedRequest.serialNumber = user.nif;

      next();
    } catch (error) {
      next(error);
    }
  }
}
