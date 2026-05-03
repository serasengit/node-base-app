import { UserDTO } from '@features/users/dtos/user-dto';
import { JSONSchema, Model, RelationMappings } from 'objection';

export default class UserSchema extends Model {
  id!: number;
  nif!: string;
  name!: string;
  email!: string;
  createdById!: number;
  updatedById!: number;
  createdAt!: Date;
  updatedAt!: Date;
  // Relations
  createdBy?: UserSchema;
  updatedBy?: UserSchema;

  $beforeUpdate(): void {
    this.updatedAt = new Date();
  }

  static readonly tableName = 'users';

  static readonly jsonSchema: JSONSchema = {
    type: 'object',
    required: ['nif', 'name', 'email'],
    properties: {
      id: { type: 'integer' },

      nif: {
        type: 'string',
        minLength: 9,
        maxLength: 9
      },

      name: {
        type: 'string',
        minLength: 1,
        maxLength: 100
      },

      email: {
        type: 'string',
        format: 'email',
        maxLength: 255
      },

      createdAt: {
        type: 'string',
        format: 'date-time'
      },

      updatedAt: {
        type: 'string',
        format: 'date-time'
      },

      createdById: {
        type: 'integer'
      },

      updatedById: {
        type: 'integer'
      }
    }
  };

  static get relationMappings(): RelationMappings {
    return {
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

  static toDTO(userSchema: UserSchema): UserDTO {
    const user: UserDTO = {
      id: userSchema.id,
      name: userSchema.name,
      displayName: userSchema.displayName,
      nif: userSchema.nif,
      email: userSchema.email
    };
    if (userSchema.createdBy) user.createdBy = UserSchema.toDTO(userSchema.createdBy);
    if (userSchema.updatedBy) user.updatedBy = UserSchema.toDTO(userSchema.updatedBy);
    return user;
  }
}
