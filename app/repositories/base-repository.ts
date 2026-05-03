import { Transaction } from 'objection';

export enum DBAction {
  Read = 'read',
  Create = 'create',
  Update = 'update',
  Delete = 'delete',
  Download = 'download'
}

export interface QueryFilters {
  [key: string]: any;
}

export interface QueryRelations {
  [key: string]: boolean | string[] | undefined;
}

export interface QueryPagination {
  limit?: number;
  offset?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
}

export const DEFAULT_PAGINATION_LIMIT = 50;

export interface QueryResponse<T> {
  total: number;
  records: T[];
}

export interface QueryParams {
  filters?: QueryFilters;
  pagination?: QueryPagination;
  relations?: QueryRelations;
  trx?: Transaction;
}

export interface ReadOnlyRepository<T, TId = number> {
  exists(t: T, trx?: Transaction): Promise<Record<keyof T, boolean>>;
  find(params: QueryParams): Promise<QueryResponse<T>>;
  findById(id: TId, params?: QueryParams): Promise<T | undefined>;
}

export interface WritableRepository<T, TId = number> extends ReadOnlyRepository<T, TId> {
  update?(trx: Transaction, t: T, withCascade?: boolean): Promise<any>;
  delete(trx: Transaction, t: T): Promise<any>;
  save(trx: Transaction, t: T, withCascade?: boolean): Promise<any>;
  upsert?(trx: Transaction, t: T, withCascade?: boolean): Promise<any>;
}
