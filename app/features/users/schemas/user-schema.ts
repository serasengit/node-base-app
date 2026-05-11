import { Language } from '@api-messages/api-messages';
import RoleSchema from '@features/roles/schemas/role-schema';
import { JSONSchema, Model, RelationMappings } from 'objection';
import { UserDTO } from '../dtos/user-dto';

export default class UserSchema extends Model {
  id!: number;
  username!: string;
  password!: string;
  nif!: string;
  name?: string;
  email?: string;
  language?: Language;
  roleId?: number;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
  createdById?: number;
  updatedById?: number;
  // Relations
  role?: RoleSchema;
  createdBy?: UserSchema;
  updatedBy?: UserSchema;

  $beforeUpdate(): void {
    this.updatedAt = new Date();
  }

  static readonly tableName = 'users';

  static readonly jsonSchema: JSONSchema = {
    type: 'object',
    required: ['language', 'roleId', 'isActive'],
    properties: {
      id: { type: 'integer' },
      username: { type: ['string', 'null'], minLength: 3, maxLength: 100 },
      password: { type: ['string', 'null'], minLength: 8, maxLength: 100 },
      nif: { type: ['string', 'null'], minLength: 9, maxLength: 9 },
      name: { type: ['string', 'null'], maxLength: 100 },
      email: { type: ['string', 'null'], format: 'email', maxLength: 255 },
      language: { type: 'string', maxLength: 5 },
      roleId: { type: 'integer' },
      isActive: { type: 'boolean' },
      createdById: { type: ['integer', 'null'] },
      updatedById: { type: ['integer', 'null'] },
      createdAt: { type: ['string', 'null'], format: 'date-time' },
      updatedAt: { type: ['string', 'null'], format: 'date-time' }
    }
  };

  static get relationMappings(): RelationMappings {
    return {
      role: {
        relation: Model.BelongsToOneRelation,
        modelClass: RoleSchema,
        join: {
          from: 'users.roleId',
          to: 'roles.id'
        }
      },
      createdBy: {
        relation: Model.BelongsToOneRelation,
        modelClass: UserSchema,
        join: {
          from: 'users.createdById',
          to: 'users.id'
        }
      },
      updatedBy: {
        relation: Model.BelongsToOneRelation,
        modelClass: UserSchema,
        join: {
          from: 'users.updatedById',
          to: 'users.id'
        }
      }
    };
  }

  static get virtualAttributes(): string[] {
    return ['displayName'];
  }

  get displayName(): string | undefined {
    if (!this.nif && !this.name) return undefined;
    if (!this.name) return this.nif;
    if (!this.nif) return this.name;
    return this.nif + ' - ' + this.name;
  }

  static toDTO(userSchema: UserSchema, options: { includePassword?: boolean } = {}): UserDTO {
    const user: UserDTO = {
      id: userSchema.id,
      name: userSchema.name,
      username: userSchema.username,
      displayName: userSchema.displayName,
      nif: userSchema.nif,
      email: userSchema.email,
      language: userSchema.language,
      roleId: userSchema.roleId,
      isActive: userSchema.isActive,
      createdById: userSchema.createdById,
      updatedById: userSchema.updatedById,
      createdAt: userSchema.createdAt,
      updatedAt: userSchema.updatedAt
    };
    if (options.includePassword) {
      user.password = userSchema.password;
    }
    if (userSchema.role) {
      user.role = RoleSchema.toDTO(userSchema.role);
    }
    if (userSchema.createdBy) {
      user.createdBy = UserSchema.toDTO(userSchema.createdBy);
    }
    if (userSchema.updatedBy) {
      user.updatedBy = UserSchema.toDTO(userSchema.updatedBy);
    }

    return user;
  }
}
