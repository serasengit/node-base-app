import { GrantDTO } from '@features/grants/dtos/grant-dto';
import { RoleCode } from '../schemas/role-schema';

export class RoleDTO {
  id: number;
  code: RoleCode;
  description: string;
  // Relations
  grants?: GrantDTO[];
}
