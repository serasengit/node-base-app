import {
  DEFAULT_PAGINATION_LIMIT,
  QueryFilters,
  QueryPagination,
  QueryParams,
  QueryRelations,
  QueryResponse
} from '@core/repositories/base-repository';
import MeteoStationSchema from '@features/meteo-stations/schemas/meteo-station-schema';
import Objection, { QueryBuilder, Transaction } from 'objection';
import { Service } from 'typedi';
import { MeteoStationRepository } from './meteo-station-repository';

@Service('meteoStationRepository')
export class MeteoStationRepositoryImpl implements MeteoStationRepository {
  /**
   * Checks whether a meteo station already exists by ID or name.
   *
   * Returns a map with the duplicated fields found in the database.
   */
  public async exists(meteoStationSchema: MeteoStationSchema, trx?: Transaction): Promise<Record<string, boolean>> {
    const query = MeteoStationSchema.query(trx);

    if (meteoStationSchema?.id) {
      query.orWhere('id', meteoStationSchema.id);
    }

    if (meteoStationSchema?.name) {
      query.orWhere('name', meteoStationSchema.name);
    }

    const result: Record<string, boolean> = {};
    const records = await query;

    records.forEach((record) => {
      if (record.id === meteoStationSchema.id) {
        result.id = true;
      }

      if (record.name === meteoStationSchema.name && record.id !== meteoStationSchema.id) {
        result.name = true;
      }
    });

    return result;
  }

  /**
   * Finds a meteo station by its primary key.
   *
   * Optional relations can be loaded using query params.
   */
  public async findById(id: number, params: QueryParams = {}): Promise<MeteoStationSchema> {
    const qb = MeteoStationSchema.query(params.trx);

    if (params.relations) this.applyRelations(qb, params.relations);

    return await qb.findById(id);
  }

  /**
   * Finds a meteo station by its unique name.
   *
   * Optional relations can be loaded using query params.
   */
  public async findByName(name: string, params?: QueryParams): Promise<MeteoStationSchema> {
    const qb = MeteoStationSchema.query(params?.trx);

    if (params?.relations) this.applyRelations(qb, params.relations);

    return await qb.findOne({ name });
  }

  /**
   * Creates a new meteo station.
   *
   * When cascade mode is enabled, related graph data is inserted as well.
   */
  public async save(trx: Transaction, meteoStationSchema: MeteoStationSchema, withCascade = false): Promise<MeteoStationSchema> {
    const query = MeteoStationSchema.query(trx);

    return withCascade ? await query.insertGraphAndFetch(meteoStationSchema) : await query.insert(meteoStationSchema);
  }

  /**
   * Updates an existing meteo station.
   *
   * When cascade mode is enabled, related graph data is upserted as well.
   */
  public async update(trx: Transaction, meteoStationSchema: MeteoStationSchema, withCascade = false): Promise<MeteoStationSchema> {
    const query = MeteoStationSchema.query(trx);

    return withCascade ?
        await query.upsertGraphAndFetch(meteoStationSchema)
      : await query.patchAndFetchById(meteoStationSchema.id, meteoStationSchema);
  }

  /**
   * Creates or updates a meteo station depending on whether it has an ID.
   */
  public async upsert(trx: Transaction, meteoStationSchema: MeteoStationSchema, withCascade = false): Promise<MeteoStationSchema> {
    return meteoStationSchema.id ?
        await this.update(trx, meteoStationSchema, withCascade)
      : await this.save(trx, meteoStationSchema, withCascade);
  }

  /**
   * Deletes a meteo station and returns the deleted record when available.
   */
  public async delete(trx: Transaction, meteoStationSchema: MeteoStationSchema): Promise<MeteoStationSchema> {
    return await MeteoStationSchema.query(trx).deleteById(meteoStationSchema.id).returning('*').first();
  }

  /**
   * Finds meteo stations using filters, pagination, ordering, and optional relations.
   */
  public async find(params: QueryParams): Promise<QueryResponse<MeteoStationSchema>> {
    const { filters = {}, pagination = {}, relations = {} } = params;

    // Build the base query.
    // The city relation is joined to allow text search by creator name.
    const qb = MeteoStationSchema.query().distinct('meteoStations.id').select('meteoStations.*');

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
  private applyRelations(qb: QueryBuilder<MeteoStationSchema>, relations: QueryRelations): void {
    if (!Array.isArray(relations.include)) return;

    // Load city data.
    if (relations.include.includes('city')) {
      qb.withGraphFetched('city');
    }

    if (relations.include.includes('createdBy')) {
      qb.withGraphFetched('createdBy');
    }

    if (relations.include.includes('updatedBy')) {
      qb.withGraphFetched('updatedBy');
    }
  }

  /**
   * Applies text search filters over station fields and related city fields.
   */
  private applyFilters(qb: Objection.QueryBuilder<MeteoStationSchema>, filters: QueryFilters): void {
    if (!filters.textSearch) return;

    const search = `%${filters.textSearch.trim()}%`;

    qb.where((builder: QueryBuilder<MeteoStationSchema>) => {
      builder
        // Search by station name.
        .where('meteo_stations.name', 'ilike', search)

        // Latitude and longitude are numeric fields, so they must be cast to text before using ILIKE.
        .orWhereRaw('CAST(meteo_stations.latitude AS TEXT) ILIKE ?', [search])
        .orWhereRaw('CAST(meteo_stations.longitude AS TEXT) ILIKE ?', [search])

        // Search by related city fields.
        .orWhereExists(
          MeteoStationSchema.relatedQuery('city').where((cityBuilder) => {
            cityBuilder
              // Search by city name.
              .where('city.name', 'ilike', search)

              // Search by country name.
              .orWhere('city.country', 'ilike', search)

              // Search by province name.
              .orWhere('city.province', 'ilike', search);
          })
        );
    });
  }

  /**
   * Applies dynamic ordering using pagination parameters.
   */
  private applyOrder(qb: QueryBuilder<MeteoStationSchema>, pagination: QueryPagination): void {
    qb.orderBy(`meteoStations.${pagination.orderBy ?? 'createdAt'}`, pagination.order ?? 'asc');
  }
}
