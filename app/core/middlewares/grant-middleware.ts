import { APICode } from '@api-messages/api-messages';
import { ForbiddenError } from '@api-messages/errors/forbidden-error';
import { UnauthorizedError } from '@api-messages/errors/unauthorized-error';
import { AuthenticatedRequest } from '@core/types/authenticated-request';
import { getBearerTokenFromAuthHeader, toAccessTokenPayload } from '@features/auth/dtos/auth-dto';
import { GrantType } from '@features/grants/schemas/grant-schema';
import { ModuleCode } from '@features/modules/schemas/module-schema';
import { RoleCode } from '@features/roles/schemas/role-schema';
import RoleService from '@features/roles/services/role-service';
import express from 'express';
import { TokenExpiredError, verify } from 'jsonwebtoken';
import { Inject, Service } from 'typedi';

@Service()
export class GrantMiddleware {
  @Inject(() => RoleService) private readonly roleService!: RoleService;

  /**
   * Middleware to validate whether the authenticated user has a required grant type
   * for a specific module based on the role stored in the access token.
   *
   * Access rules:
   * - The request must contain a valid access token.
   * - System administrators are automatically granted access.
   * - For other roles, the role must explicitly include the required grant type
   *   for the target module.
   */
  hasGrantTypeOverModule(moduleCode: ModuleCode, grantType: GrantType) {
    return async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
      void res;

      try {
        const tokenInfo = this.getAccessTokenPayload(req);

        if (this.isSystemAdministrator(tokenInfo.roleCode)) {
          next();
          return;
        }

        const hasGrantTypeOverModule = await this.roleService.hasGrantTypeOverModule(tokenInfo.roleCode, moduleCode, grantType);

        if (!hasGrantTypeOverModule) {
          throw new ForbiddenError(APICode.InvalidGrants);
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Gets the access token payload from the current request.
   *
   * Resolution strategy:
   * - If the request already contains an authenticated payload, reuse it.
   * - Otherwise, extract the bearer token from the Authorization header.
   * - Verify the token using the configured JWT access secret.
   * - Transform the verified JWT payload into the application access token payload.
   *
   * Error handling:
   * - Existing UnauthorizedError instances are propagated.
   * - Expired tokens are normalized as invalid access token errors.
   * - Any other token extraction or verification error is also normalized as an
   *   invalid access token error.
   */
  private getAccessTokenPayload(req: express.Request): ReturnType<typeof toAccessTokenPayload> {
    const authenticatedRequest = req as AuthenticatedRequest;

    if (authenticatedRequest.auth) return authenticatedRequest.auth;

    try {
      const accessToken = getBearerTokenFromAuthHeader(req.headers['authorization']);
      return toAccessTokenPayload(verify(accessToken, process.env.JWT_ACCESS_SECRET_KEY as string));
    } catch (error) {
      if (error instanceof UnauthorizedError) throw error;
      if (error instanceof TokenExpiredError) throw new UnauthorizedError(APICode.SessionExpired);
      throw new UnauthorizedError(APICode.InvalidAccessToken);
    }
  }

  /**
   * Checks whether a role code belongs to the System Administrator role.
   */
  private isSystemAdministrator(roleCode: RoleCode): boolean {
    return roleCode === RoleCode.SystemAdministrator;
  }
}
