import { AccessTokenPayload } from '@features/auth/dtos/auth-dto';
import { UserDTO } from '@features/users/dtos/user-dto';
import { Request } from 'express';

export type AuthenticatedRequest = Request & {
  auth?: AccessTokenPayload;
  user?: UserDTO;
  serialNumber?: string;
  requestId?: string;
};
