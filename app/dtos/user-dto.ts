import UserSchema from '@schemas/user-schema';

export class UserDTO {
  id: number;
  nif: string;
  name: string;
  displayName?: string;
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
  // Relations
  createdBy?: UserDTO;
  updatedBy?: UserDTO;

  static toSchema(user: UserDTO): UserSchema {
    const userSchema = new UserSchema();

    userSchema.id = user.id;
    userSchema.nif = user.nif;
    userSchema.name = user.name;
    userSchema.email = user.email;
    userSchema.createdAt = user.createdAt;
    userSchema.updatedAt = user.updatedAt;

    return userSchema;
  }
}
