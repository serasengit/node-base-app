import { APICode, Language } from '@api-messages/api-messages';
import { ForbiddenError } from '@api-messages/errors/forbidden-error';
import { UnauthorizedError } from '@api-messages/errors/unauthorized-error';
import { QueryParams, QueryRelations } from '@core/repositories/base-repository';
import {
  AccessTokenPayload,
  AuthRequestDTO,
  AuthResponseDTO,
  AuthenticatedUserDTO,
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
import jwt, { SignOptions, TokenExpiredError } from 'jsonwebtoken';
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
      const serializedRefreshToken = this.getCookieValue(req.headers.cookie, 'refreshToken');

      if (!serializedRefreshToken) throw new UnauthorizedError(APICode.SessionExpired);

      const payload = toRefreshTokenPayload(jwt.verify(serializedRefreshToken, process.env.JWT_REFRESH_SECRET_KEY as string));
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
    return jwt.sign(payload, process.env.JWT_ACCESS_SECRET_KEY as string, {
      expiresIn: process.env.JWT_ACCESS_EXPIRATION_TIME
    } as SignOptions);
  }

  /**
   * Generates a refresh token for the authenticated user session.
   */
  private generateRefreshToken(payload: RefreshTokenPayload): string {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET_KEY as string, {
      expiresIn: process.env.JWT_REFRESH_EXPIRATION_TIME
    } as SignOptions);
  }

  /**
   * Sets the refresh token cookie using environment-aware security defaults.
   */
  private setRefreshTokenCookie(res: express.Response, refreshToken: string): void {
    const rawEnv = (process.env.NODE_ENV || 'dev').trim().toLowerCase();
    const isProduction = rawEnv === 'prod' || rawEnv === 'production';

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: Number.parseInt(process.env.JWT_MAX_INACTIVE_TIME, 10)
    });
  }

  /**
   * Retrieves a cookie value from the raw Cookie header.
   */
  private getCookieValue(cookieHeader: string | string[] | undefined, cookieName: string): string | undefined {
    const serializedHeader = Array.isArray(cookieHeader) ? cookieHeader[0] : cookieHeader;

    if (!serializedHeader) return undefined;

    return serializedHeader
      .split(';')
      .map((entry) => entry.trim())
      .find((entry) => entry.startsWith(`${cookieName}=`))
      ?.slice(cookieName.length + 1);
  }
}

export default AuthService;
