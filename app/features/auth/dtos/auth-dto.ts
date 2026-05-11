import { APICode, Language } from '@api-messages/api-messages';
import { UnauthorizedError } from '@api-messages/errors/unauthorized-error';
import { RoleCode } from '@features/roles/schemas/role-schema';
import { JwtPayload } from 'jsonwebtoken';

export interface AccessTokenPayload extends JwtPayload {
  userId: number;
  roleCode: RoleCode;
  language: Language;
}

export interface RefreshTokenPayload extends JwtPayload {
  userId: number;
  type: 'refresh';
}

export interface AuthenticatedUserDTO {
  id: number;
  username?: string;
  name?: string;
  language?: Language;
  role?: {
    id: number;
    code: RoleCode;
    description?: string;
  };
}

export class AuthRequestDTO {
  username!: string;
  password!: string;
}

export class AuthResponseDTO {
  accessToken!: string;
  isAuthenticated!: boolean;
  user!: AuthenticatedUserDTO;
  permissions!: string[];
}

export class RefreshTokenResponseDTO {
  accessToken!: string;
}

/**
 * Retrieves the serialized bearer token from the Authorization header.
 */
export function getBearerTokenFromAuthHeader(authHeader?: string | string[]): string {
  const serializedHeader = Array.isArray(authHeader) ? authHeader[0] : authHeader;

  if (!serializedHeader) throw new UnauthorizedError(APICode.RequiredToken);

  const [scheme, token] = serializedHeader.split(' ');

  if (scheme !== 'Bearer' || !token) throw new UnauthorizedError(APICode.RequiredToken);

  return token;
}

/**
 * Validates that the decoded JWT payload contains the claims required by the access token.
 */
export function toAccessTokenPayload(jwtPayload: string | JwtPayload): AccessTokenPayload {
  if (typeof jwtPayload === 'string') throw new UnauthorizedError(APICode.InvalidAccessToken);
  if (typeof jwtPayload.userId !== 'number') throw new UnauthorizedError(APICode.InvalidAccessToken);
  if (typeof jwtPayload.roleCode !== 'string') throw new UnauthorizedError(APICode.InvalidAccessToken);
  if (typeof jwtPayload.language !== 'string') throw new UnauthorizedError(APICode.InvalidAccessToken);

  return {
    ...jwtPayload,
    userId: jwtPayload.userId,
    roleCode: jwtPayload.roleCode as RoleCode,
    language: jwtPayload.language as Language
  };
}

/**
 * Validates that the decoded JWT payload contains the claims required by the refresh token.
 */
export function toRefreshTokenPayload(jwtPayload: string | JwtPayload): RefreshTokenPayload {
  if (typeof jwtPayload === 'string') throw new UnauthorizedError(APICode.InvalidRefreshToken);
  if (typeof jwtPayload.userId !== 'number') throw new UnauthorizedError(APICode.InvalidRefreshToken);
  if (jwtPayload.type !== 'refresh') throw new UnauthorizedError(APICode.InvalidRefreshToken);

  return {
    ...jwtPayload,
    userId: jwtPayload.userId,
    type: 'refresh'
  };
}
