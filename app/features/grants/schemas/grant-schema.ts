import ModuleSchema from '@features/modules/schemas/module-schema';
import RoleSchema from '@features/roles/schemas/role-schema';
import { JSONSchema, Model, RelationMappings } from 'objection';
import { GrantDTO } from '../dtos/grant-dto';

export enum GrantType {
  CanRead,
  CanEdit,
  CanCreate,
  CanDelete
}

export default class GrantSchema extends Model {
  id!: number;
  moduleId!: number;
  description!: string;
  canRead!: boolean;
  canCreate!: boolean;
  canEdit!: boolean;
  canDelete!: boolean;

  createdAt!: Date;
  updatedAt!: Date;
  // Relations
  roles?: RoleSchema[];
  module?: ModuleSchema;

  $beforeUpdate(): void {
    this.updatedAt = new Date();
  }

  // Table name is the only required property.
  static readonly tableName = 'grants';

  // Optional JSON schema. This is not the database schema! Nothing is generated
  // based on this. This is only used for validation. Whenever a model instance
  // is created it is checked against this schema. http://json-schema.org/.
  static readonly jsonSchema: JSONSchema = {
    type: 'object',
    required: ['moduleId', 'canRead', 'canCreate', 'canEdit', 'canDelete'],
    properties: {
      id: { type: 'integer' },
      moduleId: { type: 'integer', minimum: 1 },
      description: { type: 'string', minLength: 1, maxLength: 255 },
      canRead: { type: ['boolean', 'null'], default: false },
      canCreate: { type: ['boolean', 'null'], default: false },
      canEdit: { type: ['boolean', 'null'], default: false },
      canDelete: { type: ['boolean', 'null'], default: false },
      createdAt: { type: ['string', 'null'], format: 'date-time' },
      updatedAt: { type: ['string', 'null'], format: 'date-time' }
    }
  };

  // This object defines the relations to other models. The relationMappings
  // property can be a thunk to prevent circular dependencies.
  static get relationMappings(): RelationMappings {
    return {
      roles: {
        relation: Model.ManyToManyRelation,
        // The related model.
        modelClass: RoleSchema,
        join: {
          from: 'grants.id',
          through: {
            from: 'role_grants.grantId',
            to: 'role_grants.roleId'
          },
          to: 'roles.id'
        }
      },
      module: {
        relation: Model.BelongsToOneRelation,
        // The related model.
        modelClass: ModuleSchema,
        join: {
          from: 'grants.moduleId',
          to: 'modules.id'
        }
      }
    };
  }

  static toDTO(grantSchema: GrantSchema): GrantDTO {
    const grant: GrantDTO = {
      id: grantSchema.id,
      description: grantSchema.description,
      canRead: grantSchema.canRead,
      canCreate: grantSchema.canCreate,
      canEdit: grantSchema.canEdit,
      canDelete: grantSchema.canDelete
    };
    if (grantSchema.module) grant.module = ModuleSchema.toDTO(grantSchema.module);

    return grant;
  }
}
