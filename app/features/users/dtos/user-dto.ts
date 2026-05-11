import { Language } from '@api-messages/api-messages';
import { RoleDTO } from '@features/roles/dtos/role-dto';
import UserSchema from '../schemas/user-schema';

export class UserDTO {
  id?: number;
  nif!: string;
  username?: string;
  password?: string;
  name?: string;
  displayName?: string;
  email?: string;
  language?: Language;
  roleId?: number;
  isActive!: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createdById?: number;
  updatedById?: number;
  // Relations
  role?: RoleDTO;
  createdBy?: UserDTO;
  updatedBy?: UserDTO;

  /**
   * Maps a UserDTO into its persistence schema representation.
   */
  static toSchema(user: UserDTO): UserSchema {
    const userSchema = new UserSchema();
    userSchema.id = user.id;
    userSchema.username = user.username;
    userSchema.password = user.password;
    userSchema.name = user.name;
    userSchema.nif = user.nif?.toUpperCase();
    userSchema.email = user.email;
    userSchema.language = user.language;
    userSchema.roleId = user.role?.id ?? user.roleId;
    userSchema.isActive = user.isActive;
    userSchema.createdById = user.createdById;
    userSchema.updatedById = user.updatedById;
    return userSchema;
  }
}
