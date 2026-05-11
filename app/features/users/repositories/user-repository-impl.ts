import { Language } from '@api-messages/api-messages';
import {
  DEFAULT_PAGINATION_LIMIT,
  QueryFilters,
  QueryPagination,
  QueryParams,
  QueryRelations,
  QueryResponse
} from '@core/repositories/base-repository';
import Objection, { QueryBuilder, Transaction } from 'objection';
import { Service } from 'typedi';
import UserSchema from '../schemas/user-schema';
import { UserRepository } from './user-repository';

@Service('userRepository')
export class UserRepositoryImpl implements UserRepository {
  /**
   * Checks whether a user already exists by ID or by its unique fields.
   *
   * Returns a map with the duplicated fields found in the database.
   */
  public async exists(userSchema: UserSchema, trx?: Transaction): Promise<Record<string, boolean>> {
    const query = UserSchema.query(trx);

    if (userSchema?.id) {
      query.orWhere('id', userSchema.id);
    }

    if (userSchema?.email) {
      query.orWhere('email', userSchema.email);
    }

    if (userSchema?.username) {
      query.orWhere('username', userSchema.username);
    }

    const existingUsers = await query.select('id', 'email', 'username');
    const result: Record<string, boolean> = {};

    if (existingUsers.length > 0) {
      for (const existingUser of existingUsers) {
        if (userSchema.id === existingUser.id) {
          result.id = true;
        }

        if (userSchema.email === existingUser.email && userSchema.id !== existingUser.id) {
          result.email = true;
        }

        if (userSchema.username === existingUser.username && userSchema.id !== existingUser.id) {
          result.username = true;
        }
      }
    }

    return result;
  }

  /**
   * Finds a user by its primary key.
   *
   * Optional relations can be loaded using query params.
   */
  public async findById(id: number, params: QueryParams = {}): Promise<UserSchema> {
    const qb = UserSchema.query(params.trx);

    if (params.relations) this.applyRelations(qb, params.relations);

    return await qb.findById(id);
  }

  /**
   * Finds a user by its unique username.
   *
   * Optional relations can be loaded using query params.
   */
  public async findByUsername(username: string, params?: QueryParams): Promise<UserSchema> {
    const qb = UserSchema.query(params?.trx);

    if (params?.relations) {
      this.applyRelations(qb, params.relations);
    }

    return await qb.where('username', username).first();
  }

  /**
   * Creates a new user.
   *
   * When cascade mode is enabled, related graph data is inserted as well.
   */
  public async save(trx: Transaction, userSchema: UserSchema, withCascade = false): Promise<UserSchema> {
    const query = UserSchema.query(trx);

    return withCascade ? await query.insertGraphAndFetch(userSchema) : await query.insert(userSchema);
  }

  /**
   * Updates an existing user.
   *
   * When cascade mode is enabled, related graph data is upserted as well.
   */
  public async update(trx: Transaction, userSchema: UserSchema, withCascade = false): Promise<UserSchema> {
    const query = UserSchema.query(trx);

    return withCascade ? await query.upsertGraphAndFetch(userSchema) : await query.patchAndFetchById(userSchema.id, userSchema);
  }

  /**
   * Creates or updates a user depending on whether it has an ID.
   */
  public async upsert(trx: Transaction, userSchema: UserSchema, withCascade = false): Promise<UserSchema> {
    return userSchema.id ? await this.update(trx, userSchema, withCascade) : await this.save(trx, userSchema, withCascade);
  }

  /**
   * Deletes a user and returns the deleted record when available.
   */
  public async delete(trx: Transaction, userSchema: UserSchema): Promise<UserSchema> {
    return await UserSchema.query(trx).deleteById(userSchema.id).returning('*').first();
  }

  /**
   * Finds users using filters, pagination, ordering, and optional relations.
   */
  public async find(params: QueryParams): Promise<QueryResponse<UserSchema>> {
    const { filters = {}, pagination = {}, relations = {} } = params;

    // Build the base query.
    // The role relation can be loaded later when explicitly requested.
    const qb = UserSchema.query().distinct('users.id').select('users.*');

    this.applyRelations(qb, relations);
    this.applyFilters(qb, filters);
    this.applyOrder(qb, pagination);

    const limit = pagination.limit ?? DEFAULT_PAGINATION_LIMIT;
    const offset = pagination.offset ?? 0;
    const page = Math.floor(offset / limit);
    const result = await qb.page(page, limit);

    return {
      total: result.total,
      records: result.results
    };
  }

  /**
   * Applies optional graph fetching for supported relations.
   *
   * Relations are loaded only when explicitly included in the query params.
   */
  private applyRelations(qb: QueryBuilder<UserSchema>, relations: QueryRelations): void {
    if (!Array.isArray(relations.include)) return;

    if (relations.include.includes('role')) {
      qb.withGraphFetched('role');
    }
    if (relations.include.includes('roleGrants')) {
      qb.withGraphFetched('[role.grants]');
    }
    if (relations.include.includes('roleGrantsModule')) {
      qb.withGraphFetched('[role.grants.module]');
    }
    if (relations.include.includes('createdBy')) {
      qb.withGraphFetched('createdBy');
    }
    if (relations.include.includes('updatedBy')) {
      qb.withGraphFetched('updatedBy');
    }
  }

  /**
   * Applies text search filters over user fields and related user fields.
   */
  private applyFilters(qb: Objection.QueryBuilder<UserSchema>, filters: QueryFilters): void {
    const textSearch = filters.textSearch?.trim();

    if (!textSearch) return;

    const search = `%${textSearch}%`;
    const language = filters.language ?? Language.Spanish;

    qb.where((builder: QueryBuilder<UserSchema>) => {
      builder
        // Search by user name.
        .where('users.name', 'ilike', search)

        // Search by user NIF.
        .orWhere('users.nif', 'ilike', search)

        // Search by user email.
        .orWhere('users.email', 'ilike', search)

        // Search by role translation text.
        .orWhereExists(
          UserSchema.relatedQuery('role')
            .joinRelated('codeTranslation')
            .where('codeTranslation.text', 'ilike', search)
            .where('codeTranslation.language', language)
        );
    });
  }

  /**
   * Applies dynamic ordering using pagination parameters.
   */
  private applyOrder(qb: QueryBuilder<UserSchema>, pagination: QueryPagination): void {
    qb.orderBy(`users.${pagination.orderBy ?? 'createdAt'}`, pagination.order ?? 'asc');
  }
}
