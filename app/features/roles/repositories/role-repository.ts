import { QueryParams } from '@core/repositories/base-repository';
import { GrantType } from '@features/grants/schemas/grant-schema';
import RoleSchema, { RoleCode } from '../schemas/role-schema';

export interface RoleRepository {
  findById(id: number, params: QueryParams): Promise<RoleSchema>;
  findByCode(code: RoleCode): Promise<RoleSchema>;
  hasGrantTypeOverModule(id: number, moduleId: number, grantType: GrantType): Promise<boolean>;
}
