import { QueryParams, WritableRepository } from '@core/repositories/base-repository';
import UserSchema from '../schemas/user-schema';

export interface UserRepository extends WritableRepository<UserSchema> {
  findByUsername(username: string, params?: QueryParams): Promise<UserSchema>;
}
