import {
  DEFAULT_PAGINATION_LIMIT,
  QueryFilters,
  QueryPagination,
  QueryParams,
  QueryRelations,
  QueryResponse
} from '@core/repositories/base-repository';
import CitySchema from '@features/cities/schemas/city-schema';
import Objection, { QueryBuilder, Transaction } from 'objection';
import { Service } from 'typedi';
import { CityRepository } from './city-repository';

@Service('cityRepository')
export class CityRepositoryImpl implements CityRepository {
  /**
   * Checks whether a city already exists by ID or by its unique composite key.
   *
   * Returns a map with the duplicated fields found in the database.
   */
  public async exists(citySchema: CitySchema, trx?: Transaction): Promise<Record<string, boolean>> {
    const query = CitySchema.query(trx);

    if (citySchema?.id) {
      query.orWhere('id', citySchema.id);
    }

    if (citySchema?.name && citySchema?.country) {
      query.orWhere((builder) => {
        builder.where('name', citySchema.name).andWhere('country', citySchema.country);

        if (citySchema.province == null) {
          builder.whereNull('province');
        } else {
          builder.andWhere('province', citySchema.province);
        }
      });
    }

    const result: Record<string, boolean> = {};
    const records = await query;

    records.forEach((record) => {
      if (record.id === citySchema.id) {
        result.id = true;
      }

      const sameCompositeKey =
        record.name === citySchema.name &&
        record.country === citySchema.country &&
        (record.province ?? null) === (citySchema.province ?? null) &&
        record.id !== citySchema.id;

      if (sameCompositeKey) {
        result.name = true;
        result.country = true;
        if (citySchema.province !== undefined) {
          result.province = true;
        }
      }
    });

    return result;
  }

  /**
   * Finds a city by its primary key.
   *
   * Optional relations can be loaded using query params.
   */
  public async findById(id: number, params: QueryParams = {}): Promise<CitySchema | undefined> {
    const qb = CitySchema.query(params.trx);

    if (params.relations) this.applyRelations(qb, params.relations);

    return await qb.findById(id);
  }

  /**
   * Finds a city by its unique name, country, and province combination.
   *
   * Optional relations can be loaded using query params.
   */
  public async findByNameCountryAndProvince(
    name: string,
    country: string,
    province?: string,
    params: QueryParams = {}
  ): Promise<CitySchema | undefined> {
    const qb = CitySchema.query(params.trx).where({ name, country });

    if (params.relations) this.applyRelations(qb, params.relations);

    if (province == null) {
      qb.whereNull('province');
    } else {
      qb.andWhere('province', province);
    }

    return await qb.first();
  }

  /**
   * Creates a new city.
   *
   * When cascade mode is enabled, related graph data is inserted as well.
   */
  public async save(trx: Transaction, citySchema: CitySchema, withCascade = false): Promise<CitySchema> {
    const query = CitySchema.query(trx);

    return withCascade ? await query.insertGraphAndFetch(citySchema) : await query.insert(citySchema);
  }

  /**
   * Updates an existing city.
   *
   * When cascade mode is enabled, related graph data is upserted as well.
   */
  public async update(trx: Transaction, citySchema: CitySchema, withCascade = false): Promise<CitySchema> {
    const query = CitySchema.query(trx);

    return withCascade ? await query.upsertGraphAndFetch(citySchema) : await query.patchAndFetchById(citySchema.id, citySchema);
  }

  /**
   * Creates or updates a city depending on whether it has an ID.
   */
  public async upsert(trx: Transaction, citySchema: CitySchema, withCascade = false): Promise<CitySchema> {
    return citySchema.id ? await this.update(trx, citySchema, withCascade) : await this.save(trx, citySchema, withCascade);
  }

  /**
   * Deletes a city and returns the deleted record when available.
   */
  public async delete(trx: Transaction, citySchema: CitySchema): Promise<CitySchema | undefined> {
    return await CitySchema.query(trx).deleteById(citySchema.id).returning('*').first();
  }

  /**
   * Finds cities using filters, pagination, ordering, and optional relations.
   */
  public async find(params: QueryParams): Promise<QueryResponse<CitySchema>> {
    const { filters = {}, pagination = {}, relations = {} } = params;

    // Build the base query.
    // The meteoStations relation is joined to allow text search by station name.
    const qb = CitySchema.query().distinct('cities.id').select('cities.*');

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
  private applyRelations(qb: QueryBuilder<CitySchema>, relations: QueryRelations): void {
    if (!Array.isArray(relations.include)) return;

    if (relations.include.includes('meteoStations')) {
      qb.withGraphFetched('meteoStations');
    }

    if (relations.include.includes('createdBy')) {
      qb.withGraphFetched('createdBy');
    }

    if (relations.include.includes('updatedBy')) {
      qb.withGraphFetched('updatedBy');
    }
  }

  /**
   * Applies text search filters over city fields and related meteo station fields.
   */
  private applyFilters(qb: Objection.QueryBuilder<CitySchema>, filters: QueryFilters): void {
    if (!filters.textSearch) return;

    const search = `%${filters.textSearch.trim()}%`;

    qb.where((builder: QueryBuilder<CitySchema>) => {
      builder
        // Search by city name.
        .where('cities.name', 'ilike', search)
        // Search by province.
        .orWhere('cities.province', 'ilike', search)
        // Search by country.
        .orWhere('cities.country', 'ilike', search)
        // Search by related meteo station name.
        .orWhereExists(CitySchema.relatedQuery('meteoStations').where('meteoStations.name', 'ilike', search));
    });
  }

  /**
   * Applies dynamic ordering using pagination parameters.
   */
  private applyOrder(qb: QueryBuilder<CitySchema>, pagination: QueryPagination): void {
    qb.orderBy(`cities.${pagination.orderBy ?? 'createdAt'}`, pagination.order ?? 'asc');
  }
}
