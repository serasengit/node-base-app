import { APICode } from '@api-messages/api-messages';
import { ConflictError } from '@api-messages/errors/conflict-error';
import { ForbiddenError } from '@api-messages/errors/forbidden-error';
import { NotFoundError } from '@api-messages/errors/not-found-error';
import { QueryParams, QueryResponse } from '@core/repositories/base-repository';
import RoleService from '@features/roles/services/role-service';
import logger from '@logger/logger';
import { hash } from 'bcrypt';
import { transaction } from 'objection';
import { Inject, Service } from 'typedi';
import { UserDTO } from '../dtos/user-dto';
import { UserRepository } from '../repositories/user-repository';
import UserSchema from '../schemas/user-schema';

@Service()
class UserService {
  @Inject(() => RoleService)
  private readonly roleService!: RoleService;
  @Inject('userRepository') private readonly userRepository: UserRepository;

  /**
   * @summary Retrieves users based on provided query parameters.
   */
  public async find(params: QueryParams): Promise<QueryResponse<UserDTO>> {
    // Retrieve user records from the repository
    const { total, records }: QueryResponse<UserSchema> = await this.userRepository.find(params);

    // Convert the user records to DTOs and return the response
    return { total, records: records.map(UserSchema.toDTO) };
  }

  /**
   * @summary Retrieves a user by its ID.
   */
  public async findById(id: number, params: QueryParams = {}): Promise<UserDTO> {
    const userSchema = await this.userRepository.findById(id, params);
    if (!userSchema) throw new NotFoundError(APICode.UserNotFound);
    return UserSchema.toDTO(userSchema);
  }

  /**
   * @summary Retrieves a user by its username.
   */
  public async findByUsername(username: string, params?: QueryParams): Promise<UserDTO> {
    const userSchema = await this.userRepository.findByUsername(username, params);
    if (!userSchema) throw new NotFoundError(APICode.UserNotFound);
    return UserSchema.toDTO(userSchema);
  }

  /**
   * @summary Creates a new user.
   */
  public async create(user: UserDTO, authenticatedUserId: number): Promise<UserDTO> {
    const trx = await transaction.start(UserSchema.knex());

    try {
      // Convert the user DTO to a user schema
      const userSchema = UserDTO.toSchema(user);
      userSchema.createdById = authenticatedUserId;
      userSchema.updatedById = authenticatedUserId;

      // Check role exists
      if (userSchema.roleId) await this.roleService.findById(userSchema.roleId, { trx });

      // Hash the password before saving the user
      if (userSchema.password) {
        userSchema.password = await hash(userSchema.password, 10);
      }

      // Ensure user does not already exist
      const exists = await this.userRepository.exists(userSchema, trx);
      if (!!exists['username'] || !!exists['email']) {
        throw new ConflictError(APICode.UserAlreadyExists, { details: this.userIdentity(user) });
      }

      // Create user
      const createdUserSchema = await this.userRepository.save(trx, userSchema);

      // Commit
      await trx.commit();

      // Return created user
      return UserSchema.toDTO(createdUserSchema);
    } catch (error) {
      logger.error(
        `Error in UserService.create: ${error.code}, message: ${error.message}, details: ${error.details}, stack: ${error.stack}`
      );
      await trx.rollback();
      throw error;
    }
  }

  /**
   * @summary Updates an existing user.
   */
  public async update(user: UserDTO, authenticatedUserId: number): Promise<UserDTO> {
    const trx = await transaction.start(UserSchema.knex());

    try {
      // Convert the user DTO to a user schema
      const userSchema = UserDTO.toSchema(user);
      userSchema.updatedById = authenticatedUserId;

      // Ensure user exists
      const existingUserSchema = await this.userRepository.findById(userSchema.id, { trx });
      if (!existingUserSchema) throw new NotFoundError(APICode.UserNotFound);

      // Check role exists when a role is provided
      if (userSchema.roleId !== undefined && userSchema.roleId !== null) {
        await this.roleService.findById(userSchema.roleId, { trx });
      }

      // Ensure user does not modify their own role
      if (userSchema.id === authenticatedUserId && userSchema.roleId !== undefined && userSchema.roleId !== existingUserSchema.roleId) {
        throw new ForbiddenError(APICode.InvalidGrants);
      }

      // Hash the password before updating the user when it is provided
      if (userSchema.password) {
        userSchema.password = await hash(userSchema.password, 10);
      }

      // Ensure unique user fields do not already exist for another record
      const exists = await this.userRepository.exists(userSchema, trx);
      if (this.hasUniqueConflict(exists)) {
        throw new ConflictError(APICode.UserAlreadyExists, { details: this.userIdentity(user) });
      }

      // Update user
      const updatedUserSchema = await this.userRepository.update(trx, userSchema);

      // Commit
      await trx.commit();

      // Return updated user
      return UserSchema.toDTO(updatedUserSchema);
    } catch (error) {
      logger.error(
        `Error in UserService.update: ${error.code}, message: ${error.message}, details: ${error.details}, stack: ${error.stack}`
      );
      await trx.rollback();
      throw error;
    }
  }
  /**
   * @summary Deletes a user by its ID.
   */
  public async delete(id: number, authenticatedUserId: number): Promise<void> {
    const trx = await transaction.start(UserSchema.knex());

    try {
      // Ensure user exists
      const userSchema = await this.userRepository.findById(id, { trx });
      if (!userSchema) throw new NotFoundError(APICode.UserNotFound);

      // Ensure user does not delete itself
      if (userSchema.id === authenticatedUserId) {
        throw new ForbiddenError(APICode.InvalidGrants);
      }
      // Delete user
      await this.userRepository.delete(trx, userSchema);

      // Commit
      await trx.commit();
    } catch (error) {
      logger.error(
        `Error in UserService.delete: ${error.code}, message: ${error.message}, details: ${error.details}, stack: ${error.stack}`
      );
      await trx.rollback();
      throw error;
    }
  }

  /**
   * @summary Checks whether any unique user field already exists for another record.
   */
  private hasUniqueConflict(exists: Record<string, boolean>): boolean {
    return Object.entries(exists).some(([field, existsField]) => field !== 'id' && existsField);
  }

  /**
   * @summary Builds a readable user identity for conflict details.
   */
  private userIdentity(user: UserDTO): string {
    return [user.username, user.email, user.nif].filter(Boolean).join(', ');
  }
}

export default UserService;
