import { Transaction } from 'objection';

/**
 * Generic query filters.
 *
 * Each repository can define and interpret its own supported filter keys.
 */
export interface QueryFilters {
  [key: string]: any;
}

/**
 * Generic relation loading configuration.
 *
 * Common usage:
 * - include: ['city']
 */
export interface QueryRelations {
  [key: string]: boolean | string[];
}

/**
 * Generic pagination and sorting options.
 */
export interface QueryPagination {
  // Maximum number of records to return.
  limit?: number;

  // Number of records to skip.
  offset?: number;

  // Field used for sorting.
  orderBy?: string;

  // Sorting direction.
  order?: 'asc' | 'desc';
}

/**
 * Default pagination limit used when no limit is provided.
 */
export const DEFAULT_PAGINATION_LIMIT = 50;

/**
 * Generic paginated query response.
 */
export interface QueryResponse<T> {
  total: number;
  records: T[];
}

/**
 * Generic query parameters shared by repositories.
 */
export interface QueryParams {
  // Repository-specific filters.
  filters?: QueryFilters;

  // Pagination and sorting options.
  pagination?: QueryPagination;

  // Optional relation loading configuration.
  relations?: QueryRelations;

  // Optional transaction used to execute the query.
  trx?: Transaction;
}

/**
 * Base contract for read-only repositories.
 */
export interface ReadOnlyRepository<T, TId = number> {
  /**
   * Checks whether a record already exists.
   *
   * Returns a field-level map indicating which unique fields already exist.
   */
  exists(t: T, trx?: Transaction): Promise<Record<keyof T, boolean>>;

  /**
   * Finds records using filters, pagination, sorting, and optional relations.
   */
  find(params: QueryParams): Promise<QueryResponse<T>>;

  /**
   * Finds a single record by its identifier.
   */
  findById(id: TId, params?: QueryParams): Promise<T>;
}

/**
 * Base contract for writable repositories.
 */
export interface WritableRepository<T, TId = number> extends ReadOnlyRepository<T, TId> {
  /**
   * Updates an existing record.
   *
   * When cascade mode is enabled, related graph data can be updated as well.
   */
  update?(trx: Transaction, t: T, withCascade?: boolean): Promise<any>;

  /**
   * Deletes an existing record.
   */
  delete(trx: Transaction, t: T): Promise<any>;

  /**
   * Creates a new record.
   *
   * When cascade mode is enabled, related graph data can be inserted as well.
   */
  save(trx: Transaction, t: T, withCascade?: boolean): Promise<any>;

  /**
   * Creates or updates a record depending on whether it already exists.
   *
   * When cascade mode is enabled, related graph data can be inserted or updated as well.
   */
  upsert?(trx: Transaction, t: T, withCascade?: boolean): Promise<any>;
}
