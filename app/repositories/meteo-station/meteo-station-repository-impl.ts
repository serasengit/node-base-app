import { DEFAULT_PAGINATION_LIMIT, QueryPagination, QueryParams, QueryRelations, QueryResponse } from '@repositories/base-repository';
import MeteoStationSchema from '@schemas/meteo-station-schema';
import { QueryBuilder, Transaction } from 'objection';
import { Service } from 'typedi';

import { MeteoStationRepository } from './meteo-station-repository';

@Service('meteoStationRepository')
export class MeteoStationRepositoryImpl implements MeteoStationRepository {
  public async exists(meteoStationSchema: MeteoStationSchema): Promise<Record<string, boolean>> {
    const query = MeteoStationSchema.query();

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

      if (record.name === meteoStationSchema.name) {
        result.name = true;
      }
    });

    return result;
  }

  public async findById(id: number, params: QueryParams = {}): Promise<MeteoStationSchema | undefined> {
    const qb = MeteoStationSchema.query(params.trx);

    if (params.relations) this.applyRelations(qb, params.relations);

    return await qb.findById(id);
  }

  public async findByName(name: string, params?: QueryParams): Promise<MeteoStationSchema | undefined> {
    const qb = MeteoStationSchema.query(params?.trx);

    if (params?.relations) this.applyRelations(qb, params.relations);

    return await qb.findOne({ name });
  }

  public async save(trx: Transaction, meteoStationSchema: MeteoStationSchema, withCascade = false): Promise<MeteoStationSchema> {
    const query = MeteoStationSchema.query(trx);

    return withCascade ? await query.insertGraphAndFetch(meteoStationSchema) : await query.insert(meteoStationSchema);
  }

  public async update(trx: Transaction, meteoStationSchema: MeteoStationSchema, withCascade = false): Promise<MeteoStationSchema> {
    const query = MeteoStationSchema.query(trx);

    return withCascade
      ? await query.upsertGraphAndFetch(meteoStationSchema)
      : await query.patchAndFetchById(meteoStationSchema.id, meteoStationSchema);
  }

  public async upsert(trx: Transaction, meteoStationSchema: MeteoStationSchema, withCascade = false): Promise<MeteoStationSchema> {
    return meteoStationSchema.id
      ? await this.update(trx, meteoStationSchema, withCascade)
      : await this.save(trx, meteoStationSchema, withCascade);
  }

  public async delete(trx: Transaction, meteoStationSchema: MeteoStationSchema): Promise<MeteoStationSchema | undefined> {
    return await MeteoStationSchema.query(trx).deleteById(meteoStationSchema.id).returning('*').first();
  }

  public async find(params: QueryParams): Promise<QueryResponse<MeteoStationSchema>> {
    const { pagination = {}, relations = {} } = params;

    const qb = MeteoStationSchema.query().distinct('meteoStations.id').select('meteoStations.*');

    this.applyRelations(qb, relations);
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

  private applyRelations(qb: QueryBuilder<MeteoStationSchema>, relations: QueryRelations): void {
    if (relations.withCreatedBy) {
      qb.withGraphFetched('[createdByUser]');
    }

    if (relations.withUpdatedBy) {
      qb.withGraphFetched('[updatedByUser]');
    }
  }

  private applyOrder(qb: QueryBuilder<MeteoStationSchema>, pagination: QueryPagination): void {
    qb.orderBy(`meteoStations.${pagination.orderBy ?? 'createdAt'}`, pagination.order ?? 'asc');
  }
}
