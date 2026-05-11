import { APICode, Language } from '@api-messages/api-messages';
import { ForbiddenError } from '@api-messages/errors/forbidden-error';
import { UnauthorizedError } from '@api-messages/errors/unauthorized-error';
import { appConfig } from '@bootstrap/config';
import { QueryParams, QueryRelations } from '@core/repositories/base-repository';
import {
  AccessTokenPayload,
  AuthenticatedUserDTO,
  AuthRequestDTO,
  AuthResponseDTO,
  RefreshTokenPayload,
  RefreshTokenResponseDTO,
  toRefreshTokenPayload
} from '@features/auth/dtos/auth-dto';
import { GrantDTO } from '@features/grants/dtos/grant-dto';
import { UserDTO } from '@features/users/dtos/user-dto';
import UserService from '@features/users/services/user-service';
import logger from '@logger/logger';
import { compare } from 'bcrypt';
import express from 'express';
import { sign, SignOptions, TokenExpiredError, verify } from 'jsonwebtoken';
import { Inject, Service } from 'typedi';

@Service()
class AuthService {
  @Inject(() => UserService) private readonly userService!: UserService;

  /**
   * Authenticates a user with username and password credentials.
   */
  public async auth(auth: AuthRequestDTO, res: express.Response): Promise<AuthResponseDTO> {
    try {
      const user = await this.userService.findByUsername(auth.username, <QueryParams>{
        relations: <QueryRelations>{ include: ['roleGrantsModule'] }
      });

      if (!user.isActive) throw new ForbiddenError(APICode.InactiveUser);
      if (!(await compare(auth.password, user.password))) throw new ForbiddenError(APICode.InvalidPassword);

      logger.info(`${auth.username} logged in successfully`);

      const accessToken = this.generateAccessToken(this.buildAccessTokenPayload(user));
      const refreshToken = this.generateRefreshToken({ userId: user.id, type: 'refresh' });

      this.setRefreshTokenCookie(res, refreshToken);

      return {
        accessToken,
        isAuthenticated: true,
        user: this.buildAuthenticatedUser(user),
        permissions: this.buildPermissions(user.role?.grants ?? [])
      };
    } catch (error) {
      logger.error(`Error in AuthService.auth: ${error.code}, message: ${error.message}, details: ${error.details}, stack: ${error.stack}`);
      throw error;
    }
  }

  /**
   * Refreshes the access token using the refresh token stored in cookies.
   */
  public async refreshToken(req: express.Request, res: express.Response): Promise<RefreshTokenResponseDTO> {
    try {
      const serializedRefreshToken = req.cookies?.refreshToken as string;

      if (!serializedRefreshToken) throw new UnauthorizedError(APICode.SessionExpired);

      const payload = toRefreshTokenPayload(verify(serializedRefreshToken, appConfig.auth.refreshSecretKey));
      const user = await this.userService.findById(payload.userId, <QueryParams>{
        relations: <QueryRelations>{ include: ['role'] }
      });

      if (!user.isActive) throw new ForbiddenError(APICode.InactiveUser);

      const accessToken = this.generateAccessToken(this.buildAccessTokenPayload(user));
      const refreshToken = this.generateRefreshToken({ userId: user.id, type: 'refresh' });

      this.setRefreshTokenCookie(res, refreshToken);

      return { accessToken };
    } catch (error) {
      logger.error(
        `Error in AuthService.refreshToken: ${error.code}, message: ${error.message}, details: ${error.details}, stack: ${error.stack}`
      );
      if (error instanceof TokenExpiredError) throw new UnauthorizedError(APICode.SessionExpired);
      throw error;
    }
  }

  /**
   * Builds the access token payload from the current user state.
   */
  private buildAccessTokenPayload(user: UserDTO): AccessTokenPayload {
    if (!user.id || !user.role?.code) throw new UnauthorizedError(APICode.InvalidAccessToken);

    return {
      userId: user.id,
      roleCode: user.role.code,
      language: user.language ?? Language.Spanish
    } as AccessTokenPayload;
  }

  /**
   * Maps the authenticated user into the response shape returned by the API.
   */
  private buildAuthenticatedUser(user: UserDTO): AuthenticatedUserDTO {
    if (!user.id) throw new UnauthorizedError(APICode.InvalidAccessToken);

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      language: user.language,
      role: user.role
        ? {
            id: user.role.id,
            code: user.role.code as AccessTokenPayload['roleCode'],
            description: user.role.description
          }
        : undefined
    };
  }

  /**
   * Builds a flattened permission list for UI guards and route checks.
   */
  private buildPermissions(grants: GrantDTO[]): string[] {
    const permissions = new Set<string>();

    for (const grant of grants) {
      const moduleCode = grant.module?.code;

      if (!moduleCode) continue;
      if (grant.canRead) permissions.add(`${moduleCode}:read`);
      if (grant.canCreate) permissions.add(`${moduleCode}:create`);
      if (grant.canEdit) permissions.add(`${moduleCode}:edit`);
      if (grant.canDelete) permissions.add(`${moduleCode}:delete`);
    }

    return [...permissions].sort();
  }

  /**
   * Generates an access token for the authenticated user.
   */
  private generateAccessToken(payload: AccessTokenPayload): string {
    return sign(payload, appConfig.auth.accessSecretKey, {
      expiresIn: appConfig.auth.accessExpirationTime
    } as SignOptions);
  }

  /**
   * Generates a refresh token for the authenticated user session.
   */
  private generateRefreshToken(payload: RefreshTokenPayload): string {
    return sign(payload, appConfig.auth.refreshSecretKey, {
      expiresIn: appConfig.auth.refreshExpirationTime
    } as SignOptions);
  }

  /**
   * Sets the refresh token as an HTTP-only cookie.
   *
   * The refresh token is stored in a cookie because the frontend does not need
   * to read it directly. The browser will automatically send it to the backend
   * when the refresh endpoint is called.
   */
  private setRefreshTokenCookie(res: express.Response, refreshToken: string): void {
    res.cookie('refreshToken', refreshToken, {
      // Prevents JavaScript from reading the cookie through document.cookie.
      // This reduces the risk of refresh token theft in case of XSS.
      httpOnly: true,

      // Ensures the cookie is only sent over HTTPS in production.
      secure: appConfig.isProduction,

      // Allows cross-site cookie usage in production when frontend and backend
      // are hosted on different domains. Uses a safer default for local development.
      sameSite: appConfig.isProduction ? 'none' : 'lax',

      // Defines how long the refresh token cookie remains valid in the browser.
      maxAge: appConfig.auth.refreshMaxInactiveTimeMs
    });
  }

  /**
   * Logs out the current user by clearing the refresh token cookie.
   */
  public logout(res: express.Response): void {
    this.clearRefreshTokenCookie(res);
  }

  /**
   * Clears the refresh token cookie from the browser.
   */
  private clearRefreshTokenCookie(res: express.Response): void {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: appConfig.isProduction,
      sameSite: appConfig.isProduction ? 'none' : 'lax'
    });
  }
}

export default AuthService;
