import { NotImplementedMethodError } from '@api-messages/errors/non-implemented-method-error';

import { GrantType } from '@features/grants/schemas/grant-schema';
import { Service } from 'typedi';
import RoleSchema, { RoleCode } from '../schemas/role-schema';
import { RoleRepository } from './role-repository';

@Service('roleRepository')
export class RoleRepositoryImpl implements RoleRepository {
  /* istanbul ignore next */
  public async exists(roleSchema: RoleSchema): Promise<Record<string, boolean>> {
    throw new NotImplementedMethodError();
  }

  public async findById(id: number): Promise<RoleSchema> {
    return await RoleSchema.query().findById(id);
  }

  public async findByCode(code: RoleCode): Promise<RoleSchema> {
    return await RoleSchema.query().findOne({ code });
  }

  public async hasGrantTypeOverModule(roleId: number, moduleId: number, grantType: GrantType): Promise<boolean> {
    const existsGrant =
      (await RoleSchema.relatedQuery('grants')
        .for(roleId)
        .where('moduleId', moduleId)
        .modify((builder) => {
          switch (grantType) {
            case GrantType.CanRead:
              builder.where('canRead', true);
              break;
            case GrantType.CanCreate:
              builder.where('canCreate', true);
              break;
            case GrantType.CanEdit:
              builder.where('canEdit', true);
              break;
            case GrantType.CanDelete:
              builder.where('canDelete', true);
              break;
          }
        })
        .resultSize()) > 0;

    return existsGrant;
  }
}
