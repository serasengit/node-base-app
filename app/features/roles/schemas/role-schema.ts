import { Language } from '@api-messages/api-messages';
import GrantSchema from '@features/grants/schemas/grant-schema';
import TranslationSchema from '@features/translations/schemas/translation-schema';
import UserSchema from '@features/users/schemas/user-schema';
import { JSONSchema, Model, RelationMappings } from 'objection';
import { RoleDTO } from '../dtos/role-dto';

export enum RoleCode {
  SystemAdministrator = 'system_administrator',
  ReadOnly = 'read_only'
}

export default class RoleSchema extends Model {
  id!: number;
  code!: RoleCode;
  createdAt!: Date;
  updatedAt!: Date;
  // Relations
  users?: UserSchema[];
  grants?: GrantSchema[];
  codeTranslation?: TranslationSchema;

  $beforeUpdate(): void {
    this.updatedAt = new Date();
  }

  static readonly tableName = 'roles';

  static get jsonAttributes(): string[] {
    // Do not map to string arrays
    return [];
  }

  static readonly jsonSchema: JSONSchema = {
    type: 'object',
    required: ['code'],
    properties: {
      id: { type: 'integer' },
      code: { type: 'string', minLength: 1, maxLength: 100 },
      createdAt: { type: ['string', 'null'], format: 'date-time' },
      updatedAt: { type: ['string', 'null'], format: 'date-time' }
    }
  };

  static get relationMappings(): RelationMappings {
    return {
      users: {
        relation: Model.HasManyRelation,
        modelClass: UserSchema,
        join: {
          from: 'roles.id',
          to: 'users.roleId'
        }
      },
      grants: {
        relation: Model.ManyToManyRelation,
        modelClass: GrantSchema,
        join: {
          from: 'roles.id',
          through: {
            from: 'role_grants.roleId',
            to: 'role_grants.grantId'
          },
          to: 'grants.id'
        }
      },
      codeTranslation: {
        relation: Model.HasOneRelation,
        modelClass: TranslationSchema,
        join: {
          from: 'roles.code',
          to: 'translations.code'
        },
        modify: (qb): void => {
          const language = qb.context()?.language || Language.Spanish;
          qb.where('language', language);
        }
      }
    };
  }

  static toDTO(roleSchema: RoleSchema): RoleDTO {
    const role: RoleDTO = {
      id: roleSchema.id,
      code: roleSchema.code,
      description: roleSchema.codeTranslation?.text
    };
    if (roleSchema.grants) {
      role.grants = roleSchema.grants.map((grant) => GrantSchema.toDTO(grant));
    }
    return role;
  }
}
